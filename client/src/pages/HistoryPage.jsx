import { useEffect, useState } from "react";
import { api } from "../api/client";

export function HistoryPage() {
  const [workouts, setWorkouts] = useState([]);
  useEffect(() => {
    api.listWorkouts().then(setWorkouts).catch(() => setWorkouts([]));
  }, []);

  return (
    <section className="space-y-3">
      {workouts.map((workout) => (
        <details key={workout._id} className="rounded-xl border border-white/10 bg-black/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {new Date(workout.date).toLocaleDateString()} - {workout.split} - {workout.totalVolume} vol
          </summary>
          <div className="mt-2 space-y-2 text-sm text-zinc-300">
            {workout.exercises.map((exercise, idx) => (
              <div key={`${exercise.name}-${idx}`} className="rounded-lg bg-white/5 p-2">
                <p className="font-medium">{exercise.name}</p>
                <p className="text-xs">{exercise.sets.length} sets</p>
              </div>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
