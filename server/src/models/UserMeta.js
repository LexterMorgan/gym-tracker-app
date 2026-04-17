const mongoose = require("mongoose");

const userMetaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    favoriteExercises: { type: [String], default: [] },
    streakCount: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date, default: null },
    lastSplit: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserMeta", userMetaSchema);
