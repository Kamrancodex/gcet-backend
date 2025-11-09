import mongoose, { Schema, Document } from "mongoose";

export interface IAdmissionSession extends Document {
  sessionId: string;
  semester: number;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  feeAmount: number;
  feeDeadline: Date;
  isActive: boolean;
  courses: string[];
  eligibilityCriteria: string;
  requiredDocuments: string[];
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `ADM${Date.now()}${Math.floor(Math.random() * 1000)}`,
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
    courses: [
      {
        type: String,
        required: true,
      },
    ],
    eligibilityCriteria: {
      type: String,
      required: true,
    },
    requiredDocuments: [
      {
        type: String,
        required: true,
      },
    ],
    totalApplications: {
      type: Number,
      default: 0,
    },
    approvedApplications: {
      type: Number,
      default: 0,
    },
    rejectedApplications: {
      type: Number,
      default: 0,
    },
    pendingApplications: {
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
AdmissionSessionSchema.index({ semester: 1 });
AdmissionSessionSchema.index({ academicYear: 1 });
AdmissionSessionSchema.index({ isActive: 1 });
AdmissionSessionSchema.index({ startDate: 1 });
AdmissionSessionSchema.index({ endDate: 1 });

export default mongoose.model<IAdmissionSession>(
  "AdmissionSession",
  AdmissionSessionSchema
);
