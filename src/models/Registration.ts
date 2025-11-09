import mongoose, { Schema, Document } from "mongoose";

export interface IRegistration extends Document {
  registrationId: string;
  studentId: string;
  universityRegNumber: string;
  studentName: string;
  email: string;
  phone?: string;
  currentSemester: number;
  registeringForSemester: number;
  selectedCourses: string[];
  status: "pending" | "completed" | "payment_pending" | "library_pending";
  feeStatus: "pending" | "paid" | "partial" | "overdue";
  libraryCleared: boolean;
  registeredAt: Date;
  sessionId: string; // RegistrationSession _id
}

const RegistrationSchema: Schema = new Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      default: () => `REG${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    studentId: { type: String, required: true },
    universityRegNumber: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    currentSemester: { type: Number, required: true },
    registeringForSemester: { type: Number, required: true },
    selectedCourses: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ["pending", "completed", "payment_pending", "library_pending"],
      default: "pending",
      index: true,
    },
    feeStatus: {
      type: String,
      enum: ["pending", "paid", "partial", "overdue"],
      default: "pending",
      index: true,
    },
    libraryCleared: { type: Boolean, default: false },
    registeredAt: { type: Date, default: Date.now },
    sessionId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

RegistrationSchema.index({ sessionId: 1, registeringForSemester: 1 });

export default mongoose.model<IRegistration>(
  "Registration",
  RegistrationSchema
);










