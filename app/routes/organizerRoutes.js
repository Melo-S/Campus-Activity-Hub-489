const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const organizer = require("../controllers/organizerController");

// Every organizer route requires login AND the organizer role

router.get("/organizer/apply", requireAuth, requireRole("organizer"), organizer.renderApply);
router.post("/organizer/apply", requireAuth, requireRole("organizer"), organizer.submitApplication);
router.get("/organizer/dashboard", requireAuth, requireRole("organizer"), organizer.renderDashboard);

module.exports = router;
