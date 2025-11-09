import express from "express";
import { body, validationResult } from "express-validator";
import SocialPost from "../models/SocialPost";
import SocialComment from "../models/SocialComment";
import SocialNotification from "../models/SocialNotification";
import { auth } from "../middleware/auth";

const router = express.Router();

// Helper function to create notifications
const createNotification = async (
  recipientId: string,
  senderId: string,
  senderName: string,
  type: string,
  title: string,
  message: string,
  relatedPost?: string,
  relatedComment?: string,
  relatedLostFound?: string
) => {
  try {
    const notification = new SocialNotification({
      recipient: recipientId,
      sender: senderId,
      senderName,
      type,
      title,
      message,
      relatedPost,
      relatedComment,
      relatedLostFound,
    });
    await notification.save();
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// ===== SOCIAL POSTS =====

// Get feed posts (with pagination and sorting)
router.get("/posts", auth, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "recent"; // recent, popular, trending
    const skip = (page - 1) * limit;

    let sortQuery: any = { createdAt: -1 };

    if (sortBy === "popular") {
      sortQuery = { totalScore: -1, createdAt: -1 };
    } else if (sortBy === "trending") {
      // Trending: high score + recent (within last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const posts = await SocialPost.find({ createdAt: { $gte: weekAgo } })
        .sort({ totalScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit,
        },
      });
    }

    const posts = await SocialPost.find()
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

// Create new post
router.post(
  "/posts",
  [
    auth,
    body("content")
      .isLength({ min: 1, max: 2000 })
      .withMessage("Content must be 1-2000 characters"),
    body("images").optional().isArray().withMessage("Images must be an array"),
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("isAnonymous must be boolean"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { content, images = [], isAnonymous = false, tags = [] } = req.body;

      // Determine post type
      let type = "text";
      if (images.length > 0) {
        type = content.trim() ? "mixed" : "image";
      }

      const post = new SocialPost({
        author: req.user.userId,
        authorName: isAnonymous ? "Anonymous" : req.user.name || "User",
        authorRole: req.user.role || "student",
        content,
        images,
        type,
        isAnonymous,
        tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      });

      await post.save();

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to create post" });
    }
  }
);

// Vote on post (upvote/downvote)
router.post(
  "/posts/:id/vote",
  [
    auth,
    body("type")
      .isIn(["upvote", "downvote"])
      .withMessage("Vote type must be upvote or downvote"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { type } = req.body;
      const userId = req.user.userId;

      const post = await SocialPost.findById(id);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      // Remove existing vote
      post.upvotes = post.upvotes.filter((vote) => !vote.equals(userId));
      post.downvotes = post.downvotes.filter((vote) => !vote.equals(userId));

      // Add new vote
      if (type === "upvote") {
        post.upvotes.push(userId);
      } else {
        post.downvotes.push(userId);
      }

      await post.save();

      // Create notification for post author (if not voting on own post)
      if (!post.author.equals(userId)) {
        await createNotification(
          post.author.toString(),
          userId,
          req.user.name || "Someone",
          type,
          `${type === "upvote" ? "👍" : "👎"} Post ${type}d`,
          `${
            req.user.name || "Someone"
          } ${type}d your post: "${post.content.substring(0, 50)}..."`,
          id
        );
      }

      res.json({
        success: true,
        message: `Post ${type}d successfully`,
        totalScore: post.totalScore,
        upvotes: post.upvotes.length,
        downvotes: post.downvotes.length,
      });
    } catch (error) {
      console.error("Error voting on post:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to vote on post" });
    }
  }
);

// Get comments for a post
router.get("/posts/:id/comments", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await SocialComment.find({
      post: id,
      parentComment: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("replies");

    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        hasMore: comments.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch comments" });
  }
});

// Add comment to post
router.post(
  "/posts/:id/comments",
  [
    auth,
    body("content")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment must be 1-1000 characters"),
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("isAnonymous must be boolean"),
    body("parentComment")
      .optional()
      .isMongoId()
      .withMessage("Invalid parent comment ID"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { content, isAnonymous = false, parentComment } = req.body;
      const userId = req.user.userId;

      const post = await SocialPost.findById(id);
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      const comment = new SocialComment({
        post: id,
        author: userId,
        authorName: isAnonymous ? "Anonymous" : req.user.name || "User",
        authorRole: req.user.role || "student",
        content,
        isAnonymous,
        parentComment,
      });

      await comment.save();

      // Update post comment count
      post.commentsCount += 1;
      await post.save();

      // If it's a reply, update parent comment
      if (parentComment) {
        await SocialComment.findByIdAndUpdate(parentComment, {
          $push: { replies: comment._id },
        });
      }

      // Create notification for post author (if not commenting on own post)
      if (!post.author.equals(userId)) {
        await createNotification(
          post.author.toString(),
          userId,
          req.user.name || "Someone",
          parentComment ? "reply" : "comment",
          `💬 New ${parentComment ? "reply" : "comment"}`,
          `${req.user.name || "Someone"} ${
            parentComment ? "replied to" : "commented on"
          } your post: "${content.substring(0, 50)}..."`,
          id,
          String(comment._id)
        );
      }

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        comment,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to add comment" });
    }
  }
);

// Vote on comment
router.post(
  "/comments/:id/vote",
  [
    auth,
    body("type")
      .isIn(["upvote", "downvote"])
      .withMessage("Vote type must be upvote or downvote"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { type } = req.body;
      const userId = req.user.userId;

      const comment = await SocialComment.findById(id);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Comment not found" });
      }

      // Remove existing vote
      comment.upvotes = comment.upvotes.filter((vote) => !vote.equals(userId));
      comment.downvotes = comment.downvotes.filter(
        (vote) => !vote.equals(userId)
      );

      // Add new vote
      if (type === "upvote") {
        comment.upvotes.push(userId);
      } else {
        comment.downvotes.push(userId);
      }

      await comment.save();

      // Create notification for comment author (if not voting on own comment)
      if (!comment.author.equals(userId)) {
        await createNotification(
          comment.author.toString(),
          userId,
          req.user.name || "Someone",
          type,
          `${type === "upvote" ? "👍" : "👎"} Comment ${type}d`,
          `${
            req.user.name || "Someone"
          } ${type}d your comment: "${comment.content.substring(0, 50)}..."`,
          comment.post.toString(),
          id
        );
      }

      res.json({
        success: true,
        message: `Comment ${type}d successfully`,
        totalScore: comment.totalScore,
        upvotes: comment.upvotes.length,
        downvotes: comment.downvotes.length,
      });
    } catch (error) {
      console.error("Error voting on comment:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to vote on comment" });
    }
  }
);

export default router;
