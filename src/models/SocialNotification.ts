import mongoose, { Document, Schema } from "mongoose";

export interface ISocialNotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  type:
    | "upvote"
    | "downvote"
    | "comment"
    | "reply"
    | "mention"
    | "claim"
    | "post_update";
  title: string;
  message: string;
  relatedPost?: mongoose.Types.ObjectId;
  relatedComment?: mongoose.Types.ObjectId;
  relatedLostFound?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const SocialNotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "upvote",
        "downvote",
        "comment",
        "reply",
        "mention",
        "claim",
        "post_update",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialPost",
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialComment",
    },
    relatedLostFound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostFound",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
SocialNotificationSchema.index({ recipient: 1, createdAt: -1 });
SocialNotificationSchema.index({ isRead: 1 });
SocialNotificationSchema.index({ type: 1 });

export default mongoose.model<ISocialNotification>(
  "SocialNotification",
  SocialNotificationSchema
);
