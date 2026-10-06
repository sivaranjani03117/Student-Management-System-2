const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// @route   GET /api/students
// @desc    Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      error: error.message,
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get a single student by Mongo ID or Student ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let student = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id);
    }
    if (!student) {
      student = await Student.findOne({ studentId: id });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student",
      error: error.message,
    });
  }
});

// @route   POST /api/students
// @desc    Add a new student
router.post("/", async (req, res) => {
  try {
    const { studentId, name, department, year, email, phone } = req.body;

    // Form validation
    if (!studentId || !name || !department || !year || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: Student ID, Name, Department, Year, Email, and Phone.",
      });
    }

    // Check for duplicate student ID
    const existingStudent = await Student.findOne({ studentId: studentId.trim() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with ID "${studentId.trim()}" already exists! Please use a unique Student ID.`,
      });
    }

    const newStudent = new Student({
      studentId: studentId.trim(),
      name: name.trim(),
      department: department.trim(),
      year: year.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    });

    const savedStudent = await newStudent.save();

    res.status(201).json({
      success: true,
      message: "Student added successfully!",
      data: savedStudent,
    });
  } catch (error) {
    console.error("Error adding student:", error);

    // MongoDB duplicate key error check
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate Student ID found. Please provide a unique Student ID.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding student",
      error: error.message,
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update an existing student
router.put("/:id", async (req, res) => {
  try {
    const { studentId, name, department, year, email, phone } = req.body;
    const id = req.params.id;

    // Check if the student exists
    let student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with the provided ID",
      });
    }

    // If studentId changed, verify uniqueness
    if (studentId && studentId.trim() !== student.studentId) {
      const duplicate = await Student.findOne({ studentId: studentId.trim() });
      if (duplicate && duplicate._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: `Another student already has ID "${studentId.trim()}".`,
        });
      }
      student.studentId = studentId.trim();
    }

    if (name) student.name = name.trim();
    if (department) student.department = department.trim();
    if (year) student.year = year.trim();
    if (email) student.email = email.trim().toLowerCase();
    if (phone) student.phone = phone.trim();

    const updatedStudent = await student.save();

    res.status(200).json({
      success: true,
      message: "Student updated successfully!",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating student",
      error: error.message,
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found to delete",
      });
    }

    res.status(200).json({
      success: true,
      message: `Student "${deletedStudent.name}" (${deletedStudent.studentId}) deleted successfully!`,
      data: deletedStudent,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting student",
      error: error.message,
    });
  }
});

module.exports = router;
