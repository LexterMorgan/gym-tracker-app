const dayjs = require("dayjs");
const Workout = require("../models/Workout");
const UserMeta = require("../models/UserMeta");
const { suggestNextSplit } = require("../services/workoutService");

const getDashboard = async (req, res) => {
  const weekStart = dayjs().startOf("week").toDate();
  const recent = await Workout.find({ userId: req.userId }).sort({ date: -1 }).limit(5);
  const weekly = await Workout.find({ userId: req.userId, date: { $gte: weekStart } });
  const exercisePrs = {};
  for (const workout of weekly) {
    for (const exercise of workout.exercises) {
      const maxWeight = Math.max(0, ...exercise.sets.map((set) => set.weight));
      exercisePrs[exercise.name] = Math.max(exercisePrs[exercise.name] || 0, maxWeight);
    }
  }
  const meta = await UserMeta.findOne({ userId: req.userId });
  res.json({
    recent,
    prs: exercisePrs,
    weeklySummary: {
      totalWorkouts: weekly.length,
      totalVolume: weekly.reduce((sum, workout) => sum + workout.totalVolume, 0),
    },
    streak: meta?.streakCount || 0,
    suggestion: suggestNextSplit(meta?.lastSplit),
  });
};

const getProgress = async (req, res) => {
  const workouts = await Workout.find({ userId: req.userId }).sort({ date: 1 });
  const byWeek = {};
  const byExercise = {};
  for (const workout of workouts) {
    const weekKey = dayjs(workout.date).startOf("week").format("YYYY-MM-DD");
    byWeek[weekKey] = (byWeek[weekKey] || 0) + workout.totalVolume;
    for (const ex of workout.exercises) {
      const maxWeight = Math.max(0, ...ex.sets.map((set) => set.weight));
      byExercise[ex.name] = byExercise[ex.name] || [];
      byExercise[ex.name].push({ date: dayjs(workout.date).format("YYYY-MM-DD"), weight: maxWeight });
    }
  }
  res.json({ weeklyVolume: byWeek, strengthByExercise: byExercise });
};

module.exports = { getDashboard, getProgress };
