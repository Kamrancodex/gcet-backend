import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User";

dotenv.config();

async function main() {
  await mongoose.connect(process.env["MONGO_URI"] as string);
  const users = [
    {
      name: "Admissions Admin",
      email: "admissions@gcet.edu",
      role: "admissions_admin",
      password: "admin123",
    },
    {
      name: "Principal",
      email: "principal@gcet.edu",
      role: "admin",
      password: "admin123",
    },
    {
      name: "Teacher One",
      email: "teacher1@gcet.edu",
      role: "teacher",
      password: "teacher123",
    },
    {
      name: "Student One",
      email: "student1@gcet.edu",
      role: "student",
      password: "student123",
    },
  ];
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({
        name: u.name,
        email: u.email,
        role: u.role as any,
        passwordHash,
      });
      console.log("Created", u.email);
    }
  }
  console.log("Seed complete");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
