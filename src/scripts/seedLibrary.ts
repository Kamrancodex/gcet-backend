import mongoose from "mongoose";
import Book from "../models/Book";
import BookTransaction from "../models/BookTransaction";
import Student from "../models/Student";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env["MONGODB_URI"] ||
  "mongodb+srv://mickeym4044:e2ngduK5G9y8EWkJ@cluster0gcet.6ssgum8.mongodb.net/gcet_db";

// Comprehensive library books organized by department and sub-blocks
const libraryBooks = [
  // CSE Department Books
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    isbn: "978-0262033848",
    category: "academic",
    subject: "Computer Science",
    department: "CSE",
    subBlock: "Algorithms",
    academicLevel: "undergraduate",
    semester: [3, 4, 5],
    publisher: "MIT Press",
    publicationYear: 2009,
    edition: "3rd",
    pages: 1292,
    description:
      "Comprehensive textbook covering algorithm design and analysis",
    totalCopies: 15,
    availableCopies: 12,
    location: "CSE Library - Block A",
    shelfNumber: "CSE-ALG-001",
    price: 2500,
    replacementCost: 3750,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Algorithm Fundamentals",
    tags: ["algorithms", "data-structures", "computer-science"],
    addedBy: "library_admin",
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth",
    isbn: "978-0073523323",
    category: "academic",
    subject: "Database Management",
    department: "CSE",
    subBlock: "Database",
    academicLevel: "undergraduate",
    semester: [4, 5],
    publisher: "McGraw-Hill",
    publicationYear: 2019,
    edition: "7th",
    pages: 1376,
    description: "Comprehensive database concepts and implementation",
    totalCopies: 20,
    availableCopies: 15,
    location: "CSE Library - Block A",
    shelfNumber: "CSE-DB-001",
    price: 2200,
    replacementCost: 3300,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Database Fundamentals",
    tags: ["database", "sql", "dbms"],
    addedBy: "library_admin",
  },
  {
    title: "Computer Networks: A Top-Down Approach",
    author: "James Kurose, Keith Ross",
    isbn: "978-0133594140",
    category: "academic",
    subject: "Computer Networks",
    department: "CSE",
    subBlock: "Networks",
    academicLevel: "undergraduate",
    semester: [5, 6],
    publisher: "Pearson",
    publicationYear: 2016,
    edition: "7th",
    pages: 864,
    description: "Network protocols and internet architecture",
    totalCopies: 18,
    availableCopies: 14,
    location: "CSE Library - Block A",
    shelfNumber: "CSE-NET-001",
    price: 2800,
    replacementCost: 4200,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Network Engineering",
    tags: ["networks", "tcp-ip", "protocols"],
    addedBy: "library_admin",
  },
  {
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Greg Gagne",
    isbn: "978-1118063330",
    category: "academic",
    subject: "Operating Systems",
    department: "CSE",
    subBlock: "Systems",
    academicLevel: "undergraduate",
    semester: [4, 5],
    publisher: "Wiley",
    publicationYear: 2018,
    edition: "10th",
    pages: 944,
    description: "Fundamental operating system concepts",
    totalCopies: 22,
    availableCopies: 18,
    location: "CSE Library - Block A",
    shelfNumber: "CSE-OS-001",
    price: 2400,
    replacementCost: 3600,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "System Programming",
    tags: ["operating-systems", "processes", "memory"],
    addedBy: "library_admin",
  },
  {
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category: "academic",
    subject: "Software Engineering",
    department: "CSE",
    subBlock: "Programming",
    academicLevel: "undergraduate",
    semester: [3, 4, 5, 6],
    publisher: "Prentice Hall",
    publicationYear: 2008,
    edition: "1st",
    pages: 464,
    description: "Best practices in software development",
    totalCopies: 12,
    availableCopies: 8,
    location: "CSE Library - Block B",
    shelfNumber: "CSE-PROG-001",
    price: 1800,
    replacementCost: 2700,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Software Engineering",
    tags: ["clean-code", "programming", "software-engineering"],
    addedBy: "library_admin",
  },

  // EEE Department Books
  {
    title: "Fundamentals of Electric Circuits",
    author: "Charles K. Alexander, Matthew N. O. Sadiku",
    isbn: "978-0073380575",
    category: "academic",
    subject: "Circuit Analysis",
    department: "EEE",
    subBlock: "Circuits",
    academicLevel: "undergraduate",
    semester: [2, 3],
    publisher: "McGraw-Hill",
    publicationYear: 2016,
    edition: "6th",
    pages: 896,
    description: "Basic electric circuit analysis and design",
    totalCopies: 25,
    availableCopies: 20,
    location: "EEE Library - Block C",
    shelfNumber: "EEE-CIR-001",
    price: 2600,
    replacementCost: 3900,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Circuit Fundamentals",
    tags: ["circuits", "electrical", "analysis"],
    addedBy: "library_admin",
  },
  {
    title: "Power System Analysis and Design",
    author: "J. Duncan Glover, Thomas J. Overbye",
    isbn: "978-1305636187",
    category: "academic",
    subject: "Power Systems",
    department: "EEE",
    subBlock: "Power",
    academicLevel: "undergraduate",
    semester: [5, 6],
    publisher: "Cengage Learning",
    publicationYear: 2016,
    edition: "6th",
    pages: 848,
    description: "Power system analysis and design principles",
    totalCopies: 20,
    availableCopies: 16,
    location: "EEE Library - Block C",
    shelfNumber: "EEE-POW-001",
    price: 3200,
    replacementCost: 4800,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Power Engineering",
    tags: ["power-systems", "electrical", "energy"],
    addedBy: "library_admin",
  },
  {
    title: "Control Systems Engineering",
    author: "Norman S. Nise",
    isbn: "978-1118170519",
    category: "academic",
    subject: "Control Systems",
    department: "EEE",
    subBlock: "Control",
    academicLevel: "undergraduate",
    semester: [5, 6],
    publisher: "Wiley",
    publicationYear: 2015,
    edition: "7th",
    pages: 944,
    description: "Control systems analysis and design",
    totalCopies: 18,
    availableCopies: 14,
    location: "EEE Library - Block C",
    shelfNumber: "EEE-CON-001",
    price: 2900,
    replacementCost: 4350,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Control Engineering",
    tags: ["control-systems", "feedback", "automation"],
    addedBy: "library_admin",
  },

  // CIVIL Department Books
  {
    title: "Structural Analysis",
    author: "Russell C. Hibbeler",
    isbn: "978-0134610672",
    category: "academic",
    subject: "Structural Engineering",
    department: "CIVIL",
    subBlock: "Structures",
    academicLevel: "undergraduate",
    semester: [4, 5],
    publisher: "Pearson",
    publicationYear: 2017,
    edition: "10th",
    pages: 736,
    description:
      "Analysis of statically determinate and indeterminate structures",
    totalCopies: 22,
    availableCopies: 18,
    location: "Civil Library - Block D",
    shelfNumber: "CIV-STR-001",
    price: 2700,
    replacementCost: 4050,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Structural Engineering",
    tags: ["structural-analysis", "civil", "buildings"],
    addedBy: "library_admin",
  },
  {
    title: "Soil Mechanics and Foundation Engineering",
    author: "K.R. Arora",
    isbn: "978-8121924955",
    category: "academic",
    subject: "Geotechnical Engineering",
    department: "CIVIL",
    subBlock: "Geotechnical",
    academicLevel: "undergraduate",
    semester: [5, 6],
    publisher: "Standard Publishers",
    publicationYear: 2015,
    edition: "7th",
    pages: 896,
    description: "Soil mechanics and foundation design principles",
    totalCopies: 20,
    availableCopies: 16,
    location: "Civil Library - Block D",
    shelfNumber: "CIV-GEO-001",
    price: 1800,
    replacementCost: 2700,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Geotechnical Engineering",
    tags: ["soil-mechanics", "foundations", "geotechnical"],
    addedBy: "library_admin",
  },

  // MECH Department Books
  {
    title: "Engineering Mechanics: Dynamics",
    author: "Russell C. Hibbeler",
    isbn: "978-0134116992",
    category: "academic",
    subject: "Engineering Mechanics",
    department: "MECH",
    subBlock: "Mechanics",
    academicLevel: "undergraduate",
    semester: [2, 3],
    publisher: "Pearson",
    publicationYear: 2016,
    edition: "14th",
    pages: 768,
    description: "Dynamics of particles and rigid bodies",
    totalCopies: 25,
    availableCopies: 20,
    location: "Mechanical Library - Block E",
    shelfNumber: "MECH-DYN-001",
    price: 2500,
    replacementCost: 3750,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Applied Mechanics",
    tags: ["dynamics", "mechanics", "engineering"],
    addedBy: "library_admin",
  },
  {
    title: "Thermodynamics: An Engineering Approach",
    author: "Yunus A. Cengel, Michael A. Boles",
    isbn: "978-0073398174",
    category: "academic",
    subject: "Thermodynamics",
    department: "MECH",
    subBlock: "Thermal",
    academicLevel: "undergraduate",
    semester: [3, 4],
    publisher: "McGraw-Hill",
    publicationYear: 2014,
    edition: "8th",
    pages: 1024,
    description: "Thermodynamics principles and applications",
    totalCopies: 22,
    availableCopies: 18,
    location: "Mechanical Library - Block E",
    shelfNumber: "MECH-THERM-001",
    price: 3000,
    replacementCost: 4500,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Thermal Engineering",
    tags: ["thermodynamics", "heat", "energy"],
    addedBy: "library_admin",
  },

  // ECE Department Books
  {
    title: "Digital Signal Processing",
    author: "John G. Proakis, Dimitris G. Manolakis",
    isbn: "978-0131873742",
    category: "academic",
    subject: "Signal Processing",
    department: "ECE",
    subBlock: "Signals",
    academicLevel: "undergraduate",
    semester: [5, 6],
    publisher: "Pearson",
    publicationYear: 2006,
    edition: "4th",
    pages: 1104,
    description: "Digital signal processing principles and applications",
    totalCopies: 18,
    availableCopies: 14,
    location: "ECE Library - Block F",
    shelfNumber: "ECE-DSP-001",
    price: 2800,
    replacementCost: 4200,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Signal Processing",
    tags: ["dsp", "signals", "electronics"],
    addedBy: "library_admin",
  },
  {
    title: "Microelectronic Circuits",
    author: "Adel S. Sedra, Kenneth C. Smith",
    isbn: "978-0199339136",
    category: "academic",
    subject: "Electronics",
    department: "ECE",
    subBlock: "Microelectronics",
    academicLevel: "undergraduate",
    semester: [4, 5],
    publisher: "Oxford University Press",
    publicationYear: 2014,
    edition: "7th",
    pages: 1552,
    description: "Microelectronic circuit analysis and design",
    totalCopies: 20,
    availableCopies: 16,
    location: "ECE Library - Block F",
    shelfNumber: "ECE-MIC-001",
    price: 3500,
    replacementCost: 5250,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Microelectronics",
    tags: ["microelectronics", "circuits", "vlsi"],
    addedBy: "library_admin",
  },

  // General Books
  {
    title: "Engineering Mathematics",
    author: "K.A. Stroud, Dexter J. Booth",
    isbn: "978-1137031204",
    category: "academic",
    subject: "Mathematics",
    department: "GENERAL",
    subBlock: "Mathematics",
    academicLevel: "undergraduate",
    semester: [1, 2, 3, 4],
    publisher: "Palgrave",
    publicationYear: 2013,
    edition: "7th",
    pages: 1264,
    description: "Comprehensive engineering mathematics",
    totalCopies: 30,
    availableCopies: 25,
    location: "General Library - Block G",
    shelfNumber: "GEN-MATH-001",
    price: 2000,
    replacementCost: 3000,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Engineering Mathematics",
    tags: ["mathematics", "calculus", "engineering"],
    addedBy: "library_admin",
  },
  {
    title: "Technical Communication",
    author: "Paul V. Anderson",
    isbn: "978-1285774909",
    category: "academic",
    subject: "Communication Skills",
    department: "GENERAL",
    subBlock: "Communication",
    academicLevel: "undergraduate",
    semester: [1, 2],
    publisher: "Cengage Learning",
    publicationYear: 2014,
    edition: "8th",
    pages: 768,
    description: "Technical writing and communication skills",
    totalCopies: 25,
    availableCopies: 22,
    location: "General Library - Block G",
    shelfNumber: "GEN-COM-001",
    price: 1500,
    replacementCost: 2250,
    dailyFine: 10,
    maxBorrowDays: 30,
    collectionName: "Communication Skills",
    tags: ["communication", "writing", "technical"],
    addedBy: "library_admin",
  },
];

// Sample book transactions with various library scenarios
const sampleTransactions = [
  {
    studentId: "GCET20240001", // Rahul Sharma - overdue book with fine
    type: "borrow",
    borrowDate: new Date("2024-07-01"),
    dueDate: new Date("2024-07-31"), // 1 month ago - overdue
    status: "overdue",
    fineAmount: 250, // 25 days overdue * 10 INR
  },
  {
    studentId: "GCET20240002", // Priya Patel - active book, no issues
    type: "borrow",
    borrowDate: new Date("2024-08-15"),
    dueDate: new Date("2024-09-14"), // Due soon
    status: "active",
    fineAmount: 0,
  },
  {
    studentId: "GCET20240003", // New student - simple pending book
    type: "borrow",
    borrowDate: new Date("2024-08-20"),
    dueDate: new Date("2024-09-19"), // Still within due date
    status: "active",
    fineAmount: 0,
  },
  {
    studentId: "GCET20240004", // New student - overdue with high fine
    type: "borrow",
    borrowDate: new Date("2024-06-01"),
    dueDate: new Date("2024-07-01"), // 2 months overdue
    status: "overdue",
    fineAmount: 630, // 63 days overdue * 10 INR
  },
  {
    studentId: "GCET20240005", // New student - lost book (wants to buy)
    type: "borrow",
    borrowDate: new Date("2024-05-15"),
    dueDate: new Date("2024-06-14"), // Long overdue - lost book
    status: "overdue",
    fineAmount: 800, // 80 days overdue * 10 INR + will need replacement cost
  },
];

async function seedLibrary() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Clear existing library data
    console.log("Clearing existing library data...");
    await Book.deleteMany({});
    await BookTransaction.deleteMany({});

    console.log("Creating library books...");
    const createdBooks = [];

    for (const bookData of libraryBooks) {
      const book = new Book(bookData);
      const savedBook = await book.save();
      createdBooks.push(savedBook);
      console.log(`Created book: ${savedBook.title} (${savedBook.bookId})`);
    }

    console.log("Creating book transactions with actual student IDs...");

    // Map test student IDs to university reg numbers
    const studentMapping: Record<string, string> = {
      GCET20240001: "GCET/2022/CSE/001",
      GCET20240002: "GCET/2022/ME/002",
      GCET20240003: "GCET/2022/CSE/003",
      GCET20240004: "GCET/2022/EEE/003",
      GCET20240005: "GCET/2022/MECH/003",
    };

    for (let i = 0; i < sampleTransactions.length; i++) {
      const transactionData = sampleTransactions[i];
      const book = createdBooks[i % createdBooks.length];

      if (transactionData && book) {
        // Find the actual student by university reg number
        const universityRegNumber = studentMapping[transactionData.studentId];
        const actualStudent = await Student.findOne({ universityRegNumber });

        if (actualStudent) {
          const transaction = new BookTransaction({
            ...transactionData,
            studentId: actualStudent.studentId, // Use actual student ID
            bookId: book.bookId,
          });

          const savedTransaction = await transaction.save();
          console.log(
            `Created transaction: ${savedTransaction.transactionId} for ${actualStudent.name}`
          );

          // Update book availability
          if (
            transactionData.status === "active" ||
            transactionData.status === "overdue"
          ) {
            book.availableCopies -= 1;
            await book.save();
          }
        } else {
          console.log(
            `⚠️  Student not found for ${transactionData.studentId} (${universityRegNumber})`
          );
        }
      }
    }

    // Create additional test students for comprehensive library testing
    console.log("Creating additional test students...");
    const additionalStudents = [
      {
        universityRegNumber: "GCET/2022/CSE/003",
        name: "Arjun Kumar",
        email: "arjun.kumar@student.gcet.edu",
        password:
          "$2b$10$xEAtMy4xQHMDwsaa5Br5Y.qjFnirlrvelkvamZDVzbP5htQfa9hM2",
        phone: "+91-9876543213",
        dateOfBirth: new Date("2001-08-10"),
        gender: "male",
        currentSemester: 5,
        course: {
          name: "Computer Science Engineering",
          code: "CSE",
          semester: 5,
          year: 2024,
        },
        address: {
          street: "789 Tech Street",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        },
        admissionStatus: "approved",
        registrationStatus: "completed",
        feeStatus: "paid",
        feeAmount: 80000,
        feePaid: 80000,
        admissionDate: new Date("2022-01-10"),
        approvalDate: new Date("2022-01-15"),
        approvedBy: "admissions_admin",
        subjects: [
          {
            name: "Data Structures",
            code: "CS301",
            credits: 4,
            instructor: "Dr. Amit Sharma",
          },
          {
            name: "Database Systems",
            code: "CS302",
            credits: 4,
            instructor: "Prof. Neha Gupta",
          },
        ],
        selectedCourses: [],
        libraryBooksIssued: 1,
        libraryBooksReturned: 0,
        libraryCleared: false,
        libraryNOCStatus: "pending",
        totalBooksIssuedAllSemesters: 1,
        totalBooksReturnedAllSemesters: 0,
        documents: [],
      },
      {
        universityRegNumber: "GCET/2022/EEE/003",
        name: "Sneha Reddy",
        email: "sneha.reddy@student.gcet.edu",
        password:
          "$2b$10$xEAtMy4xQHMDwsaa5Br5Y.qjFnirlrvelkvamZDVzbP5htQfa9hM2",
        phone: "+91-9876543214",
        dateOfBirth: new Date("2001-12-05"),
        gender: "female",
        currentSemester: 6,
        course: {
          name: "Electrical and Electronics Engineering",
          code: "EEE",
          semester: 6,
          year: 2024,
        },
        address: {
          street: "321 Power Lane",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500001",
        },
        admissionStatus: "approved",
        registrationStatus: "completed",
        feeStatus: "partial",
        feeAmount: 80000,
        feePaid: 40000,
        admissionDate: new Date("2022-01-10"),
        approvalDate: new Date("2022-01-15"),
        approvedBy: "admissions_admin",
        subjects: [
          {
            name: "Power Systems",
            code: "EE401",
            credits: 4,
            instructor: "Dr. Rajesh Kumar",
          },
          {
            name: "Control Systems",
            code: "EE402",
            credits: 3,
            instructor: "Prof. Sunita Devi",
          },
        ],
        selectedCourses: [],
        libraryBooksIssued: 1,
        libraryBooksReturned: 0,
        libraryCleared: false,
        libraryNOCStatus: "pending",
        totalBooksIssuedAllSemesters: 1,
        totalBooksReturnedAllSemesters: 0,
        documents: [],
      },
      {
        universityRegNumber: "GCET/2022/MECH/003",
        name: "Vikram Singh",
        email: "vikram.singh@student.gcet.edu",
        password:
          "$2b$10$xEAtMy4xQHMDwsaa5Br5Y.qjFnirlrvelkvamZDVzbP5htQfa9hM2",
        phone: "+91-9876543215",
        dateOfBirth: new Date("2001-06-18"),
        gender: "male",
        currentSemester: 7,
        course: {
          name: "Mechanical Engineering",
          code: "MECH",
          semester: 7,
          year: 2024,
        },
        address: {
          street: "654 Engine Road",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
        },
        admissionStatus: "approved",
        registrationStatus: "completed",
        feeStatus: "paid",
        feeAmount: 80000,
        feePaid: 80000,
        admissionDate: new Date("2022-01-10"),
        approvalDate: new Date("2022-01-15"),
        approvedBy: "admissions_admin",
        subjects: [
          {
            name: "Thermodynamics",
            code: "ME401",
            credits: 4,
            instructor: "Dr. Kiran Patel",
          },
          {
            name: "Fluid Mechanics",
            code: "ME402",
            credits: 4,
            instructor: "Prof. Anita Sharma",
          },
        ],
        selectedCourses: [],
        libraryBooksIssued: 1,
        libraryBooksReturned: 0,
        libraryCleared: false,
        libraryNOCStatus: "pending",
        totalBooksIssuedAllSemesters: 1,
        totalBooksReturnedAllSemesters: 0,
        documents: [],
      },
    ];

    // Create the additional students
    const newStudents = [];
    for (const studentData of additionalStudents) {
      try {
        const existingStudent = await Student.findOne({
          universityRegNumber: studentData.universityRegNumber,
        });
        if (!existingStudent) {
          const student = new Student(studentData);
          const savedStudent = await student.save();
          newStudents.push(savedStudent);
          console.log(
            `Created student: ${savedStudent.name} (${savedStudent.universityRegNumber})`
          );
        } else {
          newStudents.push(existingStudent);
          console.log(
            `Student already exists: ${existingStudent.name} (${existingStudent.universityRegNumber})`
          );
        }
      } catch (error) {
        console.error(`Error creating student ${studentData.name}:`, error);
      }
    }

    // Update students with pending books
    console.log("Updating student library records...");
    const allStudents = await Student.find({
      universityRegNumber: {
        $in: [
          "GCET/2022/CSE/001",
          "GCET/2022/ME/002",
          "GCET/2022/CSE/003",
          "GCET/2022/EEE/003",
          "GCET/2022/MECH/003",
        ],
      },
    });

    if (allStudents.length > 0 && createdBooks.length >= 5) {
      // Update Rahul (overdue book with fine)
      const rahul = allStudents.find(
        (s) => s.universityRegNumber === "GCET/2022/CSE/001"
      );
      if (rahul && createdBooks[0]) {
        rahul.pendingBooks = [
          {
            bookId: createdBooks[0].bookId,
            bookTitle: createdBooks[0].title,
            issueDate: new Date("2024-07-01"),
            dueDate: new Date("2024-07-31"),
            lateFee: 250,
            status: "overdue",
          },
        ];
        rahul.libraryCleared = false;
        rahul.libraryNOCStatus = "pending";
        await rahul.save();
        console.log("Updated Rahul's library record (overdue book with fine)");
      }

      // Update Priya (active book, no issues)
      const priya = allStudents.find(
        (s) => s.universityRegNumber === "GCET/2022/ME/002"
      );
      if (priya && createdBooks[1]) {
        priya.pendingBooks = [
          {
            bookId: createdBooks[1].bookId,
            bookTitle: createdBooks[1].title,
            issueDate: new Date("2024-08-15"),
            dueDate: new Date("2024-09-14"),
            lateFee: 0,
            status: "issued",
          },
        ];
        priya.libraryCleared = false;
        priya.libraryNOCStatus = "pending";
        await priya.save();
        console.log("Updated Priya's library record (active book, no issues)");
      }

      // Update Arjun (simple pending book)
      const arjun = allStudents.find(
        (s) => s.universityRegNumber === "GCET/2022/CSE/003"
      );
      if (arjun && createdBooks[2]) {
        arjun.pendingBooks = [
          {
            bookId: createdBooks[2].bookId,
            bookTitle: createdBooks[2].title,
            issueDate: new Date("2024-08-20"),
            dueDate: new Date("2024-09-19"),
            lateFee: 0,
            status: "issued",
          },
        ];
        arjun.libraryCleared = false;
        arjun.libraryNOCStatus = "pending";
        await arjun.save();
        console.log("Updated Arjun's library record (simple pending book)");
      }

      // Update Sneha (overdue with high fine)
      const sneha = allStudents.find(
        (s) => s.universityRegNumber === "GCET/2022/EEE/003"
      );
      if (sneha && createdBooks[3]) {
        sneha.pendingBooks = [
          {
            bookId: createdBooks[3].bookId,
            bookTitle: createdBooks[3].title,
            issueDate: new Date("2024-06-01"),
            dueDate: new Date("2024-07-01"),
            lateFee: 630,
            status: "overdue",
          },
        ];
        sneha.libraryCleared = false;
        sneha.libraryNOCStatus = "pending";
        await sneha.save();
        console.log("Updated Sneha's library record (overdue with high fine)");
      }

      // Update Vikram (lost book - wants to buy)
      const vikram = allStudents.find(
        (s) => s.universityRegNumber === "GCET/2022/MECH/003"
      );
      if (vikram && createdBooks[4]) {
        vikram.pendingBooks = [
          {
            bookId: createdBooks[4].bookId,
            bookTitle: createdBooks[4].title,
            issueDate: new Date("2024-05-15"),
            dueDate: new Date("2024-06-14"),
            lateFee: 800,
            status: "lost", // This indicates the student wants to pay replacement cost
          },
        ];
        vikram.libraryCleared = false;
        vikram.libraryNOCStatus = "pending";
        await vikram.save();
        console.log(
          "Updated Vikram's library record (lost book - wants to buy)"
        );
      }
    }

    console.log(`\n✅ Library seeding completed successfully!`);
    console.log(
      `📚 Created ${createdBooks.length} books across all departments`
    );
    console.log(`📋 Created ${sampleTransactions.length} transactions`);
    console.log(`👥 Updated ${allStudents.length} student library records`);

    console.log(`\n📋 Test Students Created/Updated:`);
    console.log(
      `  1. Rahul Sharma (GCET/2022/CSE/001) - Overdue book with ₹250 fine`
    );
    console.log(`  2. Priya Patel (GCET/2022/ME/002) - Active book, no issues`);
    console.log(`  3. Arjun Kumar (GCET/2022/CSE/003) - Simple pending book`);
    console.log(
      `  4. Sneha Reddy (GCET/2022/EEE/003) - Overdue with ₹630 high fine`
    );
    console.log(
      `  5. Vikram Singh (GCET/2022/MECH/003) - Lost book, wants to buy (₹800 fine)`
    );

    console.log(`\nDepartment breakdown:`);

    const departmentCounts = createdBooks.reduce(
      (acc: Record<string, number>, book) => {
        acc[book.department] = (acc[book.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(departmentCounts).forEach(([dept, count]) => {
      console.log(`  ${dept}: ${count} books`);
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding library:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedLibrary();
