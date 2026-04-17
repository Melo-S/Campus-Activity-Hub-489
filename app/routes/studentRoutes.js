const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/requireAuth");
const student = require("../controllers/studentController");

// placeholder for teamates
router.get("/student/home", requireAuth, student.renderHome);

// placeholders for teamates
router.get("/student/facilities", requireAuth, (req, res) => {
  res.send("Student Facilities placeholder (teammate will implement).");
});

router.get("/student/activities/new", requireAuth, (req, res) => {
  res.send("Create Activity placeholder (teammate will implement).");
});

router.get("/student/friends", requireAuth, (req, res) => {
  res.send("Friends placeholder (teammate will implement).");
});

module.exports = router;