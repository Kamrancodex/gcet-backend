import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import OTP from "../models/OTP";
import emailService from "../services/emailService";

const router = Router();

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: Initiate login with email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🚨 DEVELOPMENT ONLY: Log login attempt
    if (process.env["NODE_ENV"] !== "production") {
      console.log(
        `\n🔑 LOGIN ATTEMPT: ${user.name} (${user.email}) - Role: ${user.role}`
      );
      console.log(`📤 Sending OTP for verification...`);
    }

    // Generate and save OTP
    const otpCode = generateOTP();

    // 🚨 DEVELOPMENT ONLY: Log OTP to console for easy testing
    if (process.env["NODE_ENV"] !== "production") {
      console.log(`\n🔐 LOGIN OTP for ${email}: ${otpCode}`);
      console.log(`📧 Use this OTP to complete login verification\n`);
    }

    // Remove any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Create new OTP
    await OTP.create({ email, otp: otpCode });

    // Send OTP via email
    const emailResult = await emailService.sendLoginOTP(
      email,
      otpCode,
      user.name
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // For development, we might still allow login without email
      // In production, this should fail
    }

    return res.json({
      message: "OTP sent to your email",
      requiresOTP: true,
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email for security
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Step 2: Verify OTP and complete login
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const otpRecord = await OTP.findOne({
      email,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(429)
        .json({ error: "Too many attempts. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // OTP is valid, mark as verified
    await OTP.updateOne({ _id: otpRecord._id }, { verified: true });

    // Get user and generate JWT
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // 🚨 DEVELOPMENT ONLY: Log successful login
    if (process.env["NODE_ENV"] !== "production") {
      console.log(
        `\n✅ LOGIN SUCCESS: ${user.name} (${user.email}) - Role: ${user.role}`
      );
      console.log(`🎯 User can now access ${user.role} dashboard features\n`);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env["JWT_SECRET"] as string,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new OTP
    const otpCode = generateOTP();

    // 🚨 DEVELOPMENT ONLY: Log resend OTP to console for easy testing
    if (process.env["NODE_ENV"] !== "production") {
      console.log(`\n🔄 RESEND OTP for ${email}: ${otpCode}`);
      console.log(`📧 Use this new OTP to complete login verification\n`);
    }

    // Remove existing OTPs
    await OTP.deleteMany({ email });

    // Create new OTP
    await OTP.create({ email, otp: otpCode });

    // Send OTP via email
    const emailResult = await emailService.sendLoginOTP(
      email,
      otpCode,
      user.name
    );

    if (!emailResult.success) {
      console.error("Failed to resend OTP email:", emailResult.error);
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    return res.json({
      message: "New OTP sent to your email",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
