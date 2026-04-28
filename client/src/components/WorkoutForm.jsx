import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPLIT_TEMPLATES } from "../constants/splits";

const emptySet = { reps: 8, weight: 20, status: "working" };
const SET_STATUSES = [
  { value: "warmup", label: "Warmup" },
  { value: "working", label: "Working" },
  { value: "dropset", label: "Drop" },
  { value: "failure", label: "Failure" },
];
const WEIGHT_UNITS = ["kg", "lbs"];
const WEIGHT_MODES = [
  { value: "eachSide", label: "Machine/Cable/DB Each Side" },
  { value: "wholeBar", label: "Barbell Total Load" },
];

const effectiveSetWeight = (set, draft, exercise = {}) => {
  const enteredWeight = Number(set.weight || 0);
  const mode = exercise.weightMode || draft.weightMode || "eachSide";
  if (mode === "eachSide") {
    return enteredWeight * 2;
  }
  return enteredWeight;
};

export function createDraft(split = "", muscles = []) {
  return {
    date: new Date().toISOString().slice(0, 10),
    split,
    muscles,
    weightUnit: "kg",
    weightMode: "eachSide",
    barWeight: 20,
    notes: "",
    exercises: [{ name: "", weightMode: "eachSide", barWeight: 20, sets: [{ ...emptySet }] }],
  };
}

export function computeVolume(exercises, draft = { weightMode: "eachSide" }) {
  return exercises.reduce(
    (sum, ex) =>
      ex.sets.reduce((setSum, set) => setSum + Number(set.reps || 0) * effectiveSetWeight(set, draft, ex), sum),
    0
  );
}

export function WorkoutForm({ draft, setDraft, onSubmit, exerciseHistory = {}, onSetComplete, submitLabel = "Save Workout" }) {
  const [completedSets, setCompletedSets] = useState({});
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const repInputRefs = useRef({});
  const splitExerciseOptions = SPLIT_TEMPLATES[draft.split]?.exercises || [];

  const warningKey = (exIdx, setIdx) => `${exIdx}-${setIdx}`;
  const inputKey = (exIdx, setIdx) => `${exIdx}-${setIdx}`;

  const updateExercise = (idx, patch) => {
    const exercises = [...draft.exercises];
    exercises[idx] = { ...exercises[idx], ...patch };
    setDraft({ ...draft, exercises });
  };

  const updateSet = (exIdx, setIdx, patch) => {
    const exercises = [...draft.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], ...patch };
    exercises[exIdx] = { ...exercises[exIdx], sets };
    setDraft({ ...draft, exercises });
  };

  const handleRepChange = (exIdx, setIdx, value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return;
    updateSet(exIdx, setIdx, { reps: Math.max(0, numericValue || 0) });
  };

  const addExercise = () =>
    setDraft({
      ...draft,
      exercises: [
        ...draft.exercises,
        { name: "", weightMode: draft.weightMode || "eachSide", barWeight: Number(draft.barWeight ?? 20), sets: [{ ...emptySet }] },
      ],
    });

  const addExerciseFromOptions = () => {
    const selected = splitExerciseOptions.find((item) => item.name === selectedExerciseName);
    if (!selected) return;
    const nextExercises = [...draft.exercises];
    const firstEmptyIdx = nextExercises.findIndex((exercise) => !String(exercise.name || "").trim());
    const prepared = {
      name: selected.name,
      weightMode: draft.weightMode || "eachSide",
      barWeight: Number(draft.barWeight ?? 20),
      sets: [{ reps: 8, weight: Number(selected.weight || 0), status: "working" }],
    };
    if (firstEmptyIdx >= 0) {
      nextExercises[firstEmptyIdx] = prepared;
    } else {
      nextExercises.push(prepared);
    }
    setDraft({
      ...draft,
      exercises: nextExercises,
    });
    setSelectedExerciseName("");
  };

  const removeExercise = (idx) => {
    const exercises = draft.exercises.filter((_, i) => i !== idx);
    setDraft({
      ...draft,
      exercises: exercises.length
        ? exercises
        : [{ name: "", weightMode: draft.weightMode || "eachSide", barWeight: Number(draft.barWeight ?? 20), sets: [{ ...emptySet }] }],
    });
  };

  const addSet = (idx) => {
    const ex = draft.exercises[idx];
    updateExercise(idx, { sets: [...ex.sets, { ...emptySet }] });
  };

  const removeSet = (exIdx, setIdx) => {
    const ex = draft.exercises[exIdx];
    const sets = ex.sets.filter((_, i) => i !== setIdx);
    updateExercise(exIdx, { sets: sets.length ? sets : [{ ...emptySet }] });
  };

  const completeSet = (exIdx, setIdx, set) => {
    const key = warningKey(exIdx, setIdx);
    setCompletedSets((prev) => ({ ...prev, [key]: true }));
    if (onSetComplete) {
      onSetComplete({
        exerciseName: draft.exercises[exIdx]?.name || "Exercise",
        setIndex: setIdx,
        set,
      });
    }
    const nextRef = repInputRefs.current[inputKey(exIdx, setIdx + 1)];
    if (nextRef) {
      nextRef.focus();
      nextRef.select();
    }
  };

  const totalVolume = draft.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce((setSum, set) => setSum + Number(set.reps || 0) * effectiveSetWeight(set, draft, ex), 0),
    0
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Weight Unit</label>
        <div className="grid grid-cols-2 gap-2">
          {WEIGHT_UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setDraft({ ...draft, weightUnit: unit })}
              className={`rounded-lg border p-2 text-sm ${
                draft.weightUnit === unit
                  ? "border-violet-400 bg-violet-500/25 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {unit.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
          Default Weight Mode (for new exercises)
        </label>
        <div className="grid gap-2">
          {WEIGHT_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setDraft({ ...draft, weightMode: mode.value })}
              className={`rounded-lg border p-2 text-sm text-left ${
                draft.weightMode === mode.value
                  ? "border-violet-400 bg-violet-500/25 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {draft.weightMode === "wholeBar" && (
          <div className="mt-2">
            <label className="mb-1 block text-xs text-zinc-400">Default bar weight ({draft.weightUnit || "kg"})</label>
            <input
              type="number"
              min="0"
              value={draft.barWeight ?? 20}
              onChange={(e) => setDraft({ ...draft, barWeight: Number(e.target.value) })}
              className="premium-input w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
              placeholder={`Bar weight (${draft.weightUnit || "kg"})`}
            />
          </div>
        )}
      </div>
      {!!splitExerciseOptions.length && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
            Pick Exercise From {draft.split} List
          </label>
          <div className="flex gap-2">
            <select
              value={selectedExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
            >
              <option value="">Select exercise</option>
              {splitExerciseOptions.map((exercise) => (
                <option key={exercise.name} value={exercise.name}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <motion.button
              type="button"
              onClick={addExerciseFromOptions}
              disabled={!selectedExerciseName}
              className="rounded-lg bg-violet-500/40 px-3 py-2 text-sm disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              Add
            </motion.button>
          </div>
        </div>
      )}
      <AnimatePresence initial={false}>
        {draft.exercises.map((exercise, exIdx) => (
        <motion.div
          key={exIdx}
          layout
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-white/10 bg-black/35 p-3"
        >
          <div className="mb-2 flex gap-2">
            {splitExerciseOptions.length ? (
              <div className="premium-input flex w-full items-center rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-zinc-200">
                {exercise.name || "Pick from split list above"}
              </div>
            ) : (
              <input
                value={exercise.name}
                onChange={(e) => updateExercise(exIdx, { name: e.target.value })}
                className="premium-input w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
                placeholder="Exercise name"
              />
            )}
            <motion.button
              type="button"
              onClick={() => removeExercise(exIdx)}
              className="rounded-lg bg-rose-500/20 px-2"
              whileTap={{ scale: 0.95 }}
            >
              Remove
            </motion.button>
          </div>
          <div className="mb-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
            <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-400">This exercise weight mode</p>
            <div className="grid gap-2">
              {WEIGHT_MODES.map((mode) => (
                <button
                  key={`${exercise.name || exIdx}-${mode.value}`}
                  type="button"
                  onClick={() => updateExercise(exIdx, { weightMode: mode.value })}
                  className={`rounded-lg border p-2 text-left text-xs ${
                    (exercise.weightMode || draft.weightMode || "eachSide") === mode.value
                      ? "border-violet-400 bg-violet-500/20 text-white"
                      : "border-white/10 bg-white/5 text-zinc-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            {(exercise.weightMode || draft.weightMode || "eachSide") === "wholeBar" && (
              <div className="mt-2">
                <label className="mb-1 block text-[11px] text-zinc-400">Bar weight ({draft.weightUnit || "kg"})</label>
                <input
                  type="number"
                  min="0"
                  value={exercise.barWeight ?? draft.barWeight ?? 20}
                  onChange={(e) => updateExercise(exIdx, { barWeight: Number(e.target.value) })}
                  className="premium-input w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
                />
              </div>
            )}
          </div>
          {exerciseHistory[exercise.name?.trim()] && (
            <p className="mb-2 text-xs text-emerald-300">
              Last time: {exerciseHistory[exercise.name.trim()]}
            </p>
          )}
          <div className="space-y-2">
            <AnimatePresence initial={false}>
            {exercise.sets.map((set, setIdx) => (
              <motion.div
                key={setIdx}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
                className="grid grid-cols-3 gap-2"
              >
                <label className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Reps</label>
                <label className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
                  {(exercise.weightMode || draft.weightMode || "eachSide") === "eachSide"
                    ? `Weight each side (${draft.weightUnit || "kg"})`
                    : `Barbell total (${draft.weightUnit || "kg"})`}
                </label>
                <div />
                <input
                  type="number"
                  min={0}
                  value={set.reps}
                  ref={(node) => {
                    if (node) repInputRefs.current[inputKey(exIdx, setIdx)] = node;
                  }}
                  onChange={(e) => handleRepChange(exIdx, setIdx, e.target.value)}
                  className="premium-input rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
                  placeholder="Reps"
                />
                <motion.input
                  type="number"
                  min="0"
                  value={set.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                  className="premium-input rounded-lg border border-white/10 bg-white/5 p-2 text-sm"
                  whileFocus={{ scale: 1.02 }}
                  placeholder={
                    (exercise.weightMode || draft.weightMode || "eachSide") === "eachSide"
                      ? `Each side (${draft.weightUnit || "kg"})`
                      : `Total bar load (${draft.weightUnit || "kg"})`
                  }
                />
                <motion.button
                  type="button"
                  onClick={() => removeSet(exIdx, setIdx)}
                  className="rounded-lg bg-zinc-700/60"
                  whileTap={{ scale: 0.95 }}
                >
                  Remove Set
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => completeSet(exIdx, setIdx, set)}
                  className={`rounded-lg px-2 ${
                    completedSets[warningKey(exIdx, setIdx)] ? "bg-emerald-500/40" : "bg-emerald-500/20"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {completedSets[warningKey(exIdx, setIdx)] ? "Done" : "Set Done"}
                </motion.button>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {SET_STATUSES.map((statusOpt) => (
                    <motion.button
                      key={statusOpt.value}
                      type="button"
                      onClick={() => updateSet(exIdx, setIdx, { status: statusOpt.value })}
                      className={`rounded-full px-2 py-1 text-[11px] ${
                        (set.status || "working") === statusOpt.value
                          ? "bg-emerald-500/30 text-emerald-200"
                          : "bg-white/5 text-zinc-300"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {statusOpt.label}
                    </motion.button>
                  ))}
                </div>
                <p className="col-span-3 text-[11px] text-zinc-400">
                  Effective load: {effectiveSetWeight(set, draft, exercise).toLocaleString()} {draft.weightUnit || "kg"}
                </p>
                {(exercise.weightMode || draft.weightMode || "eachSide") === "wholeBar" && (
                  <>
                    <p className="col-span-3 text-[11px] text-zinc-400">
                      Bar weight: {Number(exercise.barWeight ?? draft.barWeight ?? 0).toLocaleString()} {draft.weightUnit || "kg"}
                    </p>
                    <p className="col-span-3 text-[11px] text-zinc-400">
                      Plates total:{" "}
                      {Math.max(0, Number(set.weight || 0) - Number(exercise.barWeight ?? draft.barWeight ?? 0)).toLocaleString()}{" "}
                      {draft.weightUnit || "kg"}
                    </p>
                    <p className="col-span-3 text-[11px] text-zinc-400">
                      Plates each side:{" "}
                      {(
                        Math.max(0, Number(set.weight || 0) - Number(exercise.barWeight ?? draft.barWeight ?? 0)) / 2
                      ).toLocaleString()}{" "}
                      {draft.weightUnit || "kg"}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() => addSet(exIdx)}
              className="rounded-lg bg-violet-500/30 px-3 py-2 text-sm"
              whileTap={{ scale: 0.95 }}
            >
              + Add Set
            </motion.button>
          </div>
        </motion.div>
      ))}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={addExercise}
        className="w-full rounded-xl bg-white/10 py-2"
        whileTap={{ scale: 0.98 }}
      >
        + Add Exercise
      </motion.button>
      <div className="rounded-xl border border-violet-300/30 bg-violet-400/10 p-3 text-sm">
        Total Volume: {totalVolume.toLocaleString()}
      </div>
      <motion.button
        type="submit"
        className="w-full rounded-xl bg-violet-500 py-3 font-semibold text-black transition hover:bg-violet-400 hover:shadow-[0_0_22px_rgba(139,92,246,0.45)]"
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
      >
        {submitLabel}
      </motion.button>
    </form>
  );
}
