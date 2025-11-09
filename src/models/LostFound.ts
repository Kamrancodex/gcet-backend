import mongoose, { Document, Schema } from "mongoose";

export interface ILostFound extends Document {
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorContact: string;
  contactInfo: string;
  type: "lost" | "found";
  title: string;
  description: string;
  images: string[];
  category: string;
  location: string;
  dateOccurred: Date;
  status: "active" | "claimed" | "resolved" | "expired";
  claimedBy?: mongoose.Types.ObjectId;
  claimedByName?: string;
  claimedAt?: Date;
  claimVerified: boolean;
  tags: string[];
  upvotes: mongoose.Types.ObjectId[];
  commentsCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LostFoundSchema: Schema = new Schema(
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
    authorContact: {
      type: String,
      required: true,
    },
    contactInfo: {
      type: String,
      required: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    images: [
      {
        type: String, // URLs to uploaded images
      },
    ],
    category: {
      type: String,
      required: true,
      enum: [
        "electronics",
        "books",
        "clothing",
        "accessories",
        "documents",
        "keys",
        "bags",
        "jewelry",
        "sports",
        "other",
      ],
    },
    location: {
      type: String,
      required: true,
    },
    dateOccurred: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "claimed", "resolved", "expired"],
      default: "active",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    claimedByName: {
      type: String,
    },
    claimedAt: {
      type: Date,
    },
    claimVerified: {
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
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
LostFoundSchema.index({ type: 1, status: 1, createdAt: -1 });
LostFoundSchema.index({ category: 1 });
LostFoundSchema.index({ author: 1 });
LostFoundSchema.index({ expiresAt: 1 });
LostFoundSchema.index({ tags: 1 });

// Auto-expire items after 30 days
LostFoundSchema.pre("save", function (next) {
  if (this.isNew && !this["expiresAt"]) {
    this["expiresAt"] = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

export default mongoose.model<ILostFound>("LostFound", LostFoundSchema);
