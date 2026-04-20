const { OrganizerProfile, Report, Location } = require("../models");

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
