const mongoose = require("mongoose");

const dayPlanSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    split: { type: String, required: true },
  },
  { _id: false }
);

const weeklyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weekStart: { type: String, required: true },
    days: { type: [dayPlanSchema], default: [] },
  },
  { timestamps: true }
);

weeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("WeeklyPlan", weeklyPlanSchema);
