import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPLITS } from "../constants/splits";

export function StartWorkoutPage() {
  const [selectedSplit, setSelectedSplit] = useState("");
  const [custom, setCustom] = useState("");
  const navigate = useNavigate();

  const muscles = useMemo(() => {
    if (selectedSplit === "Custom" && custom) return [custom];
    return SPLITS[selectedSplit] || [];
  }, [selectedSplit, custom]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Choose your training day</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(SPLITS).map((split) => (
          <button
            key={split}
            onClick={() => setSelectedSplit(split)}
            className={`premium-card p-3 text-left text-sm ${
              selectedSplit === split ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-black/30"
            }`}
          >
            {split}
          </button>
        ))}
      </div>
      {selectedSplit === "Custom" && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="premium-input w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm"
          placeholder="Custom muscle focus"
        />
      )}
      {selectedSplit && (
        <div className="premium-card p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">Selected</p>
          <p className="text-lg font-semibold">{selectedSplit}</p>
          <p className="text-sm text-zinc-300">{muscles.join(", ")}</p>
        </div>
      )}
      <button
        disabled={!selectedSplit}
        onClick={() => navigate("/workout", { state: { split: selectedSplit, muscles } })}
        className="premium-button w-full rounded-xl py-3 disabled:opacity-50"
      >
        Start Workout
      </button>
    </section>
  );
}
