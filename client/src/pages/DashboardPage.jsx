import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [busyDeleteId, setBusyDeleteId] = useState("");
  const navigate = useNavigate();

  const load = () =>
    api.getDashboard().then(setData).catch(() => setData({ recent: [], prs: {}, weeklySummary: {}, streak: 0 }));

  useEffect(() => {
    load();
  }, []);

  const removeWorkout = async (workoutId) => {
    const ok = window.confirm("Delete this workout? This cannot be undone.");
    if (!ok) return;
    setBusyDeleteId(workoutId);
    try {
      await api.deleteWorkout(workoutId);
      await load();
    } finally {
      setBusyDeleteId("");
    }
  };

  if (!data) return <DashboardSkeleton />;
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card title="Workouts This Week" value={data.weeklySummary?.totalWorkouts || 0} />
        <Card title="Weekly Volume" value={(data.weeklySummary?.totalVolume || 0).toLocaleString()} />
        <Card title="Streak" value={`${data.streak || 0} days`} />
        <Card title="Next Suggestion" value={data.suggestion || "Push"} />
      </div>
      <div className="premium-card p-3">
        <h3 className="mb-2 text-sm font-semibold">Recent Workouts</h3>
        {!(data.recent?.length) && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
            No workouts yet.{" "}
            <Link to="/start" className="text-violet-300 underline">
              Start your first session
            </Link>
            .
          </div>
        )}
        <ul className="space-y-2 text-sm text-zinc-300">
          {data.recent?.map((w) => (
            <li key={w._id} className="rounded-lg bg-white/5 p-2">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {new Date(w.date).toLocaleDateString()} - {w.split} - Vol {w.totalVolume}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => navigate("/workout", { state: { editingWorkout: w } })}
                    className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-zinc-200 hover:bg-white/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWorkout(w._id)}
                    disabled={busyDeleteId === w._id}
                    className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {busyDeleteId === w._id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="premium-card p-3">
        <h3 className="mb-2 text-sm font-semibold">Personal Records</h3>
        <ul className="space-y-1 text-sm">
          {Object.entries(data.prs || {}).map(([name, val]) => (
            <li key={name} className="flex justify-between text-zinc-300">
              <span>{name}</span>
              <span>{val} kg</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="skeleton h-20 rounded-xl border border-white/10" />
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="skeleton mb-3 h-4 w-32 rounded" />
        <div className="space-y-2">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="skeleton mb-3 h-4 w-28 rounded" />
        <div className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="skeleton h-4 rounded" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ title, value }) {
  return (
    <div className="premium-card p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">{title}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
