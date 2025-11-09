import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import SocialPost from "../models/SocialPost";
import SocialComment from "../models/SocialComment";
import LostFound from "../models/LostFound";
import SocialNotification from "../models/SocialNotification";

// Load environment variables
dotenv.config();

const mockPosts = [
  {
    content:
      "Just finished my final exams! 🎉 Time to relax and enjoy the break. How did everyone else do?",
    tags: ["exams", "finals", "celebration"],
    isAnonymous: false,
  },
  {
    content:
      "The new library renovation looks amazing! 📚 Love the study spaces and the modern design. Perfect place to prepare for next semester.",
    tags: ["library", "campus", "study"],
    isAnonymous: false,
  },
  {
    content:
      "Anyone else struggling with the cafeteria food lately? 😅 Maybe we need more variety in the menu?",
    tags: ["cafeteria", "food", "campus-life"],
    isAnonymous: true,
  },
  {
    content:
      "Shoutout to Professor Smith for the amazing Data Structures course! 👨‍🏫 Really helped me understand algorithms better.",
    tags: ["professor", "course", "data-structures"],
    isAnonymous: false,
  },
  {
    content:
      "Campus fest preparations are going great! 🎪 Can't wait for everyone to see what we've planned. It's going to be epic!",
    tags: ["campus-fest", "events", "preparation"],
    isAnonymous: false,
  },
  {
    content:
      "Study group for Advanced Mathematics forming! 📐 Meeting every Tuesday and Thursday in the library. DM if interested!",
    tags: ["study-group", "mathematics", "library"],
    isAnonymous: false,
  },
  {
    content:
      "The new sports complex is finally open! 🏀 Played basketball there yesterday - the courts are fantastic!",
    tags: ["sports", "basketball", "campus"],
    isAnonymous: false,
  },
  {
    content:
      "Coffee shop near the main gate has the best chai! ☕ Perfect spot for quick study sessions between classes.",
    tags: ["coffee", "study", "campus"],
    isAnonymous: false,
  },
];

const mockComments = [
  "Congratulations! Well deserved rest 🎉",
  "Same here! The library is now my favorite spot on campus",
  "I agree! Maybe we should start a petition for better food options",
  "Professor Smith is a legend! His classes are always engaging",
  "So excited for the fest! When is it happening?",
  "Count me in for the study group! Math has been challenging",
  "Finally! I've been waiting for the sports complex to open",
  "That chai is addictive! I go there every day now 😄",
  "Great post! Thanks for sharing your experience",
  "This is so relatable! Campus life at its finest",
];

const mockLostFoundItems = [
  {
    type: "lost" as const,
    title: "Black Backpack with Laptop",
    description:
      "Lost my black JanSport backpack containing my laptop, charger, and some notebooks. Last seen near the computer science building on Monday morning.",
    category: "Electronics",
    location: "Computer Science Building",
    tags: ["laptop", "backpack", "urgent"],
  },
  {
    type: "found" as const,
    title: "Silver Wristwatch",
    description:
      "Found a silver wristwatch near the library entrance. It has some engravings on the back. Contact me to claim it.",
    category: "Accessories",
    location: "Library Entrance",
    tags: ["watch", "silver", "engraved"],
  },
  {
    type: "lost" as const,
    title: "Red Water Bottle",
    description:
      "Lost my red Hydro Flask water bottle in the cafeteria during lunch. It has some stickers on it from various tech companies.",
    category: "Personal Items",
    location: "Cafeteria",
    tags: ["water-bottle", "red", "stickers"],
  },
  {
    type: "found" as const,
    title: "Blue Umbrella",
    description:
      "Found a blue umbrella in the parking lot after yesterday's rain. It's in good condition and looks expensive.",
    category: "Personal Items",
    location: "Parking Lot",
    tags: ["umbrella", "blue", "rain"],
  },
  {
    type: "lost" as const,
    title: "Student ID Card",
    description:
      "Lost my student ID card somewhere between the main building and the hostel. Really need it for library access and exams.",
    category: "Documents",
    location: "Between Main Building and Hostel",
    tags: ["id-card", "student", "urgent"],
  },
];

export async function seedSocialData() {
  try {
    console.log("🌱 Starting to seed social data...");

    // Get all existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.log("❌ No users found. Please seed user data first.");
      return;
    }

    console.log(`📊 Found ${users.length} users to work with`);

    // Clear existing social data
    await SocialPost.deleteMany({});
    await SocialComment.deleteMany({});
    await LostFound.deleteMany({});
    await SocialNotification.deleteMany({});
    console.log("🧹 Cleared existing social data");

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < mockPosts.length; i++) {
      const post = mockPosts[i];
      if (!post) continue;

      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (!randomUser) continue;

      // Map user roles to social post roles
      const roleMapping: { [key: string]: string } = {
        student: "student",
        teacher: "faculty",
        admin: "admin",
        staff: "staff",
        admissions_admin: "admin",
        library_admin: "staff",
      };

      const newPost = await SocialPost.create({
        author: randomUser._id,
        authorName: randomUser.name,
        authorRole: roleMapping[randomUser.role] || "student",
        content: post.content,
        tags: post.tags,
        isAnonymous: post.isAnonymous,
        upvotes: [], // Start with empty arrays
        downvotes: [], // Start with empty arrays
        type: "text",
        commentsCount: 0,
      });

      createdPosts.push(newPost);
    }
    console.log(`✅ Created ${createdPosts.length} posts`);

    // Create comments for posts
    let totalComments = 0;
    for (const post of createdPosts) {
      const numComments = Math.floor(Math.random() * 4) + 1; // 1-4 comments per post

      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        if (!randomUser) continue;

        const randomComment =
          mockComments[Math.floor(Math.random() * mockComments.length)];
        if (!randomComment) continue;

        // Map user roles to social comment roles
        const roleMapping: { [key: string]: string } = {
          student: "student",
          teacher: "faculty",
          admin: "admin",
          staff: "staff",
          admissions_admin: "admin",
          library_admin: "staff",
        };

        await SocialComment.create({
          post: post._id,
          author: randomUser._id,
          authorName: randomUser.name,
          authorRole: roleMapping[randomUser.role] || "student",
          content: randomComment,
          upvotes: [], // Start with empty arrays
          downvotes: [], // Start with empty arrays
          isAnonymous: Math.random() < 0.2, // 20% anonymous
          replies: [],
        });

        totalComments++;
      }

      // Update post's comment count
      await SocialPost.findByIdAndUpdate(post._id, {
        commentsCount: numComments,
      });
    }
    console.log(`✅ Created ${totalComments} comments`);

    // Create Lost & Found items
    const createdItems = [];
    for (const item of mockLostFoundItems) {
      if (!item) continue;

      const randomUser = users[Math.floor(Math.random() * users.length)];
      if (!randomUser) continue;

      const newItem = await LostFound.create({
        author: randomUser._id,
        type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        tags: item.tags,
        dateOccurred: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ), // Random date within last 7 days
        upvotes: Math.floor(Math.random() * 10), // 0-9 upvotes
        status:
          item.type === "found" && Math.random() < 0.3
            ? "claimed"
            : item.type === "lost" && Math.random() < 0.2
            ? "found"
            : "active",
      });

      createdItems.push(newItem);
    }
    console.log(`✅ Created ${createdItems.length} lost & found items`);

    // Create some notifications
    let totalNotifications = 0;
    for (const user of users.slice(0, Math.min(users.length, 5))) {
      // Only for first 5 users
      const numNotifications = Math.floor(Math.random() * 3) + 1; // 1-3 notifications per user

      for (let i = 0; i < numNotifications; i++) {
        const randomPost =
          createdPosts[Math.floor(Math.random() * createdPosts.length)];
        if (!randomPost) continue;

        const randomSender = users[Math.floor(Math.random() * users.length)];
        if (!randomSender) continue;

        const notificationTypes = [
          "post_upvote",
          "post_comment",
          "comment_upvote",
        ];
        const randomType =
          notificationTypes[
            Math.floor(Math.random() * notificationTypes.length)
          ];

        let title, message;
        switch (randomType) {
          case "post_upvote":
            title = "Post Upvoted";
            message = `${randomSender.name} upvoted your post`;
            break;
          case "post_comment":
            title = "New Comment";
            message = `${randomSender.name} commented on your post`;
            break;
          case "comment_upvote":
            title = "Comment Upvoted";
            message = `${randomSender.name} upvoted your comment`;
            break;
          default:
            title = "Notification";
            message = "You have a new notification";
        }

        await SocialNotification.create({
          recipient: user._id,
          sender: randomSender._id,
          type: randomType,
          title,
          message,
          relatedPost: randomPost._id,
          isRead: Math.random() < 0.3, // 30% read
        });

        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} notifications`);

    console.log("🎉 Social data seeding completed successfully!");
    console.log(`📈 Summary:
    - Posts: ${createdPosts.length}
    - Comments: ${totalComments}
    - Lost & Found Items: ${createdItems.length}
    - Notifications: ${totalNotifications}
    - Users involved: ${users.length}`);
  } catch (error) {
    console.error("❌ Error seeding social data:", error);
    throw error;
  }
}

// If this file is run directly
if (require.main === module) {
  const mongoUri =
    process.env["MONGODB_URI"] || "mongodb://localhost:27017/gcet_db";

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("📡 Connected to MongoDB");
      return seedSocialData();
    })
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
