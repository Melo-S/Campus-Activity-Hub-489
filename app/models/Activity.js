const { DataTypes } = require("sequelize");

// Activities are the things students create: study sessions, workouts, dinner plans
module.exports = (sequelize) => {
  const Activity = sequelize.define("Activity", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Who created this activity
    creatorId: { type: DataTypes.INTEGER, allowNull: false },

    // Optional — where it's taking place (links to a Location row)
    locationId: { type: DataTypes.INTEGER, allowNull: true },

    title: { type: DataTypes.STRING, allowNull: false },

    // What kind of activity it is — used for filtering on the home feed
    type: {
      type: DataTypes.ENUM("study", "workout", "dinner", "other"),
      defaultValue: "other",
    },

    description: { type: DataTypes.TEXT, allowNull: true },

    // When the activity is happening
    scheduledAt: { type: DataTypes.DATE, allowNull: false },

    // Cap on how many people can join (null = unlimited)
    maxParticipants: { type: DataTypes.INTEGER, allowNull: true },

    // Short random code used to generate a shareable invite link
    inviteCode: { type: DataTypes.STRING, unique: true, allowNull: true },
  });

  return Activity;
};
