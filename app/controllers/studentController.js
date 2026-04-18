const crypto = require("crypto"); // built-in Node module — used to generate random invite codes
const { Op } = require("sequelize"); // Op gives us SQL operators like >, <, BETWEEN, IN
const { Location, StatusUpdate, Activity, Participant, Friendship, Vote, User, Report } = require("../models");

// Converts a Date to a human-readable "X min ago" string for the UI
function timeAgo(date) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Maps a status string to a Bootstrap color name for badge/text coloring
function statusColor(status) {
  return { light: "success", moderate: "warning", busy: "danger" }[status] || "secondary";
}

// Returns a typical busyness level based on facility type + current time
// This fills in when no active crowd/verified report exists — labeled "Typical" in the UI
// Patterns are based on realistic WSU campus behavior by hour and day
function getTypicalBusyness(locationType, now) {
  const hour = now.getHours();        // 0–23
  const day  = now.getDay();          // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;

  if (locationType === "library") {
    // Library is closed late night / early morning
    if (hour < 7 || hour >= 24) return null; // closed
    if (isWeekend) {
      if (hour < 10) return "light";
      if (hour < 17) return "moderate";
      return "light";
    }
    // Weekday: builds through morning, peaks midday–afternoon
    if (hour < 9)  return "light";
    if (hour < 11) return "moderate";
    if (hour < 18) return "busy";
    if (hour < 21) return "moderate";
    return "light";
  }

  if (locationType === "rec") {
    // UREC is closed very early and late
    if (hour < 6 || hour >= 23) return null;
    if (isWeekend) {
      if (hour < 10) return "light";
      if (hour < 14) return "moderate";
      return "light";
    }
    // Weekday: morning crowd + big after-class peak 3–7pm
    if (hour < 8)  return "light";
    if (hour < 10) return "moderate";
    if (hour < 15) return "light";
    if (hour < 19) return "busy";
    if (hour < 21) return "moderate";
    return "light";
  }

  if (locationType === "dining") {
    // Dining closed between service periods
    if (hour < 7 || hour >= 22) return null;
    // Rush at lunch (11–1) and dinner (5–7), quiet in between
    if (hour < 9)  return "light";
    if (hour < 11) return "moderate";
    if (hour < 13) return "busy";   // lunch rush
    if (hour < 17) return "light";
    if (hour < 19) return "busy";   // dinner rush
    if (hour < 21) return "moderate";
    return "light";
  }

  // Generic fallback for "other" location types
  if (hour < 8 || hour >= 20) return null;
  if (hour < 10 || hour > 17) return "light";
  return "moderate";
}

// ── Home Feed ─────────────────────────────────────────────────────────────

exports.renderHome = async (req, res) => {
  const now = new Date();
  const myId = req.session.user.id;

  // Set the time window for "Today" — midnight to 11:59pm of the current day
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  // ── Happening Now tab: facilities + latest non-expired status update ──
  const locations = await Location.findAll({
    include: [{
      model: StatusUpdate,
      where: { expiresAt: { [Op.gt]: now } }, // only updates that haven't expired yet
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
      limit: 1,
      required: false, // LEFT JOIN — show location even if no active updates exist
    }],
  });

  const facilities = locations.map(loc => {
    const latest = loc.StatusUpdates[0];
    // Fall back to time-based typical busyness when no one has filed a report yet
    const typical = !latest ? getTypicalBusyness(loc.type, now) : null;
    const resolvedStatus = latest ? latest.status : (typical || "closed");
    return {
      id: loc.id,
      name: loc.name,
      status: resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1),
      statusColor: statusColor(resolvedStatus),
      // "Typical" badge signals this is an algorithm estimate, not a real student report
      badge: latest ? (latest.type === "verified" ? "Verified" : "Crowd") : (typical ? "Typical" : null),
      updated: latest ? timeAgo(latest.createdAt) : (typical ? "Based on typical patterns" : null),
      hours: loc.hours || null,
    };
  });

  // ── Today tab: activities scheduled for today ──
  const todayActivities = await Activity.findAll({
    where: { scheduledAt: { [Op.between]: [todayStart, todayEnd] } },
    include: [
      { model: User, as: "creator", attributes: ["name"] },
      { model: Location, attributes: ["name"] },
      { model: Participant },
    ],
    order: [["scheduledAt", "ASC"]],
  });

  // ── Friends tab: upcoming activities from accepted friends ──
  const friendships = await Friendship.findAll({
    where: {
      // A friendship can appear with me as either userId or friendId
      [Op.or]: [
        { userId: myId, status: "accepted" },
        { friendId: myId, status: "accepted" },
      ],
    },
  });

  // Extract just the IDs of my friends (the "other side" of each friendship)
  const friendIds = friendships.map(f => (f.userId === myId ? f.friendId : f.userId));

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const friendActivities = friendIds.length > 0
    ? await Activity.findAll({
        where: {
          creatorId: { [Op.in]: friendIds },
          scheduledAt: { [Op.between]: [now, nextWeek] }, // upcoming in the next 7 days
        },
        include: [
          { model: User, as: "creator", attributes: ["name"] },
          { model: Location, attributes: ["name"] },
          { model: Participant },
        ],
        order: [["scheduledAt", "ASC"]],
        limit: 10,
      })
    : [];

  res.render("student/home", { facilities, todayActivities, friendActivities });
};

// ── Facilities List ───────────────────────────────────────────────────────

exports.renderFacilities = async (req, res) => {
  const now = new Date();
  const locations = await Location.findAll({
    include: [{
      model: StatusUpdate,
      where: { expiresAt: { [Op.gt]: now } },
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
      limit: 1,
      required: false,
    }],
  });

  const facilities = locations.map(loc => {
    const latest = loc.StatusUpdates[0];
    return {
      id: loc.id,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      status: (() => {
        if (latest) return latest.status;
        const typical = getTypicalBusyness(loc.type, now);
        return typical || "closed";
      })(),
      statusColor: (() => {
        if (latest) return statusColor(latest.status);
        const typical = getTypicalBusyness(loc.type, now);
        return typical ? statusColor(typical) : "secondary";
      })(),
      badge: latest ? (latest.type === "verified" ? "Verified" : "Crowd") : (getTypicalBusyness(loc.type, now) ? "Typical" : null),
      updated: latest ? timeAgo(latest.createdAt) : (getTypicalBusyness(loc.type, now) ? "Based on typical patterns" : null),
      hours: loc.hours || null,
    };
  });

  res.render("student/facilities", { facilities });
};

// ── Facility Detail ───────────────────────────────────────────────────────

exports.renderFacilityDetail = async (req, res) => {
  const now = new Date();
  const location = await Location.findByPk(req.params.id);
  if (!location) return res.redirect("/student/facilities");

  // Get all non-expired status updates for this location, newest first
  const updates = await StatusUpdate.findAll({
    where: { locationId: location.id, expiresAt: { [Op.gt]: now } },
    include: [
      { model: User, attributes: ["name", "role"] },
      { model: Vote }, // we count these to show confirm/disagree totals
    ],
    order: [["createdAt", "DESC"]],
  });

  const myId = req.session.user.id;

  // Shape each update into a clean object the view can loop over
  const feed = updates.map(u => ({
    id: u.id,
    status: u.status,
    statusColor: statusColor(u.status),
    type: u.type,
    postedBy: u.User.name,
    postedByRole: u.User.role,
    posted: timeAgo(u.createdAt),
    confirms: u.Votes.filter(v => v.type === "confirm").length,
    disagrees: u.Votes.filter(v => v.type === "disagree").length,
    myVote: u.Votes.find(v => v.userId === myId)?.type || null, // has current user voted yet?
  }));

  // If no active reports, compute typical busyness so the header isn't blank
  const typicalStatus = feed.length === 0 ? getTypicalBusyness(location.type, now) : null;

  res.render("student/facility-detail", {
    location,
    feed,
    latest: feed[0] || null,
    typicalStatus,   // null if there are real reports; a string like "busy" if derived
    error: req.query.error || null,
  });
};

exports.submitUpdate = async (req, res) => {
  const { status } = req.body;
  const locationId = req.params.id;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  if (!["light", "moderate", "busy"].includes(status)) {
    return res.redirect(`/student/facilities/${locationId}?error=invalid`);
  }

  // Verified updates (organizers) last 2 hours; student crowd reports last 30 min
  const expiresMins = userRole === "organizer" ? 120 : 30;
  const expiresAt = new Date(Date.now() + expiresMins * 60000);

  await StatusUpdate.create({
    locationId,
    userId,
    status,
    type: userRole === "organizer" ? "verified" : "crowd",
    expiresAt,
  });

  res.redirect(`/student/facilities/${locationId}`);
};

exports.voteUpdate = async (req, res) => {
  const { type } = req.body; // "confirm" or "disagree"
  const { id: locationId, updateId } = req.params;
  const userId = req.session.user.id;

  if (!["confirm", "disagree"].includes(type)) {
    return res.redirect(`/student/facilities/${locationId}`);
  }

  // If the user already voted, change their vote instead of creating a duplicate
  const existing = await Vote.findOne({ where: { statusUpdateId: updateId, userId } });
  if (existing) {
    existing.type = type;
    await existing.save();
  } else {
    await Vote.create({ statusUpdateId: updateId, userId, type });
  }

  res.redirect(`/student/facilities/${locationId}`);
};

// ── Create Activity ───────────────────────────────────────────────────────

exports.renderCreateActivity = async (req, res) => {
  const locations = await Location.findAll(); // for the location dropdown
  res.render("student/activity-new", { locations, error: null });
};

exports.createActivity = async (req, res) => {
  const { title, type, locationId, description, scheduledAt, maxParticipants } = req.body;
  const creatorId = req.session.user.id;

  if (!title || !scheduledAt) {
    const locations = await Location.findAll();
    return res.status(400).render("student/activity-new", {
      locations,
      error: "Title and scheduled time are required.",
    });
  }

  // crypto.randomBytes gives us random hex — 4 bytes = 8 hex chars, then uppercase for readability
  const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const activity = await Activity.create({
    creatorId,
    title,
    type: type || "other",
    locationId: locationId || null,
    description: description || null,
    scheduledAt: new Date(scheduledAt),
    maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
    inviteCode,
  });

  // Auto-RSVP the creator so they appear in their own participant list
  await Participant.create({ activityId: activity.id, userId: creatorId, status: "rsvp" });

  res.redirect(`/student/activities/${activity.id}`);
};

// ── Activity Detail ───────────────────────────────────────────────────────

exports.renderActivityDetail = async (req, res) => {
  const activity = await Activity.findByPk(req.params.id, {
    include: [
      { model: User, as: "creator", attributes: ["name"] },
      { model: Location, attributes: ["name"] },
      {
        model: Participant,
        include: [{ model: User, attributes: ["name"] }], // show participant names
      },
    ],
  });

  if (!activity) return res.redirect("/student/home");

  const myId = req.session.user.id;
  const myParticipant = activity.Participants.find(p => p.userId === myId) || null;

  // Build the full invite URL here so the view doesn't need access to req
  const inviteUrl = activity.inviteCode
    ? `${req.protocol}://${req.get("host")}/join/${activity.inviteCode}`
    : null;

  res.render("student/activity-detail", {
    activity,
    myParticipant,
    inviteUrl,
    rsvpCount: activity.Participants.length,
    error: req.query.error || null,
  });
};

exports.rsvpActivity = async (req, res) => {
  const activityId = req.params.id;
  const userId = req.session.user.id;

  const activity = await Activity.findByPk(activityId, { include: [Participant] });
  if (!activity) return res.redirect("/student/home");

  // Don't create a duplicate RSVP for the same user
  const alreadyIn = activity.Participants.find(p => p.userId === userId);
  if (alreadyIn) return res.redirect(`/student/activities/${activityId}`);

  // Enforce the participant cap if one was set
  if (activity.maxParticipants && activity.Participants.length >= activity.maxParticipants) {
    return res.redirect(`/student/activities/${activityId}?error=full`);
  }

  await Participant.create({ activityId, userId, status: "rsvp" });
  res.redirect(`/student/activities/${activityId}`);
};

exports.checkinActivity = async (req, res) => {
  const activityId = req.params.id;
  const userId = req.session.user.id;

  // You can only check in if you've already RSVP'd
  const participant = await Participant.findOne({ where: { activityId, userId } });
  if (!participant) return res.redirect(`/student/activities/${activityId}`);

  participant.status = "checked_in";
  await participant.save();
  res.redirect(`/student/activities/${activityId}`);
};

// ── Friends ───────────────────────────────────────────────────────────────

exports.renderFriends = async (req, res) => {
  const myId = req.session.user.id;

  // Get all accepted friendships and include the User rows for both sides
  const acceptedFriendships = await Friendship.findAll({
    where: {
      [Op.or]: [
        { userId: myId, status: "accepted" },
        { friendId: myId, status: "accepted" },
      ],
    },
    include: [
      { model: User, as: "requester", attributes: ["id", "name", "email"] },
      { model: User, as: "recipient", attributes: ["id", "name", "email"] },
    ],
  });

  // Reduce each friendship to just "the other person" — not myself
  const friends = acceptedFriendships.map(f => ({
    friendshipId: f.id,
    user: f.userId === myId ? f.recipient : f.requester,
  }));

  // Incoming requests — other users who added me and I haven't accepted yet
  const pendingReceived = await Friendship.findAll({
    where: { friendId: myId, status: "pending" },
    include: [{ model: User, as: "requester", attributes: ["id", "name", "email"] }],
  });

  // Outgoing requests I sent but the other person hasn't accepted yet
  const pendingSent = await Friendship.findAll({
    where: { userId: myId, status: "pending" },
    include: [{ model: User, as: "recipient", attributes: ["id", "name", "email"] }],
  });

  const errorMessages = {
    notfound: "No user found with that email.",
    self: "You can't add yourself as a friend.",
    exists: "You already have a connection with that user.",
  };

  res.render("student/friends", {
    friends,
    pendingReceived,
    pendingSent,
    error: req.query.error ? (errorMessages[req.query.error] || "Something went wrong.") : null,
    success: req.query.success ? "Friend request sent!" : null,
  });
};

exports.sendFriendRequest = async (req, res) => {
  const { email } = req.body;
  const myId = req.session.user.id;

  const target = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!target) return res.redirect("/student/friends?error=notfound");
  if (target.id === myId) return res.redirect("/student/friends?error=self");

  // Block duplicate requests in either direction
  const existing = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId: myId, friendId: target.id },
        { userId: target.id, friendId: myId },
      ],
    },
  });
  if (existing) return res.redirect("/student/friends?error=exists");

  await Friendship.create({ userId: myId, friendId: target.id });
  res.redirect("/student/friends?success=1");
};

exports.acceptFriendRequest = async (req, res) => {
  // Verify the current user is the recipient before allowing the accept
  const friendship = await Friendship.findOne({
    where: { id: req.params.id, friendId: req.session.user.id, status: "pending" },
  });
  if (!friendship) return res.redirect("/student/friends");

  friendship.status = "accepted";
  await friendship.save();
  res.redirect("/student/friends");
};

// ── My Schedule ───────────────────────────────────────────────────────────

exports.renderSchedule = async (req, res) => {
  const myId = req.session.user.id;
  const now = new Date();

  // Find every Participant row for this user, pull in the full Activity + Location + creator
  const participations = await Participant.findAll({
    where: { userId: myId },
    include: [{
      model: Activity,
      include: [
        { model: User, as: "creator", attributes: ["name"] },
        { model: Location, attributes: ["name"] },
        { model: Participant }, // to count total RSVPs per activity
      ],
    }],
    order: [[Activity, "scheduledAt", "ASC"]],
  });

  // Split into upcoming vs past so the view can render two separate sections
  const upcoming = participations.filter(p => new Date(p.Activity.scheduledAt) >= now);
  const past     = participations.filter(p => new Date(p.Activity.scheduledAt) <  now);

  // Also include activities the user created (they may not have RSVP'd their own)
  const created = await Activity.findAll({
    where: { creatorId: myId, scheduledAt: { [Op.gte]: now } },
    include: [
      { model: Location, attributes: ["name"] },
      { model: Participant },
    ],
    order: [["scheduledAt", "ASC"]],
  });

  res.render("student/schedule", { upcoming, past, created });
};

// ── Join by Invite Code ───────────────────────────────────────────────────

exports.renderJoin = async (req, res) => {
  // Look up the activity by its short invite code (case-insensitive)
  const activity = await Activity.findOne({
    where: { inviteCode: req.params.code.toUpperCase() },
    include: [
      { model: User, as: "creator", attributes: ["name"] },
      { model: Location, attributes: ["name"] },
      { model: Participant },
    ],
  });

  if (!activity) return res.render("student/join", { activity: null, code: req.params.code });

  const myId = req.session.user.id;
  const alreadyJoined = activity.Participants.some(p => p.userId === myId);

  res.render("student/join", { activity, alreadyJoined, code: req.params.code });
};

exports.joinByCode = async (req, res) => {
  const activity = await Activity.findOne({
    where: { inviteCode: req.params.code.toUpperCase() },
    include: [Participant],
  });

  if (!activity) return res.redirect(`/join/${req.params.code}`);

  const userId = req.session.user.id;

  // Don't double-add
  if (activity.Participants.some(p => p.userId === userId)) {
    return res.redirect(`/student/activities/${activity.id}`);
  }

  // Respect the cap
  if (activity.maxParticipants && activity.Participants.length >= activity.maxParticipants) {
    return res.redirect(`/join/${req.params.code}?error=full`);
  }

  await Participant.create({ activityId: activity.id, userId, status: "rsvp" });
  res.redirect(`/student/activities/${activity.id}`);
};

// ── Report Content ────────────────────────────────────────────────────────

exports.renderReport = (req, res) => {
  // contentType and contentId come from the link on the activity/facility detail page
  const { contentType, contentId } = req.query;
  res.render("student/report", { contentType, contentId, error: null, success: false });
};

exports.submitReport = async (req, res) => {
  const { contentType, contentId, reason } = req.body;
  const reporterId = req.session.user.id;

  if (!reason || !reason.trim()) {
    return res.render("student/report", {
      contentType, contentId, error: "Please describe the issue.", success: false,
    });
  }

  if (!["activity", "statusUpdate"].includes(contentType)) {
    return res.redirect("/student/home");
  }

  await Report.create({ reporterId, contentType, contentId: parseInt(contentId), reason });

  // Show success in the same view rather than redirecting — user can see their report was sent
  res.render("student/report", { contentType, contentId, error: null, success: true });
};
