const mongoose = require("mongoose");
const Workout = require("../models/Workout");
const UserMeta = require("../models/UserMeta");
const { withVolumes, calculateStreak } = require("../services/workoutService");

const VALID_STATUSES = new Set(["warmup", "working", "dropset", "failure"]);
const VALID_SPLITS = new Set(["Push", "Pull", "Legs", "Rest Day", "Custom"]);

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const validateWorkoutPayload = (payload) => {
  if (!payload || typeof payload !== "object") return "Invalid payload";
  const dateTs = new Date(payload.date).getTime();
  if (!Number.isFinite(dateTs)) return "Invalid workout date";
  if (!VALID_SPLITS.has(payload.split)) return "Invalid split";
  if (!Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    return "At least one exercise is required";
  }

  for (const exercise of payload.exercises) {
    if (!exercise || typeof exercise !== "object") return "Invalid exercise row";
    if (!String(exercise.name || "").trim()) return "Exercise name is required";
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      return `Exercise "${exercise.name || "Unknown"}" needs at least one set`;
    }
    for (const set of exercise.sets) {
      if (!isFiniteNumber(set.reps) || set.reps < 0 || set.reps > 100) return "Invalid reps value";
      if (!isFiniteNumber(set.weight) || set.weight < 0 || set.weight > 2000) return "Invalid weight value";
      if (set.status && !VALID_STATUSES.has(set.status)) return "Invalid set status";
    }
  }

  return null;
};

const getOrCreateMeta = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user");
  }
  return UserMeta.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true }
  );
};

const listWorkouts = async (req, res) => {
  const { start, end } = req.query;
  const query = { userId: req.userId };
  if (start || end) {
    query.date = {};
    if (start) query.date.$gte = new Date(start);
    if (end) query.date.$lte = new Date(end);
  }
  const workouts = await Workout.find(query).sort({ date: -1, createdAt: -1 });
  res.json(workouts);
};

const createWorkout = async (req, res) => {
  const validationError = validateWorkoutPayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const normalized = withVolumes(req.body);
  delete normalized.userId;
  normalized.userId = req.userId;
  const workout = await Workout.create(normalized);
  const meta = await getOrCreateMeta(req.userId);
  const streakAction = calculateStreak(meta.lastWorkoutDate, workout.date);
  if (streakAction === "increment") meta.streakCount += 1;
  if (streakAction === "reset") meta.streakCount = 1;
  if (streakAction === 1) meta.streakCount = 1;
  meta.lastWorkoutDate = workout.date;
  meta.lastSplit = workout.split;
  await meta.save();
  res.status(201).json(workout);
};

const updateWorkout = async (req, res) => {
  const validationError = validateWorkoutPayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const normalized = withVolumes(req.body);
  delete normalized.userId;
  const updated = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    normalized,
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Workout not found" });
  res.json(updated);
};

const deleteWorkout = async (req, res) => {
  const removed = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!removed) return res.status(404).json({ message: "Workout not found" });
  res.status(204).end();
};

module.exports = { listWorkouts, createWorkout, updateWorkout, deleteWorkout };
