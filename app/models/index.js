const { Sequelize } = require("sequelize");
const path = require("path");

// Create a SQLite database file at app/database.sqlite
// SQLite stores everything in one file — perfect for development and submission ZIPs
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: false, // set to console.log if you want to see every SQL query
});

// Import every model and pass the sequelize instance into it
const User = require("./User")(sequelize);
const Location = require("./Location")(sequelize);
const StatusUpdate = require("./StatusUpdate")(sequelize);
const Activity = require("./Activity")(sequelize);
const Participant = require("./Participant")(sequelize);
const Friendship = require("./Friendship")(sequelize);
const Invite = require("./Invite")(sequelize);
const Vote = require("./Vote")(sequelize);
const Report = require("./Report")(sequelize);
const RoomClaim = require("./RoomClaim")(sequelize);
const OrganizerProfile = require("./OrganizerProfile")(sequelize);

// ── Associations (these define the foreign-key relationships) ──────────────

// A user can post many status updates; each update belongs to one user
User.hasMany(StatusUpdate, { foreignKey: "userId" });
StatusUpdate.belongsTo(User, { foreignKey: "userId" });

// A location (Library, Rec, Dining) can have many status updates over time
Location.hasMany(StatusUpdate, { foreignKey: "locationId" });
StatusUpdate.belongsTo(Location, { foreignKey: "locationId" });

// A user creates many activities; each activity has one creator
User.hasMany(Activity, { foreignKey: "creatorId", as: "createdActivities" });
Activity.belongsTo(User, { foreignKey: "creatorId", as: "creator" });

// An activity can take place at a location
Location.hasMany(Activity, { foreignKey: "locationId" });
Activity.belongsTo(Location, { foreignKey: "locationId" });

// Participants join activities (the RSVP / check-in join table)
Activity.hasMany(Participant, { foreignKey: "activityId" });
Participant.belongsTo(Activity, { foreignKey: "activityId" });
User.hasMany(Participant, { foreignKey: "userId" });
Participant.belongsTo(User, { foreignKey: "userId" });

// Friendships are between two users (userId sends request to friendId)
User.hasMany(Friendship, { foreignKey: "userId", as: "sentRequests" });
User.hasMany(Friendship, { foreignKey: "friendId", as: "receivedRequests" });
Friendship.belongsTo(User, { foreignKey: "userId", as: "requester" });
Friendship.belongsTo(User, { foreignKey: "friendId", as: "recipient" });

// Invites connect a sender, a receiver, and an activity
Activity.hasMany(Invite, { foreignKey: "activityId" });
Invite.belongsTo(Activity, { foreignKey: "activityId" });
User.hasMany(Invite, { foreignKey: "senderId", as: "sentInvites" });
User.hasMany(Invite, { foreignKey: "receiverId", as: "receivedInvites" });
Invite.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Invite.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });

// Votes are cast on status updates (confirm / disagree)
StatusUpdate.hasMany(Vote, { foreignKey: "statusUpdateId" });
Vote.belongsTo(StatusUpdate, { foreignKey: "statusUpdateId" });
User.hasMany(Vote, { foreignKey: "userId" });
Vote.belongsTo(User, { foreignKey: "userId" });

// Reports can reference any content type (activity or statusUpdate)
User.hasMany(Report, { foreignKey: "reporterId" });
Report.belongsTo(User, { foreignKey: "reporterId" });

// Room claims belong to a user
User.hasMany(RoomClaim, { foreignKey: "userId" });
RoomClaim.belongsTo(User, { foreignKey: "userId" });

// An organizer profile extends a user account (one-to-one)
User.hasOne(OrganizerProfile, { foreignKey: "userId" });
OrganizerProfile.belongsTo(User, { foreignKey: "userId" });

// Export everything so any file can do: const { User, Activity } = require("./models")
module.exports = {
  sequelize,
  User,
  Location,
  StatusUpdate,
  Activity,
  Participant,
  Friendship,
  Invite,
  Vote,
  Report,
  RoomClaim,
  OrganizerProfile,
};
