const { DataTypes } = require("sequelize");

// Students can vote on a status update to confirm or disagree with it
// This is how the crowd-sourced busy level gets validated
module.exports = (sequelize) => {
  const Vote = sequelize.define("Vote", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Which status update is being voted on
    statusUpdateId: { type: DataTypes.INTEGER, allowNull: false },

    // Which student cast this vote
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // "confirm" = "yes, it's accurate" / "disagree" = "no, it's different now"
    type: {
      type: DataTypes.ENUM("confirm", "disagree"),
      allowNull: false,
    },
  });

  return Vote;
};
