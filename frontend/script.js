/* ==========================================================================
   Student Management System - Master Frontend Script
   ========================================================================== */

// Base API URL
const API_BASE = "/api";

// --------------------------------------------------------------------------
// 1. Authentication & Session Management
// --------------------------------------------------------------------------

// Check if user is logged in
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // If on login page and already logged in, redirect to dashboard
  if (currentPage === "index.html" || currentPage === "") {
    if (isLoggedIn === "true") {
      window.location.href = "dashboard.html";
    }
  } else {
    // Protected pages: redirect to login if not authenticated
    if (isLoggedIn !== "true") {
      window.location.href = "index.html";
    }
  }
}

// Perform Logout
function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  showToast("info", "Logged Out", "You have been logged out successfully.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

// Update User UI elements in sidebar
function updateUserInfoUI() {
  const user = JSON.parse(localStorage.getItem("currentUser") || '{"username":"Admin","role":"Administrator"}');
  const nameEls = document.querySelectorAll(".user-name");
  const roleEls = document.querySelectorAll(".user-role");
  const avatarEls = document.querySelectorAll(".user-avatar");

  nameEls.forEach((el) => (el.textContent = user.username || "Admin"));
  roleEls.forEach((el) => (el.textContent = user.role || "Administrator"));
  avatarEls.forEach((el) => {
    el.textContent = (user.username || "A").charAt(0).toUpperCase();
  });
}

// --------------------------------------------------------------------------
// 2. Toast Notifications
// --------------------------------------------------------------------------
function showToast(type, title, message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || "ℹ"}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --------------------------------------------------------------------------
// 3. Login Page Logic
// --------------------------------------------------------------------------
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginBtn = document.getElementById("loginBtn");

    if (!username || !password) {
      showToast("error", "Validation Error", "Please enter both username and password.");
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            username: data.user.username,
            role: data.user.role,
          })
        );
        showToast("success", "Success", "Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
      } else {
        showToast("error", "Login Failed", data.message || "Invalid username or password.");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login to Dashboard";
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      // Fallback for offline testing
      if (
        (username.toLowerCase() === "admin" && password === "admin123") ||
        (username.toLowerCase() === "student" && password === "student123")
      ) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            username: username,
            role: username.toLowerCase() === "admin" ? "Administrator" : "Student",
          })
        );
        showToast("success", "Success", "Logged in via offline mode!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
      } else {
        showToast("error", "Error", "Could not connect to server. Please check backend.");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login to Dashboard";
      }
    }
  });
}

function fillDemo(username, password) {
  const u = document.getElementById("username");
  const p = document.getElementById("password");
  if (u && p) {
    u.value = username;
    p.value = password;
  }
}

// --------------------------------------------------------------------------
// 4. Dashboard Page Logic
// --------------------------------------------------------------------------
async function initDashboardPage() {
  const totalStudentsEl = document.getElementById("totalStudents");
  const totalAttendanceEl = document.getElementById("totalAttendance");
  const totalMarksEl = document.getElementById("totalMarks");
  const averageMarksEl = document.getElementById("averageMarks");

  if (!totalStudentsEl) return;

  try {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    const result = await res.json();

    if (result.success && result.data) {
      totalStudentsEl.textContent = result.data.totalStudents;
      totalAttendanceEl.textContent = result.data.totalAttendance;
      totalMarksEl.textContent = result.data.totalMarks;
      averageMarksEl.textContent = `${result.data.averageMarks}%`;
    }
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    showToast("error", "Network Error", "Could not fetch dashboard statistics from MongoDB.");
  }

  // Load recent students table preview
  loadRecentStudentsPreview();
}

async function loadRecentStudentsPreview() {
  const tbody = document.getElementById("recentStudentsTbody");
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/students`);
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      const recents = result.data.slice(0, 5);
      tbody.innerHTML = recents
        .map(
          (s) => `
        <tr>
          <td><strong>${s.studentId}</strong></td>
          <td>${s.name}</td>
          <td><span class="badge badge-primary">${s.department}</span></td>
          <td>${s.year}</td>
          <td>${s.email}</td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 24px;">No students added yet. Click "Students" in the menu to add your first student.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading preview:", err);
  }
}

// --------------------------------------------------------------------------
// 5. Students Page Logic (Add, View, Edit, Delete)
// --------------------------------------------------------------------------
let allStudentsList = [];

async function initStudentsPage() {
  const studentForm = document.getElementById("studentForm");
  const searchInput = document.getElementById("studentSearch");

  if (studentForm) {
    studentForm.addEventListener("submit", handleAddStudent);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allStudentsList.filter(
        (s) =>
          s.studentId.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
      renderStudentsTable(filtered);
    });
  }

  await loadStudents();
}

async function loadStudents() {
  const tbody = document.getElementById("studentsTbody");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">Loading students from MongoDB...</td></tr>`;
    const res = await fetch(`${API_BASE}/students`);
    const result = await res.json();

    if (result.success && result.data) {
      allStudentsList = result.data;
      renderStudentsTable(allStudentsList);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No students found.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading students:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 24px;">Error connecting to MongoDB backend.</td></tr>`;
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById("studentsTbody");
  const countBadge = document.getElementById("studentCountBadge");
  if (countBadge) countBadge.textContent = `${students.length} Students`;

  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">👨‍🎓</div>
            <h3>No Students Found</h3>
            <p>Fill out the form above to add a new student into MongoDB.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students
    .map(
      (s) => `
    <tr>
      <td><strong>${escapeHtml(s.studentId)}</strong></td>
      <td>${escapeHtml(s.name)}</td>
      <td><span class="badge badge-primary">${escapeHtml(s.department)}</span></td>
      <td>${escapeHtml(s.year)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.phone)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" title="Edit Student" onclick="openEditStudentModal('${s._id}')">✏️</button>
          <button class="btn-icon delete" title="Delete Student" onclick="deleteStudent('${s._id}', '${escapeHtml(s.name)}')">🗑️</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

async function handleAddStudent(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("addStudentBtn");

  const studentData = {
    studentId: document.getElementById("studentId").value.trim(),
    name: document.getElementById("name").value.trim(),
    department: document.getElementById("department").value.trim(),
    year: document.getElementById("year").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
  };

  if (!studentData.studentId || !studentData.name || !studentData.department || !studentData.year || !studentData.email || !studentData.phone) {
    showToast("error", "Validation Error", "All fields are required.");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving to MongoDB...";

    const res = await fetch(`${API_BASE}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Saved!", result.message || "Student added to MongoDB!");
      document.getElementById("studentForm").reset();
      await loadStudents();
    } else {
      showToast("error", "Failed to Add", result.message || "Could not add student.");
    }
  } catch (err) {
    console.error("Error adding student:", err);
    showToast("error", "Server Error", "Could not reach backend API.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Student";
  }
}

async function openEditStudentModal(mongoId) {
  const student = allStudentsList.find((s) => s._id === mongoId);
  if (!student) return;

  document.getElementById("editStudentMongoId").value = student._id;
  document.getElementById("editStudentId").value = student.studentId;
  document.getElementById("editName").value = student.name;
  document.getElementById("editDepartment").value = student.department;
  document.getElementById("editYear").value = student.year;
  document.getElementById("editEmail").value = student.email;
  document.getElementById("editPhone").value = student.phone;

  document.getElementById("editStudentModal").classList.add("active");
}

function closeEditStudentModal() {
  document.getElementById("editStudentModal").classList.remove("active");
}

async function handleUpdateStudent(e) {
  e.preventDefault();
  const mongoId = document.getElementById("editStudentMongoId").value;
  const updateBtn = document.getElementById("updateStudentBtn");

  const studentData = {
    studentId: document.getElementById("editStudentId").value.trim(),
    name: document.getElementById("editName").value.trim(),
    department: document.getElementById("editDepartment").value.trim(),
    year: document.getElementById("editYear").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
  };

  try {
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";

    const res = await fetch(`${API_BASE}/students/${mongoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Updated", "Student updated successfully in MongoDB!");
      closeEditStudentModal();
      await loadStudents();
    } else {
      showToast("error", "Update Failed", result.message || "Failed to update student.");
    }
  } catch (err) {
    console.error("Error updating student:", err);
    showToast("error", "Server Error", "Could not communicate with backend.");
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = "Save Changes";
  }
}

async function deleteStudent(mongoId, studentName) {
  if (!confirm(`Are you sure you want to delete student "${studentName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/students/${mongoId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Deleted", result.message || "Student removed from MongoDB.");
      await loadStudents();
    } else {
      showToast("error", "Delete Failed", result.message || "Could not delete student.");
    }
  } catch (err) {
    console.error("Error deleting student:", err);
    showToast("error", "Error", "Could not connect to backend to delete.");
  }
}

// --------------------------------------------------------------------------
// 6. Attendance Page Logic & Mathematical Calculation
// --------------------------------------------------------------------------
let allAttendanceList = [];

// Formula: (attended + x) / (total + x) >= 0.75  =>  x >= 3*total - 4*attended
function calculateConsecutiveClassesNeeded(total, attended) {
  const currentPct = (attended / total) * 100;
  if (currentPct >= 75) return 0;
  return Math.max(0, Math.ceil(3 * total - 4 * attended));
}

async function initAttendancePage() {
  const attendanceForm = document.getElementById("attendanceForm");
  const totalClassesInput = document.getElementById("totalClasses");
  const attendedClassesInput = document.getElementById("attendedClasses");
  const percentagePreview = document.getElementById("attendancePercentagePreview");

  // Auto-calculate percentage in real-time
  function updateLivePercentage() {
    const total = parseFloat(totalClassesInput.value);
    const attended = parseFloat(attendedClassesInput.value);

    if (!isNaN(total) && total > 0 && !isNaN(attended) && attended >= 0) {
      if (attended > total) {
        percentagePreview.value = "Attended cannot exceed Total";
        return;
      }
      const pct = (attended / total) * 100;
      percentagePreview.value = `${pct.toFixed(2)}%`;
    } else {
      percentagePreview.value = "";
    }
  }

  if (totalClassesInput && attendedClassesInput) {
    totalClassesInput.addEventListener("input", updateLivePercentage);
    attendedClassesInput.addEventListener("input", updateLivePercentage);
  }

  if (attendanceForm) {
    attendanceForm.addEventListener("submit", handleAddAttendance);
  }

  // Pre-load student list into dropdown if available
  loadStudentsForDropdown("attendanceStudentSelect", "attendanceStudentName");

  await loadAttendance();
}

async function loadStudentsForDropdown(selectId, nameInputId) {
  const select = document.getElementById(selectId);
  const nameInput = document.getElementById(nameInputId);
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/students`);
    const result = await res.json();

    if (result.success && result.data && result.data.length > 0) {
      select.innerHTML = '<option value="">-- Select Registered Student --</option>';
      result.data.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.studentId;
        opt.textContent = `${s.studentId} - ${s.name}`;
        opt.dataset.name = s.name;
        select.appendChild(opt);
      });

      select.addEventListener("change", (e) => {
        const selectedOpt = select.options[select.selectedIndex];
        if (selectedOpt && selectedOpt.dataset.name && nameInput) {
          nameInput.value = selectedOpt.dataset.name;
        }
      });
    }
  } catch (e) {
    console.warn("Could not populate student dropdown:", e);
  }
}

async function loadAttendance() {
  const tbody = document.getElementById("attendanceTbody");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">Loading attendance from MongoDB...</td></tr>`;
    const res = await fetch(`${API_BASE}/attendance`);
    const result = await res.json();

    if (result.success && result.data) {
      allAttendanceList = result.data;
      renderAttendanceTable(allAttendanceList);
    }
  } catch (err) {
    console.error("Error loading attendance:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 24px;">Failed to load attendance from backend.</td></tr>`;
  }
}

function renderAttendanceTable(records) {
  const tbody = document.getElementById("attendanceTbody");
  const countBadge = document.getElementById("attendanceCountBadge");
  if (countBadge) countBadge.textContent = `${records.length} Records`;

  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>No Attendance Records</h3>
            <p>Submit attendance using the form above to store in MongoDB.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records
    .map((r) => {
      const isLow = r.percentage < 75;
      const statusBadge = isLow
        ? `<span class="badge badge-danger">Low (${r.percentage}%)</span>`
        : `<span class="badge badge-success">Good (${r.percentage}%)</span>`;

      return `
      <tr>
        <td><strong>${escapeHtml(r.studentId)}</strong></td>
        <td>${escapeHtml(r.studentName)}</td>
        <td>${r.totalClasses}</td>
        <td>${r.attendedClasses}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showAttendanceWarningPopup(${r.totalClasses}, ${r.attendedClasses}, ${r.percentage}, '${escapeHtml(r.studentName)}')">
            🔍 Check Status
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" title="Edit Attendance" onclick="openEditAttendanceModal('${r._id}')">✏️</button>
            <button class="btn-icon delete" title="Delete Attendance" onclick="deleteAttendance('${r._id}', '${escapeHtml(r.studentName)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

async function handleAddAttendance(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("addAttendanceBtn");

  const studentSelect = document.getElementById("attendanceStudentSelect");
  let studentId = "";
  if (studentSelect && studentSelect.value) {
    studentId = studentSelect.value;
  } else {
    const rawIdInput = document.getElementById("attendanceCustomStudentId");
    if (rawIdInput) studentId = rawIdInput.value.trim();
  }

  const studentName = document.getElementById("attendanceStudentName").value.trim();
  const totalClasses = parseFloat(document.getElementById("totalClasses").value);
  const attendedClasses = parseFloat(document.getElementById("attendedClasses").value);

  if (!studentId || !studentName || isNaN(totalClasses) || isNaN(attendedClasses)) {
    showToast("error", "Validation Error", "Please provide all required attendance details.");
    return;
  }

  if (attendedClasses > totalClasses) {
    showToast("error", "Invalid Input", "Attended classes cannot be greater than total classes.");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving to MongoDB...";

    const res = await fetch(`${API_BASE}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        studentName,
        totalClasses,
        attendedClasses,
      }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Saved", "Attendance recorded in MongoDB!");
      document.getElementById("attendanceForm").reset();
      document.getElementById("attendancePercentagePreview").value = "";
      await loadAttendance();

      // Show the mandatory popup warning or confirmation
      showAttendanceWarningPopup(totalClasses, attendedClasses, result.data.percentage, studentName);
    } else {
      showToast("error", "Failed", result.message || "Could not record attendance.");
    }
  } catch (err) {
    console.error("Error saving attendance:", err);
    showToast("error", "Server Error", "Could not reach backend API.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Attendance";
  }
}

// Attendance Warning Popup with exact mathematical calculation
function showAttendanceWarningPopup(total, attended, percentage, studentName) {
  const modal = document.getElementById("attendanceWarningModal");
  if (!modal) return;

  const iconEl = document.getElementById("warningModalIcon");
  const titleEl = document.getElementById("warningModalTitle");
  const pctEl = document.getElementById("warningModalPercentage");
  const textEl = document.getElementById("warningModalText");
  const calcBoxEl = document.getElementById("warningModalCalcBox");

  pctEl.textContent = `${percentage.toFixed(2)}%`;

  if (percentage < 75) {
    // Exact mathematical formula: x = 3*total - 4*attended
    const needed = calculateConsecutiveClassesNeeded(total, attended);

    iconEl.className = "warning-icon";
    iconEl.textContent = "⚠";
    titleEl.className = "warning-title";
    titleEl.textContent = `Warning! Low Attendance for ${studentName}`;
    pctEl.className = "warning-percentage";

    textEl.innerHTML = `
      <strong>Warning! Your attendance is only ${percentage.toFixed(2)}%.</strong><br>
      Your attendance is below the required 75%.<br>
      Please attend more classes regularly to improve your attendance.
    `;

    calcBoxEl.style.display = "block";
    calcBoxEl.innerHTML = `
      <h4>📊 Mathematical Improvement Plan:</h4>
      <p>
        Current Attendance: <strong>${percentage.toFixed(2)}%</strong> (${attended} attended out of ${total} total classes).<br><br>
        If you attend the next <strong>${needed}</strong> classes continuously without missing any, your attendance percentage will reach <strong>75%</strong>.<br>
        <em>Attend classes regularly to reach 75%.</em>
      </p>
    `;
  } else {
    iconEl.className = "warning-icon success";
    iconEl.textContent = "✓";
    titleEl.className = "warning-title success";
    titleEl.textContent = `Good Attendance! (${studentName})`;
    pctEl.className = "warning-percentage success";

    textEl.innerHTML = `
      <strong>Good! Your attendance is above the required percentage.</strong><br>
      Keep attending classes regularly to maintain your good standing.
    `;

    calcBoxEl.style.display = "none";
  }

  modal.classList.add("active");
}

function closeAttendanceWarningModal() {
  const modal = document.getElementById("attendanceWarningModal");
  if (modal) modal.classList.remove("active");
}

async function openEditAttendanceModal(mongoId) {
  const record = allAttendanceList.find((r) => r._id === mongoId);
  if (!record) return;

  document.getElementById("editAttendanceMongoId").value = record._id;
  document.getElementById("editAttendanceStudentId").value = record.studentId;
  document.getElementById("editAttendanceStudentName").value = record.studentName;
  document.getElementById("editTotalClasses").value = record.totalClasses;
  document.getElementById("editAttendedClasses").value = record.attendedClasses;

  document.getElementById("editAttendanceModal").classList.add("active");
}

function closeEditAttendanceModal() {
  document.getElementById("editAttendanceModal").classList.remove("active");
}

async function handleUpdateAttendance(e) {
  e.preventDefault();
  const mongoId = document.getElementById("editAttendanceMongoId").value;
  const updateBtn = document.getElementById("updateAttendanceBtn");

  const totalClasses = parseFloat(document.getElementById("editTotalClasses").value);
  const attendedClasses = parseFloat(document.getElementById("editAttendedClasses").value);

  if (attendedClasses > totalClasses) {
    showToast("error", "Invalid", "Attended classes cannot be greater than total classes.");
    return;
  }

  try {
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";

    const res = await fetch(`${API_BASE}/attendance/${mongoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: document.getElementById("editAttendanceStudentId").value.trim(),
        studentName: document.getElementById("editAttendanceStudentName").value.trim(),
        totalClasses,
        attendedClasses,
      }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Updated", "Attendance updated successfully in MongoDB!");
      closeEditAttendanceModal();
      await loadAttendance();
    } else {
      showToast("error", "Update Failed", result.message || "Failed to update attendance.");
    }
  } catch (err) {
    console.error("Error updating attendance:", err);
    showToast("error", "Server Error", "Could not reach backend API.");
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = "Save Changes";
  }
}

async function deleteAttendance(mongoId, studentName) {
  if (!confirm(`Delete attendance record for "${studentName}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/attendance/${mongoId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Deleted", result.message || "Attendance record deleted.");
      await loadAttendance();
    } else {
      showToast("error", "Delete Failed", result.message || "Failed to delete.");
    }
  } catch (err) {
    console.error("Error deleting attendance:", err);
    showToast("error", "Error", "Could not delete attendance record.");
  }
}

// --------------------------------------------------------------------------
// 7. Marks Page Logic (Add, View, Edit, Delete, Percentage calculation)
// --------------------------------------------------------------------------
let allMarksList = [];

async function initMarksPage() {
  const marksForm = document.getElementById("marksForm");
  const marksObtainedInput = document.getElementById("marksObtained");
  const totalMarksInput = document.getElementById("totalMarks");
  const percentagePreview = document.getElementById("markPercentagePreview");

  function updateLiveMarkPercentage() {
    const marks = parseFloat(marksObtainedInput.value);
    const total = parseFloat(totalMarksInput.value);

    if (!isNaN(marks) && marks >= 0 && !isNaN(total) && total > 0) {
      if (marks > total) {
        percentagePreview.value = "Marks cannot exceed Total";
        return;
      }
      const pct = (marks / total) * 100;
      percentagePreview.value = `${pct.toFixed(2)}%`;
    } else {
      percentagePreview.value = "";
    }
  }

  if (marksObtainedInput && totalMarksInput) {
    marksObtainedInput.addEventListener("input", updateLiveMarkPercentage);
    totalMarksInput.addEventListener("input", updateLiveMarkPercentage);
  }

  if (marksForm) {
    marksForm.addEventListener("submit", handleAddMark);
  }

  // Pre-load student list into dropdown
  loadStudentsForDropdown("markStudentSelect", "markStudentName");

  await loadMarks();
}

async function loadMarks() {
  const tbody = document.getElementById("marksTbody");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;">Loading marks from MongoDB...</td></tr>`;
    const res = await fetch(`${API_BASE}/marks`);
    const result = await res.json();

    if (result.success && result.data) {
      allMarksList = result.data;
      renderMarksTable(allMarksList);
    }
  } catch (err) {
    console.error("Error loading marks:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ef4444; padding: 24px;">Error loading marks from backend.</td></tr>`;
  }
}

function getGradeBadge(percentage) {
  if (percentage >= 90) return `<span class="badge badge-success">A+ (${percentage}%)</span>`;
  if (percentage >= 80) return `<span class="badge badge-success">A (${percentage}%)</span>`;
  if (percentage >= 70) return `<span class="badge badge-primary">B (${percentage}%)</span>`;
  if (percentage >= 60) return `<span class="badge badge-warning">C (${percentage}%)</span>`;
  if (percentage >= 50) return `<span class="badge badge-warning">D (${percentage}%)</span>`;
  return `<span class="badge badge-danger">F (${percentage}%)</span>`;
}

function renderMarksTable(marks) {
  const tbody = document.getElementById("marksTbody");
  const countBadge = document.getElementById("marksCountBadge");
  if (countBadge) countBadge.textContent = `${marks.length} Records`;

  if (!tbody) return;

  if (marks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h3>No Marks Recorded</h3>
            <p>Add student examination marks using the form above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = marks
    .map(
      (m) => `
    <tr>
      <td><strong>${escapeHtml(m.studentId)}</strong></td>
      <td>${escapeHtml(m.studentName)}</td>
      <td><span class="badge badge-primary">${escapeHtml(m.subject)}</span></td>
      <td>${m.marks}</td>
      <td>${m.totalMarks}</td>
      <td>${m.percentage}%</td>
      <td>${getGradeBadge(m.percentage)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" title="Edit Mark" onclick="openEditMarkModal('${m._id}')">✏️</button>
          <button class="btn-icon delete" title="Delete Mark" onclick="deleteMark('${m._id}', '${escapeHtml(m.studentName)}', '${escapeHtml(m.subject)}')">🗑️</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

async function handleAddMark(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("addMarkBtn");

  const studentSelect = document.getElementById("markStudentSelect");
  let studentId = "";
  if (studentSelect && studentSelect.value) {
    studentId = studentSelect.value;
  } else {
    const rawInput = document.getElementById("markCustomStudentId");
    if (rawInput) studentId = rawInput.value.trim();
  }

  const studentName = document.getElementById("markStudentName").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const marks = parseFloat(document.getElementById("marksObtained").value);
  const totalMarks = parseFloat(document.getElementById("totalMarks").value);

  if (!studentId || !studentName || !subject || isNaN(marks) || isNaN(totalMarks)) {
    showToast("error", "Validation Error", "All fields are required.");
    return;
  }

  if (marks > totalMarks) {
    showToast("error", "Invalid Marks", "Marks obtained cannot be higher than total marks.");
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving to MongoDB...";

    const res = await fetch(`${API_BASE}/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        studentName,
        subject,
        marks,
        totalMarks,
      }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Saved", "Marks added successfully to MongoDB!");
      document.getElementById("marksForm").reset();
      document.getElementById("markPercentagePreview").value = "";
      await loadMarks();
    } else {
      showToast("error", "Failed", result.message || "Could not save marks.");
    }
  } catch (err) {
    console.error("Error adding marks:", err);
    showToast("error", "Server Error", "Could not reach backend API.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Marks";
  }
}

async function openEditMarkModal(mongoId) {
  const mark = allMarksList.find((m) => m._id === mongoId);
  if (!mark) return;

  document.getElementById("editMarkMongoId").value = mark._id;
  document.getElementById("editMarkStudentId").value = mark.studentId;
  document.getElementById("editMarkStudentName").value = mark.studentName;
  document.getElementById("editSubject").value = mark.subject;
  document.getElementById("editMarksObtained").value = mark.marks;
  document.getElementById("editTotalMarks").value = mark.totalMarks;

  document.getElementById("editMarkModal").classList.add("active");
}

function closeEditMarkModal() {
  document.getElementById("editMarkModal").classList.remove("active");
}

async function handleUpdateMark(e) {
  e.preventDefault();
  const mongoId = document.getElementById("editMarkMongoId").value;
  const updateBtn = document.getElementById("updateMarkBtn");

  const marks = parseFloat(document.getElementById("editMarksObtained").value);
  const totalMarks = parseFloat(document.getElementById("editTotalMarks").value);

  if (marks > totalMarks) {
    showToast("error", "Invalid", "Marks obtained cannot exceed total marks.");
    return;
  }

  try {
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";

    const res = await fetch(`${API_BASE}/marks/${mongoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: document.getElementById("editMarkStudentId").value.trim(),
        studentName: document.getElementById("editMarkStudentName").value.trim(),
        subject: document.getElementById("editSubject").value.trim(),
        marks,
        totalMarks,
      }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Updated", "Marks record updated in MongoDB!");
      closeEditMarkModal();
      await loadMarks();
    } else {
      showToast("error", "Update Failed", result.message || "Failed to update marks.");
    }
  } catch (err) {
    console.error("Error updating mark:", err);
    showToast("error", "Server Error", "Could not reach backend API.");
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = "Save Changes";
  }
}

async function deleteMark(mongoId, studentName, subject) {
  if (!confirm(`Delete marks record for "${studentName}" in "${subject}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/marks/${mongoId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Deleted", result.message || "Marks record deleted from MongoDB.");
      await loadMarks();
    } else {
      showToast("error", "Delete Failed", result.message || "Failed to delete.");
    }
  } catch (err) {
    console.error("Error deleting mark:", err);
    showToast("error", "Error", "Could not delete marks record.");
  }
}

// --------------------------------------------------------------------------
// 8. Profile Page Logic
// --------------------------------------------------------------------------
async function initProfilePage() {
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleUpdateProfile);
  }

  await loadProfile();
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const result = await res.json();

    if (result.success && result.data) {
      const p = result.data;
      document.getElementById("profileName").value = p.name || "";
      document.getElementById("profileStudentId").value = p.studentId || "";
      document.getElementById("profileDepartment").value = p.department || "";
      document.getElementById("profileYear").value = p.year || "";
      document.getElementById("profileEmail").value = p.email || "";
      document.getElementById("profilePhone").value = p.phone || "";

      // Also update display view elements
      const viewName = document.getElementById("viewProfileName");
      const viewId = document.getElementById("viewProfileId");
      const viewDept = document.getElementById("viewProfileDept");
      const viewAvatar = document.getElementById("viewProfileAvatar");

      if (viewName) viewName.textContent = p.name || "Student Profile";
      if (viewId) viewId.textContent = p.studentId || "STU-1001";
      if (viewDept) viewDept.textContent = p.department || "Engineering";
      if (viewAvatar) viewAvatar.textContent = (p.name || "S").charAt(0).toUpperCase();
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const saveBtn = document.getElementById("saveProfileBtn");

  const profileData = {
    name: document.getElementById("profileName").value.trim(),
    studentId: document.getElementById("profileStudentId").value.trim(),
    department: document.getElementById("profileDepartment").value.trim(),
    year: document.getElementById("profileYear").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    phone: document.getElementById("profilePhone").value.trim(),
  };

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving to MongoDB...";

    const res = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showToast("success", "Saved", "Profile details saved in MongoDB!");
      // Update local storage username if current user
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      currentUser.username = profileData.name;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      updateUserInfoUI();
      await loadProfile();
    } else {
      showToast("error", "Failed", result.message || "Could not update profile.");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    showToast("error", "Error", "Could not reach backend API.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Profile Details";
  }
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --------------------------------------------------------------------------
// Page Initialization on DOMContentLoaded
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Check Authentication on every page load
  checkAuth();

  // If on protected page, populate user badge in sidebar
  updateUserInfoUI();

  // Route page initialization based on current file
  const path = window.location.pathname.toLowerCase();

  if (path.includes("index.html") || path.endsWith("/") || path.length <= 1) {
    initLoginPage();
  } else if (path.includes("dashboard.html")) {
    initDashboardPage();
  } else if (path.includes("students.html")) {
    initStudentsPage();
  } else if (path.includes("attendance.html")) {
    initAttendancePage();
  } else if (path.includes("marks.html")) {
    initMarksPage();
  } else if (path.includes("profile.html")) {
    initProfilePage();
  }
});
