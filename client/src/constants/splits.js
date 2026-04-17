export const SPLITS = {
  Push: ["Chest", "Shoulders", "Triceps"],
  Pull: ["Back", "Rear Delts", "Biceps"],
  Legs: ["Quads", "Hamstrings", "Glutes", "Calves"],
  "Rest Day": ["Recovery", "Mobility"],
  Custom: ["Custom Focus"],
};

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const SPLIT_TEMPLATES = {
  Push: {
    bodyweightKg: 79,
    exercises: [
      { name: "Incline Machine Press", weight: 27.5 },
      { name: "Pec Deck", weight: 60 },
      { name: "Shoulder Press Machine", weight: 27.5 },
      { name: "Unilateral Cable Lateral Raise", weight: 16.1 },
      { name: "V-Bar Triceps Pushdown", weight: 55 },
      { name: "Smith JM Press", weight: 30 },
      { name: "Unilateral Tricep Extensions", weight: 27 },
    ],
  },
  Pull: {
    bodyweightKg: 79,
    exercises: [
      { name: "Lat Pulldown (Cable - Wide)", weight: 60 },
      { name: "Chest Supported Upper Back Row", weight: 25 },
      { name: "Chest Supported Close Grip Row", weight: 27.5 },
      { name: "Reverse Pec Deck (Rear Delt)", weight: 35 },
      { name: "Machine Preacher Curl", weight: 32.5 },
      { name: "Dumbbell Hammer Curl", weight: 14 },
    ],
  },
  Legs: {
    bodyweightKg: 79,
    exercises: [
      { name: "Leg Press", weight: 110 },
      { name: "Leg Extension", weight: 70 },
      { name: "Hamstring Curl", weight: 55 },
      { name: "Adductor Machine", weight: 35 },
      { name: "Calf Raises (Machine) - Full stack", weight: 0 },
      { name: "Abs Machine", weight: 40 },
      { name: "Back Extension", weight: 40 },
    ],
  },
};
