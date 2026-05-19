const express = require("express");
const router = express.Router();
const { signup, login, getMe, logout } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me  (protected)
router.get("/me", protect, getMe);

module.exports = router;
