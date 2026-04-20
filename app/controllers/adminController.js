const { OrganizerProfile, Report, Location, User } = require("../models");

function parseApplicationNote(note = "") {
  const details = { roleTitle: "", reason: "", proof: "" };

  note.split("\n").forEach((line) => {
    if (line.startsWith("Role/Title: ")) details.roleTitle = line.replace("Role/Title: ", "").trim();
    if (line.startsWith("Reason: ")) details.reason = line.replace("Reason: ", "").trim();
    if (line.startsWith("Proof: ")) details.proof = line.replace("Proof: ", "").trim();
  });

  return details;
}

exports.renderDashboard = async (req, res) => {
  // Dashboard cards show high-level counts so admin knows what needs attention
  const [pendingApplications, openReports, totalLocations] = await Promise.all([
    OrganizerProfile.count({ where: { applicationStatus: "pending" } }),
    Report.count({ where: { status: "pending" } }),
    Location.count(),
  ]);

  res.render("admin/dashboard", {
    pendingApplications,
    openReports,
    totalLocations,
  });
};

exports.renderVerificationQueue = async (req, res) => {
  const applications = await OrganizerProfile.findAll({
    where: { applicationStatus: "pending" },
    include: [{ model: User }],
    order: [["appliedAt", "ASC"]],
  });

  res.render("admin/verification-queue", {
    applications: applications.map((application) => ({
      application,
      details: parseApplicationNote(application.applicationNote || ""),
    })),
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

exports.approveOrganizer = async (req, res) => {
  const profile = await OrganizerProfile.findByPk(req.params.id);

  if (!profile) {
    return res.redirect("/admin/verification-queue?error=notfound");
  }

  await profile.update({
    applicationStatus: "approved",
    isVerified: true,
    reviewedAt: new Date(),
  });

  await User.update({ isVerified: true }, { where: { id: profile.userId } });
  return res.redirect("/admin/verification-queue?success=approved");
};

exports.rejectOrganizer = async (req, res) => {
  const profile = await OrganizerProfile.findByPk(req.params.id);

  if (!profile) {
    return res.redirect("/admin/verification-queue?error=notfound");
  }

  await profile.update({
    applicationStatus: "rejected",
    isVerified: false,
    reviewedAt: new Date(),
  });

  await User.update({ isVerified: false }, { where: { id: profile.userId } });
  return res.redirect("/admin/verification-queue?success=rejected");
};
