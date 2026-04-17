import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { StrengthChart } from "../components/Charts";
import { MuscleRecoveryMap } from "../components/MuscleRecoveryMap";
import { computeMuscleRecovery } from "../utils/recovery";

export function ProgressPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({ weeklyVolume: {}, strengthByExercise: {} });
  const [workouts, setWorkouts] = useState([]);
  const [dashboard, setDashboard] = useState({ streak: 0 });
  const [loading, setLoading] = useState(true);
  const [busyDeleteId, setBusyDeleteId] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [bodyWeight, setBodyWeight] = useState(() => Number(localStorage.getItem("gym-bodyweight") || 79));
  const [height, setHeight] = useState(() => Number(localStorage.getItem("gym-height") || 175));

  const refresh = () =>
    Promise.allSettled([api.getProgress(), api.listWorkouts(), api.getDashboard()]).then((results) => {
      if (results[0].status === "fulfilled") setProgress(results[0].value);
      else setProgress({ weeklyVolume: {}, strengthByExercise: {} });
      if (results[1].status === "fulfilled") setWorkouts(results[1].value);
      else setWorkouts([]);
      if (results[2].status === "fulfilled") setDashboard(results[2].value);
      else setDashboard({ streak: 0 });
      setLoading(false);
    });

  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    localStorage.setItem("gym-bodyweight", String(bodyWeight || 0));
  }, [bodyWeight]);
  useEffect(() => {
    localStorage.setItem("gym-height", String(height || 0));
  }, [height]);

  const exerciseNames = useMemo(() => Object.keys(progress.strengthByExercise || {}), [progress]);
  useEffect(() => {
    if (!selectedExercise && exerciseNames.length) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames, selectedExercise]);

  const weeklyVolumeTotal = useMemo(
    () => Object.values(progress.weeklyVolume || {}).reduce((sum, value) => sum + Number(value || 0), 0),
    [progress.weeklyVolume]
  );

  const recentCount = useMemo(
    () =>
      workouts.filter((workout) => {
        const diff = Date.now() - new Date(workout.date).getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }).length,
    [workouts]
  );

  const heatmapDays = useMemo(() => {
    const countsByDate = {};
    for (const workout of workouts) {
      const key = new Date(workout.date).toISOString().slice(0, 10);
      countsByDate[key] = (countsByDate[key] || 0) + 1;
    }
    return Array.from({ length: 84 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (83 - idx));
      const key = date.toISOString().slice(0, 10);
      return { key, count: countsByDate[key] || 0 };
    });
  }, [workouts]);

  const prTimeline = useMemo(() => {
    const timeline = [];
    const bestByExercise = {};
    const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const workout of sorted) {
      for (const exercise of workout.exercises || []) {
        const topWeight = Math.max(0, ...(exercise.sets || []).map((set) => Number(set.weight || 0)));
        if (!exercise.name) continue;
        if (!bestByExercise[exercise.name] || topWeight > bestByExercise[exercise.name]) {
          bestByExercise[exercise.name] = topWeight;
          timeline.push({
            date: new Date(workout.date).toLocaleDateString(),
            exercise: exercise.name,
            weight: topWeight,
          });
        }
      }
    }
    return timeline.slice(-8).reverse();
  }, [workouts]);

  const muscleRecovery = useMemo(() => computeMuscleRecovery(workouts), [workouts]);

  const exportData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      workouts,
      profile: { bodyWeight, height },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gym-tracker-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed?.workouts) ? parsed.workouts : [];
    for (const workout of rows) {
      // Recreate workouts through API for persistence consistency.
      await api.createWorkout({
        date: workout.date,
        split: workout.split,
        muscles: workout.muscles || [],
        notes: workout.notes || "",
        exercises: workout.exercises || [],
      });
    }
    if (parsed?.profile?.bodyWeight) setBodyWeight(Number(parsed.profile.bodyWeight));
    if (parsed?.profile?.height) setHeight(Number(parsed.profile.height));
    await refresh();
  };

  const removeWorkout = async (workoutId) => {
    const ok = window.confirm("Delete this workout? This cannot be undone.");
    if (!ok) return;
    setBusyDeleteId(workoutId);
    try {
      await api.deleteWorkout(workoutId);
      await refresh();
    } finally {
      setBusyDeleteId("");
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="skeleton h-48 rounded-3xl border border-white/10" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="skeleton h-24 rounded-2xl border border-white/10" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-3xl border border-white/10" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="premium-card p-4">
        <p className="mb-2 text-sm font-semibold text-white">Consistency heatmap (12 weeks)</p>
        <div className="grid grid-cols-12 gap-1">
          {heatmapDays.map((day) => (
            <div
              key={day.key}
              title={`${day.key}: ${day.count} workout${day.count === 1 ? "" : "s"}`}
              className={`heat-cell h-3 ${
                day.count >= 2 ? "heat-cell-high" : day.count === 1 ? "heat-cell-low" : "heat-cell-empty"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="premium-card p-4">
        <p className="mb-2 text-sm font-semibold text-white">Muscle recovery estimate</p>
        <p className="mb-3 text-xs text-zinc-400">
          Green means more ready, red means more fatigue based on recent workout volume and recency.
        </p>
        <MuscleRecoveryMap muscleRecovery={muscleRecovery} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="premium-card p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Workouts</p>
          <p className="text-2xl font-semibold text-white">{workouts.length}</p>
          <p className="text-xs text-zinc-400">All time</p>
        </div>
        <div className="premium-card p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Volume</p>
          <p className="text-2xl font-semibold text-white">{weeklyVolumeTotal.toLocaleString()}</p>
          <p className="text-xs text-zinc-400">Last 7d</p>
        </div>
        <div className="premium-card p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Day Streak</p>
          <p className="text-2xl font-semibold text-white">{dashboard?.streak || 0}</p>
          <p className="text-xs text-zinc-400">{recentCount} sessions/week</p>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="mb-2 flex items-end justify-between">
          <p className="text-sm font-semibold text-white">Strength progression</p>
          <span className="text-xs text-zinc-400">Body: {bodyWeight}kg / {height}cm</span>
        </div>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="premium-input mb-3 w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <StrengthChart points={progress.strengthByExercise[selectedExercise] || []} />
      </div>

      <div className="premium-card p-4">
        <p className="mb-2 text-sm font-semibold text-white">Recent PR timeline</p>
        <div className="space-y-2">
          {prTimeline.length === 0 && <p className="text-xs text-zinc-400">No PRs yet - keep training.</p>}
          {prTimeline.slice(0, 3).map((entry, idx) => (
            <div key={`${entry.exercise}-${entry.date}-${idx}`} className="flex items-center justify-between rounded-xl bg-white/5 p-2 text-xs">
              <span className="text-zinc-200">
                {entry.exercise} <span className="text-zinc-400">({entry.date})</span>
              </span>
              <span className="font-semibold text-emerald-300">{entry.weight} kg PR</span>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-4">
        <p className="mb-2 text-sm font-semibold text-white">Workout history</p>
        <div className="space-y-2">
          {workouts.slice(0, 10).map((workout) => (
            <div
              key={workout._id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <div>
                <p className="text-sm text-zinc-100">
                  {new Date(workout.date).toLocaleDateString()} - {workout.split}
                </p>
                <p className="text-xs text-zinc-400">Vol {Number(workout.totalVolume || 0).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => navigate("/workout", { state: { editingWorkout: workout } })}
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeWorkout(workout._id)}
                  disabled={busyDeleteId === workout._id}
                  className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {busyDeleteId === workout._id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {!workouts.length && <p className="text-xs text-zinc-400">No workouts logged yet.</p>}
        </div>
      </div>

      <div className="premium-card p-4">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-white">Data and backup</summary>
          <div className="mt-3 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-zinc-400">Weight</label>
                <input
                  type="number"
                  min="0"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(Number(e.target.value))}
                  className="premium-input w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-zinc-400">Height</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="premium-input w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={exportData} className="premium-button rounded-lg px-3 py-1.5 text-xs">
                Export
              </button>
              <label className="premium-button cursor-pointer rounded-lg px-3 py-1.5 text-xs">
                Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </details>
        {workouts.length === 0 && (
          <p className="mt-3 text-xs text-zinc-400">
            No workout history yet. Start your first workout from the Workout tab.
          </p>
        )}
        {!workouts.length ? null : (
          <div className="mt-3 text-xs text-zinc-400">
            History is available in your recent sessions from the dashboard.
          </div>
        )}
      </div>
    </section>
  );
}
