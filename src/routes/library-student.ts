import express from "express";
import { auth } from "../middleware/auth";
import Student from "../models/Student";
import BookTransaction from "../models/BookTransaction";
import Book from "../models/Book";

const router = express.Router();

// Get current student's library information
router.get("/my-info", auth, async (req: any, res: any) => {
  try {
    // Get student from auth token
    const userId = req.user.userId || req.user.id;
    
    // Find student by user ID from token
    const student = await Student.findById(userId);
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get all transactions for this student
    const transactions = await BookTransaction.find({
      studentId: student.studentId,
    }).sort({ createdAt: -1 });

    // Get active transactions with book details
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
        studentId: student.studentId,
        libraryId: student.libraryId,
        universityRegNumber: student.universityRegNumber,
        course: student.course,
      },
      booksWithDetails,
      totalUnpaidFines,
      totalCurrentFines,
      totalFines: totalUnpaidFines + totalCurrentFines,
      activeBookCount: activeTransactions.length,
      totalTransactionsCount: transactions.length,
    });
  } catch (error) {
    console.error("Get my library info error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student borrow book (simplified - uses auth token)
router.post("/borrow-book/:bookId", auth, async (req: any, res: any) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.userId || req.user.id;
    
    // Find the authenticated student
    const student = await Student.findById(userId);
    if (!student) {
      return res.status(404).json({ error: "Student record not found" });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return res.status(400).json({ 
        error: "This book is currently out of stock. Please try again later." 
      });
    }

    // Check if student has overdue books
    const overdueBooks = await BookTransaction.find({
      studentId: student.studentId,
      status: "overdue",
    });

    if (overdueBooks.length > 0) {
      return res.status(400).json({
        error: "You have overdue books. Please return them before borrowing new ones.",
        overdueCount: overdueBooks.length,
      });
    }

    // Check for unpaid fines
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
        error: `You have unpaid fines of ₹${totalFines}. Please clear them before borrowing new books.`,
        totalFines,
      });
    }

    // Calculate due date (default: book's max borrow days or 30 days)
    const daysToAdd = book.maxBorrowDays || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    // Create borrow transaction
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

    res.json({
      message: "Book borrowed successfully!",
      transaction: {
        id: transaction._id,
        bookId: book.bookId,
        bookTitle: book.title,
        author: book.author,
        borrowDate: transaction.borrowDate,
        dueDate: transaction.dueDate,
        maxBorrowDays: daysToAdd,
      },
      book: {
        title: book.title,
        author: book.author,
        availableCopies: book.availableCopies,
      },
    });
  } catch (error) {
    console.error("Borrow book error:", error);
    res.status(500).json({ error: "Failed to borrow book. Please try again." });
  }
});

export default router;





