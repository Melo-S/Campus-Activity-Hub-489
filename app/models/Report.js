const { DataTypes } = require("sequelize");

// Students can flag bad content; admins review these in the moderation queue
module.exports = (sequelize) => {
  const Report = sequelize.define("Report", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Who filed the report
    reporterId: { type: DataTypes.INTEGER, allowNull: false },

    // What kind of content was reported ("activity" or "statusUpdate")
    // We store the type + id instead of a single FK so one table handles all content types
    contentType: {
      type: DataTypes.ENUM("activity", "statusUpdate"),
      allowNull: false,
    },

    // The id of the reported activity or statusUpdate row
    contentId: { type: DataTypes.INTEGER, allowNull: false },

    reason: { type: DataTypes.TEXT, allowNull: false },

    // Admin workflow: pending → reviewed
    status: {
      type: DataTypes.ENUM("pending", "reviewed"),
      defaultValue: "pending",
    },
  });

  return Report;
};
