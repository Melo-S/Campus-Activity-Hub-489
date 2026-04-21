const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const student = require("../controllers/studentController");

// Every route here requires the user to be logged in (requireAuth checks the session)

// Home feed
router.get("/student/home", requireAuth, student.renderHome);

// Facilities
router.get("/student/facilities", requireAuth, student.renderFacilities);
router.get("/student/facilities/:id", requireAuth, student.renderFacilityDetail);
router.post("/student/facilities/:id/updates", requireAuth, student.submitUpdate);
router.post("/student/facilities/:id/updates/:updateId/vote", requireAuth, student.voteUpdate);

// Activities
router.get("/student/activities/new", requireAuth, student.renderCreateActivity);
router.post("/student/activities", requireAuth, student.createActivity);
router.get("/student/activities/:id", requireAuth, student.renderActivityDetail);
router.post("/student/activities/:id/rsvp", requireAuth, student.rsvpActivity);
router.post("/student/activities/:id/checkin", requireAuth, student.checkinActivity);
router.post("/student/activities/:id/delete", requireAuth, student.deleteActivity);

// Friends
router.get("/student/friends", requireAuth, student.renderFriends);
router.post("/student/friends/request", requireAuth, student.sendFriendRequest);
router.post("/student/friends/:id/accept", requireAuth, student.acceptFriendRequest);

// My Schedule
router.get("/student/schedule", requireAuth, student.renderSchedule);

// Campus Map
router.get("/student/map", requireAuth, student.renderMap);

// Profile
router.get("/student/profile",          requireAuth, student.renderProfile);
router.post("/student/profile",         requireAuth, student.updateProfile);
router.post("/student/profile/password",requireAuth, student.changePassword);

// Join by invite code (public-ish — still requires login)
router.get("/join/:code", requireAuth, student.renderJoin);
router.post("/join/:code", requireAuth, student.joinByCode);

// Report content
router.get("/student/report", requireAuth, student.renderReport);
router.post("/student/report", requireAuth, student.submitReport);

module.exports = router;
