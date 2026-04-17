exports.renderLanding = (req, res) => {
  if (!req.session.user) return res.render("landing");

  const role = req.session.user.role;
  if (role === "admin") return res.redirect("/admin/dashboard");
  if (role === "organizer") return res.redirect("/organizer/dashboard");
  return res.redirect("/student/home");
};

exports.renderLogin = (req, res) => {
  res.render("auth/login", { error: null });
};

exports.login = (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .render("auth/login", { error: "Please enter email and password." });
  }

  // Temporary session user (replace with DB later)
  req.session.user = { email, role: role || "student", name: "Test User" };

  if (req.session.user.role === "admin") return res.redirect("/admin/dashboard");
  if (req.session.user.role === "organizer") return res.redirect("/organizer/dashboard");
  return res.redirect("/student/home");
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
};

exports.signupPlaceholder = (req, res) => {
  res.send("Signup placeholder (will be implemented later).");
};