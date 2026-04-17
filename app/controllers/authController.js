const bcrypt = require("bcrypt");
const { User } = require("../models");

// ── Landing ───────────────────────────────────────────────────────────────

exports.renderLanding = (req, res) => {
  // If already logged in, skip the landing page and go straight to their dashboard
  if (!req.session.user) return res.render("landing");

  const role = req.session.user.role;
  if (role === "admin")     return res.redirect("/admin/dashboard");
  if (role === "organizer") return res.redirect("/organizer/dashboard");
  return res.redirect("/student/home");
};

// ── Login ─────────────────────────────────────────────────────────────────

exports.renderLogin = (req, res) => {
  res.render("auth/login", { error: null });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("auth/login", { error: "Please enter your email and password." });
  }

  // Look up the user row by email (case-insensitive via toLowerCase)
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  if (!user) {
    // Vague error on purpose — don't reveal whether the email exists in the DB
    return res.status(401).render("auth/login", { error: "Invalid email or password." });
  }

  // bcrypt.compare hashes the submitted password the same way and checks if they match
  // It never decrypts — bcrypt hashing is one-way
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).render("auth/login", { error: "Invalid email or password." });
  }

  // Store only what views need in the session — never store the password hash
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };

  if (user.role === "admin")     return res.redirect("/admin/dashboard");
  if (user.role === "organizer") return res.redirect("/organizer/dashboard");
  return res.redirect("/student/home");
};

// ── Register ──────────────────────────────────────────────────────────────

exports.renderRegister = (req, res) => {
  res.render("auth/register", { error: null });
};

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  // Basic validation before touching the DB
  if (!name || !email || !password) {
    return res.status(400).render("auth/register", { error: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).render("auth/register", { error: "Passwords do not match." });
  }

  if (password.length < 6) {
    return res.status(400).render("auth/register", { error: "Password must be at least 6 characters." });
  }

  // Check if someone already registered with that email
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(400).render("auth/register", { error: "That email is already registered." });
  }

  // Hash the password with bcrypt before saving — 10 salt rounds is the standard
  const hashedPassword = await bcrypt.hash(password, 10);

  // Only allow student/organizer self-registration; admin accounts are created manually
  const safeRole = role === "organizer" ? "organizer" : "student";

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: safeRole,
  });

  // Log them in immediately after registering
  req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };

  if (newUser.role === "organizer") return res.redirect("/organizer/dashboard");
  return res.redirect("/student/home");
};

// ── Logout ────────────────────────────────────────────────────────────────

exports.logout = (req, res) => {
  // Destroy the session completely — clears all stored user data server-side
  req.session.destroy(() => res.redirect("/login"));
};
