const UserMeta = require("../models/UserMeta");
const Workout = require("../models/Workout");

const mongoose = require("mongoose");

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

const getFavorites = async (req, res) => {
  const meta = await getOrCreateMeta(req.userId);
  res.json({ favorites: meta.favoriteExercises || [] });
};

const setFavorites = async (req, res) => {
  const { favorites = [] } = req.body;
  const meta = await getOrCreateMeta(req.userId);
  meta.favoriteExercises = [...new Set(favorites.map((item) => item.trim()).filter(Boolean))];
  await meta.save();
  res.json({ favorites: meta.favoriteExercises });
};

const getQuickAdd = async (req, res) => {
  const latest = await Workout.findOne({ userId: req.userId }).sort({ date: -1 });
  if (!latest) return res.json({ template: null });
  const template = {
    split: latest.split,
    muscles: latest.muscles,
    exercises: latest.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((set) => ({ reps: set.reps, weight: set.weight })),
    })),
  };
  res.json({ template });
};

module.exports = { getFavorites, setFavorites, getQuickAdd };
