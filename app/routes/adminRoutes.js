const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const admin = require("../controllers/adminController");

// Every admin route requires login AND the admin role

router.get("/admin/dashboard", requireAuth, requireRole("admin"), admin.renderDashboard);
router.get("/admin/verification-queue", requireAuth, requireRole("admin"), admin.renderVerificationQueue);
router.post("/admin/organizers/:id/approve", requireAuth, requireRole("admin"), admin.approveOrganizer);
router.post("/admin/organizers/:id/reject", requireAuth, requireRole("admin"), admin.rejectOrganizer);

module.exports = router;
