const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const admin = require("../controllers/adminController");

// Every admin route requires login AND the admin role

router.get("/admin/dashboard", requireAuth, requireRole("admin"), admin.renderDashboard);

module.exports = router;
