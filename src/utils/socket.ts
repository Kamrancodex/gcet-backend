import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface MessageData {
  conversationId: string;
  content: string;
}

interface JoinConversationData {
  conversationId: string;
}

interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (server: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env['FRONTEND_URL'] || 'http://localhost:5173'
      ],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth['token'];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const jwtSecret = process.env['JWT_SECRET'] || 'your-super-secret-jwt-key';
      const decoded = jwt.verify(token, jwtSecret) as { userId?: string; id?: string };
      
      // Handle both 'userId' and 'id' from JWT (different endpoints use different field names)
      socket.userId = decoded.userId || decoded.id || '';
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`✅ User connected: ${userId} (${socket.id})`);
    
    // Store user as online
    onlineUsers.set(userId, socket.id);
    
    // Emit online status to all users
    io.emit('user:online', { userId });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('conversation:join', async (data: JoinConversationData) => {
      try {
        const { conversationId } = data;
        
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.some(p => p.toString() === userId)) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (data: JoinConversationData) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data: MessageData) => {
      try {
        const { conversationId, content } = data;
        
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => p.toString() === userId)) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content,
          readBy: [userId]
        });

        // Update conversation's last message (use userId, not populated sender)
        conversation.lastMessage = {
          content,
          sender: userId as any,
          timestamp: message.createdAt
        };
        await conversation.save();

        // Now populate sender info for the response
        await message.populate('sender', 'name email role');

        // Emit to all users in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          message: message.toObject(),
          conversationId
        });

        // You can implement push notifications here for offline users
        // const offlineParticipants = conversation.participants.filter(
        //   p => p.toString() !== userId && !onlineUsers.has(p.toString())
        // );
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('message:read', async (data: { messageIds: string[] }) => {
      try {
        const { messageIds } = data;
        
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: userId } }
        );

        // Notify other users that messages were read
        const messages = await Message.find({ _id: { $in: messageIds } });
        messages.forEach(msg => {
          io.to(`conversation:${msg.conversation}`).emit('message:read', {
            messageIds,
            userId
          });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing:start', (data: TypingData) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId,
        conversationId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data: TypingData) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId,
        conversationId,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId} (${socket.id})`);
      onlineUsers.delete(userId);
      
      // Emit offline status to all users
      io.emit('user:offline', { userId });
    });
  });

  return io;
};

export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};

