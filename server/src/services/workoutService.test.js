const test = require("node:test");
const assert = require("node:assert/strict");

const { withVolumes, calculateStreak, suggestNextSplit } = require("./workoutService");

test("withVolumes computes set, exercise and total volume", () => {
  const input = {
    exercises: [
      { name: "Bench", sets: [{ reps: 8, weight: 100 }, { reps: 6, weight: 110 }] },
      { name: "Row", sets: [{ reps: 10, weight: 60 }] },
    ],
  };

  const result = withVolumes(input);
  assert.equal(result.exercises[0].volume, 1460);
  assert.equal(result.exercises[1].volume, 600);
  assert.equal(result.totalVolume, 2060);
});

test("withVolumes defaults invalid status to working", () => {
  const input = {
    exercises: [{ name: "Curl", sets: [{ reps: 10, weight: 20, status: "invalid" }] }],
  };
  const result = withVolumes(input);
  assert.equal(result.exercises[0].sets[0].status, "working");
});

test("calculateStreak handles increment and reset cases", () => {
  assert.equal(calculateStreak(null, "2026-04-10"), 1);
  assert.equal(calculateStreak("2026-04-09", "2026-04-10"), "increment");
  assert.equal(calculateStreak("2026-04-01", "2026-04-10"), "reset");
});

test("suggestNextSplit rotates through split order", () => {
  assert.equal(suggestNextSplit("Push"), "Pull");
  assert.equal(suggestNextSplit("Pull"), "Legs");
  assert.equal(suggestNextSplit("Legs"), "Rest Day");
  assert.equal(suggestNextSplit("Rest Day"), "Push");
  assert.equal(suggestNextSplit("Unknown"), "Push");
});
