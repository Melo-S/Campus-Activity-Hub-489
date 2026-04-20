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

    // Short blurb the organizer writes when applying (why they should be verified)
    applicationNote: { type: DataTypes.TEXT, allowNull: true },

    // Admin workflow for verification: pending on submit, approved or rejected after review
    applicationStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },

    // Timestamp of when the organizer submitted the application
    appliedAt: { type: DataTypes.DATE, allowNull: true },

    // Timestamp of when an admin approved or rejected the application
    reviewedAt: { type: DataTypes.DATE, allowNull: true },

    // Admin must flip this to true before organizer can post verified updates
    // This is set alongside applicationStatus === 'approved' on admin approve
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  return OrganizerProfile;
};
