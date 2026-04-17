const { DataTypes } = require("sequelize");

// Locations are the physical campus spots: Library, Rec Center, Dining, etc.
module.exports = (sequelize) => {
  const Location = sequelize.define("Location", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Human-readable name shown in the UI (e.g. "Terrell Library")
    name: { type: DataTypes.STRING, allowNull: false },

    // Broad category used to group locations in the dashboard
    type: {
      type: DataTypes.ENUM("library", "rec", "dining", "other"),
      defaultValue: "other",
    },

    // Optional blurb shown on the facility detail page
    description: { type: DataTypes.TEXT, allowNull: true },

    // Human-readable hours string displayed on facility cards and detail pages
    hours: { type: DataTypes.STRING, allowNull: true },
  });

  return Location;
};
