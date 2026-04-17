import { SPLITS } from "../constants/splits";

const MUSCLE_ORDER = [
  "chest",
  "shoulders",
  "triceps",
  "back",
  "rear delts",
  "biceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

const normalize = (name) => String(name || "").trim().toLowerCase();

const inferMusclesFromSplit = (split) => (SPLITS[split] || []).map((m) => normalize(m));

const RULES = [
  {
    keywords: ["tricep", "pushdown", "skull", "jm press", "overhead extension"],
    primary: ["triceps"],
    secondary: [],
  },
  {
    keywords: ["bicep", "curl", "hammer curl", "preacher"],
    primary: ["biceps"],
    secondary: [],
  },
  {
    keywords: ["chest", "pec", "press", "fly", "incline", "bench"],
    primary: ["chest"],
    // Keep spillover intentionally narrow per request.
    secondary: ["triceps"],
  },
  {
    keywords: ["lateral raise", "shoulder press", "overhead press", "front raise", "rear delt", "reverse pec"],
    primary: ["shoulders"],
    secondary: ["triceps"],
  },
  {
    keywords: ["row", "pulldown", "pull-up", "lat", "upper back", "deadlift"],
    primary: ["back"],
    secondary: ["biceps", "rear delts"],
  },
  {
    keywords: ["leg press", "leg extension", "squat", "lunge"],
    primary: ["quads"],
    secondary: ["glutes"],
  },
  {
    keywords: ["hamstring", "rdl", "stiff leg", "back extension"],
    primary: ["hamstrings"],
    secondary: ["glutes"],
  },
  {
    keywords: ["calf"],
    primary: ["calves"],
    secondary: [],
  },
  {
    keywords: ["glute", "hip thrust", "adductor"],
    primary: ["glutes"],
    secondary: ["hamstrings"],
  },
];

const inferFromExerciseName = (exerciseName) => {
  const lower = normalize(exerciseName);
  if (!lower) return null;
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule;
    }
  }
  return null;
};

export function computeMuscleRecovery(workouts = []) {
  const now = Date.now();
  const scores = Object.fromEntries(
    MUSCLE_ORDER.map((muscle) => [muscle, { muscle, fatigue: 0, lastHitTs: 0 }])
  );

  for (const workout of workouts) {
    const ts = new Date(workout.date).getTime();
    if (!Number.isFinite(ts)) continue;
    const hoursSince = Math.max(0, (now - ts) / 3600000);
    if (hoursSince > 24 * 14) continue;

    const volume = Number(workout.totalVolume || 0);
    const intensity = Math.log10(Math.max(volume, 1) + 10) * 10;
    const decay = Math.exp(-hoursSince / 48);
    const workoutFatigue = intensity * decay;

    let matchedAnyExercise = false;
    for (const exercise of workout.exercises || []) {
      const rule = inferFromExerciseName(exercise?.name);
      if (!rule) continue;
      matchedAnyExercise = true;
      for (const muscle of rule.primary || []) {
        const key = normalize(muscle);
        if (!scores[key]) continue;
        scores[key].fatigue += workoutFatigue;
        scores[key].lastHitTs = Math.max(scores[key].lastHitTs, ts);
      }
      for (const muscle of rule.secondary || []) {
        const key = normalize(muscle);
        if (!scores[key]) continue;
        scores[key].fatigue += workoutFatigue * 0.35;
        scores[key].lastHitTs = Math.max(scores[key].lastHitTs, ts);
      }
    }

    if (!matchedAnyExercise) {
      const muscles = (workout.muscles?.length ? workout.muscles : inferMusclesFromSplit(workout.split))
        .map((m) => normalize(m))
        .filter((m) => scores[m]);

      for (const muscle of muscles) {
        const row = scores[muscle];
        row.fatigue += workoutFatigue;
        row.lastHitTs = Math.max(row.lastHitTs, ts);
      }
    }
  }

  return MUSCLE_ORDER.map((muscle) => {
    const row = scores[muscle];
    const readiness = Math.max(0, Math.min(100, Math.round(100 - row.fatigue * 2.1)));
    const status = readiness >= 70 ? "ready" : readiness >= 45 ? "moderate" : "fatigued";
    return {
      id: muscle,
      label: muscle
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" "),
      readiness,
      status,
      lastHitTs: row.lastHitTs || null,
    };
  });
}
