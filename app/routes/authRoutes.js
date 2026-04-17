const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.get("/", auth.renderLanding);

// Login routes
router.get("/login", auth.renderLogin);
router.post("/login", auth.login);
router.post("/logout", auth.logout);

// Register routes — /signup keeps the URL the mockups already used
router.get("/signup", auth.renderRegister);
router.post("/signup", auth.register);

module.exports = router;
