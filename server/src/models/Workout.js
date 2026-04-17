const mongoose = require("mongoose");

const setSchema = new mongoose.Schema(
  {
    reps: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["warmup", "working", "dropset", "failure"],
      default: "working",
    },
  },
  { _id: false }
);

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: [setSchema], default: [] },
    volume: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    split: { type: String, required: true },
    muscles: { type: [String], default: [] },
    notes: { type: String, default: "" },
    exercises: { type: [exerciseSchema], default: [] },
    totalVolume: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workout", workoutSchema);
