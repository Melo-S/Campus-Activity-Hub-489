const { DataTypes } = require("sequelize");

// Join table between Activity and User — tracks RSVPs and check-ins
// One row = one user's involvement in one activity
module.exports = (sequelize) => {
  const Participant = sequelize.define("Participant", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    activityId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // "rsvp" means they said they'll come; "checked_in" means they physically arrived
    status: {
      type: DataTypes.ENUM("rsvp", "checked_in"),
      defaultValue: "rsvp",
    },
  });

  return Participant;
};
