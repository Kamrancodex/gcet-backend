import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import RegistrationSession from "../models/RegistrationSession";
import Registration from "../models/Registration";
import Student from "../models/Student";
// import { requireRole } from "../middleware/auth"; // Currently unused

const router = express.Router();

// Middleware to ensure admin role
// const requireAdmin = requireRole(["admin", "admissions_admin"]); // Currently unused

// Helper function to calculate library clearance requirements
const calculateLibraryClearance = (
  currentSemester: number,
  registeringForSemester: number,
  totalBooksIssued: number,
  totalBooksReturned: number
) => {
  const booksPerSemester = 6;
  const requiredClearancePercentage = 80; // 80% clearance required

  // Calculate total books that should have been issued by now
  const expectedTotalBooks = currentSemester * booksPerSemester;
  const actualTotalBooks = totalBooksIssued || expectedTotalBooks;

  // Calculate required books to be returned for 80% clearance
  const requiredBooksReturned = Math.ceil(
    (actualTotalBooks * requiredClearancePercentage) / 100
  );

  // Current clearance percentage
  const currentClearancePercentage =
    actualTotalBooks > 0 ? (totalBooksReturned / actualTotalBooks) * 100 : 100;

  // Check if clearance is required for this semester
  const requiresClearance =
    registeringForSemester === 5 || registeringForSemester === 7;

  // Check if student meets the requirement
  const meetsRequirement =
    !requiresClearance || totalBooksReturned >= requiredBooksReturned;

  return {
    requiresClearance,
    expectedTotalBooks: actualTotalBooks,
    requiredBooksReturned,
    actualBooksReturned: totalBooksReturned,
    currentClearancePercentage:
      Math.round(currentClearancePercentage * 100) / 100,
    requiredClearancePercentage,
    meetsRequirement,
    shortfall: requiresClearance
      ? Math.max(0, requiredBooksReturned - totalBooksReturned)
      : 0,
  };
};

// Helper function to calculate late fees and pending amounts
const calculateLibraryFees = (pendingBooks: any[]) => {
  let totalLateFee = 0;
  let totalBookCost = 0;
  const overdueBooks: any[] = [];
  const lostBooks: any[] = [];

  pendingBooks.forEach((book) => {
    if (book.status === "overdue") {
      totalLateFee += book.lateFee || 0;
      overdueBooks.push(book);
    } else if (book.status === "lost") {
      totalBookCost += 500; // Assume ₹500 per lost book
      lostBooks.push(book);
    }
  });

  return {
    totalLateFee,
    totalBookCost,
    totalAmount: totalLateFee + totalBookCost,
    overdueBooks,
    lostBooks,
    hasPendingBooks: pendingBooks.length > 0,
  };
};

// Mock data for when MongoDB is not connected
const mockSessions = [
  {
    _id: "1",
    sessionId: "REG2024-SEM5",
    semester: 5,
    academicYear: "2024-25",
    startDate: "2024-08-01T00:00:00Z",
    endDate: "2024-08-31T23:59:59Z",
    feeAmount: 45000,
    feeDeadline: "2024-09-15T23:59:59Z",
    isActive: true,
    availableCourses: [
      "Computer Networks",
      "Database Management",
      "Software Engineering",
      "Operating Systems",
    ],
    libraryRequirement: true, // 5th semester requires library clearance
    totalRegistrations: 156,
    completedRegistrations: 89,
    pendingRegistrations: 67,
    createdBy: "Registration Admin",
    createdAt: "2024-07-15T10:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
  {
    _id: "2",
    sessionId: "REG2024-SEM3",
    semester: 3,
    academicYear: "2024-25",
    startDate: "2024-06-01T00:00:00Z",
    endDate: "2024-06-30T23:59:59Z",
    feeAmount: 42000,
    feeDeadline: "2024-07-15T23:59:59Z",
    isActive: false,
    availableCourses: [
      "Data Structures",
      "Digital Logic",
      "Mathematics III",
      "Physics II",
    ],
    libraryRequirement: false, // 3rd semester doesn't require library clearance
    totalRegistrations: 234,
    completedRegistrations: 201,
    pendingRegistrations: 33,
    createdBy: "Registration Admin",
    createdAt: "2024-05-15T10:00:00Z",
    updatedAt: "2024-06-30T10:00:00Z",
  },
];

const mockRegistrations = [
  {
    _id: "1",
    registrationId: "REG2024001",
    studentId: "GCET20240001",
    universityRegNumber: "GCET/2022/CSE/001",
    studentName: "Rahul Sharma",
    email: "rahul.sharma@student.gcet.edu",
    phone: "+91 9876543210",
    currentSemester: 4,
    registeringForSemester: 5,
    selectedCourses: ["Computer Networks", "Database Management"],
    status: "library_pending",
    feeStatus: "pending",
    libraryCleared: false,
    registeredAt: "2024-08-15T14:30:00Z",
    sessionId: "1",
  },
  {
    _id: "2",
    registrationId: "REG2024002",
    studentId: "GCET20240002",
    universityRegNumber: "GCET/2022/ME/002",
    studentName: "Priya Patel",
    email: "priya.patel@student.gcet.edu",
    phone: "+91 9876543211",
    currentSemester: 2,
    registeringForSemester: 3,
    selectedCourses: ["Data Structures", "Digital Logic"],
    status: "completed",
    feeStatus: "paid",
    libraryCleared: true,
    registeredAt: "2024-08-12T09:15:00Z",
    sessionId: "2",
  },
];

const mockStudents = [
  {
    _id: "GCET20240001",
    studentId: "GCET20240001",
    universityRegNumber: "GCET/2022/CSE/001",
    name: "Rahul Sharma",
    email: "rahul.sharma@student.gcet.edu",
    phone: "+91 9876543210",
    address: "123 Main St, Safapora, Kashmir",
    course: "Computer Science Engineering",
    currentSemester: 4,
    libraryId: "LIB000001",
    libraryCard: "LIB000001",
    admissionStatus: "enrolled",
    feeStatus: "paid",
    // Current semester books
    libraryBooksIssued: 2,
    libraryBooksReturned: 4,
    // All semesters total (4 sems × 6 books = 24 books total)
    totalBooksIssuedAllSemesters: 24,
    totalBooksReturnedAllSemesters: 18, // 75% - needs 80% for 5th sem (20 books)
    libraryCleared: false,
    libraryNOCStatus: "pending",
    pendingBooks: [
      {
        bookId: "BK001",
        bookTitle: "Advanced Database Systems",
        issueDate: new Date("2024-07-01"),
        dueDate: new Date("2024-07-15"),
        lateFee: 150,
        status: "overdue",
      },
      {
        bookId: "BK002",
        bookTitle: "Computer Networks Fundamentals",
        issueDate: new Date("2024-07-10"),
        dueDate: new Date("2024-07-24"),
        lateFee: 0,
        status: "issued",
      },
    ],
  },
  {
    _id: "GCET20240002",
    studentId: "GCET20240002",
    universityRegNumber: "GCET/2022/ME/002",
    name: "Priya Patel",
    email: "priya.patel@student.gcet.edu",
    phone: "+91 9876543211",
    address: "456 College Road, Safapora, Kashmir",
    course: "Mechanical Engineering",
    currentSemester: 2,
    libraryId: "LIB000002",
    libraryCard: "LIB000002",
    admissionStatus: "enrolled",
    feeStatus: "paid",
    // Current semester books
    libraryBooksIssued: 1,
    libraryBooksReturned: 5,
    // All semesters total (2 sems × 6 books = 12 books total)
    totalBooksIssuedAllSemesters: 12,
    totalBooksReturnedAllSemesters: 11, // 92% - good for 3rd sem
    libraryCleared: true,
    libraryNOCStatus: "approved",
    libraryNOCDate: new Date("2024-08-01"),
    libraryNOCIssuedBy: "Library Attendant",
    pendingBooks: [
      {
        bookId: "BK003",
        bookTitle: "Engineering Mechanics",
        issueDate: new Date("2024-08-01"),
        dueDate: new Date("2024-08-15"),
        lateFee: 0,
        status: "issued",
      },
    ],
  },
  {
    _id: "GCET20240003",
    studentId: "GCET20240003",
    universityRegNumber: "GCET/2022/CSE/003",
    name: "Arjun Singh",
    email: "arjun.singh@student.gcet.edu",
    phone: "+91 9876543212",
    address: "789 Tech Street, Safapora, Kashmir",
    course: "Computer Science Engineering",
    currentSemester: 6,
    libraryId: "LIB000003",
    libraryCard: "LIB000003",
    admissionStatus: "enrolled",
    feeStatus: "paid",
    // Current semester books
    libraryBooksIssued: 0,
    libraryBooksReturned: 6,
    // All semesters total (6 sems × 6 books = 36 books total)
    totalBooksIssuedAllSemesters: 36,
    totalBooksReturnedAllSemesters: 30, // 83% - good for 7th sem (needs 29 books)
    libraryCleared: true,
    libraryNOCStatus: "approved",
    libraryNOCDate: new Date("2024-08-05"),
    libraryNOCIssuedBy: "Library Attendant",
    pendingBooks: [], // No pending books
  },
];

// Get all registration sessions
router.get("/sessions", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log(
        "📚 Returning mock registration sessions (MongoDB not connected)"
      );
      return res.json(mockSessions);
    }

    const { semester, isActive } = req.query;
    const filter: any = {};

    if (semester) filter.semester = parseInt(semester as string);
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const sessions = await RegistrationSession.find(filter).sort({
      createdAt: -1,
    });

    return res.json(sessions);
  } catch (error) {
    console.error("Get registration sessions error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get registration session by ID
router.get("/sessions/:id", async (req: any, res: any) => {
  try {
    const { branch } = req.query; // Get student's branch from query params

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      const session = mockSessions.find((s) => s._id === req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.json(session);
    }

    const session = await RegistrationSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Filter subjects by branch if branchSubjects exists
    let responseSession = session.toObject();
    if (branch && session.branchSubjects) {
      const branchSubjects = (session.branchSubjects as any).get
        ? (session.branchSubjects as any).get(branch as string)
        : (session.branchSubjects as any)[branch as string];
      if (branchSubjects && Array.isArray(branchSubjects)) {
        responseSession.availableCourses = branchSubjects;
      }
    }

    return res.json(responseSession);
  } catch (error) {
    console.error("Get registration session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create registration session
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
    body("availableCourses").isArray({ min: 1 }),
    body("libraryRequirement").isBoolean(),
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
          "📝 Mock registration session creation (MongoDB not connected)"
        );
        const mockSession = {
          _id: Date.now().toString(),
          sessionId: `REG${new Date().getFullYear()}-SEM${req.body.semester}`,
          ...req.body,
          isActive: true,
          totalRegistrations: 0,
          completedRegistrations: 0,
          pendingRegistrations: 0,
          createdBy: "Registration Admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.status(201).json(mockSession);
      }

      // Generate session ID
      const sessionId = `REG${new Date().getFullYear()}-SEM${
        req.body.semester
      }`;

      const session = new RegistrationSession({
        sessionId,
        ...req.body,
        createdBy: "Registration Admin", // req.user?.email || "Admin",
      });

      await session.save();
      res.status(201).json(session);
    } catch (error) {
      console.error("Create registration session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update registration session
router.put(
  "/sessions/:id",
  // auth,
  // requireAdmin,
  async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "📝 Mock registration session update (MongoDB not connected)"
        );
        const mockSession = {
          _id: req.params.id,
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockSession);
      }

      const session = await RegistrationSession.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Update registration session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Toggle session active status
router.patch(
  "/sessions/:id/toggle-status",
  /* auth, requireAdmin, */ async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "🔄 Mock registration session toggle (MongoDB not connected)"
        );
        return res.json({
          _id: req.params.id,
          isActive: req.body.isActive,
          updatedAt: new Date().toISOString(),
        });
      }

      const session = await RegistrationSession.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Toggle session status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete registration session
router.delete(
  "/sessions/:id",
  /* auth, requireAdmin, */ async (req: any, res: any) => {
    try {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "🗑️ Mock registration session deletion (MongoDB not connected)"
        );
        return res.json({ message: "Session deleted successfully" });
      }

      const session = await RegistrationSession.findByIdAndDelete(
        req.params.id
      );

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Delete registration session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Auto-expire sessions based on end date
router.post("/sessions/check-expiry", async (_req: any, res: any) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      return res.json({ message: "Running in offline mode", expired: 0 });
    }

    const expiredCount = await RegistrationSession.updateMany(
      {
        isActive: true,
        endDate: { $lt: new Date() },
      },
      {
        isActive: false,
      }
    );

    res.json({
      message: "Expiry check completed",
      expired: expiredCount.modifiedCount,
    });
  } catch (error) {
    console.error("Check expiry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all registrations
router.get("/registrations", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log("📚 Returning mock registrations (MongoDB not connected)");
      return res.json(mockRegistrations);
    }

    const { sessionId, semester, status, search } = req.query;
    const filter: any = {};
    if (sessionId) filter.sessionId = sessionId;
    if (semester) filter.registeringForSemester = parseInt(semester as string);
    if (status) filter.status = status;

    const mongoQuery: any = Registration.find(filter).sort({ createdAt: -1 });
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      mongoQuery.where({
        $or: [
          { studentName: searchRegex },
          { email: searchRegex },
          { universityRegNumber: searchRegex },
        ],
      });
    }
    const registrations = await mongoQuery.exec();
    res.json(registrations);
  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get registration by ID
router.get("/registrations/:id", async (req: any, res: any) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      const registration = mockRegistrations.find(
        (r) => r._id === req.params.id
      );
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }
      return res.json(registration);
    }

    const registration = await Student.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.json(registration);
  } catch (error) {
    console.error("Get registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update registration status
router.patch(
  "/registrations/:id/status",
  // auth,
  // requireAdmin,
  [
    body("status").isIn([
      "pending",
      "completed",
      "payment_pending",
      "library_pending",
    ]),
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
          "📝 Mock registration status update (MongoDB not connected)"
        );
        const mockRegistration = {
          _id: req.params.id,
          status: req.body.status,
          updatedAt: new Date().toISOString(),
        };
        return res.json(mockRegistration);
      }

      const registration = await Student.findByIdAndUpdate(
        req.params.id,
        { registrationStatus: req.body.status },
        { new: true }
      );

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      console.error("Update registration status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Student lookup by university registration number
router.get("/lookup/:universityRegNumber", async (req: any, res: any) => {
  try {
    console.log(
      "req.params.universityRegNumber",
      req.params.universityRegNumber
    );

    const universityRegNumber = decodeURIComponent(
      req.params.universityRegNumber
    );
    const { registeringForSemester } = req.query;

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log("🔍 Mock student lookup (MongoDB not connected)");
      const student = mockStudents.find(
        (s) => s.universityRegNumber === universityRegNumber
      );
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Calculate library clearance for the target semester
      const targetSemester = registeringForSemester
        ? parseInt(registeringForSemester as string)
        : student.currentSemester + 1;
      const clearanceInfo = calculateLibraryClearance(
        student.currentSemester,
        targetSemester,
        student.totalBooksIssuedAllSemesters || 0,
        student.totalBooksReturnedAllSemesters || 0
      );

      // Calculate library fees
      const feeInfo = calculateLibraryFees(student.pendingBooks || []);

      return res.json({
        ...student,
        libraryCleared:
          clearanceInfo.meetsRequirement && !feeInfo.hasPendingBooks,
        clearanceInfo,
        feeInfo,
        libraryNOCRequired:
          clearanceInfo.requiresClearance || feeInfo.hasPendingBooks,
      });
    }

    const student = await Student.findOne({ universityRegNumber });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get active book transactions from BookTransaction collection
    const BookTransaction = require("../models/BookTransaction").default;
    const activeTransactions = await BookTransaction.find({
      studentId: student.studentId,
      status: { $in: ["active", "overdue"] },
    });

    // Get unpaid fines
    const unpaidFines = await BookTransaction.find({
      studentId: student.studentId,
      fineAmount: { $gt: 0 },
      finePaid: false,
    });

    // Calculate NOC status
    const totalUnpaidFines = unpaidFines.reduce(
      (sum: number, tx: any) => sum + tx.fineAmount,
      0
    );
    const totalBookCost =
      student.pendingBooks?.reduce((sum: number, book: any) => {
        if (book.status === "lost") {
          return sum + 2500; // Average book replacement cost
        }
        return sum;
      }, 0) || 0;

    const libraryNOC = {
      canGetNOC: activeTransactions.length === 0 && totalUnpaidFines === 0,
      pendingBooks: activeTransactions.length,
      pendingFines: totalUnpaidFines,
      lostBooksCost: totalBookCost,
      totalAmount: totalUnpaidFines + totalBookCost,
      libraryNOCStatus: student.libraryNOCStatus || "pending",
      requiresNOC: activeTransactions.length > 0 || totalUnpaidFines > 0,
      clearanceOptions: {
        option1: {
          type: "return_books_pay_fines",
          description: "Return all books and pay pending fines",
          amount: totalUnpaidFines,
          pendingBooksCount: activeTransactions.length,
        },
        option2: {
          type: "pay_full_cost",
          description: "Pay full cost of unreturned books + fines",
          amount: totalUnpaidFines + totalBookCost,
          note: "Choose this if books are lost or cannot be returned",
        },
      },
    };

    // Calculate library clearance for the target semester (backward compatibility)
    const targetSemester = registeringForSemester
      ? parseInt(registeringForSemester as string)
      : student.currentSemester + 1;
    const clearanceInfo = calculateLibraryClearance(
      student.currentSemester,
      targetSemester,
      student.totalBooksIssuedAllSemesters || 0,
      student.totalBooksReturnedAllSemesters || 0
    );

    // Calculate library fees (backward compatibility)
    const feeInfo = calculateLibraryFees(student.pendingBooks || []);

    res.json({
      ...student.toObject(),
      libraryCleared:
        libraryNOC.canGetNOC && student.libraryNOCStatus === "approved",
      clearanceInfo,
      feeInfo,
      libraryNOC, // New NOC information
      libraryNOCRequired: libraryNOC.requiresNOC,
    });
  } catch (error) {
    console.error("Student lookup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit registration
router.post(
  "/submit",
  [
    body("universityRegNumber").trim().notEmpty(),
    body("sessionId").trim().notEmpty(),
    body("selectedCourses").isArray({ min: 1 }),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { universityRegNumber, sessionId, selectedCourses, updatedInfo } =
        req.body;

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log("📝 Mock registration submission (MongoDB not connected)");
        const student = mockStudents.find(
          (s) => s.universityRegNumber === universityRegNumber
        );
        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        const session = mockSessions.find((s) => s._id === sessionId);
        if (!session) {
          return res
            .status(404)
            .json({ error: "Registration session not found" });
        }

        // Check library requirement with comprehensive NOC verification (Mock)
        if (session.libraryRequirement) {
          // Mock NOC verification
          const pendingBooks = student.pendingBooks || [];
          const totalUnpaidFines = pendingBooks.reduce(
            (sum: number, book: any) => sum + (book.lateFee || 0),
            0
          );
          const totalBookCost = pendingBooks.reduce(
            (sum: number, book: any) => {
              if (book.status === "lost") {
                return sum + 2500; // Average book replacement cost
              }
              return sum;
            },
            0
          );

          const requiresNOC = pendingBooks.length > 0 || totalUnpaidFines > 0;
          const hasApprovedNOC = student.libraryNOCStatus === "approved";

          // Check if student needs NOC but doesn't have one
          if (requiresNOC && !hasApprovedNOC) {
            return res.status(400).json({
              error: "Library NOC required for this semester",
              requiresLibraryClearance: true,
              libraryNOC: {
                canGetNOC: false,
                pendingBooks: pendingBooks.length,
                pendingFines: totalUnpaidFines,
                lostBooksCost: totalBookCost,
                totalAmount: totalUnpaidFines + totalBookCost,
                libraryNOCStatus: student.libraryNOCStatus || "pending",
                requiresNOC: true,
                clearanceOptions: {
                  option1: {
                    type: "return_books_pay_fines",
                    description: "Return all books and pay pending fines",
                    amount: totalUnpaidFines,
                    pendingBooksCount: pendingBooks.length,
                  },
                  option2: {
                    type: "pay_full_cost",
                    description: "Pay full cost of unreturned books + fines",
                    amount: totalUnpaidFines + totalBookCost,
                    note: "Choose this if books are lost or cannot be returned",
                  },
                },
              },
              message: `You have ${pendingBooks.length} pending books and ₹${totalUnpaidFines} in unpaid fines. Please clear your library dues to get NOC.`,
            });
          }

          // Also check the legacy clearance requirement (backward compatibility)
          const clearanceInfo = calculateLibraryClearance(
            student.currentSemester,
            session.semester,
            student.totalBooksIssuedAllSemesters || 0,
            student.totalBooksReturnedAllSemesters || 0
          );

          const feeInfo = calculateLibraryFees(student.pendingBooks || []);

          if (!clearanceInfo.meetsRequirement || feeInfo.hasPendingBooks) {
            return res.status(400).json({
              error: "Library clearance required for this semester",
              requiresLibraryClearance: true,
              clearanceInfo,
              feeInfo,
              message: !clearanceInfo.meetsRequirement
                ? `You need to return ${clearanceInfo.shortfall} more books to meet the 80% requirement`
                : "You have pending books or fees that need to be cleared",
            });
          }
        }

        const mockRegistration = {
          _id: Date.now().toString(),
          registrationId: `REG${new Date().getFullYear()}${String(
            Math.floor(Math.random() * 999) + 1
          ).padStart(3, "0")}`,
          studentId: student.studentId,
          universityRegNumber,
          studentName: student.name,
          email: student.email,
          phone: updatedInfo?.phone || student.phone,
          currentSemester: student.currentSemester,
          registeringForSemester: session.semester,
          selectedCourses,
          status:
            session.libraryRequirement && !student.libraryCleared
              ? "library_pending"
              : "payment_pending",
          feeStatus: "pending",
          libraryCleared: student.libraryCleared,
          registeredAt: new Date().toISOString(),
          sessionId,
        };

        return res.status(201).json(mockRegistration);
      }

      // Find student
      const student = await Student.findOne({ universityRegNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Find session
      const session = await RegistrationSession.findById(sessionId);
      if (!session) {
        return res
          .status(404)
          .json({ error: "Registration session not found" });
      }

      // Check library requirement with comprehensive NOC verification
      if (session.libraryRequirement) {
        // Get active book transactions from BookTransaction collection
        const BookTransaction = require("../models/BookTransaction").default;
        const activeTransactions = await BookTransaction.find({
          studentId: student.studentId,
          status: { $in: ["active", "overdue"] },
        });

        // Get unpaid fines
        const unpaidFines = await BookTransaction.find({
          studentId: student.studentId,
          fineAmount: { $gt: 0 },
          finePaid: false,
        });

        // Calculate NOC status
        const totalUnpaidFines = unpaidFines.reduce(
          (sum: number, tx: any) => sum + tx.fineAmount,
          0
        );
        const totalBookCost =
          student.pendingBooks?.reduce((sum: number, book: any) => {
            if (book.status === "lost") {
              return sum + 2500; // Average book replacement cost
            }
            return sum;
          }, 0) || 0;

        const requiresNOC =
          activeTransactions.length > 0 || totalUnpaidFines > 0;
        const hasApprovedNOC = student.libraryNOCStatus === "approved";

        // Check if student needs NOC but doesn't have one
        if (requiresNOC && !hasApprovedNOC) {
          return res.status(400).json({
            error: "Library NOC required for this semester",
            requiresLibraryClearance: true,
            libraryNOC: {
              canGetNOC: false,
              pendingBooks: activeTransactions.length,
              pendingFines: totalUnpaidFines,
              lostBooksCost: totalBookCost,
              totalAmount: totalUnpaidFines + totalBookCost,
              libraryNOCStatus: student.libraryNOCStatus || "pending",
              requiresNOC: true,
              clearanceOptions: {
                option1: {
                  type: "return_books_pay_fines",
                  description: "Return all books and pay pending fines",
                  amount: totalUnpaidFines,
                  pendingBooksCount: activeTransactions.length,
                },
                option2: {
                  type: "pay_full_cost",
                  description: "Pay full cost of unreturned books + fines",
                  amount: totalUnpaidFines + totalBookCost,
                  note: "Choose this if books are lost or cannot be returned",
                },
              },
            },
            message: `You have ${activeTransactions.length} pending books and ₹${totalUnpaidFines} in unpaid fines. Please clear your library dues to get NOC.`,
          });
        }

        // Also check the legacy clearance requirement (backward compatibility)
        const clearanceInfo = calculateLibraryClearance(
          student.currentSemester,
          session.semester,
          student.totalBooksIssuedAllSemesters || 0,
          student.totalBooksReturnedAllSemesters || 0
        );

        const feeInfo = calculateLibraryFees(student.pendingBooks || []);

        if (!clearanceInfo.meetsRequirement || feeInfo.hasPendingBooks) {
          return res.status(400).json({
            error: "Library clearance required for this semester",
            requiresLibraryClearance: true,
            clearanceInfo,
            feeInfo,
            message: !clearanceInfo.meetsRequirement
              ? `You need to return ${clearanceInfo.shortfall} more books to meet the 80% requirement`
              : "You have pending books or fees that need to be cleared",
          });
        }
      }

      // Update student info if provided
      if (updatedInfo) {
        if (updatedInfo.phone) student.phone = updatedInfo.phone;
        if (updatedInfo.address) {
          // If address is a string, parse it into an object
          if (typeof updatedInfo.address === "string") {
            // Keep the existing address structure, just update it as a formatted string isn't what the model expects
            // For now, we'll skip updating address if it's a string
            console.log(
              "Address is a string, skipping update. Consider using address object format."
            );
          } else {
            student.address = updatedInfo.address;
          }
        }
        await student.save();
      }

      // Persist registration in DB
      const registration = await Registration.create({
        studentId: student.studentId,
        universityRegNumber,
        studentName: student.name,
        email: student.email,
        phone: student.phone,
        currentSemester: student.currentSemester,
        registeringForSemester: session.semester,
        selectedCourses,
        status: "completed",
        feeStatus: "paid",
        libraryCleared: !!student.libraryCleared,
        sessionId,
      });

      // Update session stats
      await RegistrationSession.updateOne(
        { _id: sessionId },
        {
          $inc: {
            totalRegistrations: 1,
            completedRegistrations: 1,
          },
        }
      );

      // Update student record summary
      student.registrationStatus = "completed";
      student.selectedCourses = selectedCourses;
      student.feeStatus = "paid";
      await student.save();

      res.status(201).json({
        message: "Registration submitted successfully",
        registration,
        student: student.toObject(),
      });
    } catch (error) {
      console.error("Submit registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Library card verification and NOC check
router.post(
  "/library-noc/verify",
  [
    body("libraryCard")
      .trim()
      .notEmpty()
      .withMessage("Library card number is required"),
    body("universityRegNumber")
      .trim()
      .notEmpty()
      .withMessage("University registration number is required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { libraryCard, universityRegNumber } = req.body;

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log(
          "📚 Mock library card verification (MongoDB not connected)"
        );
        const student = mockStudents.find(
          (s) =>
            s.libraryCard === libraryCard &&
            s.universityRegNumber === universityRegNumber
        );

        if (!student) {
          return res.status(404).json({
            error: "Library card not found or doesn't match student record",
          });
        }

        const feeInfo = calculateLibraryFees(student.pendingBooks || []);

        return res.json({
          verified: true,
          student: {
            name: student.name,
            universityRegNumber: student.universityRegNumber,
            libraryCard: student.libraryCard,
            currentSemester: student.currentSemester,
          },
          libraryStatus: {
            nocStatus: student.libraryNOCStatus,
            nocDate: student.libraryNOCDate,
            nocIssuedBy: student.libraryNOCIssuedBy,
            pendingBooks: student.pendingBooks || [],
            ...feeInfo,
          },
        });
      }

      const student = await Student.findOne({
        libraryCard,
        universityRegNumber,
      });

      if (!student) {
        return res.status(404).json({
          error: "Library card not found or doesn't match student record",
        });
      }

      const feeInfo = calculateLibraryFees(student.pendingBooks || []);

      res.json({
        verified: true,
        student: {
          name: student.name,
          universityRegNumber: student.universityRegNumber,
          libraryCard: student.libraryCard,
          currentSemester: student.currentSemester,
        },
        libraryStatus: {
          nocStatus: student.libraryNOCStatus,
          nocDate: student.libraryNOCDate,
          nocIssuedBy: student.libraryNOCIssuedBy,
          pendingBooks: student.pendingBooks || [],
          ...feeInfo,
        },
      });
    } catch (error) {
      console.error("Library card verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Pay library fees and get NOC
router.post(
  "/library-noc/pay-fees",
  [
    body("universityRegNumber").trim().notEmpty(),
    body("paymentType").isIn(["late_fee", "book_cost", "both"]),
    body("amount").isFloat({ min: 0 }),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { universityRegNumber, paymentType } = req.body;

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        console.log("💳 Mock library fee payment (MongoDB not connected)");
        const studentIndex = mockStudents.findIndex(
          (s) => s.universityRegNumber === universityRegNumber
        );

        if (studentIndex === -1) {
          return res.status(404).json({ error: "Student not found" });
        }

        // Update student's library status
        const student = mockStudents[studentIndex];
        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        // Clear overdue books if late fee is paid
        if (paymentType === "late_fee" || paymentType === "both") {
          student.pendingBooks =
            student.pendingBooks?.map((book) => ({
              ...book,
              lateFee: 0,
              status: book.status === "overdue" ? "issued" : book.status,
            })) || [];
        }

        // Mark lost books as paid if book cost is paid
        if (paymentType === "book_cost" || paymentType === "both") {
          student.pendingBooks =
            student.pendingBooks?.filter((book) => book.status !== "lost") ||
            [];
        }

        // Issue NOC if no pending books
        const remainingFees = calculateLibraryFees(student.pendingBooks || []);
        if (!remainingFees.hasPendingBooks) {
          student.libraryNOCStatus = "approved";
          student.libraryNOCDate = new Date();
          student.libraryNOCIssuedBy = "Library Attendant";
          student.libraryCleared = true;
        }

        return res.json({
          success: true,
          message: "Payment processed successfully",
          nocIssued: !remainingFees.hasPendingBooks,
          libraryStatus: {
            nocStatus: student.libraryNOCStatus,
            nocDate: student.libraryNOCDate,
            nocIssuedBy: student.libraryNOCIssuedBy,
            pendingBooks: student.pendingBooks || [],
            ...remainingFees,
          },
        });
      }

      const student = await Student.findOne({ universityRegNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Process payment and update student record
      if (paymentType === "late_fee" || paymentType === "both") {
        student.pendingBooks =
          student.pendingBooks?.map((book) => ({
            ...book,
            lateFee: 0,
            status: book.status === "overdue" ? "issued" : book.status,
          })) || [];
      }

      if (paymentType === "book_cost" || paymentType === "both") {
        student.pendingBooks =
          student.pendingBooks?.filter((book) => book.status !== "lost") || [];
      }

      // Issue NOC if no pending books
      const remainingFees = calculateLibraryFees(student.pendingBooks || []);
      if (!remainingFees.hasPendingBooks) {
        student.libraryNOCStatus = "approved";
        student.libraryNOCDate = new Date();
        student.libraryNOCIssuedBy = "Library Attendant";
        student.libraryCleared = true;
      }

      await student.save();

      return res.json({
        success: true,
        message: "Payment processed successfully",
        nocIssued: !remainingFees.hasPendingBooks,
        libraryStatus: {
          nocStatus: student.libraryNOCStatus,
          nocDate: student.libraryNOCDate,
          nocIssuedBy: student.libraryNOCIssuedBy,
          pendingBooks: student.pendingBooks || [],
          ...remainingFees,
        },
      });
    } catch (error) {
      console.error("Library fee payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Check library status - accepts both studentId and universityRegNumber
router.get("/library-status/:studentId", async (req: any, res: any) => {
  try {
    const { studentId } = req.params;

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      console.log("📚 Mock library status check (MongoDB not connected)");
      // Try to find by studentId or universityRegNumber
      const student = mockStudents.find(
        (s) => s.studentId === studentId || s.universityRegNumber === studentId
      );
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Return comprehensive library status with pending books
      return res.json({
        studentId: student.studentId,
        universityRegNumber: student.universityRegNumber,
        libraryCleared: student.libraryCleared || false,
        pendingBooks: student.pendingBooks || [],
        totalLateFee: student.pendingBooks
          ? student.pendingBooks.reduce(
              (sum: number, book: any) => sum + (book.lateFee || 0),
              0
            )
          : 0,
        nocStatus: student.libraryNOCStatus || "not_issued",
        nocDate: student.libraryNOCDate,
        requiresLibraryClearance:
          !student.libraryCleared && student.pendingBooks?.length > 0,
      });
    }

    // Try to find student in MongoDB by either studentId or universityRegNumber
    const student = await Student.findOne({
      $or: [{ studentId }, { universityRegNumber: studentId }],
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const pendingBooks = student.pendingBooks || [];
    const totalLateFee = pendingBooks.reduce(
      (sum: number, book: any) => sum + (book.lateFee || 0),
      0
    );

    res.json({
      studentId: student.studentId,
      universityRegNumber: student.universityRegNumber,
      libraryCleared: student.libraryCleared || false,
      pendingBooks: pendingBooks,
      totalLateFee,
      nocStatus: student.libraryNOCStatus || "not_issued",
      nocDate: student.libraryNOCDate,
      requiresLibraryClearance:
        !student.libraryCleared && pendingBooks.length > 0,
    });
  } catch (error) {
    console.error("Library status check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
