import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  bookId: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  subject: string;
  publisher: string;
  publicationYear: number;
  edition: string;
  pages: number;
  description: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
  shelfNumber: string;
  status: "available" | "borrowed" | "reserved" | "maintenance";
  tags: string[];
  coverImage?: string;
  // Enhanced fields for department organization
  department: "CSE" | "EEE" | "CIVIL" | "MECH" | "ECE" | "GENERAL";
  subBlock: string; // e.g., "Programming", "Databases", "Networks" for CSE
  academicLevel: "undergraduate" | "postgraduate" | "reference" | "general";
  semester: number[]; // Which semesters this book is relevant for
  // Pricing and fee structure
  price: number; // Book cost in INR
  replacementCost: number; // Cost if book is lost/damaged
  dailyFine: number; // Fine per day after due date (default 10 INR)
  maxBorrowDays: number; // Maximum borrow period (default 30 days)
  // Collection management
  collectionName?: string; // e.g., "Programming Fundamentals", "Circuit Analysis"
  addedBy: string; // Who added this book
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema = new Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      default: () => `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "fiction",
        "non-fiction",
        "academic",
        "reference",
        "magazine",
        "journal",
      ],
    },
    subject: {
      type: String,
      required: true,
    },
    // Enhanced departmental organization
    department: {
      type: String,
      required: true,
      enum: ["CSE", "EEE", "CIVIL", "MECH", "ECE", "GENERAL"],
      default: "GENERAL",
    },
    subBlock: {
      type: String,
      required: true,
      trim: true,
    },
    academicLevel: {
      type: String,
      required: true,
      enum: ["undergraduate", "postgraduate", "reference", "general"],
      default: "undergraduate",
    },
    semester: [
      {
        type: Number,
        min: 1,
        max: 8,
      },
    ],
    // Pricing and fee structure
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 500, // Default book price 500 INR
    },
    replacementCost: {
      type: Number,
      required: true,
      min: 0,
      default: 750, // Will be calculated as price * 1.5 in application logic
    },
    dailyFine: {
      type: Number,
      required: true,
      min: 0,
      default: 10, // 10 INR per day
    },
    maxBorrowDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30, // 30 days maximum
    },
    // Collection management
    collectionName: {
      type: String,
      trim: true,
    },
    addedBy: {
      type: String,
      required: false, // Temporarily optional for debugging
      ref: "User",
      default: "system", // Default value
    },
    lastUpdatedBy: {
      type: String,
      ref: "User",
    },
    publisher: {
      type: String,
      required: true,
    },
    publicationYear: {
      type: Number,
      required: true,
    },
    edition: {
      type: String,
      default: "1st",
    },
    pages: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
    },
    shelfNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "borrowed", "reserved", "maintenance"],
      default: "available",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    coverImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
BookSchema.index({ title: 1 });
BookSchema.index({ author: 1 });
BookSchema.index({ isbn: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({ subject: 1 });
BookSchema.index({ status: 1 });
BookSchema.index({ department: 1 });
BookSchema.index({ subBlock: 1 });
BookSchema.index({ academicLevel: 1 });
BookSchema.index({ semester: 1 });
BookSchema.index({ collectionName: 1 });
BookSchema.index({ department: 1, subBlock: 1 }); // Compound index for department queries

export default mongoose.model<IBook>("Book", BookSchema);
