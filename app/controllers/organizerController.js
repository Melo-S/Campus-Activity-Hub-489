const { OrganizerProfile, Location, User } = require("../models");

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

exports.renderDashboard = async (req, res) => {
  const [profile, locations] = await Promise.all([
    loadProfile(req.session.user.id),
    Location.findAll({ order: [["name", "ASC"]] }),
  ]);

  res.render("organizer/dashboard", {
    profile,
    applicationStatus: profile?.applicationStatus || null,
    locations: locations.slice(0, 6),
    success: req.query.success || null,
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
