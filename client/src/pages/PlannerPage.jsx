import { useEffect, useState } from "react";
import { api } from "../api/client";
import { SPLITS, WEEK_DAYS } from "../constants/splits";

const CACHE_KEY = "gym-week-plan";

export function PlannerPage() {
  const weekStart = new Date().toISOString().slice(0, 10);
  const [days, setDays] = useState(WEEK_DAYS.map((day) => ({ day, split: "Rest Day" })));

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setDays(JSON.parse(cached));
    api.getPlan(weekStart).then((response) => {
      if (response?.days?.length) setDays(response.days);
    });
  }, [weekStart]);

  const update = (idx, split) => {
    const next = [...days];
    next[idx] = { ...next[idx], split };
    setDays(next);
  };

  const save = async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(days));
    await api.savePlan({ weekStart, days });
  };

  return (
    <section className="space-y-3">
      {days.map((item, idx) => (
        <div key={item.day} className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-1 text-sm font-semibold">{item.day}</p>
          <select
            value={item.split}
            onChange={(e) => update(idx, e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
          >
            {Object.keys(SPLITS).map((split) => (
              <option key={split} value={split}>
                {split}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button onClick={save} className="w-full rounded-xl bg-violet-500 py-3 font-semibold text-black">
        Save Weekly Plan
      </button>
    </section>
  );
}
