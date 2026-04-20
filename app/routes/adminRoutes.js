const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const admin = require("../controllers/adminController");

// Every admin route requires login AND the admin role

router.get("/admin/dashboard", requireAuth, requireRole("admin"), admin.renderDashboard);
router.get("/admin/verification-queue", requireAuth, requireRole("admin"), admin.renderVerificationQueue);
router.get("/admin/moderation-queue", requireAuth, requireRole("admin"), admin.renderModerationQueue);
router.post("/admin/organizers/:id/approve", requireAuth, requireRole("admin"), admin.approveOrganizer);
router.post("/admin/organizers/:id/reject", requireAuth, requireRole("admin"), admin.rejectOrganizer);
router.post("/admin/reports/:id/resolve", requireAuth, requireRole("admin"), admin.resolveReport);
router.post("/admin/reports/:id/remove-content", requireAuth, requireRole("admin"), admin.removeReportedContent);

module.exports = router;
