const { OrganizerProfile, Report, Location, User, Activity, StatusUpdate, Participant, Invite, Vote } = require("../models");

function parseApplicationNote(note = "") {
  const details = { roleTitle: "", reason: "", proof: "" };

  note.split("\n").forEach((line) => {
    if (line.startsWith("Role/Title: ")) details.roleTitle = line.replace("Role/Title: ", "").trim();
    if (line.startsWith("Reason: ")) details.reason = line.replace("Reason: ", "").trim();
    if (line.startsWith("Proof: ")) details.proof = line.replace("Proof: ", "").trim();
  });

  return details;
}

async function loadReportContent(report) {
  if (report.contentType === "activity") {
    const activity = await Activity.findByPk(report.contentId, {
      include: [
        { model: Location, attributes: ["name"] },
        { model: User, as: "creator", attributes: ["name"] },
        { model: Participant },
      ],
    });

    if (!activity) {
      return {
        exists: false,
        title: "Activity already removed",
        subtitle: null,
        detail: "The reported activity is no longer available.",
      };
    }

    return {
      exists: true,
      title: activity.title,
      subtitle: activity.Location?.name || "No location",
      detail: `${activity.Participants.length} RSVP(s) · created by ${activity.creator?.name || "Unknown user"}`,
    };
  }

  const update = await StatusUpdate.findByPk(report.contentId, {
    include: [
      { model: Location, attributes: ["name"] },
      { model: User, attributes: ["name", "role"] },
    ],
  });

  if (!update) {
    return {
      exists: false,
      title: "Status update already removed",
      subtitle: null,
      detail: "The reported update is no longer available.",
    };
  }

  return {
    exists: true,
    title: `${update.status.charAt(0).toUpperCase() + update.status.slice(1)} status update`,
    subtitle: update.Location?.name || "No location",
    detail: `${update.type === "verified" ? "Verified" : "Crowd"} post by ${update.User?.name || "Unknown user"}`,
  };
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

exports.renderModerationQueue = async (req, res) => {
  const reports = await Report.findAll({
    where: { status: "pending" },
    include: [{ model: User, attributes: ["name", "email"] }],
    order: [["createdAt", "ASC"]],
  });

  const reportCards = await Promise.all(reports.map(async (report) => ({
    report,
    content: await loadReportContent(report),
  })));

  res.render("admin/moderation-queue", {
    reportCards,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

exports.resolveReport = async (req, res) => {
  const report = await Report.findByPk(req.params.id);

  if (!report) {
    return res.redirect("/admin/moderation-queue?error=notfound");
  }

  await report.update({ status: "reviewed" });
  return res.redirect("/admin/moderation-queue?success=resolved");
};

exports.removeReportedContent = async (req, res) => {
  const report = await Report.findByPk(req.params.id);

  if (!report) {
    return res.redirect("/admin/moderation-queue?error=notfound");
  }

  if (report.contentType === "activity") {
    await Participant.destroy({ where: { activityId: report.contentId } });
    await Invite.destroy({ where: { activityId: report.contentId } });
    await Activity.destroy({ where: { id: report.contentId } });
  } else {
    await Vote.destroy({ where: { statusUpdateId: report.contentId } });
    await StatusUpdate.destroy({ where: { id: report.contentId } });
  }

  await report.update({ status: "reviewed" });
  return res.redirect("/admin/moderation-queue?success=removed");
};
