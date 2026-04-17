const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.get("/", auth.renderLanding);

router.get("/login", auth.renderLogin);
router.post("/login", auth.login);
router.post("/logout", auth.logout);

router.get("/signup", auth.signupPlaceholder);

module.exports = router;