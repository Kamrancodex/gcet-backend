import mongoose, { Schema, Document } from "mongoose";

export interface IRegistrationSession extends Document {
  sessionId: string;
  semester: number;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  feeAmount: number;
  feeDeadline: Date;
  isActive: boolean;
  availableCourses: string[]; // Legacy field - kept for backward compatibility
  branches?: string[]; // New: Multiple branches ["CSE", "ME", "CE"]
  branchSubjects?: Record<string, string[]>; // New: Branch-specific subjects { "CSE": [...], "ME": [...] }
  libraryRequirement: boolean; // true for 5th & 7th semester
  totalRegistrations: number;
  completedRegistrations: number;
  pendingRegistrations: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `REG${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    feeDeadline: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    availableCourses: [
      {
        type: String,
      },
    ],
    branches: [
      {
        type: String, // Branch codes: CSE, ME, CE, EE, etc.
      },
    ],
    branchSubjects: {
      type: Map,
      of: [String], // Map of branch code to array of subjects
    },
    libraryRequirement: {
      type: Boolean,
      default: false,
    },
    totalRegistrations: {
      type: Number,
      default: 0,
    },
    completedRegistrations: {
      type: Number,
      default: 0,
    },
    pendingRegistrations: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
RegistrationSessionSchema.index({ semester: 1 });
RegistrationSessionSchema.index({ academicYear: 1 });
RegistrationSessionSchema.index({ isActive: 1 });
RegistrationSessionSchema.index({ startDate: 1 });
RegistrationSessionSchema.index({ endDate: 1 });

export default mongoose.model<IRegistrationSession>(
  "RegistrationSession",
  RegistrationSessionSchema
);
