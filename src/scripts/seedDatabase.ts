import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Student from "../models/Student";
import Book from "../models/Book";
import Notice from "../models/Notice";
import AdmissionSession from "../models/AdmissionSession";
import User from "../models/User";

dotenv.config();

const MONGODB_URI =
  process.env["MONGODB_URI"] ||
  "mongodb+srv://mickeym4044:e2ngduK5G9y8EWkJ@cluster0gcet.6sggum8.mongodb.net/gcet_db";

// Sample data
const students = [
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543210",
    dateOfBirth: new Date("2000-05-15"),
    gender: "male",
    universityRegNumber: "GCET/2022/CSE/001",
    currentSemester: 4,
    address: {
      street: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    course: {
      name: "Computer Science Engineering",
      code: "CSE",
      semester: 3,
      year: 2024,
    },
    subjects: [
      {
        name: "Data Structures",
        code: "CS301",
        credits: 4,
        instructor: "Dr. Priya Patel",
      },
      {
        name: "Database Management",
        code: "CS302",
        credits: 3,
        instructor: "Prof. Amit Kumar",
      },
    ],
    admissionStatus: "approved",
    feeStatus: "paid",
    feeAmount: 75000,
    feePaid: 75000,
    admissionDate: new Date("2024-01-15"),
    approvalDate: new Date("2024-01-20"),
    approvedBy: "admissions_admin",
  },
  {
    name: "Priya Patel",
    email: "priya.patel@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543211",
    dateOfBirth: new Date("2001-03-22"),
    gender: "female",
    universityRegNumber: "GCET/2022/ME/002",
    currentSemester: 2,
    address: {
      street: "456 Park Avenue",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    },
    course: {
      name: "Mechanical Engineering",
      code: "ME",
      semester: 5,
      year: 2024,
    },
    subjects: [
      {
        name: "Power Systems",
        code: "EE501",
        credits: 4,
        instructor: "Dr. Sanjay Verma",
      },
      {
        name: "Control Systems",
        code: "EE502",
        credits: 3,
        instructor: "Prof. Meera Iyer",
      },
    ],
    admissionStatus: "approved",
    feeStatus: "partial",
    feeAmount: 80000,
    feePaid: 40000,
    admissionDate: new Date("2024-01-10"),
    approvalDate: new Date("2024-01-15"),
    approvedBy: "admissions_admin",
  },
  {
    name: "Amit Kumar",
    email: "amit.kumar@student.gcet.edu",
    password: "password123",
    phone: "+91-9876543212",
    dateOfBirth: new Date("2000-11-08"),
    gender: "male",
    universityRegNumber: "GCET/2022/CSE/003",
    currentSemester: 6,
    address: {
      street: "789 Lake Road",
      city: "Nagpur",
      state: "Maharashtra",
      pincode: "440001",
    },
    course: {
      name: "Computer Science Engineering",
      code: "CSE",
      semester: 7,
      year: 2024,
    },
    subjects: [
      {
        name: "Thermodynamics",
        code: "ME701",
        credits: 4,
        instructor: "Dr. Ramesh Gupta",
      },
      {
        name: "Machine Design",
        code: "ME702",
        credits: 3,
        instructor: "Prof. Suresh Reddy",
      },
    ],
    admissionStatus: "pending",
    feeStatus: "pending",
    feeAmount: 70000,
    feePaid: 0,
    admissionDate: new Date("2024-02-01"),
  },
];

const books = [
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    isbn: "9780262033848",
    category: "academic",
    subject: "Computer Science",
    publisher: "MIT Press",
    publicationYear: 2009,
    edition: "3rd",
    pages: 1312,
    description: "A comprehensive guide to algorithms and data structures",
    totalCopies: 5,
    availableCopies: 3,
    location: "Computer Science Section",
    shelfNumber: "CS-A1",
    status: "available",
    tags: ["algorithms", "data structures", "computer science"],
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9780073523323",
    category: "academic",
    subject: "Computer Science",
    publisher: "McGraw-Hill",
    publicationYear: 2019,
    edition: "7th",
    pages: 1376,
    description: "Fundamental concepts of database systems",
    totalCopies: 4,
    availableCopies: 2,
    location: "Computer Science Section",
    shelfNumber: "CS-A2",
    status: "available",
    tags: ["database", "SQL", "computer science"],
  },
  {
    title: "Power System Analysis",
    author: "John J. Grainger",
    isbn: "9780070612938",
    category: "academic",
    subject: "Electrical Engineering",
    publisher: "McGraw-Hill",
    publicationYear: 2016,
    edition: "4th",
    pages: 736,
    description: "Analysis and design of power systems",
    totalCopies: 3,
    availableCopies: 1,
    location: "Electrical Engineering Section",
    shelfNumber: "EE-A1",
    status: "available",
    tags: ["power systems", "electrical engineering", "analysis"],
  },
];

const users = [
  {
    name: "Admin User",
    email: "admin@gcet.edu",
    password: "admin123",
    role: "admin",
    phone: "+91-9876543200",
  },
  {
    name: "Admissions Admin",
    email: "admissions@gcet.edu",
    password: "admissions123",
    role: "admissions_admin",
    phone: "+91-9876543201",
  },
  {
    name: "Library Admin",
    email: "library@gcet.edu",
    password: "library123",
    role: "library_admin",
    phone: "+91-9876543202",
  },
  {
    name: "Teacher User",
    email: "teacher@gcet.edu",
    password: "teacher123",
    role: "teacher",
    phone: "+91-9876543203",
  },
];

const notices = [
  {
    title: "Semester 3 Exam Forms Available",
    content:
      "Exam forms for Semester 3 students are now available. Please submit your forms by the end of this month. Late submissions will not be accepted. Forms can be collected from the academic office or downloaded from the student portal.",
    type: "exam_form",
    priority: "high",
    targetAudience: "specific_semester",
    targetSemester: 3,
    attachments: [],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-29"),
    isActive: true,
    publishedBy: "Admissions Admin",
  },
  {
    title: "Library Maintenance Notice",
    content:
      "The library will be closed for maintenance on Saturday, February 15th, 2024. We apologize for the inconvenience. Students can access digital resources through our online portal during this period.",
    type: "maintenance",
    priority: "medium",
    targetAudience: "all",
    attachments: [],
    startDate: new Date("2024-02-10"),
    endDate: new Date("2024-02-20"),
    isActive: true,
    publishedBy: "Library Admin",
  },
  {
    title: "Fee Payment Deadline Extended",
    content:
      "The deadline for fee payment has been extended to March 15th, 2024. Please ensure timely payment to avoid any late fees. Payment can be made online through the student portal or at the accounts office.",
    type: "fee_notice",
    priority: "urgent",
    targetAudience: "students",
    attachments: [],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-03-15"),
    isActive: true,
    publishedBy: "Admissions Admin",
  },
  {
    title: "Annual Tech Fest Registration",
    content:
      "Registration for our annual tech fest is now open! Showcase your projects and win exciting prizes. Last date for registration: March 1st, 2024. For more details, visit the events section.",
    type: "event",
    priority: "medium",
    targetAudience: "students",
    attachments: [],
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-03-01"),
    isActive: true,
    publishedBy: "Admin User",
  },
  {
    title: "Holiday Schedule - Republic Day",
    content:
      "College will remain closed on January 26th, 2024, in observance of Republic Day. Classes will resume on January 27th, 2024. Wishing everyone a happy Republic Day!",
    type: "announcement",
    priority: "low",
    targetAudience: "all",
    attachments: [],
    startDate: new Date("2024-01-25"),
    endDate: new Date("2024-01-27"),
    isActive: true,
    publishedBy: "Admin User",
  },
  {
    title: "New Course Registration - AI & Machine Learning",
    content:
      "We are excited to announce the launch of our new course in Artificial Intelligence & Machine Learning. Registration is now open for the upcoming semester. Limited seats available.",
    type: "academic",
    priority: "high",
    targetAudience: "students",
    attachments: [],
    startDate: new Date("2024-02-15"),
    endDate: new Date("2024-03-15"),
    isActive: true,
    publishedBy: "Admissions Admin",
  },
  {
    title: "Semester 5 Project Submission Guidelines",
    content:
      "All Semester 5 students must submit their final projects by March 20th, 2024. Please follow the submission guidelines available on the student portal. Late submissions will result in grade penalties.",
    type: "academic",
    priority: "high",
    targetAudience: "specific_semester",
    targetSemester: 5,
    attachments: [],
    startDate: new Date("2024-02-20"),
    endDate: new Date("2024-03-20"),
    isActive: true,
    publishedBy: "Admin User",
  },
];

const admissionSessions = [
  {
    name: "Fall 2024 Semester 1",
    description:
      "Admission session for first semester students starting in Fall 2024",
    semester: 1,
    academicYear: 2024,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-07-31"),
    isActive: true,
    maxSeats: 120,
    availableSeats: 85,
    feeAmount: 65000,
    courses: [
      {
        name: "Computer Science Engineering",
        code: "CSE",
        seats: 40,
        availableSeats: 25,
      },
      {
        name: "Electrical Engineering",
        code: "EE",
        seats: 30,
        availableSeats: 20,
      },
    ],
    requirements: [
      {
        name: "10+2 Certificate",
        description: "Valid 10+2 certificate with minimum 60% marks",
        required: true,
      },
    ],
    documents: [
      {
        name: "10+2 Mark Sheet",
        description: "Original mark sheet with attested copy",
        required: true,
        maxSize: 5,
      },
    ],
    createdBy: "admissions_admin",
  },
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      Student.deleteMany({}),
      Book.deleteMany({}),
      User.deleteMany({}),
      Notice.deleteMany({}),
      AdmissionSession.deleteMany({}),
    ]);
    console.log("Existing data cleared!");

    // Create users
    console.log("Creating users...");
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
      });
      const savedUser = await user.save();
      console.log(`Created user: ${savedUser.name} (${savedUser.role})`);
    }

    // Create students
    console.log("Creating students...");
    for (const studentData of students) {
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      const student = new Student({
        ...studentData,
        password: hashedPassword,
      });
      const savedStudent = await student.save();
      console.log(
        `Created student: ${savedStudent.name} (${savedStudent.studentId})`
      );
    }

    // Create books
    console.log("Creating books...");
    for (const bookData of books) {
      const book = new Book(bookData);
      const savedBook = await book.save();
      console.log(`Created book: ${savedBook.title} (${savedBook.bookId})`);
    }

    // Create admission sessions
    console.log("Creating admission sessions...");
    for (const sessionData of admissionSessions) {
      const session = new AdmissionSession(sessionData);
      const savedSession = await session.save();
      console.log(`Created admission session: ${savedSession.sessionId}`);
    }

    // Create notices
    console.log("Creating notices...");
    for (const noticeData of notices) {
      const notice = new Notice(noticeData);
      const savedNotice = await notice.save();
      console.log(
        `Created notice: ${savedNotice.title} (${savedNotice.noticeId})`
      );
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`\n🔑 Test Login Credentials:`);
    console.log(`Admin: admin@gcet.edu / admin123`);
    console.log(`Admissions: admissions@gcet.edu / admissions123`);
    console.log(`Library: library@gcet.edu / library123`);
    console.log(`Teacher: teacher@gcet.edu / teacher123`);
    console.log(`Student: rahul.sharma@student.gcet.edu / password123`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedDatabase();
