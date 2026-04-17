const express = require("express");
const { getDashboard, getProgress } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", getDashboard);
router.get("/progress", getProgress);

module.exports = router;
