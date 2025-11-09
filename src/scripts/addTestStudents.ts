import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Student from "../models/Student";

dotenv.config();

const MONGODB_URI =
  process.env["MONGODB_URI"] ||
  "mongodb+srv://mickeym4044:e2ngduK5G9y8EWkJ@cluster0gcet.6sggum8.mongodb.net/gcet_db";

const testStudents = [
  // Student 1: NO LIBRARY ISSUES (Clean)
  {
    name: "Ananya Singh",
    email: "ananya.singh@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543213",
    dateOfBirth: new Date("2001-07-20"),
    gender: "female",
    universityRegNumber: "GCET/2023/CSE/101",
    currentSemester: 5,
    address: {
      street: "45 Garden Street",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
    },
    course: {
      name: "Computer Science Engineering",
      code: "CSE",
      semester: 5,
      year: 2024,
    },
    subjects: [],
    admissionStatus: "approved",
    feeStatus: "paid",
    feeAmount: 45000,
    feePaid: 45000,
    admissionDate: new Date("2023-08-01"),
    approvalDate: new Date("2023-08-05"),
    approvedBy: "admissions_admin",
    // Library fields - ALL CLEAR
    libraryBooksIssued: 0,
    libraryBooksReturned: 0,
    libraryCleared: true,
    pendingBooks: [],
    totalBooksIssuedAllSemesters: 8,
    totalBooksReturnedAllSemesters: 8,
    libraryNOCStatus: "approved",
    registrationStatus: "pending",
  },

  // Student 2: HAS OVERDUE BOOKS WITH LATE FEES
  {
    name: "Vikram Malhotra",
    email: "vikram.malhotra@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543214",
    dateOfBirth: new Date("2000-12-10"),
    gender: "male",
    universityRegNumber: "GCET/2023/ME/102",
    currentSemester: 5,
    address: {
      street: "67 Park Lane",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
    },
    course: {
      name: "Mechanical Engineering",
      code: "ME",
      semester: 5,
      year: 2024,
    },
    subjects: [],
    admissionStatus: "approved",
    feeStatus: "paid",
    feeAmount: 45000,
    feePaid: 45000,
    admissionDate: new Date("2023-08-01"),
    approvalDate: new Date("2023-08-05"),
    approvedBy: "admissions_admin",
    // Library fields - OVERDUE BOOKS
    libraryBooksIssued: 2,
    libraryBooksReturned: 0,
    libraryCleared: false,
    pendingBooks: [
      {
        bookId: "BOOK001",
        bookTitle: "Thermodynamics by Cengel",
        issueDate: new Date("2024-08-01"),
        dueDate: new Date("2024-09-01"),
        lateFee: 330, // 33 days overdue * 10 Rs/day
        status: "overdue",
      },
      {
        bookId: "BOOK002",
        bookTitle: "Machine Design Handbook",
        issueDate: new Date("2024-08-15"),
        dueDate: new Date("2024-09-15"),
        lateFee: 190, // 19 days overdue * 10 Rs/day
        status: "overdue",
      },
    ],
    totalBooksIssuedAllSemesters: 10,
    totalBooksReturnedAllSemesters: 8,
    libraryNOCStatus: "pending",
    registrationStatus: "pending",
  },

  // Student 3: HAS BOOKS PENDING BUT WANTS TO BUY/PAY
  {
    name: "Sneha Kapoor",
    email: "sneha.kapoor@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543215",
    dateOfBirth: new Date("2001-04-18"),
    gender: "female",
    universityRegNumber: "GCET/2023/EE/103",
    currentSemester: 5,
    address: {
      street: "89 Lake View",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
    },
    course: {
      name: "Electrical Engineering",
      code: "EE",
      semester: 5,
      year: 2024,
    },
    subjects: [],
    admissionStatus: "approved",
    feeStatus: "paid",
    feeAmount: 45000,
    feePaid: 45000,
    admissionDate: new Date("2023-08-01"),
    approvalDate: new Date("2023-08-05"),
    approvedBy: "admissions_admin",
    // Library fields - HAS PENDING BOOKS (wants to buy)
    libraryBooksIssued: 3,
    libraryBooksReturned: 0,
    libraryCleared: false,
    pendingBooks: [
      {
        bookId: "BOOK003",
        bookTitle: "Power Systems Analysis",
        issueDate: new Date("2024-07-01"),
        dueDate: new Date("2024-08-01"),
        lateFee: 640, // 64 days overdue * 10 Rs/day (wants to pay/buy)
        status: "overdue",
      },
      {
        bookId: "BOOK004",
        bookTitle: "Electrical Machines by Fitzgerald",
        issueDate: new Date("2024-07-10"),
        dueDate: new Date("2024-08-10"),
        lateFee: 550, // 55 days overdue * 10 Rs/day
        status: "overdue",
      },
      {
        bookId: "BOOK005",
        bookTitle: "Control Systems Engineering",
        issueDate: new Date("2024-08-20"),
        dueDate: new Date("2024-09-20"),
        lateFee: 140, // 14 days overdue * 10 Rs/day
        status: "overdue",
      },
    ],
    totalBooksIssuedAllSemesters: 15,
    totalBooksReturnedAllSemesters: 12,
    libraryNOCStatus: "pending",
    registrationStatus: "pending",
  },
];

async function addTestStudents() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");

    console.log("\n📚 Adding test students...");

    // Hash passwords
    for (const student of testStudents) {
      student.password = await bcrypt.hash(student.password, 10);
    }

    // Delete existing test students if any
    await Student.deleteMany({
      universityRegNumber: {
        $in: testStudents.map((s) => s.universityRegNumber),
      },
    });

    // Insert test students
    const createdStudents = await Student.insertMany(testStudents);

    console.log(
      `\n✅ Successfully added ${createdStudents.length} test students!`
    );

    console.log("\n" + "=".repeat(70));
    console.log("🎓 TEST STUDENTS FOR REGISTRATION:");
    console.log("=".repeat(70));

    console.log("\n1️⃣  CLEAN STUDENT (No Library Issues):");
    console.log("   📝 Name: Ananya Singh");
    console.log("   🎫 Reg Number: GCET/2023/CSE/101");
    console.log("   📚 Library Status: ✅ ALL CLEAR");
    console.log("   📖 Pending Books: 0");
    console.log("   💰 Late Fees: ₹0");
    console.log("   ✅ Can register without issues!");

    console.log("\n2️⃣  STUDENT WITH OVERDUE BOOKS:");
    console.log("   📝 Name: Vikram Malhotra");
    console.log("   🎫 Reg Number: GCET/2023/ME/102");
    console.log("   📚 Library Status: ⚠️ OVERDUE");
    console.log("   📖 Pending Books: 2 books overdue");
    console.log("   💰 Late Fees: ₹520 (₹330 + ₹190)");
    console.log("   ⚠️  Must return books OR pay fees to register");

    console.log("\n3️⃣  STUDENT WITH BOOKS TO BUY/PAY:");
    console.log("   📝 Name: Sneha Kapoor");
    console.log("   🎫 Reg Number: GCET/2023/EE/103");
    console.log("   📚 Library Status: ⚠️ PENDING");
    console.log("   📖 Pending Books: 3 books overdue");
    console.log("   💰 Total Amount: ₹1,330 (₹640 + ₹550 + ₹140)");
    console.log("   💳 Can choose to pay fees to clear dues");

    console.log("\n" + "=".repeat(70));
    console.log("🔐 All students use password: password123");
    console.log("=".repeat(70) + "\n");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error adding test students:", error);
    process.exit(1);
  }
}

addTestStudents();












