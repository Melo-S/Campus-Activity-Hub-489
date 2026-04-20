const { OrganizerProfile } = require("../models");

// Load the organizer profile for the signed-in user so views can check status
async function loadProfile(userId) {
  return OrganizerProfile.findOne({ where: { userId } });
}

exports.renderDashboard = async (req, res) => {
  const profile = await loadProfile(req.session.user.id);
  res.render("organizer/dashboard", {
    profile,
    applicationStatus: profile?.applicationStatus || null,
  });
};
