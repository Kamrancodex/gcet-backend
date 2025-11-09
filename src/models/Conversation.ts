import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  updatedAt: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      content: { type: String },
      sender: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
      },
      timestamp: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

// Method to find conversation between two users
conversationSchema.statics['findBetweenUsers'] = function(userId1: string, userId2: string) {
  return this.findOne({
    participants: { $all: [userId1, userId2] }
  });
};

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;

