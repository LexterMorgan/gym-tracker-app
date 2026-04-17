const express = require("express");
const { getWeekPlan, saveWeekPlan } = require("../controllers/plannerController");

const router = express.Router();

router.get("/", getWeekPlan);
router.put("/", saveWeekPlan);

module.exports = router;
