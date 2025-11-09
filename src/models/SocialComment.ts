import mongoose, { Document, Schema } from "mongoose";

export interface ISocialComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  content: string;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  totalScore: number;
  isAnonymous: boolean;
  parentComment?: mongoose.Types.ObjectId; // For nested replies
  replies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SocialCommentSchema: Schema = new Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      required: true,
      enum: ["student", "faculty", "staff", "admin"],
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialComment",
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocialComment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
SocialCommentSchema.index({ post: 1, createdAt: -1 });
SocialCommentSchema.index({ author: 1 });
SocialCommentSchema.index({ parentComment: 1 });

// Update totalScore when upvotes/downvotes change
SocialCommentSchema.pre("save", function (next) {
  this["totalScore"] =
    (this["upvotes"] as any[]).length - (this["downvotes"] as any[]).length;
  next();
});

export default mongoose.model<ISocialComment>(
  "SocialComment",
  SocialCommentSchema
);
