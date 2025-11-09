import express from "express";
import { query, validationResult } from "express-validator";
import Notice from "../models/Notice";
import { auth } from "../middleware/auth";

const router = express.Router();

// Public route to get active notices
router.get(
  "/public",
  [
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("audience").optional().isString(),
    query("type")
      .optional()
      .isIn([
        "announcement",
        "exam_form",
        "fee_notice",
        "academic",
        "event",
        "maintenance",
      ]),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limit = 10, audience, type } = req.query;
      const currentDate = new Date();

      // Build query for active notices
      const query: any = {
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      };

      // Add audience filter
      if (audience && audience !== "all") {
        query.$or = [{ targetAudience: "all" }, { targetAudience: audience }];
      } else {
        query.targetAudience = { $in: ["all", "students", "teachers"] };
      }

      // Add type filter
      if (type) {
        query.type = type;
      }

      const notices = await Notice.find(query)
        .sort({ priority: -1, publishedAt: -1 })
        .limit(parseInt(limit as string))
        .select("-readBy");

      // Transform priority for sorting (urgent=4, high=3, medium=2, low=1)
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const sortedNotices = notices.sort((a, b) => {
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder];
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder];

        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }

        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        ); // Newer first
      });

      res.json(sortedNotices);
    } catch (error) {
      console.error("Error fetching public notices:", error);
      res.status(500).json({ message: "Failed to fetch notices" });
    }
  }
);

// Get notice by ID (public)
router.get("/public/:id", async (req: any, res: any) => {
  try {
    const notice = await Notice.findOne({
      _id: req.params["id"],
      isActive: true,
    }).select("-readBy");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json(notice);
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({ message: "Failed to fetch notice" });
  }
});

// Mark notice as read (requires auth)
router.post("/:id/read", auth, async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const notice = await Notice.findById(req.params["id"]);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Add user to readBy array if not already present
    if (!notice.readBy.includes(userId)) {
      notice.readBy.push(userId);
      await notice.save();
    }

    res.json({ message: "Notice marked as read" });
  } catch (error) {
    console.error("Error marking notice as read:", error);
    res.status(500).json({ message: "Failed to mark notice as read" });
  }
});

export default router;
