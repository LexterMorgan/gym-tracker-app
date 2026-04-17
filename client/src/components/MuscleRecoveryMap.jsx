import { useMemo, useState } from "react";

const statusToColor = {
  ready: "#34d399",
  moderate: "#f59e0b",
  fatigued: "#ef4444",
};

const statusToText = {
  ready: "Rested",
  moderate: "Recovering",
  fatigued: "Just Trained",
};

const getAgo = (ts) => {
  if (!ts) return "No recent log";
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function MuscleRecoveryMap({ muscleRecovery }) {
  const byId = Object.fromEntries((muscleRecovery || []).map((m) => [m.id, m]));
  const list = (muscleRecovery || []).filter((m) => m.id in byId);
  const [selectedId, setSelectedId] = useState(null);

  const selected = byId[selectedId] || list[0];
  const recent = useMemo(
    () =>
      [...list]
        .filter((item) => item.lastHitTs)
        .sort((a, b) => (b.lastHitTs || 0) - (a.lastHitTs || 0))
        .slice(0, 4),
    [list]
  );
  const stressed = useMemo(
    () =>
      [...list]
        .filter((item) => item.lastHitTs || item.readiness < 100)
        .sort((a, b) => a.readiness - b.readiness)
        .slice(0, 3),
    [list]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400">
        <Legend color={statusToColor.fatigued} label="Just Trained" />
        <Legend color={statusToColor.moderate} label="Recovering" />
        <Legend color={statusToColor.ready} label="Rested" />
      </div>
      {stressed.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {stressed.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/20 p-3 text-left backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Most Used</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusToColor[item.status] }} />
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-zinc-400">Load {100 - item.readiness}%</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/35 to-black/10 p-3 text-sm text-zinc-300">
          No recent muscle fatigue yet. Log a workout to see most-used muscles.
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Muscle usage</p>
          <p className="text-xs text-zinc-400">Tap row for details</p>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {list.map((item) => {
            const selectedRow = selected?.id === item.id;
            const usage = Math.max(0, Math.min(100, 100 - item.readiness));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                  selectedRow ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-zinc-200">{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: statusToColor[item.status] }}>
                    {statusToText[item.status]}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${usage}%`, background: statusToColor[item.status] }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-black/50 to-black/30 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Selected muscle</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: statusToColor[selected.status] }}
              />
              <span className="text-lg font-semibold text-white">{selected.label}</span>
            </div>
            <span className="text-sm text-zinc-300">{getAgo(selected.lastHitTs)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
            <span>{statusToText[selected.status]}</span>
            <span>Readiness {selected.readiness}%</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {recent.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left"
          >
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusToColor[item.status] }} />
              <span className="text-sm text-zinc-200">{item.label}</span>
            </span>
            <span className="text-sm text-zinc-400">{getAgo(item.lastHitTs)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
