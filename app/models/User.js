const { DataTypes } = require("sequelize");

// A model is a JS class that maps to a database table
// This factory function receives the sequelize instance and returns the model
module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    // Primary key — Sequelize auto-increments this for each new row
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // The user's display name (e.g. "Melvin Sanare")
    name: { type: DataTypes.STRING, allowNull: false },

    // Email must be unique across all users — used to log in
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }, // Sequelize rejects bad email formats before they hit the DB
    },

    // Stored as a bcrypt hash — never the plain text password
    password: { type: DataTypes.STRING, allowNull: false },

    // Controls what the user can see and do in the app
    role: {
      type: DataTypes.ENUM("student", "organizer", "admin"),
      defaultValue: "student",
    },

    // Admins flip this to true to grant organizer posting privileges
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  return User;
};
