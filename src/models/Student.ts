import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  libraryId: string;
  universityRegNumber: string; // Added for registration lookup
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  course: {
    name: string;
    code: string;
    semester: number;
    year: number;
  };
  currentSemester: number; // Added for registration
  subjects: Array<{
    name: string;
    code: string;
    credits: number;
    instructor: string;
  }>;
  selectedCourses?: string[]; // Added for registration
  admissionStatus: "pending" | "approved" | "rejected" | "enrolled";
  registrationStatus?:
    | "pending"
    | "completed"
    | "payment_pending"
    | "library_pending"; // Added
  feeStatus: "pending" | "paid" | "partial" | "overdue";
  feeAmount: number;
  feePaid: number;
  admissionDate: Date;
  approvalDate?: Date;
  approvedBy?: string;
  // Library fields for clearance check
  libraryBooksIssued?: number;
  libraryBooksReturned?: number;
  libraryCleared?: boolean;
  // Detailed library tracking
  libraryCard?: string;
  pendingBooks?: Array<{
    bookId: string;
    bookTitle: string;
    issueDate: Date;
    dueDate: Date;
    lateFee: number;
    status: "issued" | "overdue" | "lost";
  }>;
  totalBooksIssuedAllSemesters?: number; // Total books issued across all semesters
  totalBooksReturnedAllSemesters?: number; // Total books returned across all semesters
  libraryNOCStatus?: "pending" | "approved" | "rejected";
  libraryNOCDate?: Date;
  libraryNOCIssuedBy?: string;
  documents: Array<{
    name: string;
    url: string;
    verified: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      default: () => `STU${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    libraryId: {
      type: String,
      required: true,
      unique: true,
      default: () => `LIB${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    universityRegNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    course: {
      name: { type: String, required: true },
      code: { type: String, required: true },
      semester: { type: Number, required: true },
      year: { type: Number, required: true },
    },
    currentSemester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    subjects: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        credits: { type: Number, required: true },
        instructor: { type: String, required: true },
      },
    ],
    selectedCourses: [
      {
        type: String,
      },
    ],
    admissionStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "enrolled"],
      default: "pending",
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "completed", "payment_pending", "library_pending"],
      default: "pending",
    },
    feeStatus: {
      type: String,
      enum: ["pending", "paid", "partial", "overdue"],
      default: "pending",
    },
    feeAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    feePaid: {
      type: Number,
      default: 0,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    approvedBy: {
      type: String,
    },
    libraryBooksIssued: {
      type: Number,
      default: 0,
    },
    libraryBooksReturned: {
      type: Number,
      default: 0,
    },
    libraryCleared: {
      type: Boolean,
      default: false,
    },
    libraryCard: {
      type: String,
    },
    pendingBooks: [
      {
        bookId: { type: String, required: true },
        bookTitle: { type: String, required: true },
        issueDate: { type: Date, required: true },
        dueDate: { type: Date, required: true },
        lateFee: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["issued", "overdue", "lost"],
          default: "issued",
        },
      },
    ],
    totalBooksIssuedAllSemesters: {
      type: Number,
      default: 0,
    },
    totalBooksReturnedAllSemesters: {
      type: Number,
      default: 0,
    },
    libraryNOCStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    libraryNOCDate: {
      type: Date,
    },
    libraryNOCIssuedBy: {
      type: String,
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        verified: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: email, studentId, libraryId, and universityRegNumber already have indexes via unique:true
StudentSchema.index({ admissionStatus: 1 });
StudentSchema.index({ registrationStatus: 1 });
StudentSchema.index({ feeStatus: 1 });
StudentSchema.index({ course: 1 });
StudentSchema.index({ currentSemester: 1 });

export default mongoose.model<IStudent>("Student", StudentSchema);
