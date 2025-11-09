import mongoose, { Schema, Document } from "mongoose";

export interface IBookTransaction extends Document {
  transactionId: string;
  bookId: string;
  studentId: string;
  type: "borrow" | "return" | "reserve" | "renew";
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "active" | "overdue" | "returned" | "reserved" | "cancelled";
  fineAmount: number;
  finePaid: boolean;
  finePaymentDate?: Date;
  paymentMode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookTransactionSchema: Schema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    bookId: {
      type: String,
      required: true,
      ref: "Book",
    },
    studentId: {
      type: String,
      required: true,
      ref: "Student",
    },
    type: {
      type: String,
      enum: ["borrow", "return", "reserve", "renew"],
      required: true,
    },
    borrowDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "overdue", "returned", "reserved", "cancelled"],
      default: "active",
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    finePaymentDate: {
      type: Date,
    },
    paymentMode: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
BookTransactionSchema.index({ bookId: 1 });
BookTransactionSchema.index({ studentId: 1 });
BookTransactionSchema.index({ status: 1 });
BookTransactionSchema.index({ dueDate: 1 });
BookTransactionSchema.index({ type: 1 });

export default mongoose.model<IBookTransaction>(
  "BookTransaction",
  BookTransactionSchema
);
