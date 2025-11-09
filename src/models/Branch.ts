import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  branchId: string;
  name: string; // "Computer Science Engineering"
  shortCode: string; // "CSE"
  department: string;
  isActive: boolean;
  totalSemesters: number;
  semesterSubjects: Map<number, ISemesterSubject[]>; // Semester number -> Subjects
  createdAt: Date;
  updatedAt: Date;
}

export interface ISemesterSubject {
  subjectCode: string; // "CS501"
  subjectName: string; // "Computer Networks"
  subjectType: "theory" | "practical" | "lab" | "project" | "seminar";
  credits: number;

  // Theory subjects (150 marks total)
  internalMarks?: number; // 50
  externalMarks?: number; // 100
  totalMarks?: number; // 150

  // Practical subjects
  practicalMarks?: number; // Variable

  isMandatory: boolean;
  isElective: boolean;
  instructor?: string;
}

const SemesterSubjectSchema = new Schema({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  subjectType: {
    type: String,
    enum: ["theory", "practical", "lab", "project", "seminar"],
    required: true,
  },
  credits: { type: Number, required: true },

  // Theory marks
  internalMarks: { type: Number },
  externalMarks: { type: Number },
  totalMarks: { type: Number },

  // Practical marks
  practicalMarks: { type: Number },

  isMandatory: { type: Boolean, default: true },
  isElective: { type: Boolean, default: false },
  instructor: { type: String },
});

const BranchSchema: Schema = new Schema(
  {
    branchId: {
      type: String,
      required: true,
      unique: true,
      default: () => `BR${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    name: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalSemesters: {
      type: Number,
      default: 8,
    },
    // Map of semester number to subjects array
    semesterSubjects: {
      type: Map,
      of: [SemesterSubjectSchema],
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BranchSchema.index({ shortCode: 1 });
BranchSchema.index({ isActive: 1 });

export default mongoose.model<IBranch>("Branch", BranchSchema);












