import mongoose from "mongoose";
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env["MONGODB_URI"] ||
  "mongodb+srv://mickeym4044:e2ngduK5G9y8EWkJ@cluster0gcet.6ssgum8.mongodb.net/gcet_db";

async function testLibrarianLogin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Check if librarian user exists
    const librarian = await User.findOne({ email: "library@gcet.edu" });

    if (librarian) {
      console.log("✅ Librarian user found:");
      console.log(`  Name: ${librarian.name}`);
      console.log(`  Email: ${librarian.email}`);
      console.log(`  Role: ${librarian.role}`);
      console.log(`  ID: ${librarian._id}`);
    } else {
      console.log("❌ Librarian user not found. Creating now...");

      // Create librarian user
      const newLibrarian = new User({
        name: "Library Admin",
        email: "library@gcet.edu",
        password: "library123", // Will be hashed automatically
        role: "library_admin",
        phone: "+91-9876543202",
      });

      await newLibrarian.save();
      console.log("✅ Librarian user created successfully!");
    }

    // Test login credentials
    console.log("\n📋 Librarian Login Credentials:");
    console.log("  Email: library@gcet.edu");
    console.log("  Password: library123");
    console.log("  Role: library_admin");

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error testing librarian login:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testLibrarianLogin();
