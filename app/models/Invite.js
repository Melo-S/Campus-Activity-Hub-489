const { DataTypes } = require("sequelize");

// Tracks personal invites from one user to another for a specific activity
module.exports = (sequelize) => {
  const Invite = sequelize.define("Invite", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    activityId: { type: DataTypes.INTEGER, allowNull: false },

    // The user who sent the invite
    senderId: { type: DataTypes.INTEGER, allowNull: false },

    // The user who was invited
    receiverId: { type: DataTypes.INTEGER, allowNull: false },

    // Receiver can accept or decline; starts as pending
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined"),
      defaultValue: "pending",
    },
  });

  return Invite;
};
