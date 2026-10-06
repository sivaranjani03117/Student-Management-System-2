const express = require("express");
const router = express.Router();
const Mark = require("../models/Mark");

// @route   GET /api/marks
// @desc    Get all marks records
router.get("/", async (req, res) => {
  try {
    const marks = await Mark.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks,
    });
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching marks",
      error: error.message,
    });
  }
});

// @route   GET /api/marks/:id
// @desc    Get a single mark record by ID
router.get("/:id", async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: "Mark record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: mark,
    });
  } catch (error) {
    console.error("Error fetching mark record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching mark record",
      error: error.message,
    });
  }
});

// @route   POST /api/marks
// @desc    Add a new marks record
router.post("/", async (req, res) => {
  try {
    let { studentId, studentName, subject, marks, totalMarks } = req.body;

    // Field validation
    if (!studentId || !studentName || !subject || marks === undefined || totalMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide student ID, student name, subject, marks, and total marks.",
      });
    }

    marks = Number(marks);
    totalMarks = Number(totalMarks);

    if (isNaN(totalMarks) || totalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total marks must be a valid number greater than 0.",
      });
    }

    if (isNaN(marks) || marks < 0) {
      return res.status(400).json({
        success: false,
        message: "Marks obtained must be a valid number (0 or higher).",
      });
    }

    if (marks > totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks cannot be greater than total marks!",
      });
    }

    // Calculate percentage: (Marks / TotalMarks) * 100
    const rawPercentage = (marks / totalMarks) * 100;
    const percentage = Number(rawPercentage.toFixed(2));

    const newMark = new Mark({
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      subject: subject.trim(),
      marks,
      totalMarks,
      percentage,
    });

    const savedMark = await newMark.save();

    res.status(201).json({
      success: true,
      message: "Marks added successfully!",
      data: savedMark,
    });
  } catch (error) {
    console.error("Error creating marks record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving marks",
      error: error.message,
    });
  }
});

// @route   PUT /api/marks/:id
// @desc    Update a marks record
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let { studentId, studentName, subject, marks, totalMarks } = req.body;

    const markRecord = await Mark.findById(id);
    if (!markRecord) {
      return res.status(404).json({
        success: false,
        message: "Marks record not found",
      });
    }

    if (studentId) markRecord.studentId = studentId.trim();
    if (studentName) markRecord.studentName = studentName.trim();
    if (subject) markRecord.subject = subject.trim();

    if (totalMarks !== undefined) {
      const parsedTotal = Number(totalMarks);
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({
          success: false,
          message: "Total marks must be greater than 0.",
        });
      }
      markRecord.totalMarks = parsedTotal;
    }

    if (marks !== undefined) {
      const parsedMarks = Number(marks);
      if (isNaN(parsedMarks) || parsedMarks < 0) {
        return res.status(400).json({
          success: false,
          message: "Marks obtained must be 0 or higher.",
        });
      }
      markRecord.marks = parsedMarks;
    }

    if (markRecord.marks > markRecord.totalMarks) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks cannot be greater than total marks!",
      });
    }

    // Recalculate percentage
    const rawPercentage = (markRecord.marks / markRecord.totalMarks) * 100;
    markRecord.percentage = Number(rawPercentage.toFixed(2));

    const updatedMark = await markRecord.save();

    res.status(200).json({
      success: true,
      message: "Marks updated successfully!",
      data: updatedMark,
    });
  } catch (error) {
    console.error("Error updating mark record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating marks",
      error: error.message,
    });
  }
});

// @route   DELETE /api/marks/:id
// @desc    Delete a marks record
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletedMark = await Mark.findByIdAndDelete(id);

    if (!deletedMark) {
      return res.status(404).json({
        success: false,
        message: "Marks record not found to delete",
      });
    }

    res.status(200).json({
      success: true,
      message: `Marks record for ${deletedMark.studentName} (${deletedMark.subject}) deleted successfully!`,
      data: deletedMark,
    });
  } catch (error) {
    console.error("Error deleting mark record:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting marks record",
      error: error.message,
    });
  }
});

module.exports = router;
