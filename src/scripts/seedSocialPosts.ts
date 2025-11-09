import mongoose from "mongoose";
import SocialPost from "../models/SocialPost";
import Student from "../models/Student";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env["MONGODB_URI"] as string;

const samplePosts = [
  {
    content: "Just finished my semester exams! 🎉 Time to relax and enjoy the break. How did everyone else do?",
    type: "text",
    tags: ["exams", "college-life", "semester"],
    isAnonymous: false,
  },
  {
    content: "Does anyone have notes for Data Structures? I missed a few classes and need to catch up. Would really appreciate the help! 📚",
    type: "text",
    tags: ["academics", "help-needed", "cse"],
    isAnonymous: false,
  },
  {
    content: "The new canteen menu is amazing! 🍕🍔 Highly recommend trying the new pizza. Finally some good food on campus!",
    type: "text",
    tags: ["food", "canteen", "campus-life"],
    isAnonymous: false,
  },
  {
    content: "Looking for teammates for the upcoming hackathon. Need 2 more people with web dev experience. DM me if interested! 💻",
    type: "text",
    tags: ["hackathon", "team", "collaboration"],
    isAnonymous: false,
  },
  {
    content: "Why is the WiFi so slow in Block A? 😤 Can't even load a simple webpage. Anyone else facing this issue?",
    type: "text",
    tags: ["campus", "wifi", "complaints"],
    isAnonymous: true,
  },
  {
    content: "Shoutout to Professor Sharma for making Algorithms so interesting! Best teacher ever 🙌",
    type: "text",
    tags: ["faculty", "appreciation", "academics"],
    isAnonymous: false,
  },
  {
    content: "Found someone's ID card near the library. Has the name 'Priya Patel' on it. Please DM to claim!",
    type: "text",
    tags: ["lost-and-found", "help", "library"],
    isAnonymous: false,
  },
  {
    content: "The cultural fest was absolutely incredible! Loved all the performances. Can't wait for next year! 🎭🎵",
    type: "text",
    tags: ["fest", "cultural", "events"],
    isAnonymous: false,
  },
  {
    content: "Anyone up for a football match tomorrow evening at 5 PM? Need at least 10 people. Comment if you're in! ⚽",
    type: "text",
    tags: ["sports", "football", "recreation"],
    isAnonymous: false,
  },
  {
    content: "Just got placed at a great company! 🎊 Hard work really pays off. Don't give up on your dreams, fellow students!",
    type: "text",
    tags: ["placements", "success", "motivation"],
    isAnonymous: false,
  },
];

async function seedSocialPosts() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Check if posts already exist
    const existingPostsCount = await SocialPost.countDocuments();
    if (existingPostsCount > 0) {
      console.log(`ℹ️  ${existingPostsCount} posts already exist. Clearing...`);
      await SocialPost.deleteMany({});
      console.log("✅ Existing posts cleared");
    }

    // Get some students to use as authors
    const students = await Student.find().limit(10);
    if (students.length === 0) {
      console.log("❌ No students found in database. Please seed students first.");
      process.exit(1);
    }

    console.log(`✅ Found ${students.length} students to use as authors`);

    // Create posts with random upvotes/downvotes
    const posts = samplePosts.map((post, index) => {
      const student = students[index % students.length];
      if (!student) throw new Error("No student found");
      
      const upvoteCount = Math.floor(Math.random() * 50) + 1;
      const downvoteCount = Math.floor(Math.random() * 10);
      
      // Generate random user IDs for upvotes/downvotes
      const upvotes = Array.from({ length: upvoteCount }, () => 
        new mongoose.Types.ObjectId().toString()
      );
      const downvotes = Array.from({ length: downvoteCount }, () => 
        new mongoose.Types.ObjectId().toString()
      );

      return {
        ...post,
        author: student._id,
        authorName: post.isAnonymous ? "Anonymous" : student.name,
        authorRole: post.isAnonymous ? "student" : "student",
        images: [],
        upvotes,
        downvotes,
        totalScore: upvoteCount - downvoteCount,
        commentsCount: Math.floor(Math.random() * 15),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
      };
    });

    await SocialPost.insertMany(posts);
    console.log(`✅ Created ${posts.length} social posts`);

    console.log("\n📊 Sample posts created:");
    posts.forEach((post, index) => {
      console.log(`  ${index + 1}. "${post.content.substring(0, 50)}..." - ${post.totalScore} points`);
    });

    console.log("\n✅ Social posts seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding social posts:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

seedSocialPosts();

