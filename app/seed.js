// Run this once to fill the database with starter data:  node seed.js
// Re-running wipes and recreates everything (force: true) — dev only

const bcrypt = require("bcrypt");
const { sequelize, User, Location, StatusUpdate, Activity, Participant } = require("./models");

async function seed() {
  // force:true drops and recreates all tables — gives us a clean slate every run
  await sequelize.sync({ force: true });
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
  await User.findOrCreate({
    where: { email: "admin@wsu.edu" },
    defaults: { name: "Demo Admin", password: adminPass, role: "admin" },
  });

  console.log("Users seeded.");

  // ── Status Updates ─────────────────────────────────────────────────────────
  const now = new Date();
  const addMinutes = (date, mins) => new Date(date.getTime() + mins * 60000);

  // A verified organizer update on UREC (lasts 2 hours) — shows "Verified" badge
  await StatusUpdate.create({
    locationId: urec.id,
    userId: organizer.id,
    status: "busy",
    type: "verified",
    expiresAt: addMinutes(now, 120),
  });

  // A crowd report on Southside (lasts 30 min)
  await StatusUpdate.create({
    locationId: southside.id,
    userId: student.id,
    status: "moderate",
    type: "crowd",
    expiresAt: addMinutes(now, 30),
  });

  // Library and CUB have NO active reports — so they'll show "Typical" busyness
  // This demonstrates both states side by side in the UI

  console.log("Status updates seeded.");

  // ── Activities ────────────────────────────────────────────────────────────
  const studySession = await Activity.create({
    creatorId: student.id,
    locationId: library.id,
    type: "study",
    title: "CS489 Final Project Study Group",
    description: "Working through the final deliverable together. All CS489 students welcome!",
    scheduledAt: addMinutes(now, 90),  // starts in 90 min
    maxParticipants: 6,
    inviteCode: "CS489-STUDY",
  });

  await Activity.create({
    creatorId: student.id,
    locationId: urec.id,
    type: "workout",
    title: "Evening Gym Session",
    description: "Lifting + cardio. Casual pace, all fitness levels welcome.",
    scheduledAt: addMinutes(now, 240), // starts in 4 hours
    maxParticipants: 4,
    inviteCode: "GYM-EVE",
  });

  await Activity.create({
    creatorId: student.id,
    locationId: southside.id,
    type: "dinner",
    title: "Dinner @ Southside",
    description: "Meeting at 6pm for dinner before the study session. Join if you want!",
    scheduledAt: addMinutes(now, 30),  // soon
    maxParticipants: null,
    inviteCode: "DINNER01",
  });

  // Auto-RSVP the creator to their own study session
  await Participant.create({ activityId: studySession.id, userId: student.id, status: "rsvp" });

  console.log("Activities seeded.");

  console.log("\nSeed complete! Test accounts:");
  console.log("  student@wsu.edu    / password123  (role: student)");
  console.log("  organizer@wsu.edu  / password123  (role: organizer)");
  console.log("  admin@wsu.edu      / password123  (role: admin)");
  console.log("\nNote: 'Alex Student' renamed to 'Demo Student' — create your own account via /signup");

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
