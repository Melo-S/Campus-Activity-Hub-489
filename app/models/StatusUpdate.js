const { DataTypes } = require("sequelize");

// A status update is one "report" of how busy a location is right now
// Students post crowd updates; organizers post verified updates
module.exports = (sequelize) => {
  const StatusUpdate = sequelize.define("StatusUpdate", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Foreign keys — which location and which user posted this
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // The reported busyness level
    status: {
      type: DataTypes.ENUM("light", "moderate", "busy"),
      allowNull: false,
    },

    // "crowd" = posted by a student, "verified" = posted by organizer/staff
    // Verified updates show a special badge and override crowd reports visually
    type: {
      type: DataTypes.ENUM("crowd", "verified"),
      defaultValue: "crowd",
    },

    // When this update stops being "fresh" and should be greyed out
    // Crowd reports expire after 30 min; verified updates after 2 hours
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  });

  return StatusUpdate;
};
