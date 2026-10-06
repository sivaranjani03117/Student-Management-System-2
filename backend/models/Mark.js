const mongoose = require("mongoose");

const markSchema = new mongoose.Schema(
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
    subject: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
    },
    percentage: {
      type: Number,
      required: [true, "Percentage is required"],
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly bind to 'marks' collection in studentManagementDB
module.exports = mongoose.model("Mark", markSchema, "marks");
