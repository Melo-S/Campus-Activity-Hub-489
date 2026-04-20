// Run this once to fill the database with starter data:  node seed.js
// Re-running wipes and recreates everything (force: true) — dev only

const bcrypt = require("bcrypt");
const { sequelize, User, Location, StatusUpdate, Activity, Participant, OrganizerProfile, Report } = require("./models");

async function seed() {
  // sync() creates missing tables without touching existing data
  await sequelize.sync();
  console.log("Tables created.");

  // ── Locations ─────────────────────────────────────────────────────────────
  // Real WSU Pullman facility info + actual posted hours
  const [library] = await Location.findOrCreate({
    where: { name: "Terrell Library" },
    defaults: {
      type: "library",
      description: "WSU's main academic library. 5 floors with quiet study areas, group rooms, and 24-hour zone.",
      hours: "Mon–Thu 7:30am–midnight · Fri 7:30am–10pm · Sat 10am–10pm · Sun 10am–midnight",
    },
  });

  const [urec] = await Location.findOrCreate({
    where: { name: "UREC" },
    defaults: {
      type: "rec",
      description: "Student recreation center with cardio/weight floors, pool, climbing wall, basketball courts, and intramural gym.",
      hours: "Mon–Fri 6am–11pm · Sat 8am–10pm · Sun 10am–9pm",
    },
  });

  const [southside] = await Location.findOrCreate({
    where: { name: "Southside Café" },
    defaults: {
      type: "dining",
      description: "All-you-care-to-eat dining hall in the CUB. Popular for breakfast, lunch, and dinner.",
      hours: "Mon–Fri 7am–10pm · Sat–Sun 10am–8pm",
    },
  });

  const [palouser] = await Location.findOrCreate({
    where: { name: "The Palouser" },
    defaults: {
      type: "dining",
      description: "Casual dining spot in the CUB with burgers, pizza, and daily specials.",
      hours: "Mon–Fri 10:30am–8pm · Sat–Sun Closed",
    },
  });

  const [cub] = await Location.findOrCreate({
    where: { name: "CUB (Compton Union Building)" },
    defaults: {
      type: "other",
      description: "Student union building — lounge seating, study tables, meeting rooms, and food vendors.",
      hours: "Mon–Fri 7am–11pm · Sat 9am–11pm · Sun 10am–11pm",
    },
  });

  const [chinook] = await Location.findOrCreate({
    where: { name: "Chinook Student Center" },
    defaults: {
      type: "dining",
      description: "All-you-care-to-eat dining hall near the northeast residence halls. Known for international food stations.",
      hours: "Mon–Fri 7am–9pm · Sat–Sun 9am–8pm",
    },
  });

  const [ferdinands] = await Location.findOrCreate({
    where: { name: "Ferdinand's" },
    defaults: {
      type: "dining",
      description: "WSU's iconic creamery and deli in the Food Science building. Famous for Cougar Gold cheese and ice cream.",
      hours: "Mon–Fri 9am–5pm · Sat–Sun Closed",
    },
  });

  await Location.findOrCreate({
    where: { name: "Bohler Gym" },
    defaults: {
      type: "rec",
      description: "Older recreation facility near the athletic complex. Has a weight room, basketball courts, and racquetball courts.",
      hours: "Mon–Fri 6am–10pm · Sat 8am–8pm · Sun 10am–8pm",
    },
  });

  await Location.findOrCreate({
    where: { name: "Mooberry Track" },
    defaults: {
      type: "rec",
      description: "Outdoor 400m track and field area open to students. Great for runs and outdoor workouts.",
      hours: "Daily 6am–10pm (weather permitting)",
    },
  });

  await Location.findOrCreate({
    where: { name: "Beasley Coliseum" },
    defaults: {
      type: "other",
      description: "WSU's main events arena. Hosts basketball games, concerts, and large campus events.",
      hours: "Event days only — check WSU Athletics",
    },
  });

  await Location.findOrCreate({
    where: { name: "Glenn Terrell Mall" },
    defaults: {
      type: "other",
      description: "The central outdoor mall running through the heart of campus. Popular for studying, hanging out, and events.",
      hours: "Open 24 hours",
    },
  });

  await Location.findOrCreate({
    where: { name: "WSU Bookstore" },
    defaults: {
      type: "other",
      description: "Campus bookstore in the CUB. Textbooks, supplies, WSU gear, and a café inside.",
      hours: "Mon–Fri 8am–6pm · Sat 10am–5pm · Sun Closed",
    },
  });

  await Location.findOrCreate({
    where: { name: "Student Recreation Center" },
    defaults: {
      type: "rec",
      description: "Student gym and fitness facility on North Fairway Road near the golf course. Has weight rooms, courts, and cardio equipment.",
      hours: "Mon–Fri 6am–11pm · Sat 8am–10pm · Sun 10am–9pm",
    },
  });

  await Location.findOrCreate({
    where: { name: "Hollingbery Fieldhouse" },
    defaults: {
      type: "rec",
      description: "Indoor practice facility next to Bohler Gym near the golf course. Has a jogging track, turf field, and fitness areas open to students.",
      hours: "Mon–Fri 6am–10pm · Sat 8am–8pm · Sun 10am–8pm",
    },
  });

  await Location.findOrCreate({
    where: { name: "Health & Wellness Services" },
    defaults: {
      type: "other",
      description: "Student health clinic on campus for appointments, urgent care, and wellness resources.",
      hours: "Mon–Fri 8am–5pm · Sat–Sun Closed",
    },
  });

  console.log("Locations seeded.");

  // ── Test Accounts ─────────────────────────────────────────────────────────
  // These exist purely for development and demo — not real people
  const studentPass  = await bcrypt.hash("password123", 10);
  const orgPass      = await bcrypt.hash("password123", 10);
  const adminPass    = await bcrypt.hash("password123", 10);

  const [student] = await User.findOrCreate({
    where: { email: "student@wsu.edu" },
    defaults: { name: "Demo Student", password: studentPass, role: "student" },
  });
  const [organizer] = await User.findOrCreate({
    where: { email: "organizer@wsu.edu" },
    defaults: { name: "Demo Organizer", password: orgPass, role: "organizer", isVerified: true },
  });
  const [pendingOrganizer] = await User.findOrCreate({
    where: { email: "pending-organizer@wsu.edu" },
    defaults: { name: "Pending Organizer", password: orgPass, role: "organizer", isVerified: false },
  });
  await User.findOrCreate({
    where: { email: "admin@wsu.edu" },
    defaults: { name: "Demo Admin", password: adminPass, role: "admin" },
  });

  console.log("Users seeded.");

  // ── Organizer Applications ────────────────────────────────────────────────
  // One already approved (ready to post verified updates) and one still pending
  // so the admin verification queue has something to review on first boot.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await OrganizerProfile.findOrCreate({
    where: { userId: organizer.id },
    defaults: {
      organization: "WSU Recreation Center",
      applicationNote: "Staff member for UREC, responsible for posting busy-level updates.",
      applicationStatus: "approved",
      appliedAt: weekAgo,
      reviewedAt: weekAgo,
      isVerified: true,
    },
  });
  await OrganizerProfile.findOrCreate({
    where: { userId: pendingOrganizer.id },
    defaults: {
      organization: "Cougar Cycling Club",
      applicationNote: "I lead the student cycling club and want to post verified rides at Mooberry Track.",
      applicationStatus: "pending",
      appliedAt: new Date(),
      isVerified: false,
    },
  });

  console.log("Organizer applications seeded.");

  // ── Status Updates ─────────────────────────────────────────────────────────
  const now = new Date();
  const addMinutes = (date, mins) => new Date(date.getTime() + mins * 60000);

  const [urecUpdate] = await StatusUpdate.findOrCreate({
    where: { locationId: urec.id, userId: organizer.id, type: "verified" },
    defaults: { status: "busy", expiresAt: addMinutes(now, 120) },
  });

  const [crowdUpdate] = await StatusUpdate.findOrCreate({
    where: { locationId: southside.id, userId: student.id, type: "crowd" },
    defaults: { status: "moderate", expiresAt: addMinutes(now, 30) },
  });

  console.log("Status updates seeded.");

  // ── Activities ────────────────────────────────────────────────────────────
  const [studySession] = await Activity.findOrCreate({
    where: { inviteCode: "CS489-STUDY" },
    defaults: {
      creatorId: student.id,
      locationId: library.id,
      type: "study",
      title: "CS489 Final Project Study Group",
      description: "Working through the final deliverable together. All CS489 students welcome!",
      scheduledAt: addMinutes(now, 90),
      maxParticipants: 6,
    },
  });

  await Activity.findOrCreate({
    where: { inviteCode: "GYM-EVE" },
    defaults: {
      creatorId: student.id,
      locationId: urec.id,
      type: "workout",
      title: "Evening Gym Session",
      description: "Lifting + cardio. Casual pace, all fitness levels welcome.",
      scheduledAt: addMinutes(now, 240),
      maxParticipants: 4,
    },
  });

  await Activity.findOrCreate({
    where: { inviteCode: "DINNER01" },
    defaults: {
      creatorId: student.id,
      locationId: southside.id,
      type: "dinner",
      title: "Dinner @ Southside",
      description: "Meeting at 6pm for dinner before the study session. Join if you want!",
      scheduledAt: addMinutes(now, 30),
      maxParticipants: null,
    },
  });

  await Participant.findOrCreate({
    where: { activityId: studySession.id, userId: student.id },
    defaults: { status: "rsvp" },
  });

  console.log("Activities seeded.");

  // ── Reports ───────────────────────────────────────────────────────────────
  await Report.findOrCreate({
    where: { reporterId: pendingOrganizer.id, contentType: "activity", contentId: studySession.id },
    defaults: { reason: "This activity post looks misleading for a class study session and should be reviewed." },
  });

  await Report.findOrCreate({
    where: { reporterId: organizer.id, contentType: "statusUpdate", contentId: crowdUpdate.id },
    defaults: { reason: "This crowd update looks stale and may no longer reflect the actual wait time." },
  });

  console.log("Reports seeded.");

  console.log("\nSeed complete! Test accounts:");
  console.log("  student@wsu.edu            / password123  (role: student)");
  console.log("  organizer@wsu.edu          / password123  (role: organizer, approved)");
  console.log("  pending-organizer@wsu.edu  / password123  (role: organizer, pending)");
  console.log("  admin@wsu.edu              / password123  (role: admin)");
  console.log("\nNote: 'Alex Student' renamed to 'Demo Student' — create your own account via /signup");

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
