const { DataTypes } = require("sequelize");

// Students can "claim" a study room for a limited time
// This is NOT official availability — just a crowd-sourced "I'm here right now"
module.exports = (sequelize) => {
  const RoomClaim = sequelize.define("RoomClaim", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: false },

    // Freeform room name (e.g. "Library Room 204")
    roomName: { type: DataTypes.STRING, allowNull: false },

    // When this claim automatically expires so stale claims don't pile up
    expiresAt: { type: DataTypes.DATE, allowNull: false },

    // Student can signal they're about to leave — shows "Leaving Soon" badge
    leavingSoon: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  return RoomClaim;
};
