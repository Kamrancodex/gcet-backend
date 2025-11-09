import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: parseInt(process.env["SMTP_PORT"] || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env["SMTP_USER"],
        pass: process.env["SMTP_PASS"],
      },
    });
  }

  async sendLoginOTP(email: string, otp: string, userName: string) {
    const mailOptions = {
      from: process.env["EMAIL_FROM"] || "GCET Admissions <noreply@gcet.edu>",
      to: email,
      subject: "GCET Login Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">GCET Admissions Portal</h2>
          <p>Hello ${userName},</p>
          <p>Your login verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            GCET Admissions Portal<br>
            Government College of Engineering and Technology
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email send error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendWelcomeEmail(email: string, userName: string, role: string) {
    const mailOptions = {
      from: process.env["EMAIL_FROM"] || "GCET Admissions <noreply@gcet.edu>",
      to: email,
      subject: "Welcome to GCET Admissions Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to GCET Admissions Portal!</h2>
          <p>Hello ${userName},</p>
          <p>Your account has been successfully created with the role: <strong>${role}</strong></p>
          <p>You can now access the portal at: <a href="http://localhost:5174">GCET Admissions Portal</a></p>
          <p>Thank you for joining GCET!</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            GCET Admissions Portal<br>
            Government College of Engineering and Technology
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Welcome email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Welcome email send error:", error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new EmailService();
