import { useEffect, useState } from "react";

const KEY = "gym-rest-timer-target";

export function RestTimerFAB() {
  const [targetTs, setTargetTs] = useState(() => Number(localStorage.getItem(KEY) || 0));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (!targetTs) return setSecondsLeft(0);
      const diff = Math.max(0, Math.floor((targetTs - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        localStorage.removeItem(KEY);
        setTargetTs(0);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [targetTs]);

  const start = (seconds) => {
    const newTarget = Date.now() + seconds * 1000;
    localStorage.setItem(KEY, String(newTarget));
    setTargetTs(newTarget);
    setSecondsLeft(seconds);
    setShowOptions(false);
  };

  const stop = () => {
    localStorage.removeItem(KEY);
    setTargetTs(0);
    setSecondsLeft(0);
    setShowOptions(false);
  };

  const format = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!targetTs) {
    return (
      <div className="fixed bottom-24 right-4 z-30 text-xs text-white">
        <button
          onClick={() => setShowOptions((prev) => !prev)}
          className="rounded-full border border-white/20 bg-black/80 px-3 py-2 shadow-xl"
        >
          Rest
        </button>
        {showOptions && (
          <div className="mt-2 flex gap-1 rounded-full border border-white/20 bg-black/80 p-2 shadow-xl">
            {[180, 240].map((s) => (
              <button key={s} onClick={() => start(s)} className="rounded-full bg-violet-500/40 px-2 py-1">
                {Math.floor(s / 60)}m
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-30 rounded-full border border-violet-300/40 bg-black/85 p-2 text-xs text-white shadow-xl">
      <div className="px-2 pb-1 text-center font-semibold">{format(secondsLeft)}</div>
      <div className="flex gap-1">
        {[180, 240].map((s) => (
          <button key={s} onClick={() => start(s)} className="rounded-full bg-violet-500/40 px-2 py-1">
            {Math.floor(s / 60)}m
          </button>
        ))}
        <button onClick={stop} className="rounded-full bg-rose-500/30 px-2 py-1">
          Stop
        </button>
      </div>
    </div>
  );
}
