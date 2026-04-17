const path = require("path");
const express = require("express");
const session = require("express-session");
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
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
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

// placeholders so role redirects won’t 404 yet (teammates will replace)
app.get("/admin/dashboard", (req, res) => res.send("Admin dashboard placeholder"));
app.get("/organizer/dashboard", (req, res) => res.send("Organizer dashboard placeholder"));

const PORT = process.env.PORT || 3000;

// sequelize.sync() checks the DB and creates any tables that don't exist yet
// { alter: false } means it won't try to modify existing columns (safe for dev)
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
});