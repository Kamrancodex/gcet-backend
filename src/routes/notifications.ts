import express from "express";
import SocialNotification from "../models/SocialNotification";
import { auth } from "../middleware/auth";

const router = express.Router();

// Get user notifications
router.get("/", auth, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const skip = (page - 1) * limit;

    let query: any = { recipient: req.user.userId };

    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await SocialNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name role")
      .populate("relatedPost", "content type")
      .populate("relatedComment", "content")
      .populate("relatedLostFound", "title type");

    const unreadCount = await SocialNotification.countDocuments({
      recipient: req.user.userId,
      isRead: false,
    });

    const total = await SocialNotification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await SocialNotification.findOne({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/read-all", auth, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    await SocialNotification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to mark all notifications as read",
      });
  }
});

// Delete notification
router.delete("/:id", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await SocialNotification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete notification" });
  }
});

// Get notification statistics
router.get("/stats", auth, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const stats = await SocialNotification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
          },
        },
      },
    ]);

    const totalUnread = await SocialNotification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    const recentActivity = await SocialNotification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sender", "name");

    res.json({
      success: true,
      stats,
      totalUnread,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notification stats" });
  }
});

export default router;
