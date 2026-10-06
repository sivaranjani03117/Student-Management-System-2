const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    totalClasses: {
      type: Number,
      required: [true, "Total classes count is required"],
      min: [1, "Total classes must be at least 1"],
    },
    attendedClasses: {
      type: Number,
      required: [true, "Attended classes count is required"],
      min: [0, "Attended classes cannot be negative"],
    },
    percentage: {
      type: Number,
      required: [true, "Attendance percentage is required"],
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly bind to 'attendance' collection in studentManagementDB
module.exports = mongoose.model("Attendance", attendanceSchema, "attendance");
