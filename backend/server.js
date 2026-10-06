const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import Route Handlers
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const markRoutes = require("./routes/markRoutes");

// Import Models for Dashboard Stats
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");
const Mark = require("./models/Mark");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://127.0.0.1:27017/studentManagementDB";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("==================================================");
    console.log(" Successfully connected to MongoDB!");
    console.log(` Database: studentManagementDB`);
    console.log(" Connection URL: mongodb://127.0.0.1:27017/studentManagementDB");
    console.log("==================================================");
  })
  .catch((err) => {
    console.error("==================================================");
    console.error(" MongoDB Connection Error:", err.message);
    console.error(" Make sure the MongoDB service is running locally on port 27017.");
    console.error("==================================================");
  });

// Profile Schema & Model (persisted in MongoDB)
const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Alex Johnson" },
    studentId: { type: String, default: "STU-1001" },
    department: { type: String, default: "Computer Science & Engineering" },
    year: { type: String, default: "3rd Year" },
    email: { type: String, default: "alex.johnson@college.edu" },
    phone: { type: String, default: "+91 9876543210" },
  },
  { timestamps: true }
);
const Profile = mongoose.model("Profile", profileSchema, "profiles");

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", markRoutes);

// @route   GET /api/dashboard/stats
// @desc    Get live counts and average marks from MongoDB
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    const totalMarks = await Mark.countDocuments();

    // Calculate Average Marks percentage from all marks records
    const allMarks = await Mark.find();
    let averageMarks = 0;
    if (allMarks.length > 0) {
      const sum = allMarks.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      averageMarks = Number((sum / allMarks.length).toFixed(2));
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalAttendance,
        totalMarks,
        averageMarks,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
});

// @route   GET /api/profile
// @desc    Get user/student profile
app.get("/api/profile", async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({
        name: "Alex Johnson",
        studentId: "STU-1001",
        department: "Computer Science & Engineering",
        year: "3rd Year",
        email: "alex.johnson@college.edu",
        phone: "+91 9876543210",
      });
    }
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user/student profile
app.put("/api/profile", async (req, res) => {
  try {
    const { name, studentId, department, year, email, phone } = req.body;
    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile();
    }

    if (name) profile.name = name.trim();
    if (studentId) profile.studentId = studentId.trim();
    if (department) profile.department = department.trim();
    if (year) profile.year = year.trim();
    if (email) profile.email = email.trim().toLowerCase();
    if (phone) profile.phone = phone.trim();

    const updatedProfile = await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully in MongoDB!",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
});

// @route   POST /api/login
// @desc    Simple authentication endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter both username and password.",
    });
  }

  // Accepts 'admin' / 'admin123' or 'student' / 'student123' or any valid format for easy testing
  if (
    (username.trim().toLowerCase() === "admin" && password === "admin123") ||
    (username.trim().toLowerCase() === "student" && password === "student123") ||
    (username.trim().length >= 3 && password.length >= 4)
  ) {
    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        username: username.trim(),
        role: username.trim().toLowerCase() === "admin" ? "Admin" : "Student",
        loginTime: new Date().toISOString(),
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid credentials! Use admin / admin123 or student / student123",
  });
});

// Root route - serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Handle unknown API routes (JSON response instead of HTML)
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route not found: " + req.originalUrl,
  });
});

// Catch-all route to serve the corresponding frontend HTML page if accessed without .html
app.get("/:page", (req, res, next) => {
  const pageName = req.params.page;
  const filePath = path.join(frontendPath, pageName.endsWith(".html") ? pageName : `${pageName}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      next();
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Student Management Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${frontendPath}`);
});
