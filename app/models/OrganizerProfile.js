const { DataTypes } = require("sequelize");

// Extra info attached to organizer/staff accounts
// A user row holds login info; this row holds organizer-specific details
module.exports = (sequelize) => {
  const OrganizerProfile = sequelize.define("OrganizerProfile", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // One-to-one link back to the User row
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },

    // e.g. "WSU Recreation Center" or "Dining Services"
    organization: { type: DataTypes.STRING, allowNull: true },

    // Admin must flip this to true before organizer can post verified updates
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  return OrganizerProfile;
};
