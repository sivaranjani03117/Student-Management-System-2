const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

// Helper function to calculate consecutive classes needed for 75%
function calculateNeededClasses(total, attended) {
  const currentPct = (attended / total) * 100;
  if (currentPct >= 75) return 0;
  // Formula: (attended + x) / (total + x) >= 0.75 => x >= 3*total - 4*attended
  const needed = Math.max(0, Math.ceil(3 * total - 4 * attended));
  return needed;
}

// @route   GET /api/attendance
// @desc    Get all attendance records
router.get("/", async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance records",
      error: error.message,
    });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get a single attendance record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Error fetching attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance record",
      error: error.message,
    });
  }
});

// @route   POST /api/attendance
// @desc    Add a new attendance record
router.post("/", async (req, res) => {
  try {
    let { studentId, studentName, totalClasses, attendedClasses } = req.body;

    // Validate fields
    if (!studentId || !studentName || totalClasses === undefined || attendedClasses === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide student ID, student name, total classes, and attended classes.",
      });
    }

    totalClasses = Number(totalClasses);
    attendedClasses = Number(attendedClasses);

    if (isNaN(totalClasses) || totalClasses <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total classes must be a valid number greater than 0.",
      });
    }

    if (isNaN(attendedClasses) || attendedClasses < 0) {
      return res.status(400).json({
        success: false,
        message: "Attended classes must be a valid number (0 or higher).",
      });
    }

    if (attendedClasses > totalClasses) {
      return res.status(400).json({
        success: false,
        message: "Attended classes cannot be greater than total classes!",
      });
    }

    // Calculate percentage: (Attended / Total) * 100
    const rawPercentage = (attendedClasses / totalClasses) * 100;
    const percentage = Number(rawPercentage.toFixed(2));

    const newRecord = new Attendance({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      totalClasses,
      attendedClasses,
      percentage,
    });

    const savedRecord = await newRecord.save();
    const neededClasses = calculateNeededClasses(totalClasses, attendedClasses);

    res.status(201).json({
      success: true,
      message: "Attendance recorded successfully!",
      data: savedRecord,
      neededClasses: neededClasses,
    });
  } catch (error) {
    console.error("Error creating attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving attendance",
      error: error.message,
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update an attendance record
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let { studentId, studentName, totalClasses, attendedClasses } = req.body;

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    if (studentId) record.studentId = studentId.trim();
    if (studentName) record.studentName = studentName.trim();

    if (totalClasses !== undefined) {
      const parsedTotal = Number(totalClasses);
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({
          success: false,
          message: "Total classes must be greater than 0.",
        });
      }
      record.totalClasses = parsedTotal;
    }

    if (attendedClasses !== undefined) {
      const parsedAttended = Number(attendedClasses);
      if (isNaN(parsedAttended) || parsedAttended < 0) {
        return res.status(400).json({
          success: false,
          message: "Attended classes must be 0 or higher.",
        });
      }
      record.attendedClasses = parsedAttended;
    }

    if (record.attendedClasses > record.totalClasses) {
      return res.status(400).json({
        success: false,
        message: "Attended classes cannot be greater than total classes!",
      });
    }

    // Recalculate percentage
    const rawPercentage = (record.attendedClasses / record.totalClasses) * 100;
    record.percentage = Number(rawPercentage.toFixed(2));

    const updatedRecord = await record.save();
    const neededClasses = calculateNeededClasses(record.totalClasses, record.attendedClasses);

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully!",
      data: updatedRecord,
      neededClasses: neededClasses,
    });
  } catch (error) {
    console.error("Error updating attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating attendance",
      error: error.message,
    });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete an attendance record
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletedRecord = await Attendance.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found to delete",
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance record for ${deletedRecord.studentName} deleted successfully!`,
      data: deletedRecord,
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting attendance record",
      error: error.message,
    });
  }
});

module.exports = router;
