require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDb } = require("./config/db");

const { requireAuth } = require("./middleware/auth");
const authRouter = require("./routes/auth");
const workoutsRouter = require("./routes/workouts");
const plannerRouter = require("./routes/planner");
const dashboardRouter = require("./routes/dashboard");
const exercisesRouter = require("./routes/exercises");

const parseAllowedOrigins = () =>
  String(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = parseAllowedOrigins();
    // Allow non-browser requests and local development convenience when unset.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/workouts", requireAuth, workoutsRouter);
app.use("/api/planner", requireAuth, plannerRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/exercises", requireAuth, exercisesRouter);

app.use((err, _req, res, _next) => {
  // Centralized error response for expected + unexpected failures.
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) console.error(err);
  const isCorsError = /cors|origin/i.test(String(err?.message || ""));
  if (isCorsError) {
    return res.status(403).json({ message: "Blocked by CORS policy" });
  }
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 4000;

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is required in production");
  process.exit(1);
}

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
