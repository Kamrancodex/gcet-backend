import express from "express";
import { body, validationResult } from "express-validator";
import LostFound from "../models/LostFound";
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
      relatedLostFound,
    });
    await notification.save();
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// Get lost & found items
router.get("/", auth, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // "lost" or "found"
    const category = req.query.category;
    const status = req.query.status || "active";
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query: any = { status };

    if (type && ["lost", "found"].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const items = await LostFound.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LostFound.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching lost & found items:", error);
    res.status(500).json({ success: false, message: "Failed to fetch items" });
  }
});

// Get single lost & found item
router.get("/:id", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ success: false, message: "Failed to fetch item" });
  }
});

// Create new lost & found item
router.post(
  "/",
  [
    auth,
    body("type")
      .isIn(["lost", "found"])
      .withMessage("Type must be 'lost' or 'found'"),
    body("title")
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be 1-200 characters"),
    body("description")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description must be 1-1000 characters"),
    body("category")
      .isIn([
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
      ])
      .withMessage("Invalid category"),
    body("location")
      .isLength({ min: 1, max: 100 })
      .withMessage("Location is required"),
    body("dateOccurred").isISO8601().withMessage("Valid date is required"),
    body("contactInfo")
      .isLength({ min: 1, max: 100 })
      .withMessage("Contact information is required"),
    body("images").optional().isArray().withMessage("Images must be an array"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        type,
        title,
        description,
        category,
        location,
        dateOccurred,
        contactInfo,
        images = [],
        tags = [],
      } = req.body;

      const userId = (req.user as any)?.userId || (req.user as any)?.id;
      
      const item = new LostFound({
        author: userId,
        authorName: req.user.name || "User",
        authorContact: req.user.email || "Contact via system",
        contactInfo,
        type,
        title,
        description,
        category,
        location,
        dateOccurred: new Date(dateOccurred),
        images,
        tags: tags.map((tag: string) => tag.toLowerCase().trim()),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      await item.save();

      res.status(201).json({
        success: true,
        message: `${
          type === "lost" ? "Lost" : "Found"
        } item posted successfully`,
        item,
      });
    } catch (error: any) {
      console.error("Error creating lost & found item:", error);
      console.error("Error details:", error.message);
      console.error("User data:", req.user);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create item",
        error: error.message 
      });
    }
  }
);

// Update lost & found item (only by author)
router.put(
  "/:id",
  [
    auth,
    body("title")
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be 1-200 characters"),
    body("description")
      .optional()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description must be 1-1000 characters"),
    body("status")
      .optional()
      .isIn(["active", "claimed", "resolved", "expired"])
      .withMessage("Invalid status"),
    body("location")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Location must be 1-100 characters"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const userId = (req.user as any)?.userId || (req.user as any)?.id;

      const item = await LostFound.findById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Item not found" });
      }

      // Only author can update
      if (!item.author.equals(userId)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to update this item",
          });
      }

      const allowedUpdates = [
        "title",
        "description",
        "status",
        "location",
        "images",
        "tags",
      ];
      const updates: any = {};

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (updates.tags) {
        updates.tags = updates.tags.map((tag: string) =>
          tag.toLowerCase().trim()
        );
      }

      const updatedItem = await LostFound.findByIdAndUpdate(id, updates, {
        new: true,
      });

      res.json({
        success: true,
        message: "Item updated successfully",
        item: updatedItem,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update item" });
    }
  }
);

// Claim an item
router.post("/:id/claim", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.userId || (req.user as any)?.id;

    const item = await LostFound.findById(id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    if (item.status !== "active") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Item is not available for claiming",
        });
    }

    // Can't claim own item
    if (item.author.equals(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot claim your own item" });
    }

    // Update item with claim info
    item.claimedBy = userId;
    item.claimedByName = req.user.name || "User";
    item.claimedAt = new Date();
    item.status = "claimed";

    await item.save();

    // Notify the item author
    await createNotification(
      item.author.toString(),
      userId,
      req.user.name || "Someone",
      "claim",
      "🔍 Item Claimed",
      `${req.user.name || "Someone"} has claimed your ${item.type} item: "${
        item.title
      }"`,
      id
    );

    res.json({
      success: true,
      message: "Item claimed successfully. The owner will be notified.",
      item,
    });
  } catch (error) {
    console.error("Error claiming item:", error);
    res.status(500).json({ success: false, message: "Failed to claim item" });
  }
});

// Verify claim (only by item author)
router.post(
  "/:id/verify-claim",
  [
    auth,
    body("verified").isBoolean().withMessage("Verified status must be boolean"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { verified } = req.body;
      const userId = (req.user as any)?.userId || (req.user as any)?.id;

      const item = await LostFound.findById(id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Item not found" });
      }

      // Only author can verify
      if (!item.author.equals(userId)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to verify this claim",
          });
      }

      if (item.status !== "claimed") {
        return res
          .status(400)
          .json({ success: false, message: "Item is not in claimed status" });
      }

      if (verified) {
        item.claimVerified = true;
        item.status = "resolved";
      } else {
        // Reset claim if not verified
        delete (item as any).claimedBy;
        delete (item as any).claimedByName;
        delete (item as any).claimedAt;
        item.status = "active";
      }

      await item.save();

      // Notify the claimer
      if (item.claimedBy) {
        await createNotification(
          item.claimedBy.toString(),
          userId,
          req.user.name || "Owner",
          "post_update",
          verified ? "✅ Claim Verified" : "❌ Claim Rejected",
          verified
            ? `Your claim for "${item.title}" has been verified!`
            : `Your claim for "${item.title}" was not verified. The item is available again.`,
          id
        );
      }

      res.json({
        success: true,
        message: verified ? "Claim verified successfully" : "Claim rejected",
        item,
      });
    } catch (error) {
      console.error("Error verifying claim:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to verify claim" });
    }
  }
);

// Upvote lost & found item
router.post("/:id/upvote", auth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.userId || (req.user as any)?.id;

    const item = await LostFound.findById(id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Toggle upvote
    const hasUpvoted = item.upvotes.some((vote) => vote.equals(userId));

    if (hasUpvoted) {
      item.upvotes = item.upvotes.filter((vote) => !vote.equals(userId));
    } else {
      item.upvotes.push(userId);
    }

    await item.save();

    // Create notification if upvoting someone else's item
    if (!hasUpvoted && !item.author.equals(userId)) {
      await createNotification(
        item.author.toString(),
        userId,
        req.user.name || "Someone",
        "upvote",
        "👍 Item Upvoted",
        `${req.user.name || "Someone"} upvoted your ${item.type} item: "${
          item.title
        }"`,
        id
      );
    }

    res.json({
      success: true,
      message: hasUpvoted ? "Upvote removed" : "Item upvoted",
      upvotes: item.upvotes.length,
    });
  } catch (error) {
    console.error("Error upvoting item:", error);
    res.status(500).json({ success: false, message: "Failed to upvote item" });
  }
});

// Get categories
router.get("/meta/categories", (_req: any, res: any) => {
  const categories = [
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "books", label: "Books", icon: "📚" },
    { value: "clothing", label: "Clothing", icon: "👕" },
    { value: "accessories", label: "Accessories", icon: "👜" },
    { value: "documents", label: "Documents", icon: "📄" },
    { value: "keys", label: "Keys", icon: "🗝️" },
    { value: "bags", label: "Bags", icon: "🎒" },
    { value: "jewelry", label: "Jewelry", icon: "💍" },
    { value: "sports", label: "Sports", icon: "⚽" },
    { value: "other", label: "Other", icon: "❓" },
  ];

  res.json({
    success: true,
    categories,
  });
});

export default router;
