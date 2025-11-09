import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Student from "../models/Student";
import { auth } from "../middleware/auth";
import { sendEmail } from "../utils/email";

const router = express.Router();

// Validation middleware
const validateStudentRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Valid 10-digit phone number required"),
  body("dateOfBirth").isISO8601().withMessage("Valid date of birth required"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Valid gender required"),
  body("address.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.pincode")
    .matches(/^[0-9]{6}$/)
    .withMessage("Valid 6-digit pincode required"),
  body("course.name").trim().notEmpty().withMessage("Course name is required"),
  body("course.code").trim().notEmpty().withMessage("Course code is required"),
  body("course.semester")
    .isInt({ min: 1, max: 8 })
    .withMessage("Valid semester (1-8) required"),
  body("course.year")
    .isInt({ min: 2020, max: 2030 })
    .withMessage("Valid year required"),
];

// Student Registration
router.post(
  "/register",
  validateStudentRegistration,
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        password,
        phone,
        dateOfBirth,
        gender,
        address,
        course,
        subjects,
      } = req.body;

      // Check if student already exists
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        return res
          .status(400)
          .json({ error: "Student with this email already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new student
      const student = new Student({
        name,
        email,
        password: hashedPassword,
        phone,
        dateOfBirth,
        gender,
        address,
        course,
        subjects: subjects || [],
      });

      await student.save();

      // Send confirmation email
      await sendEmail({
        to: email,
        subject: "GCET Admission Application Submitted",
        html: `
        <h2>Welcome to GCET!</h2>
        <p>Dear ${name},</p>
        <p>Your admission application has been successfully submitted.</p>
        <p><strong>Student ID:</strong> ${student.studentId}</p>
        <p><strong>Library ID:</strong> ${student.libraryId}</p>
        <p><strong>Course:</strong> ${course.name} - Semester ${course.semester}</p>
        <p>Your application is currently under review. You will receive an email once it's approved.</p>
        <p>Best regards,<br>GCET Admissions Team</p>
      `,
      });

      res.status(201).json({
        message: "Student registered successfully",
        student: {
          studentId: student.studentId,
          libraryId: student.libraryId,
          name: student.name,
          email: student.email,
          course: student.course,
          admissionStatus: student.admissionStatus,
        },
      });
    } catch (error) {
      console.error("Student registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Student Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find student
      const student = await Student.findOne({ email });
      if (!student) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if admission is approved
      if (
        student.admissionStatus !== "approved" &&
        student.admissionStatus !== "enrolled"
      ) {
        return res.status(403).json({
          error: "Admission not yet approved",
          status: student.admissionStatus,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: student._id,
          email: student.email,
          role: "student",
          studentId: student.studentId,
        },
        process.env["JWT_SECRET"]!,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: student._id,
          studentId: student.studentId,
          libraryId: student.libraryId,
          universityRegNumber: student.universityRegNumber,
          name: student.name,
          email: student.email,
          phone: student.phone,
          role: "student",
          course: student.course,
          currentSemester: student.currentSemester,
          admissionStatus: student.admissionStatus,
          feeStatus: student.feeStatus,
          feeAmount: student.feeAmount,
          feePaid: student.feePaid,
          address: student.address,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
        },
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Student Profile
router.get("/profile", auth, async (req: any, res: any) => {
  try {
    const student = await Student.findById(req.user.userId)
      .select("-password")
      .populate("subjects");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ student });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Student Profile
router.put(
  "/profile",
  auth,
  [
    body("phone")
      .optional()
      .matches(/^[0-9]{10}$/),
    body("address.street").optional().trim().notEmpty(),
    body("address.city").optional().trim().notEmpty(),
    body("address.state").optional().trim().notEmpty(),
    body("address.pincode")
      .optional()
      .matches(/^[0-9]{6}$/),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = req.body;
      delete updates.password; // Don't allow password update here
      delete updates.email; // Don't allow email update
      delete updates.studentId; // Don't allow student ID update
      delete updates.libraryId; // Don't allow library ID update

      const student = await Student.findByIdAndUpdate(
        req.user.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({
        message: "Profile updated successfully",
        student,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Student Dashboard Data
router.get("/dashboard", auth, async (req: any, res: any) => {
  try {
    const student = await Student.findById(req.user.userId)
      .select("-password")
      .populate("subjects");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Calculate dashboard statistics
    const dashboardData = {
      student,
      stats: {
        totalSubjects: student.subjects.length,
        feeRemaining: student.feeAmount - student.feePaid,
        admissionStatus: student.admissionStatus,
        feeStatus: student.feeStatus,
      },
      recentActivity: [
        {
          type: "admission",
          message: `Admission ${student.admissionStatus}`,
          date: student.admissionDate,
        },
        {
          type: "fee",
          message: `Fee ${student.feeStatus}`,
          date: new Date(),
        },
      ],
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Student Subjects
router.get("/subjects", auth, async (req: any, res: any) => {
  try {
    const student = await Student.findById(req.user.userId)
      .select("subjects course")
      .populate("subjects");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      subjects: student.subjects,
      course: student.course,
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change Password
router.put(
  "/change-password",
  auth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const student = await Student.findById(req.user.userId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        student.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      // const saltRounds = 10; // Not needed for this implementation
      const hashedNewPassword = await bcrypt.hash(
        newPassword,
        student.password
      );

      // Update password
      student.password = hashedNewPassword;
      await student.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
