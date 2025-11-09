import mongoose, { Schema, Document } from "mongoose";

export type UserRole =
  | "student"
  | "teacher"
  | "faculty"
  | "admin"
  | "staff"
  | "admissions_admin"
  | "library_admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // unique already creates an index
    passwordHash: { type: String, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
