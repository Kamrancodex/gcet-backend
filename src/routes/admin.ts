import express from "express";
import { body, validationResult, query } from "express-validator";
import mongoose from "mongoose";
import Student from "../models/Student";
import Notice from "../models/Notice";
// import AdmissionSession from "../models/AdmissionSession"; // Unused
import { auth, requireRole } from "../middleware/auth";
import { sendEmail } from "../utils/email";

const router = express.Router();

// Middleware to ensure admin role
const requireAdmin = requireRole(["admin", "admissions_admin"]);

// Get All Students (with filtering and pagination)
router.get(
  "/students",
  auth,
  requireAdmin,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected", "enrolled"]),
    query("course").optional().isString(),
    query("semester").optional().isInt({ min: 1, max: 8 }),
    query("search").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        page = 1,
        limit = 20,
        status,
        course,
        semester,
        search,
      } = req.query;

      // Build filter
      const filter: any = {};
      if (status) filter.admissionStatus = status;
      if (course) filter["course.name"] = { $regex: course, $options: "i" };
      if (semester) filter["course.semester"] = parseInt(semester as string);
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { studentId: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get students with pagination
      const students = await Student.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      // Get total count
      const total = await Student.countDocuments(filter);

      res.json({
        students,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Student Details
router.get("/students/:id", auth, requireAdmin, async (req: any, res: any) => {
  try {
    const student = await Student.findById(req.params["id"]).select(
      "-password"
    );

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ student });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve/Reject Student Admission
router.put(
  "/students/:id/admission-status",
  auth,
  requireAdmin,
  [
    body("status")
      .isIn(["approved", "rejected", "enrolled"])
      .withMessage("Valid status required"),
    body("notes").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, notes } = req.body;
      const studentId = req.params["id"];

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Update admission status
      student.admissionStatus = status;
      student.approvalDate = new Date();
      student.approvedBy = req.user.email;

      if (status === "approved") {
        // Send approval email
        await sendEmail({
          to: student.email,
          subject: "GCET Admission Approved!",
          html: `
          <h2>Congratulations! Your admission has been approved!</h2>
          <p>Dear ${student.name},</p>
          <p>We are pleased to inform you that your admission to GCET has been approved.</p>
          <p><strong>Student ID:</strong> ${student.studentId}</p>
          <p><strong>Course:</strong> ${student.course.name} - Semester ${student.course.semester}</p>
          <p><strong>Fee Amount:</strong> ₹${student.feeAmount}</p>
          <p>Please complete your fee payment to finalize your enrollment.</p>
          <p>Best regards,<br>GCET Admissions Team</p>
        `,
        });
      } else if (status === "rejected") {
        // Send rejection email
        await sendEmail({
          to: student.email,
          subject: "GCET Admission Update",
          html: `
          <h2>Admission Application Update</h2>
          <p>Dear ${student.name},</p>
          <p>We regret to inform you that your admission application has not been approved at this time.</p>
          <p>${notes ? `Reason: ${notes}` : ""}</p>
          <p>If you have any questions, please contact the admissions office.</p>
          <p>Best regards,<br>GCET Admissions Team</p>
        `,
        });
      }

      await student.save();

      res.json({
        message: `Student admission ${status} successfully`,
        student: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          admissionStatus: student.admissionStatus,
          approvalDate: student.approvalDate,
          approvedBy: student.approvedBy,
        },
      });
    } catch (error) {
      console.error("Update admission status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update Student Fee Status
router.put(
  "/students/:id/fee-status",
  auth,
  requireAdmin,
  [
    body("feePaid")
      .isFloat({ min: 0 })
      .withMessage("Valid fee amount required"),
    body("notes").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { feePaid } = req.body;
      const studentId = req.params["id"];

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Update fee information
      student.feePaid = feePaid;

      // Calculate fee status
      if (feePaid >= student.feeAmount) {
        student.feeStatus = "paid";
        student.admissionStatus = "enrolled";
      } else if (feePaid > 0) {
        student.feeStatus = "partial";
      } else {
        student.feeStatus = "pending";
      }

      await student.save();

      // Send fee receipt email
      await sendEmail({
        to: student.email,
        subject: "GCET Fee Receipt",
        html: `
        <h2>Fee Receipt</h2>
        <p>Dear ${student.name},</p>
        <p>Your fee payment has been recorded successfully.</p>
        <p><strong>Total Fee:</strong> ₹${student.feeAmount}</p>
        <p><strong>Amount Paid:</strong> ₹${feePaid}</p>
        <p><strong>Remaining:</strong> ₹${student.feeAmount - feePaid}</p>
        <p><strong>Status:</strong> ${student.feeStatus.toUpperCase()}</p>
        <p>Best regards,<br>GCET Finance Team</p>
      `,
      });

      res.json({
        message: "Fee status updated successfully",
        student: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          feeStatus: student.feeStatus,
          feePaid: student.feePaid,
          admissionStatus: student.admissionStatus,
        },
      });
    } catch (error) {
      console.error("Update fee status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create Notice
router.post(
  "/notices",
  // auth,
  // requireAdmin,
  [
    body("title")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Title must be at least 5 characters"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters"),
    body("type")
      .isIn([
        "announcement",
        "exam_form",
        "fee_notice",
        "academic",
        "event",
        "maintenance",
      ])
      .withMessage("Valid notice type required"),
    body("priority")
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Valid priority required"),
    body("targetAudience")
      .isIn([
        "all",
        "students",
        "teachers",
        "admin",
        "specific_course",
        "specific_semester",
      ])
      .withMessage("Valid target audience required"),
    body("startDate").isISO8601().withMessage("Valid start date required"),
    body("endDate").isISO8601().withMessage("Valid end date required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        // Return mock success when MongoDB is not connected
        console.log("📝 Mock notice creation (MongoDB not connected)");
        const mockNotice = {
          _id: Date.now().toString(),
          noticeId: `NOT${String(Math.floor(Math.random() * 999) + 1).padStart(
            3,
            "0"
          )}`,
          ...req.body,
          links: req.body.links || [],
          attachments: req.body.attachments || [],
          publishedBy: "Admissions Admin",
          publishedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.status(201).json(mockNotice);
      }

      const {
        title,
        content,
        type,
        priority,
        targetAudience,
        targetCourse,
        targetSemester,
        startDate,
        endDate,
        attachments,
        links,
        signedBy,
      } = req.body;

      // Validate date range
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
          error: "End date must be after start date",
        });
      }

      // Generate notice ID
      const noticeCount = await Notice.countDocuments();
      const noticeId = `NOT${String(noticeCount + 1).padStart(3, "0")}`;

      const notice = new Notice({
        noticeId,
        title,
        content,
        type,
        priority,
        targetAudience,
        targetCourse,
        targetSemester,
        startDate,
        endDate,
        attachments: attachments || [],
        links: links || [],
        signedBy: signedBy || "Principal, GCET Safapora",
        publishedBy: "Admissions Admin", // req.user?.email || "Admin",
      });

      await notice.save();

      res.status(201).json(notice);
    } catch (error) {
      console.error("Create notice error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Mock notices data for when MongoDB is not connected
const mockNotices = [
  {
    _id: "1",
    noticeId: "NOT001",
    title: "Semester 3 Exam Forms Available",
    content:
      "Exam forms for Semester 3 students are now available. Please submit your forms by the end of this month. Late submissions will not be accepted.",
    type: "exam_form",
    priority: "high",
    targetAudience: "specific_semester",
    targetSemester: 3,
    attachments: [],
    links: [
      {
        title: "Exam Form Download",
        url: "https://gcet.edu/forms/exam-form.pdf",
      },
      { title: "Fee Payment Portal", url: "https://gcet.edu/payments" },
    ],
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-02-29T23:59:59Z",
    isActive: true,
    publishedBy: "Admissions Admin",
    publishedAt: "2024-02-01T10:00:00Z",
    signedBy: "Principal, GCET Safapora",
    readBy: [],
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    _id: "2",
    noticeId: "NOT002",
    title: "Library Maintenance Notice",
    content:
      "The library will be closed for maintenance on Saturday, February 15th, 2024. We apologize for the inconvenience.",
    type: "maintenance",
    priority: "medium",
    targetAudience: "all",
    attachments: [],
    links: [],
    startDate: "2024-02-10T00:00:00Z",
    endDate: "2024-02-20T23:59:59Z",
    isActive: true,
    publishedBy: "Library Admin",
    publishedAt: "2024-02-10T09:00:00Z",
    signedBy: "Librarian, GCET Safapora",
    readBy: [],
    createdAt: "2024-02-10T09:00:00Z",
    updatedAt: "2024-02-10T09:00:00Z",
  },
  {
    _id: "3",
    noticeId: "NOT003",
    title: "Fee Payment Deadline Extended",
    content:
      "The deadline for fee payment has been extended to March 15th, 2024. Please ensure timely payment to avoid any late fees.",
    type: "fee_notice",
    priority: "urgent",
    targetAudience: "students",
    attachments: [],
    links: [
      { title: "Payment Portal", url: "https://gcet.edu/payments" },
      { title: "Fee Structure Guide", url: "https://gcet.edu/fees/structure" },
    ],
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-03-15T23:59:59Z",
    isActive: true,
    publishedBy: "Admissions Admin",
    publishedAt: "2024-02-01T12:00:00Z",
    signedBy: "Principal, GCET Safapora",
    readBy: [],
    createdAt: "2024-02-01T12:00:00Z",
    updatedAt: "2024-02-01T12:00:00Z",
  },
];

// Get All Notices
router.get(
  "/notices",
  // auth,
  // requireAdmin,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("type").optional().isString(),
    query("priority").optional().isString(),
    query("isActive").optional().isBoolean(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        // Return mock data when MongoDB is not connected
        console.log("📋 Returning mock notices data (MongoDB not connected)");
        return res.json(mockNotices);
      }

      const { page = 1, limit = 20, type, priority, isActive } = req.query;

      // Build filter
      const filter: any = {};
      if (type) filter.type = type;
      if (priority) filter.priority = priority;
      if (isActive !== undefined) filter.isActive = isActive;

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get notices with pagination
      const notices = await Notice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      // Get total count
      const total = await Notice.countDocuments(filter);

      res.json({
        notices,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Get notices error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update Notice
router.put(
  "/notices/:id",
  // auth,
  // requireAdmin,
  [
    body("title").optional().trim().isLength({ min: 5 }),
    body("content").optional().trim().isLength({ min: 10 }),
    body("isActive").optional().isBoolean(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        // Return mock success when MongoDB is not connected
        console.log("📝 Mock notice update (MongoDB not connected)");
        const mockNotice = {
          _id: req.params["id"],
          ...req.body,
          links: req.body.links || [],
          attachments: req.body.attachments || [],
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockNotice);
      }

      const updates = req.body;
      const noticeId = req.params["id"];

      const notice = await Notice.findByIdAndUpdate(
        noticeId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!notice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      res.json(notice);
    } catch (error) {
      console.error("Update notice error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete Notice
router.delete(
  "/notices/:id",
  /* auth, requireAdmin, */ async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        // Return mock success when MongoDB is not connected
        console.log("🗑️ Mock notice deletion (MongoDB not connected)");
        return res.json({ message: "Notice deleted successfully" });
      }

      const notice = await Notice.findByIdAndDelete(req.params["id"]);

      if (!notice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      res.json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Delete notice error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Toggle Notice Status
router.patch(
  "/notices/:id/toggle",
  /* auth, requireAdmin, */ async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        // Return mock success when MongoDB is not connected
        console.log("🔄 Mock notice toggle (MongoDB not connected)");
        const mockNotice = {
          _id: req.params["id"],
          isActive: Math.random() > 0.5, // Random toggle for demo
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockNotice);
      }

      const notice = await Notice.findById(req.params["id"]);

      if (!notice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      notice.isActive = !notice.isActive;
      await notice.save();

      res.json(notice);
    } catch (error) {
      console.error("Toggle notice status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Dashboard Statistics
router.get(
  "/dashboard-stats",
  auth,
  requireAdmin,
  async (_req: any, res: any) => {
    try {
      // Get counts
      const totalStudents = await Student.countDocuments();
      const pendingAdmissions = await Student.countDocuments({
        admissionStatus: "pending",
      });
      const approvedAdmissions = await Student.countDocuments({
        admissionStatus: "approved",
      });
      const enrolledStudents = await Student.countDocuments({
        admissionStatus: "enrolled",
      });
      const pendingFees = await Student.countDocuments({
        feeStatus: "pending",
      });
      const partialFees = await Student.countDocuments({
        feeStatus: "partial",
      });

      // Get recent activities
      const recentStudents = await Student.find()
        .select("name studentId admissionStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(10);

      const recentNotices = await Notice.find()
        .select("title type priority createdAt")
        .sort({ createdAt: -1 })
        .limit(5);

      // Calculate fee collection
      const feeStats = await Student.aggregate([
        {
          $group: {
            _id: null,
            totalFeeAmount: { $sum: "$feeAmount" },
            totalFeePaid: { $sum: "$feePaid" },
          },
        },
      ]);

      const stats = {
        counts: {
          totalStudents,
          pendingAdmissions,
          approvedAdmissions,
          enrolledStudents,
          pendingFees,
          partialFees,
        },
        fees: {
          totalAmount: feeStats[0]?.totalFeeAmount || 0,
          totalPaid: feeStats[0]?.totalFeePaid || 0,
          remaining:
            (feeStats[0]?.totalFeeAmount || 0) -
            (feeStats[0]?.totalFeePaid || 0),
        },
        recentStudents,
        recentNotices,
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
