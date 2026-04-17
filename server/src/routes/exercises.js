const express = require("express");
const {
  getFavorites,
  setFavorites,
  getQuickAdd,
} = require("../controllers/exerciseController");

const router = express.Router();

router.get("/favorites", getFavorites);
router.put("/favorites", setFavorites);
router.get("/quick-add", getQuickAdd);

module.exports = router;
