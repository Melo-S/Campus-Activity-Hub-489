const { DataTypes } = require("sequelize");

// Tracks friend connections between students
// userId sends the request to friendId
module.exports = (sequelize) => {
  const Friendship = sequelize.define("Friendship", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // The user who sent the friend request
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // The user who received the friend request
    friendId: { type: DataTypes.INTEGER, allowNull: false },

    // "pending" until the recipient accepts; then "accepted"
    status: {
      type: DataTypes.ENUM("pending", "accepted"),
      defaultValue: "pending",
    },
  });

  return Friendship;
};
