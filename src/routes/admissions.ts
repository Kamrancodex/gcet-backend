import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import AdmissionSession from "../models/AdmissionSession";
import Student from "../models/Student";
// import { requireRole } from "../middleware/auth"; // Currently unused

const router = express.Router();

// Middleware to ensure admin role
// const requireAdmin = requireRole(["admin", "admissions_admin"]); // Currently unused

// Mock data for when MongoDB is not connected
const mockSessions = [
  {
    _id: "1",
    sessionId: "ADM2024-SEM3",
    semester: 3,
    academicYear: "2024-25",
    startDate: "2024-08-01T00:00:00Z",
    endDate: "2024-08-31T23:59:59Z",
    feeAmount: 45000,
    feeDeadline: "2024-09-15T23:59:59Z",
    isActive: true,
    courses: [
      "Computer Science Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
    ],
    eligibilityCriteria: "Minimum 60% marks in 12th standard with PCM subjects",
    requiredDocuments: [
      "10th Mark Sheet",
      "12th Mark Sheet",
      "Transfer Certificate",
    ],
    totalApplications: 156,
    approvedApplications: 89,
    rejectedApplications: 12,
    pendingApplications: 55,
    createdBy: "Admissions Admin",
    createdAt: "2024-07-15T10:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
  {
    _id: "2",
    sessionId: "ADM2024-SEM1",
    semester: 1,
    academicYear: "2024-25",
    startDate: "2024-06-01T00:00:00Z",
    endDate: "2024-06-30T23:59:59Z",
    feeAmount: 50000,
    feeDeadline: "2024-07-15T23:59:59Z",
    isActive: false,
    courses: [
      "Computer Science Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
    ],
    eligibilityCriteria: "Minimum 60% marks in 12th standard with PCM subjects",
    requiredDocuments: [
      "10th Mark Sheet",
      "12th Mark Sheet",
      "Transfer Certificate",
      "Character Certificate",
    ],
    totalApplications: 234,
    approvedApplications: 178,
    rejectedApplications: 23,
    pendingApplications: 33,
    createdBy: "Admissions Admin",
    createdAt: "2024-05-15T10:00:00Z",
    updatedAt: "2024-06-30T10:00:00Z",
  },
];

const mockApplications = [
  {
    _id: "1",
    applicationId: "APP2024001",
    studentName: "Rahul Sharma",
    email: "rahul.sharma@student.gcet.edu",
    phone: "+91 9876543210",
    course: "Computer Science Engineering",
    semester: 3,
    status: "pending",
    feeStatus: "pending",
    appliedAt: "2024-08-15T14:30:00Z",
    sessionId: "1",
  },
  {
    _id: "2",
    applicationId: "APP2024002",
    studentName: "Priya Patel",
    email: "priya.patel@student.gcet.edu",
    phone: "+91 9876543211",
    course: "Mechanical Engineering",
    semester: 3,
    status: "approved",
    feeStatus: "paid",
    appliedAt: "2024-08-12T09:15:00Z",
    sessionId: "1",
  },
  {
    _id: "3",
    applicationId: "APP2024003",
    studentName: "Amit Kumar",
    email: "amit.kumar@student.gcet.edu",
    phone: "+91 9876543212",
    course: "Civil Engineering",
    semester: 3,
    status: "rejected",
    feeStatus: "pending",
    appliedAt: "2024-08-10T11:20:00Z",
    sessionId: "1",
  },
];

// Get all admission sessions
router.get("/sessions", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log(
        "📚 Returning mock admission sessions (MongoDB not connected)"
      );
      return res.json(mockSessions);
    }

    const { semester, isActive } = req.query;
    const filter: any = {};

    if (semester) filter.semester = parseInt(semester as string);
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const sessions = await AdmissionSession.find(filter).sort({
      createdAt: -1,
    });

    res.json(sessions);
  } catch (error) {
    console.error("Get admission sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get admission session by ID
router.get("/sessions/:id", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      const session = mockSessions.find((s) => s._id === req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.json(session);
    }

    const session = await AdmissionSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Get admission session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create admission session
router.post(
  "/sessions",
  // auth,
  // requireAdmin,
  [
    body("semester").isInt({ min: 1, max: 8 }),
    body("academicYear").trim().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("feeAmount").isFloat({ min: 0 }),
    body("feeDeadline").isISO8601(),
    body("courses").isArray({ min: 1 }),
    body("eligibilityCriteria").trim().notEmpty(),
    body("requiredDocuments").isArray({ min: 1 }),
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
        console.log(
          "📝 Mock admission session creation (MongoDB not connected)"
        );
        const mockSession = {
          _id: Date.now().toString(),
          sessionId: `ADM${new Date().getFullYear()}-SEM${req.body.semester}`,
          ...req.body,
          isActive: true,
          totalApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          pendingApplications: 0,
          createdBy: "Admissions Admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.status(201).json(mockSession);
      }

      // Generate session ID
      const sessionId = `ADM${new Date().getFullYear()}-SEM${
        req.body.semester
      }`;

      const session = new AdmissionSession({
        sessionId,
        ...req.body,
        createdBy: "Admissions Admin", // req.user?.email || "Admin",
      });

      await session.save();
      res.status(201).json(session);
    } catch (error) {
      console.error("Create admission session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update admission session
router.put(
  "/sessions/:id",
  // auth,
  // requireAdmin,
  async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log("📝 Mock admission session update (MongoDB not connected)");
        const mockSession = {
          _id: req.params.id,
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockSession);
      }

      const session = await AdmissionSession.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Update admission session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete admission session
router.delete(
  "/sessions/:id",
  /* auth, requireAdmin, */ async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "🗑️ Mock admission session deletion (MongoDB not connected)"
        );
        return res.json({ message: "Session deleted successfully" });
      }

      const session = await AdmissionSession.findByIdAndDelete(req.params.id);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Delete admission session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all applications
router.get("/applications", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log("📚 Returning mock applications (MongoDB not connected)");
      return res.json(mockApplications);
    }

    const { sessionId, semester, status, search } = req.query;
    const filter: any = {};

    if (sessionId) filter.sessionId = sessionId;
    if (semester) filter.semester = parseInt(semester as string);
    if (status) filter.admissionStatus = status;

    let query = Student.find(filter).sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query = query.or([
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
      ]);
    }

    const applications = await query;
    res.json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get application by ID
router.get("/applications/:id", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      const application = mockApplications.find((a) => a._id === req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      return res.json(application);
    }

    const application = await Student.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update application status
router.patch(
  "/applications/:id/status",
  // auth,
  // requireAdmin,
  [body("status").isIn(["pending", "approved", "rejected", "enrolled"])],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "📝 Mock application status update (MongoDB not connected)"
        );
        const mockApplication = {
          _id: req.params.id,
          status: req.body.status,
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockApplication);
      }

      const application = await Student.findByIdAndUpdate(
        req.params.id,
        { admissionStatus: req.body.status },
        { new: true }
      );

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Submit new application (for students)
router.post(
  "/applications",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("phone").trim().notEmpty(),
    body("course").trim().notEmpty(),
    body("semester").isInt({ min: 1, max: 8 }),
    body("sessionId").trim().notEmpty(),
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
        console.log("📝 Mock application submission (MongoDB not connected)");
        const mockApplication = {
          _id: Date.now().toString(),
          applicationId: `APP${new Date().getFullYear()}${String(
            Math.floor(Math.random() * 999) + 1
          ).padStart(3, "0")}`,
          ...req.body,
          status: "pending",
          feeStatus: "pending",
          appliedAt: new Date().toISOString(),
        };
        return res.status(201).json(mockApplication);
      }

      // Generate student ID and library ID
      const studentCount = await Student.countDocuments();
      const studentId = `GCET${new Date().getFullYear()}${String(
        studentCount + 1
      ).padStart(4, "0")}`;
      const libraryId = `LIB${String(studentCount + 1).padStart(6, "0")}`;

      const student = new Student({
        studentId,
        libraryId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        course: req.body.course,
        semester: req.body.semester,
        admissionStatus: "pending",
        feeStatus: "pending",
        sessionId: req.body.sessionId,
      });

      await student.save();
      res.status(201).json(student);
    } catch (error) {
      console.error("Submit application error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Admission Statistics
router.get(
  "/stats",
  /* auth, requireAdmin, */ async (_req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "📊 Returning mock admission stats (MongoDB not connected)"
        );
        return res.json({
          sessions: {
            total: 2,
            active: 1,
            upcoming: 0,
          },
          applications: {
            total: 390,
            pending: 88,
            approved: 267,
            rejected: 35,
          },
          recentSessions: mockSessions.slice(0, 3),
        });
      }

      // Get session counts
      const totalSessions = await AdmissionSession.countDocuments();
      const activeSessions = await AdmissionSession.countDocuments({
        isActive: true,
      });
      const upcomingSessions = await AdmissionSession.countDocuments({
        startDate: { $gt: new Date() },
      });

      // Get application counts
      const totalApplications = await Student.countDocuments();
      const pendingApplications = await Student.countDocuments({
        admissionStatus: "pending",
      });
      const approvedApplications = await Student.countDocuments({
        admissionStatus: "approved",
      });
      const rejectedApplications = await Student.countDocuments({
        admissionStatus: "rejected",
      });

      // Get recent sessions
      const recentSessions = await AdmissionSession.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const stats = {
        sessions: {
          total: totalSessions,
          active: activeSessions,
          upcoming: upcomingSessions,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
        },
        recentSessions,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get admission stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
