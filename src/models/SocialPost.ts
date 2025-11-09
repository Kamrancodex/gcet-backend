import mongoose, { Document, Schema } from "mongoose";

export interface ISocialPost extends Document {
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  content: string;
  images: string[];
  type: "text" | "image" | "mixed";
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  totalScore: number;
  commentsCount: number;
  isAnonymous: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema: Schema = new Schema(
  {
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
      maxlength: 2000,
    },
    images: [
      {
        type: String, // URLs to uploaded images
      },
    ],
    type: {
      type: String,
      enum: ["text", "image", "mixed"],
      default: "text",
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
    commentsCount: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
SocialPostSchema.index({ createdAt: -1 });
SocialPostSchema.index({ totalScore: -1 });
SocialPostSchema.index({ author: 1 });
SocialPostSchema.index({ tags: 1 });

// Update totalScore when upvotes/downvotes change
SocialPostSchema.pre("save", function (next) {
  this["totalScore"] =
    (this["upvotes"] as any[]).length - (this["downvotes"] as any[]).length;
  next();
});

export default mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);
