const WeeklyPlan = require("../models/WeeklyPlan");

const getWeekPlan = async (req, res) => {
  const { weekStart } = req.query;
  const plan = await WeeklyPlan.findOne({ userId: req.userId, weekStart });
  res.json(plan || { weekStart, days: [] });
};

const saveWeekPlan = async (req, res) => {
  const { weekStart, days } = req.body;
  const plan = await WeeklyPlan.findOneAndUpdate(
    { userId: req.userId, weekStart },
    { userId: req.userId, weekStart, days },
    { upsert: true, new: true }
  );
  res.json(plan);
};

module.exports = { getWeekPlan, saveWeekPlan };
