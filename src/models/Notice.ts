import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
  noticeId: string;
  title: string;
  content: string;
  type:
    | "announcement"
    | "exam_form"
    | "fee_notice"
    | "academic"
    | "event"
    | "maintenance";
  priority: "low" | "medium" | "high" | "urgent";
  targetAudience:
    | "all"
    | "students"
    | "teachers"
    | "admin"
    | "specific_course"
    | "specific_semester";
  targetCourse?: string;
  targetSemester?: number;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  links: Array<{
    title: string;
    url: string;
  }>;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  publishedBy: string;
  publishedAt: Date;
  signedBy: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema: Schema = new Schema(
  {
    noticeId: {
      type: String,
      required: true,
      unique: true,
      default: () => `NOT${Date.now()}${Math.floor(Math.random() * 1000)}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "announcement",
        "exam_form",
        "fee_notice",
        "academic",
        "event",
        "maintenance",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    targetAudience: {
      type: String,
      enum: [
        "all",
        "students",
        "teachers",
        "admin",
        "specific_course",
        "specific_semester",
      ],
      required: true,
    },
    targetCourse: {
      type: String,
    },
    targetSemester: {
      type: Number,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    links: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    publishedBy: {
      type: String,
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    signedBy: {
      type: String,
      default: "Principal, GCET Safapora",
    },
    readBy: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
NoticeSchema.index({ type: 1 });
NoticeSchema.index({ priority: 1 });
NoticeSchema.index({ targetAudience: 1 });
NoticeSchema.index({ isActive: 1 });
NoticeSchema.index({ startDate: 1 });
NoticeSchema.index({ endDate: 1 });
NoticeSchema.index({ publishedAt: 1 });

export default mongoose.model<INotice>("Notice", NoticeSchema);
