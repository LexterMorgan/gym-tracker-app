import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { computeVolume, createDraft, WorkoutForm } from "../components/WorkoutForm";

const KEY = "gym-workout-draft";
const REST_TIMER_KEY = "gym-rest-timer-target";

export function WorkoutLoggerPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const editingWorkout = state?.editingWorkout || null;
  const editingId = editingWorkout?._id || null;

  const buildDraftFromWorkout = (workout) => {
    const exercises = (workout?.exercises || []).map((exercise) => ({
      name: exercise.name || "",
      weightMode: "wholeBar",
      barWeight: 20,
      sets: (exercise.sets || []).map((set) => ({
        reps: Number(set.reps || 8),
        weight: Number(set.weight || 0),
        status: set.status || "working",
      })),
    }));
    return {
      date: (workout?.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
      split: workout?.split || "",
      muscles: workout?.muscles || [],
      weightUnit: "kg",
      // Existing stored weights are totals, so default to total-load mode while editing.
      weightMode: "wholeBar",
      barWeight: 20,
      notes: workout?.notes || "",
      exercises: exercises.length
        ? exercises
        : [{ name: "", weightMode: "eachSide", barWeight: 20, sets: [{ reps: 8, weight: 20, status: "working" }] }],
    };
  };

  const [draft, setDraft] = useState(() => {
    if (editingWorkout) {
      return buildDraftFromWorkout(editingWorkout);
    }
    const cached = localStorage.getItem(KEY);
    if (cached && !state?.split) return JSON.parse(cached);
    return createDraft(state?.split || "", state?.muscles || []);
  });
  const [favorites, setFavorites] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId) return;
    localStorage.setItem(KEY, JSON.stringify(draft));
  }, [draft, editingId]);
  useEffect(() => {
    api.getFavorites().then((data) => setFavorites(data.favorites || [])).catch(() => setFavorites([]));
  }, []);
  useEffect(() => {
    api
      .listWorkouts()
      .then((workoutRows) => {
        setWorkouts(workoutRows);
        const history = {};
        for (const workout of workoutRows) {
          for (const exercise of workout.exercises || []) {
            const key = (exercise.name || "").trim();
            if (!key || history[key]) continue;
            const topSet = [...(exercise.sets || [])]
              .sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))[0];
            if (topSet) {
              history[key] = `${topSet.reps} reps x ${topSet.weight} ${(draft.weightUnit || "kg").toLowerCase()} (${new Date(workout.date).toLocaleDateString()})`;
            }
          }
        }
        setExerciseHistory(history);
      })
      .catch(() => setExerciseHistory({}));
  }, [draft.weightUnit]);

  const quickAdd = async () => {
    const response = await api.getQuickAdd();
    if (response.template) {
      setDraft((prev) => ({
        ...prev,
        ...response.template,
        exercises: (response.template.exercises || []).map((exercise) => ({
          ...exercise,
          weightMode: "wholeBar",
          barWeight: 20,
        })),
      }));
    }
  };

  const quickAddSameSplit = () => {
    const splitName = draft.split;
    if (!splitName) return;
    const match = workouts.find((workout) => workout.split === splitName);
    if (!match) return;
    setDraft((prev) => ({
      ...prev,
      exercises: (match.exercises || []).map((exercise) => ({
        name: exercise.name,
        weightMode: "wholeBar",
        barWeight: 20,
        sets: (exercise.sets || []).map((set) => ({
          reps: Number(set.reps || 8),
          weight: Number(set.weight || 20),
          status: set.status || "working",
        })),
      })),
    }));
  };

  const handleSetComplete = () => {
    const defaultRestSeconds = 180;
    const target = Date.now() + defaultRestSeconds * 1000;
    localStorage.setItem(REST_TIMER_KEY, String(target));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaveError("");
    setSaving(true);
    try {
      const payload = {
        ...draft,
        exercises: draft.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => {
            if ((exercise.weightMode || draft.weightMode || "eachSide") === "eachSide") {
              return {
                ...set,
                weight: Number(set.weight || 0) * 2,
              };
            }
            return set;
          }),
        })),
      };
      if (editingId) {
        await api.updateWorkout(editingId, payload);
      } else {
        await api.createWorkout(payload);
      }
      const exerciseNames = draft.exercises.map((ex) => ex.name).filter(Boolean);
      const mergedFavorites = [...new Set([...favorites, ...exerciseNames])].slice(0, 20);
      await api.saveFavorites(mergedFavorites);
      localStorage.removeItem(KEY);
      navigate("/");
    } catch (error) {
      setSaveError(error?.message || "Could not save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-violet-300/40 bg-violet-500/20 p-3">
        <p className="text-xs uppercase tracking-[0.15em]">Current Split</p>
        <p className="text-lg font-semibold">{draft.split || "Not Selected"}</p>
        <p className="text-sm text-zinc-300">{(draft.muscles || []).join(", ")}</p>
        {editingId && (
          <p className="mt-1 text-xs text-violet-200">Editing past workout - save will update this entry.</p>
        )}
      </div>
      {!editingId && (
        <>
          <button onClick={quickAdd} className="w-full rounded-xl bg-white/10 py-2 text-sm">
            Quick-add previous workout
          </button>
          <button onClick={quickAddSameSplit} className="w-full rounded-xl bg-white/10 py-2 text-sm">
            Repeat last {draft.split || "split"} workout
          </button>
        </>
      )}
      {!!favorites.length && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-zinc-400">Favorite Exercises</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    exercises: [
                      ...prev.exercises,
                      { name, weightMode: prev.weightMode || "eachSide", barWeight: Number(prev.barWeight ?? 20), sets: [{ reps: 8, weight: 20, status: "working" }] },
                    ],
                  }))
                }
                className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
      <WorkoutForm
        draft={draft}
        setDraft={setDraft}
        onSubmit={submit}
        exerciseHistory={exerciseHistory}
        onSetComplete={handleSetComplete}
        submitLabel={editingId ? "Update Workout" : "Save Workout"}
      />
      {saveError && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {saveError}
        </div>
      )}
      {saving && (
        <div className="rounded-xl border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
          Saving workout...
        </div>
      )}
      <div className="premium-surface sticky bottom-20 z-10 rounded-2xl p-3">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span>{draft.exercises.length} exercises</span>
          <span>{draft.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)} sets</span>
          <span>Vol {computeVolume(draft.exercises, draft).toLocaleString()}</span>
        </div>
      </div>
    </section>
  );
}
