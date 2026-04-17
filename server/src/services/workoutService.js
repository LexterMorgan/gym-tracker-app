const dayjs = require("dayjs");

const SPLIT_ORDER = ["Push", "Pull", "Legs", "Rest Day"];

const computeSetVolume = (set) => Number(set.reps || 0) * Number(set.weight || 0);

const withVolumes = (workoutInput) => {
  const exercises = (workoutInput.exercises || []).map((exercise) => {
    const sets = (exercise.sets || []).map((set) => ({
      reps: Number(set.reps || 0),
      weight: Number(set.weight || 0),
      status: ["warmup", "working", "dropset", "failure"].includes(set.status) ? set.status : "working",
    }));
    const volume = sets.reduce((sum, set) => sum + computeSetVolume(set), 0);
    return { name: exercise.name?.trim() || "Exercise", sets, volume };
  });
  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);
  return { ...workoutInput, exercises, totalVolume };
};

const calculateStreak = (lastWorkoutDate, newDate) => {
  if (!lastWorkoutDate) return 1;
  const prev = dayjs(lastWorkoutDate).startOf("day");
  const curr = dayjs(newDate).startOf("day");
  const diff = curr.diff(prev, "day");
  if (diff === 0) return null;
  if (diff === 1) return "increment";
  return "reset";
};

const suggestNextSplit = (lastSplit) => {
  const idx = SPLIT_ORDER.indexOf(lastSplit);
  if (idx === -1) return "Push";
  return SPLIT_ORDER[(idx + 1) % SPLIT_ORDER.length];
};

module.exports = { withVolumes, calculateStreak, suggestNextSplit };
