const { OrganizerProfile, Location, User, StatusUpdate } = require("../models");

async function loadProfile(userId) {
  return OrganizerProfile.findOne({ where: { userId } });
}

function parseApplicationNote(note = "") {
  const fields = { roleTitle: "", reason: "", proof: "" };

  note.split("\n").forEach((line) => {
    if (line.startsWith("Role/Title: ")) fields.roleTitle = line.replace("Role/Title: ", "").trim();
    if (line.startsWith("Reason: ")) fields.reason = line.replace("Reason: ", "").trim();
    if (line.startsWith("Proof: ")) fields.proof = line.replace("Proof: ", "").trim();
  });

  return fields;
}

function buildApplicationNote({ roleTitle, reason, proof }) {
  const lines = [];
  if (roleTitle) lines.push(`Role/Title: ${roleTitle}`);
  if (reason) lines.push(`Reason: ${reason}`);
  if (proof) lines.push(`Proof: ${proof}`);
  return lines.join("\n");
}

function getApplicationForm(profile) {
  const parsed = parseApplicationNote(profile?.applicationNote || "");

  return {
    organization: profile?.organization || "",
    roleTitle: parsed.roleTitle,
    reason: parsed.reason,
    proof: parsed.proof,
  };
}

function timeAgo(date) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(status) {
  return { light: "success", moderate: "warning", busy: "danger" }[status] || "secondary";
}

async function loadFacilityToolsData(locationId) {
  const location = await Location.findByPk(locationId);
  if (!location) return null;

  const updates = await StatusUpdate.findAll({
    where: { locationId: location.id },
    include: [{ model: User, attributes: ["name", "role"] }],
    order: [["createdAt", "DESC"]],
    limit: 8,
  });

  const activeUpdates = updates.filter((update) => new Date(update.expiresAt) > new Date());

  return {
    location,
    updates: activeUpdates.map((update) => ({
      id: update.id,
      status: update.status,
      type: update.type,
      statusColor: statusColor(update.status),
      postedBy: update.User?.name || "Unknown user",
      postedByRole: update.User?.role || "unknown",
      posted: timeAgo(update.createdAt),
      expiresAt: update.expiresAt,
    })),
  };
}

async function loadApprovedProfile(userId) {
  const profile = await loadProfile(userId);
  if (!profile || profile.applicationStatus !== "approved") return null;
  return profile;
}

exports.renderDashboard = async (req, res) => {
  const [profile, locations] = await Promise.all([
    loadProfile(req.session.user.id),
    Location.findAll({ order: [["name", "ASC"]] }),
  ]);

  res.render("organizer/dashboard", {
    profile,
    applicationStatus: profile?.applicationStatus || null,
    locations: locations.slice(0, 6),
    defaultLocationId: locations[0]?.id || null,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

exports.renderApply = async (req, res) => {
  const profile = await loadProfile(req.session.user.id);

  if (profile?.applicationStatus === "approved") {
    return res.redirect("/organizer/dashboard");
  }

  res.render("organizer/apply", {
    profile,
    applicationStatus: profile?.applicationStatus || null,
    defaultLocationId: null,
    error: null,
    form: getApplicationForm(profile),
  });
};

exports.submitApplication = async (req, res) => {
  const organization = req.body.organization?.trim() || "";
  const roleTitle = req.body.roleTitle?.trim() || "";
  const reason = req.body.reason?.trim() || "";
  const proof = req.body.proof?.trim() || "";
  const userId = req.session.user.id;
  const profile = await loadProfile(userId);

  if (profile?.applicationStatus === "approved") {
    return res.redirect("/organizer/dashboard");
  }

  if (!organization || !roleTitle || !reason) {
    return res.status(400).render("organizer/apply", {
      profile,
      applicationStatus: profile?.applicationStatus || null,
      defaultLocationId: null,
      error: "Organization, role title, and reason are required.",
      form: { organization, roleTitle, reason, proof },
    });
  }

  const now = new Date();
  const note = buildApplicationNote({ roleTitle, reason, proof });

  if (profile) {
    await profile.update({
      organization,
      applicationNote: note,
      applicationStatus: "pending",
      appliedAt: now,
      reviewedAt: null,
      isVerified: false,
    });
  } else {
    await OrganizerProfile.create({
      userId,
      organization,
      applicationNote: note,
      applicationStatus: "pending",
      appliedAt: now,
      reviewedAt: null,
      isVerified: false,
    });
  }

  await User.update({ isVerified: false }, { where: { id: userId } });
  return res.redirect("/organizer/dashboard?success=applied");
};

exports.renderManageFacility = async (req, res) => {
  const profile = await loadApprovedProfile(req.session.user.id);
  if (!profile) return res.redirect("/organizer/dashboard?error=approval");

  const facility = await loadFacilityToolsData(req.params.id);
  if (!facility) return res.redirect("/organizer/dashboard?error=location");

  const latestVerified = facility.updates.find((update) => update.type === "verified") || null;
  const latestCrowd = facility.updates.find((update) => update.type === "crowd") || null;

  res.render("organizer/manage-facility", {
    profile,
    applicationStatus: profile.applicationStatus,
    defaultLocationId: facility.location.id,
    location: facility.location,
    updates: facility.updates,
    latestVerified,
    latestCrowd,
    success: req.query.success || null,
  });
};

exports.renderPostUpdate = async (req, res) => {
  const profile = await loadApprovedProfile(req.session.user.id);
  if (!profile) return res.redirect("/organizer/dashboard?error=approval");

  const facility = await loadFacilityToolsData(req.params.id);
  if (!facility) return res.redirect("/organizer/dashboard?error=location");

  res.render("organizer/post-update", {
    profile,
    applicationStatus: profile.applicationStatus,
    defaultLocationId: facility.location.id,
    location: facility.location,
    currentVerified: facility.updates.find((update) => update.type === "verified") || null,
    error: null,
  });
};

exports.postVerifiedUpdate = async (req, res) => {
  const profile = await loadApprovedProfile(req.session.user.id);
  if (!profile) return res.redirect("/organizer/dashboard?error=approval");

  const facility = await loadFacilityToolsData(req.params.id);
  if (!facility) return res.redirect("/organizer/dashboard?error=location");

  const status = req.body.status?.trim();
  if (!["light", "moderate", "busy"].includes(status)) {
    return res.status(400).render("organizer/post-update", {
      profile,
      applicationStatus: profile.applicationStatus,
      defaultLocationId: facility.location.id,
      location: facility.location,
      currentVerified: facility.updates.find((update) => update.type === "verified") || null,
      error: "Please choose a valid busy level.",
    });
  }

  await StatusUpdate.create({
    locationId: facility.location.id,
    userId: req.session.user.id,
    status,
    type: "verified",
    expiresAt: new Date(Date.now() + 120 * 60000),
  });

  return res.redirect(`/organizer/facilities/${facility.location.id}?success=posted`);
};
