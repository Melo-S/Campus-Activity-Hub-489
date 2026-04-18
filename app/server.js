const path = require("path");
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
require("dotenv").config();

// Import the sequelize instance so we can sync (create) the DB tables on startup
const { sequelize } = require("./models");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

// Serve repo-level assets/ for styles.css
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: path.join(__dirname, "../") }),
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // stay logged in for 7 days
  })
);

// Expose user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Routes
app.use(authRoutes);
app.use(studentRoutes);

// Placeholders for teammates to replace with real portals
app.get("/admin/dashboard",     (req, res) => res.send("Admin dashboard — coming soon"));
app.get("/organizer/dashboard", (req, res) => res.send("Organizer dashboard — coming soon"));

// 404 — catches any route that didn’t match above
app.use((req, res) => {
  res.status(404).render("errors/404");
});

// 500 — catches any unhandled errors thrown in routes or controllers
// The 4-argument signature is how Express knows this is an error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("errors/500");
});

const PORT = process.env.PORT || 3000;

// sequelize.sync() checks the DB and creates any tables that don't exist yet
// { alter: false } means it won't try to modify existing columns (safe for dev)
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
});