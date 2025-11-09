import express from "express";
import { body, validationResult, query } from "express-validator";
import Book from "../models/Book";
import BookTransaction from "../models/BookTransaction";
import Student from "../models/Student";
import { auth, requireRole } from "../middleware/auth";
import { sendEmail } from "../utils/email";

const router = express.Router();

// DEBUGGING: Simple test route to verify server is loading new code
router.get("/debug-test", (_req: any, res: any) => {
  res.json({
    message: "DEBUG: New code is loaded!",
    timestamp: new Date(),
    route: "/api/library/debug-test",
  });
});
console.log("🚨 DEBUG: Library routes file loaded with debug endpoint");

// Middleware to ensure library admin role
const requireLibraryAdmin = requireRole(["admin", "library_admin"]);

// NOC System Integration: Check if student needs library NOC for registration
router.get(
  "/noc/check/:universityRegNumber",
  auth,
  async (req: any, res: any) => {
    try {
      const { universityRegNumber } = req.params;

      const student = await Student.findOne({ universityRegNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get active/overdue transactions
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

      const totalUnpaidFines = unpaidFines.reduce(
        (sum, tx) => sum + tx.fineAmount,
        0
      );
      const totalBookCost =
        student.pendingBooks?.reduce((sum, book) => {
          if (book.status === "lost") {
            // Find the actual book to get replacement cost
            return sum + 500; // Default book cost, would be fetched from actual book
          }
          return sum;
        }, 0) || 0;

      const nocStatus = {
        canGetNOC: activeTransactions.length === 0 && totalUnpaidFines === 0,
        pendingBooks: activeTransactions.length,
        pendingFines: totalUnpaidFines,
        lostBooksCost: totalBookCost,
        totalAmount: totalUnpaidFines + totalBookCost,
        libraryNOCStatus: student.libraryNOCStatus || "pending",
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

      res.json(nocStatus);
    } catch (error) {
      console.error("NOC check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Generate NOC for student (after clearance)
router.post(
  "/noc/generate",
  auth,
  requireLibraryAdmin,
  [
    body("universityRegNumber")
      .trim()
      .notEmpty()
      .withMessage("University registration number required"),
    body("clearanceType")
      .isIn(["full_clearance", "conditional"])
      .withMessage("Valid clearance type required"),
    body("notes").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { universityRegNumber, clearanceType, notes } = req.body;

      const student = await Student.findOne({ universityRegNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Update student's NOC status
      student.libraryNOCStatus = "approved";
      student.libraryNOCDate = new Date();
      student.libraryNOCIssuedBy = req.user.userId;
      student.libraryCleared = true;

      await student.save();

      // Send NOC email
      await sendEmail({
        to: student.email,
        subject: "Library No Objection Certificate (NOC) - GCET",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Library No Objection Certificate</h2>
          <hr style="border: 1px solid #e5e7eb;">
          
          <p><strong>Student Name:</strong> ${student.name}</p>
          <p><strong>University Reg. No:</strong> ${
            student.universityRegNumber
          }</p>
          <p><strong>Course:</strong> ${student.course?.name || "N/A"}</p>
          <p><strong>NOC Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Clearance Type:</strong> ${
            clearanceType === "full_clearance"
              ? "Full Clearance"
              : "Conditional"
          }</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Certification:</strong></p>
            <p style="margin: 5px 0;">This is to certify that the above-mentioned student has cleared all library obligations and is eligible for registration/graduation procedures.</p>
          </div>
          
          <p style="margin-top: 30px;"><strong>Issued by:</strong><br>
          Library Administration<br>
          Government College of Engineering and Technology (GCET)</p>
          
          <hr style="border: 1px solid #e5e7eb; margin-top: 30px;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automatically generated certificate. For queries, contact the library administration.
          </p>
        </div>
      `,
      });

      res.json({
        message: "NOC generated successfully",
        nocDetails: {
          studentName: student.name,
          universityRegNumber: student.universityRegNumber,
          issueDate: student.libraryNOCDate,
          clearanceType,
          issuedBy: req.user.userId,
        },
      });
    } catch (error) {
      console.error("Generate NOC error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get books by department and sub-blocks
router.get(
  "/books/department/:department",
  auth,
  [
    query("subBlock").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: any, res: any) => {
    try {
      const { department } = req.params;
      const { subBlock, page = 1, limit = 20 } = req.query;

      const filter: any = { department: department.toUpperCase() };
      if (subBlock) {
        filter.subBlock = { $regex: subBlock, $options: "i" };
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const books = await Book.find(filter)
        .sort({ subBlock: 1, title: 1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await Book.countDocuments(filter);

      // Get sub-block summary
      const subBlockSummary = await Book.aggregate([
        { $match: { department: department.toUpperCase() } },
        {
          $group: {
            _id: "$subBlock",
            totalBooks: { $sum: "$totalCopies" },
            availableBooks: { $sum: "$availableCopies" },
            bookCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        department,
        books,
        subBlockSummary,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Get department books error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Add New Book (Enhanced with department organization)
router.post(
  "/books",
  auth,
  requireLibraryAdmin,
  [
    body("title")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Title must be at least 2 characters"),
    body("author")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Author must be at least 2 characters"),
    body("isbn").isLength({ min: 10 }).withMessage("Valid ISBN required"),
    body("category")
      .isIn([
        "fiction",
        "non-fiction",
        "academic",
        "reference",
        "magazine",
        "journal",
      ])
      .withMessage("Valid category required"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("department")
      .isIn(["CSE", "EEE", "CIVIL", "MECH", "ECE", "GENERAL"])
      .withMessage("Valid department required"),
    body("subBlock").trim().notEmpty().withMessage("Sub-block is required"),
    body("academicLevel")
      .isIn(["undergraduate", "postgraduate", "reference", "general"])
      .withMessage("Valid academic level required"),
    body("semester").isArray().withMessage("Semester array required"),
    body("price").isFloat({ min: 0 }).withMessage("Valid price required"),
    body("dailyFine").optional().isFloat({ min: 0 }),
    body("maxBorrowDays").optional().isInt({ min: 1 }),
    body("collectionName").optional().isString(),
    body("publisher").trim().notEmpty().withMessage("Publisher is required"),
    body("publicationYear")
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage("Valid publication year required"),
    body("pages").isInt({ min: 1 }).withMessage("Valid page count required"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("totalCopies")
      .isInt({ min: 1 })
      .withMessage("At least 1 copy required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("shelfNumber")
      .trim()
      .notEmpty()
      .withMessage("Shelf number is required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      console.log("🔍 Debug - req.user:", req.user);
      console.log("🔍 Debug - req.user.userId:", req.user?.userId);
      console.log("🔍 Debug - req.body:", req.body);

      const bookData = {
        ...req.body,
        replacementCost: req.body.replacementCost || req.body.price * 1.5,
        dailyFine: req.body.dailyFine || 10, // Default 10 INR per day
        maxBorrowDays: req.body.maxBorrowDays || 30,
        availableCopies: req.body.totalCopies,
        addedBy: req.user?.userId || "system", // Now userId should be available
        tags: req.body.tags || [],
      };

      // Check if book with same ISBN already exists
      const existingBook = await Book.findOne({ isbn: bookData.isbn });
      if (existingBook) {
        return res
          .status(400)
          .json({ error: "Book with this ISBN already exists" });
      }

      const book = new Book(bookData);
      await book.save();

      res.status(201).json({
        message: "Book added successfully",
        book,
      });
    } catch (error) {
      console.error("Add book error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update Book (PUT endpoint)
router.put(
  "/books/:id",
  auth,
  requireLibraryAdmin,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Title must be at least 2 characters"),
    body("author")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Author must be at least 2 characters"),
    body("isbn")
      .optional()
      .isLength({ min: 10 })
      .withMessage("Valid ISBN required"),
    body("category")
      .optional()
      .isIn([
        "fiction",
        "non-fiction",
        "academic",
        "reference",
        "magazine",
        "journal",
      ])
      .withMessage("Valid category required"),
    body("subject")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Subject is required"),
    body("department")
      .optional()
      .isIn(["CSE", "EEE", "CIVIL", "MECH", "ECE", "GENERAL"])
      .withMessage("Valid department required"),
    body("subBlock")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Sub-block is required"),
    body("academicLevel")
      .optional()
      .isIn(["undergraduate", "postgraduate", "reference", "general"])
      .withMessage("Valid academic level required"),
    body("semester")
      .optional()
      .isArray()
      .withMessage("Semester array required"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid price required"),
    body("dailyFine").optional().isFloat({ min: 0 }),
    body("maxBorrowDays").optional().isInt({ min: 1 }),
    body("publisher")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Publisher is required"),
    body("publicationYear")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage("Valid publication year required"),
    body("pages")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Valid page count required"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("totalCopies")
      .optional()
      .isInt({ min: 1 })
      .withMessage("At least 1 copy required"),
    body("location")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Location is required"),
    body("shelfNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Shelf number is required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Update validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      console.log("🔍 Updating book ID:", id);
      console.log("🔍 Update data:", req.body);

      // Check if book exists
      const existingBook = await Book.findById(id);
      if (!existingBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      // If ISBN is being updated, check for duplicates
      if (req.body.isbn && req.body.isbn !== existingBook.isbn) {
        const duplicateBook = await Book.findOne({ isbn: req.body.isbn });
        if (duplicateBook) {
          return res
            .status(400)
            .json({ error: "Book with this ISBN already exists" });
        }
      }

      const updateData = {
        ...req.body,
        lastUpdatedBy: req.user?.userId || req.user?.id || "system",
        updatedAt: new Date(),
      };

      // Update available copies if total copies changed
      if (
        req.body.totalCopies &&
        req.body.totalCopies !== existingBook.totalCopies
      ) {
        const borrowedCopies =
          existingBook.totalCopies - existingBook.availableCopies;
        updateData.availableCopies = Math.max(
          0,
          req.body.totalCopies - borrowedCopies
        );
      }

      const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      console.log("✅ Book updated successfully:", updatedBook?.title);

      res.json({
        message: "Book updated successfully",
        book: updatedBook,
      });
    } catch (error) {
      console.error("Update book error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete Book (DELETE endpoint)
router.delete(
  "/books/:id",
  auth,
  requireLibraryAdmin,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      console.log("🔍 Deleting book ID:", id);

      // Check if book exists
      const existingBook = await Book.findById(id);
      if (!existingBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Check if book has any active transactions (borrowed books)
      const activeBorrows =
        existingBook.totalCopies - existingBook.availableCopies;
      if (activeBorrows > 0) {
        return res.status(400).json({
          error: "Cannot delete book with active borrowings",
          details: `${activeBorrows} copies are currently borrowed`,
        });
      }

      // Delete the book
      await Book.findByIdAndDelete(id);

      console.log("✅ Book deleted successfully:", existingBook.title);

      res.json({
        message: "Book deleted successfully",
        deletedBook: {
          id: existingBook._id,
          title: existingBook.title,
          author: existingBook.author,
        },
      });
    } catch (error) {
      console.error("Delete book error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Test endpoint to verify server is updated
router.get("/test-outstanding", async (_req: any, res: any) => {
  res.json({
    message: "Outstanding books endpoint is working!",
    timestamp: new Date(),
  });
});

// Outstanding Books (GET endpoint) - Fetches from database
console.log("🔧 Registering /outstanding-books route");
router.get("/outstanding-books", async (req: any, res: any) => {
  try {
    console.log("🔍 Outstanding books endpoint hit!");

    const {
      search,
      status,
      sortBy = "dueDate",
      page = 1,
      limit = 50,
    } = req.query;

    console.log("📊 Fetching outstanding books from database with filters:", {
      search,
      status,
      sortBy,
      page,
      limit,
    });

    // Get all active and overdue book transactions
    const transactionFilter: any = {
      status: { $in: ["active", "overdue"] },
    };

    if (status && status !== "all") {
      transactionFilter.status = status;
    }

    // Get transactions with pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const transactions = await BookTransaction.find(transactionFilter)
      .sort({ dueDate: sortBy === "dueDate" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    console.log(`📚 Found ${transactions.length} transactions`);

    // Fetch book and student details for each transaction
    const outstandingBooks = await Promise.all(
      transactions.map(async (transaction) => {
        // Get book details
        const book = await Book.findOne({ bookId: transaction.bookId });

        // Get student details
        const student = await Student.findOne({
          studentId: transaction.studentId,
        });

        // Calculate days overdue and fine
        const today = new Date();
        const dueDate = new Date(transaction.dueDate);
        const daysOverdue =
          transaction.status === "overdue"
            ? Math.ceil(
                (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0;

        const dailyFine = book?.dailyFine || 10;
        const fineAmount = daysOverdue > 0 ? daysOverdue * dailyFine : 0;

        // Build result object
        return {
          _id: transaction._id,
          bookId: transaction.bookId,
          bookTitle: book?.title || "Unknown Book",
          bookAuthor: book?.author || "Unknown Author",
          isbn: book?.isbn || "N/A",
          studentId: transaction.studentId,
          studentName: student?.name || "Unknown Student",
          universityRegNumber: student?.universityRegNumber || "N/A",
          email: student?.email || "N/A",
          phone: student?.phone || "",
          course: student?.course?.name || "N/A",
          currentSemester: student?.currentSemester || 0,
          borrowDate: transaction.borrowDate,
          dueDate: transaction.dueDate,
          status: transaction.status,
          daysOverdue,
          fineAmount,
          dailyFine,
        };
      })
    );

    // Apply search filter if provided
    let filteredBooks = outstandingBooks;
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      filteredBooks = outstandingBooks.filter(
        (book) =>
          book.bookTitle.toLowerCase().includes(searchLower) ||
          book.studentName.toLowerCase().includes(searchLower) ||
          book.universityRegNumber.toLowerCase().includes(searchLower) ||
          book.isbn.toLowerCase().includes(searchLower)
      );
    }

    // Calculate summary
    const overdueCount = filteredBooks.filter(
      (b) => b.status === "overdue"
    ).length;
    const totalFines = filteredBooks.reduce(
      (sum, book) => sum + book.fineAmount,
      0
    );

    // Get total count for pagination
    const totalCount = await BookTransaction.countDocuments(transactionFilter);

    const response = {
      books: filteredBooks,
      pagination: {
        current: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string)),
      },
      summary: {
        totalOutstanding: totalCount,
        overdue: overdueCount,
        totalFines,
        active: totalCount - overdueCount,
      },
    };

    console.log("✅ Returning real outstanding books data from database:", {
      count: filteredBooks.length,
      overdue: overdueCount,
      totalFines,
    });

    res.json(response);
  } catch (error) {
    console.error("❌ Outstanding books error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Collection Management Routes
router.get("/collections", auth, async (_req: any, res: any) => {
  try {
    const collections = await Book.aggregate([
      {
        $group: {
          _id: {
            department: "$department",
            collectionName: "$collectionName",
          },
          totalBooks: { $sum: "$totalCopies" },
          availableBooks: { $sum: "$availableCopies" },
          uniqueTitles: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      {
        $group: {
          _id: "$_id.department",
          collections: {
            $push: {
              name: "$_id.collectionName",
              totalBooks: "$totalBooks",
              availableBooks: "$availableBooks",
              uniqueTitles: "$uniqueTitles",
              avgPrice: "$avgPrice",
            },
          },
          departmentTotal: { $sum: "$totalBooks" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ collections });
  } catch (error) {
    console.error("Get collections error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create New Collection
router.post(
  "/collections",
  auth,
  requireLibraryAdmin,
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Collection name required"),
    body("department")
      .isIn(["CSE", "EEE", "CIVIL", "MECH", "ECE", "GENERAL"])
      .withMessage("Valid department required"),
    body("subBlock").trim().notEmpty().withMessage("Sub-block required"),
    body("description").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, department, subBlock, description } = req.body;

      // Check if collection already exists
      const existingCollection = await Book.findOne({
        collectionName: name,
        department,
      });

      if (existingCollection) {
        return res
          .status(400)
          .json({ error: "Collection already exists in this department" });
      }

      res.json({
        message: "Collection template created successfully",
        collection: {
          name,
          department,
          subBlock,
          description,
          note: "Add books to this collection using the book creation endpoint",
        },
      });
    } catch (error) {
      console.error("Create collection error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced Book Search with department filtering
router.get(
  "/books",
  auth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("subject").optional().isString(),
    query("department").optional().isString(),
    query("subBlock").optional().isString(),
    query("academicLevel").optional().isString(),
    query("semester").optional().isInt({ min: 1, max: 8 }),
    query("collectionName").optional().isString(),
    query("status")
      .optional()
      .isIn(["available", "borrowed", "reserved", "maintenance"]),
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
        category,
        subject,
        department,
        subBlock,
        academicLevel,
        semester,
        collectionName,
        status,
        search,
      } = req.query;

      // Build filter
      const filter: any = {};
      if (category) filter.category = category;
      if (subject) filter.subject = { $regex: subject, $options: "i" };
      if (department) filter.department = department.toString().toUpperCase();
      if (subBlock) filter.subBlock = { $regex: subBlock, $options: "i" };
      if (academicLevel) filter.academicLevel = academicLevel;
      if (semester) filter.semester = { $in: [parseInt(semester as string)] };
      if (collectionName)
        filter.collectionName = { $regex: collectionName, $options: "i" };
      if (status) filter.status = status;

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get books with pagination
      const books = await Book.find(filter)
        .sort({ department: 1, subBlock: 1, title: 1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      // Get total count
      const total = await Book.countDocuments(filter);

      res.json({
        books,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced Student Library Management
router.get(
  "/students",
  auth,
  requireLibraryAdmin,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("department").optional().isString(),
    query("hasOverdueBooks").optional().isBoolean(),
    query("hasPendingFines").optional().isBoolean(),
    query("nocStatus").optional().isIn(["pending", "approved", "rejected"]),
    query("search").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const {
        page = 1,
        limit = 20,
        department,
        hasOverdueBooks,
        hasPendingFines,
        nocStatus,
        search,
      } = req.query;

      const filter: any = {};
      if (department)
        filter["course.code"] = { $regex: department, $options: "i" };
      if (nocStatus) filter.libraryNOCStatus = nocStatus;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { universityRegNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      let students: any = await Student.find(filter)
        .select(
          "name universityRegNumber email course currentSemester libraryNOCStatus pendingBooks libraryCleared"
        )
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      // Filter by overdue books and pending fines if requested
      if (hasOverdueBooks === "true" || hasPendingFines === "true") {
        const studentsWithDetails = await Promise.all(
          students.map(async (student: any) => {
            const overdueTransactions = await BookTransaction.find({
              studentId: student.studentId,
              status: "overdue",
            });

            const unpaidFines = await BookTransaction.find({
              studentId: student.studentId,
              fineAmount: { $gt: 0 },
              finePaid: false,
            });

            const hasOverdue = overdueTransactions.length > 0;
            const hasFines = unpaidFines.length > 0;

            return {
              ...student.toObject(),
              overdueBooks: overdueTransactions.length,
              pendingFines: unpaidFines.reduce(
                (sum, tx) => sum + tx.fineAmount,
                0
              ),
              hasOverdueBooks: hasOverdue,
              hasPendingFines: hasFines,
            };
          })
        );

        students = studentsWithDetails.filter((student: any) => {
          if (hasOverdueBooks === "true" && !student.hasOverdueBooks)
            return false;
          if (hasPendingFines === "true" && !student.hasPendingFines)
            return false;
          return true;
        });
      }

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

// Get detailed student library record
router.get(
  "/students/:universityRegNumber/details",
  auth,
  async (req: any, res: any) => {
    try {
      const { universityRegNumber } = req.params;

      const student = await Student.findOne({ universityRegNumber });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get all transactions
      const transactions = await BookTransaction.find({
        studentId: student.studentId,
      }).sort({ createdAt: -1 });

      // Get books for active transactions
      const activeTransactions = transactions.filter((tx) =>
        ["active", "overdue"].includes(tx.status)
      );
      const booksWithDetails = await Promise.all(
        activeTransactions.map(async (tx) => {
          const book = await Book.findOne({ bookId: tx.bookId });
          const daysOverdue =
            tx.status === "overdue"
              ? Math.ceil(
                  (new Date().getTime() - new Date(tx.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;
          const currentFine =
            daysOverdue > 0 ? daysOverdue * (book?.dailyFine || 10) : 0;

          return {
            transaction: tx,
            book,
            daysOverdue,
            currentFine,
          };
        })
      );

      // Calculate totals
      const totalUnpaidFines = transactions
        .filter((tx) => !tx.finePaid && tx.fineAmount > 0)
        .reduce((sum, tx) => sum + tx.fineAmount, 0);

      const totalCurrentFines = booksWithDetails.reduce(
        (sum, item) => sum + item.currentFine,
        0
      );

      res.json({
        student: {
          name: student.name,
          universityRegNumber: student.universityRegNumber,
          email: student.email,
          course: student.course,
          libraryId: student.libraryId,
          libraryNOCStatus: student.libraryNOCStatus,
          libraryCleared: student.libraryCleared,
        },
        libraryRecord: {
          activeBooks: booksWithDetails,
          allTransactions: transactions,
          summary: {
            totalBooksIssued: transactions.filter((tx) => tx.type === "borrow")
              .length,
            currentlyBorrowed: activeTransactions.length,
            overdueBooks: booksWithDetails.filter(
              (item) => item.daysOverdue > 0
            ).length,
            totalUnpaidFines: totalUnpaidFines,
            totalCurrentFines: totalCurrentFines,
            grandTotalFines: totalUnpaidFines + totalCurrentFines,
          },
        },
      });
    } catch (error) {
      console.error("Get student details error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced Borrow Book with department-specific rules
router.post(
  "/books/:id/borrow",
  auth,
  [
    body("studentId").trim().notEmpty().withMessage("Student ID is required"),
    body("borrowDays").optional().isInt({ min: 1, max: 90 }),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studentId, borrowDays } = req.body;
      const bookId = req.params["id"];

      // Find book
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      // Check if book is available
      if (book.availableCopies <= 0) {
        return res
          .status(400)
          .json({ error: "Book is not available for borrowing" });
      }

      // Find student
      const student = await Student.findOne({ studentId });
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Check if student has overdue books
      const overdueBooks = await BookTransaction.find({
        studentId: student.studentId,
        status: "overdue",
      });

      if (overdueBooks.length > 0) {
        return res.status(400).json({
          error: "Student has overdue books. Please return them first.",
          overdueCount: overdueBooks.length,
        });
      }

      // Check unpaid fines
      const unpaidFines = await BookTransaction.find({
        studentId: student.studentId,
        fineAmount: { $gt: 0 },
        finePaid: false,
      });

      if (unpaidFines.length > 0) {
        const totalFines = unpaidFines.reduce(
          (sum, tx) => sum + tx.fineAmount,
          0
        );
        return res.status(400).json({
          error: "Student has unpaid fines. Please clear them first.",
          totalFines,
        });
      }

      // Calculate due date
      const daysToAdd = borrowDays || book.maxBorrowDays || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      // Create transaction
      const transaction = new BookTransaction({
        bookId: book.bookId,
        studentId: student.studentId,
        type: "borrow",
        borrowDate: new Date(),
        dueDate: dueDate,
        status: "active",
      });

      await transaction.save();

      // Update book availability
      book.availableCopies -= 1;
      if (book.availableCopies === 0) {
        book.status = "borrowed";
      }
      await book.save();

      // Update student's pending books
      const pendingBook = {
        bookId: book.bookId,
        bookTitle: book.title,
        issueDate: new Date(),
        dueDate: dueDate,
        lateFee: 0,
        status: "issued" as const,
      };

      if (!student.pendingBooks) {
        student.pendingBooks = [];
      }
      student.pendingBooks.push(pendingBook);
      student.libraryCleared = false;
      await student.save();

      // Send confirmation email
      await sendEmail({
        to: student.email,
        subject: "Book Borrowed Successfully - GCET Library",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Book Borrowed Successfully</h2>
          <p>Dear ${student.name},</p>
          <p>You have successfully borrowed the following book:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Title:</strong> ${book.title}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Department:</strong> ${book.department}</p>
            <p><strong>Borrow Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
            <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>⚠️ Important Reminder:</strong></p>
            <p>• Please return the book on or before the due date</p>
            <p>• Late return fine: ₹${book.dailyFine}/day after due date</p>
            <p>• Book replacement cost: ₹${
              book.replacementCost
            } (if lost/damaged)</p>
          </div>
          
          <p>Best regards,<br>GCET Library Team</p>
        </div>
      `,
      });

      res.json({
        message: "Book borrowed successfully",
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId,
          bookTitle: book.title,
          studentName: student.name,
          borrowDate: transaction.borrowDate,
          dueDate: transaction.dueDate,
          dailyFine: book.dailyFine,
        },
      });
    } catch (error) {
      console.error("Borrow book error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced Return Book with proper fine calculation
router.post(
  "/books/:id/return",
  auth,
  [
    body("studentId").trim().notEmpty().withMessage("Student ID is required"),
    body("condition").optional().isIn(["good", "damaged", "lost"]),
    body("notes").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studentId, condition = "good", notes } = req.body;
      const bookId = req.params["id"];

      // Find active transaction
      const transaction = await BookTransaction.findOne({
        bookId,
        studentId,
        status: { $in: ["active", "overdue"] },
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ error: "Active borrowing transaction not found" });
      }

      // Find book and student
      const book = await Book.findOne({ bookId });
      const student = await Student.findOne({ studentId });

      if (!book || !student) {
        return res.status(404).json({ error: "Book or student not found" });
      }

      // Calculate fine if overdue
      const today = new Date();
      const dueDate = new Date(transaction.dueDate);
      let fineAmount = 0;
      let replacementCost = 0;

      if (today > dueDate) {
        const daysOverdue = Math.ceil(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        fineAmount = daysOverdue * book.dailyFine; // Use book's daily fine (default 10 INR)
      }

      if (condition === "lost" || condition === "damaged") {
        replacementCost = book.replacementCost;
      }

      const totalAmount = fineAmount + replacementCost;

      // Update transaction
      transaction.status = "returned";
      transaction.returnDate = today;
      transaction.fineAmount = totalAmount;
      transaction.notes = notes || `Book condition: ${condition}`;
      await transaction.save();

      // Update book availability (only if not lost)
      if (condition !== "lost") {
        book.availableCopies += 1;
        if (book.availableCopies > 0 && book.status === "borrowed") {
          book.status = "available";
        }
        await book.save();
      }

      // Update student's pending books
      if (student.pendingBooks) {
        student.pendingBooks = student.pendingBooks.filter(
          (pb) => pb.bookId !== book.bookId
        );
        if (student.pendingBooks.length === 0) {
          student.libraryCleared = totalAmount === 0; // Only cleared if no fines
        }
        await student.save();
      }

      // Send return confirmation email
      await sendEmail({
        to: student.email,
        subject: "Book Return Confirmation - GCET Library",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Book Return Confirmation</h2>
          <p>Dear ${student.name},</p>
          <p>You have successfully returned the following book:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Title:</strong> ${book.title}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Return Date:</strong> ${today.toLocaleDateString()}</p>
            <p><strong>Book Condition:</strong> ${condition}</p>
            <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          </div>
          
          ${
            totalAmount > 0
              ? `
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Payment Details:</strong></p>
            ${fineAmount > 0 ? `<p>• Late Return Fine: ₹${fineAmount}</p>` : ""}
            ${
              replacementCost > 0
                ? `<p>• Replacement Cost: ₹${replacementCost}</p>`
                : ""
            }
            <p><strong>Total Amount Due: ₹${totalAmount}</strong></p>
            <p>Please pay this amount at the library counter to complete the return process.</p>
          </div>
          `
              : `
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="color: #065f46;"><strong>✅ No dues pending - Return completed successfully!</strong></p>
          </div>
          `
          }
          
          <p>Best regards,<br>GCET Library Team</p>
        </div>
      `,
      });

      res.json({
        message: "Book returned successfully",
        returnDetails: {
          transactionId: transaction.transactionId,
          returnDate: transaction.returnDate,
          condition,
          fineAmount,
          replacementCost,
          totalAmount,
          paymentRequired: totalAmount > 0,
        },
      });
    } catch (error) {
      console.error("Return book error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Pay All Outstanding Fines for a Student (Simplified for librarian use)
router.post(
  "/fines/pay",
  auth,
  [
    body("studentId").optional().trim().notEmpty(),
    body("amount").isFloat({ min: 0 }).withMessage("Valid amount required"),
    body("paymentMethod")
      .optional()
      .isIn(["cash", "card", "upi", "online"])
      .withMessage("Valid payment mode required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studentId, amount, paymentMethod = "cash" } = req.body;

      // Find all unpaid fines for the student
      const unpaidTransactions = await BookTransaction.find({
        studentId,
        fineAmount: { $gt: 0 },
        finePaid: false,
      });

      if (unpaidTransactions.length === 0) {
        return res.status(404).json({ error: "No unpaid fines found" });
      }

      const totalFines = unpaidTransactions.reduce(
        (sum, tx) => sum + tx.fineAmount,
        0
      );

      if (Math.abs(amount - totalFines) > 0.01) {
        return res.status(400).json({
          error: "Payment amount does not match total outstanding fines",
          expected: totalFines,
          provided: amount,
        });
      }

      // Mark all transactions as paid
      const updatePromises = unpaidTransactions.map((tx) => {
        tx.finePaid = true;
        tx.finePaymentDate = new Date();
        tx.paymentMode = paymentMethod;
        return tx.save();
      });

      await Promise.all(updatePromises);

      // Update student's pending books to clear late fees
      const student = await Student.findOne({ studentId });
      if (student && student.pendingBooks) {
        student.pendingBooks = student.pendingBooks.map((book: any) => ({
          ...book,
          lateFee: 0,
        }));
        await student.save();
      }

      res.json({
        message: "All fines paid successfully",
        paidAmount: amount,
        transactionCount: unpaidTransactions.length,
        receiptNumber: `FINE-${Date.now()}`,
      });
    } catch (error) {
      console.error("Pay fines error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Pay Fine (Individual Transaction - Old endpoint kept for compatibility)
router.post(
  "/fines/pay-transaction",
  auth,
  [
    body("transactionId")
      .trim()
      .notEmpty()
      .withMessage("Transaction ID is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Valid amount required"),
    body("paymentMode")
      .isIn(["cash", "card", "upi", "online"])
      .withMessage("Valid payment mode required"),
    body("receiptNumber").optional().isString(),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { transactionId, amount, paymentMode, receiptNumber } = req.body;

      const transaction = await BookTransaction.findOne({ transactionId });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.finePaid) {
        return res.status(400).json({ error: "Fine already paid" });
      }

      if (amount !== transaction.fineAmount) {
        return res.status(400).json({
          error: "Payment amount does not match fine amount",
          expected: transaction.fineAmount,
          provided: amount,
        });
      }

      // Update transaction
      transaction.finePaid = true;
      transaction.notes =
        (transaction.notes || "") +
        `\nPayment: ₹${amount} via ${paymentMode}. Receipt: ${
          receiptNumber || "N/A"
        }`;
      await transaction.save();

      // Update student's library clearance status
      const student = await Student.findOne({
        studentId: transaction.studentId,
      });
      if (student) {
        const unpaidFines = await BookTransaction.find({
          studentId: student.studentId,
          fineAmount: { $gt: 0 },
          finePaid: false,
        });

        const activeBooks = await BookTransaction.find({
          studentId: student.studentId,
          status: { $in: ["active", "overdue"] },
        });

        if (unpaidFines.length === 0 && activeBooks.length === 0) {
          student.libraryCleared = true;
        }
        await student.save();
      }

      res.json({
        message: "Fine paid successfully",
        payment: {
          transactionId,
          amount,
          paymentMode,
          receiptNumber,
          paidAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Pay fine error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Enhanced Library Dashboard with department-wise statistics
router.get(
  "/dashboard-stats",
  auth,
  requireLibraryAdmin,
  async (_req: any, res: any) => {
    try {
      // Basic counts
      const totalBooks = await Book.countDocuments();
      const availableBooks = await Book.countDocuments({ status: "available" });
      const borrowedBooks = await Book.countDocuments({ status: "borrowed" });
      const totalTransactions = await BookTransaction.countDocuments();

      // Department-wise statistics
      const departmentStats = await Book.aggregate([
        {
          $group: {
            _id: "$department",
            totalBooks: { $sum: "$totalCopies" },
            availableBooks: { $sum: "$availableCopies" },
            uniqueTitles: { $sum: 1 },
            collections: { $addToSet: "$collectionName" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Update overdue status
      await BookTransaction.updateMany(
        { status: "active", dueDate: { $lt: new Date() } },
        { status: "overdue" }
      );

      const recentOverdue = await BookTransaction.find({ status: "overdue" })
        .sort({ dueDate: 1 })
        .limit(10);

      // Fine statistics
      const fineStats = await BookTransaction.aggregate([
        {
          $match: { fineAmount: { $gt: 0 } },
        },
        {
          $group: {
            _id: null,
            totalFines: { $sum: "$fineAmount" },
            collectedFines: {
              $sum: { $cond: ["$finePaid", "$fineAmount", 0] },
            },
            pendingFines: { $sum: { $cond: ["$finePaid", 0, "$fineAmount"] } },
          },
        },
      ]);

      // NOC statistics
      const nocStats = await Student.aggregate([
        {
          $group: {
            _id: "$libraryNOCStatus",
            count: { $sum: 1 },
          },
        },
      ]);

      const stats = {
        overview: {
          totalBooks,
          availableBooks,
          borrowedBooks,
          totalTransactions,
          overdueBooks: recentOverdue.length,
        },
        departments: departmentStats,
        fines: fineStats[0] || {
          totalFines: 0,
          collectedFines: 0,
          pendingFines: 0,
        },
        noc: nocStats.reduce((acc, stat) => {
          acc[stat._id || "unknown"] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        recentOverdue,
      };

      res.json(stats);
    } catch (error) {
      console.error("Library dashboard stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
