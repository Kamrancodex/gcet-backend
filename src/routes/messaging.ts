import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import { getOnlineUsers } from '../utils/socket';

const router = express.Router();

// Get all conversations for the current user
router.get('/conversations', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email role')
      .populate({
        path: 'lastMessage.sender',
        select: 'name email role'
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Add unread count to each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });

        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a specific conversation
router.get('/conversations/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    }).populate('participants', 'name email role');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    // Verify user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const query: any = { conversation: id };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name email role')
      .lean();

    return res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create or get existing conversation
router.post('/conversations', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'name email role');

    if (conversation) {
      return res.json(conversation);
    }

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [userId, participantId]
    });

    conversation = await conversation.populate('participants', 'name email role');

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Search users to message
router.get('/users/search', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const users = await User.find({
      _id: { $ne: userId }, // Exclude current user
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('name email role')
      .limit(20)
      .lean();

    // Add online status
    const onlineUserIds = getOnlineUsers();
    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: onlineUserIds.includes(user._id.toString())
    }));

    return res.json(usersWithStatus);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get online users
router.get('/users/online', auth, async (_req: Request, res: Response) => {
  try {
    const onlineUserIds = getOnlineUsers();
    res.json({ userIds: onlineUserIds });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// Delete a conversation (soft delete - removes for current user)
router.delete('/conversations/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Remove user from participants (if only 2 participants, delete conversation)
    if (conversation.participants.length === 2) {
      await Conversation.findByIdAndDelete(id);
      await Message.deleteMany({ conversation: id });
    } else {
      await Conversation.findByIdAndUpdate(id, {
        $pull: { participants: userId }
      });
    }

    return res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;

