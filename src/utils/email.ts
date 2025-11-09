import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env["SMTP_HOST"] || "smtp.gmail.com",
    port: parseInt(process.env["SMTP_PORT"] || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env["SMTP_FROM"] || process.env["SMTP_USER"],
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    // Don't throw error to prevent breaking the main flow
    // In production, you might want to log this to a service like Sentry
  }
};

// Email templates
export const emailTemplates = {
  admissionApproved: (
    studentName: string,
    studentId: string,
    course: string,
    feeAmount: number
  ) => ({
    subject: "GCET Admission Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Admission Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to GCET College</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Congratulations! We are pleased to inform you that your admission to GCET College has been approved.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0;">📋 Admission Details</h3>
            <p><strong>Student ID:</strong> ${studentId}</p>
            <p><strong>Course:</strong> ${course}</p>
            <p><strong>Fee Amount:</strong> ₹${feeAmount}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            <strong>Next Steps:</strong>
          </p>
          <ol style="color: #555; line-height: 1.6;">
            <li>Complete your fee payment</li>
            <li>Submit required documents</li>
            <li>Attend orientation (details will be sent separately)</li>
          </ol>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>📧 Need Help?</strong> Contact us at admissions@gcet.edu or call +91-XXXXXXXXXX
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We look forward to welcoming you to our campus!
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>GCET Admissions Team</strong>
          </p>
        </div>
      </div>
    `,
  }),

  feeReceipt: (
    studentName: string,
    amountPaid: number,
    totalAmount: number,
    remaining: number
  ) => ({
    subject: "GCET Fee Receipt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">💰 Fee Receipt</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Your fee payment has been recorded successfully. Thank you for your prompt payment.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #333; margin-top: 0;">📊 Payment Summary</h3>
            <p><strong>Total Fee:</strong> ₹${totalAmount}</p>
            <p><strong>Amount Paid:</strong> ₹${amountPaid}</p>
            <p><strong>Remaining Balance:</strong> ₹${remaining}</p>
            <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${
            remaining > 0
              ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Remaining Balance:</strong> Please complete the remaining payment of ₹${remaining} to avoid any late fees.
              </p>
            </div>
          `
              : `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;">
                <strong>✅ Payment Complete:</strong> All fees have been paid. You are now fully enrolled!
              </p>
            </div>
          `
          }
          
          <p style="color: #555; line-height: 1.6;">
            <strong>Payment Methods:</strong>
          </p>
          <ul style="color: #555; line-height: 1.6;">
            <li>Online Banking</li>
            <li>Credit/Debit Card</li>
            <li>UPI Payment</li>
            <li>Cash at College Counter</li>
          </ul>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>📧 Questions?</strong> Contact finance@gcet.edu or call +91-XXXXXXXXXX
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>GCET Finance Team</strong>
          </p>
        </div>
      </div>
    `,
  }),

  bookBorrowed: (
    studentName: string,
    bookTitle: string,
    author: string,
    dueDate: string,
    transactionId: string
  ) => ({
    subject: "Book Borrowed Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📚 Book Borrowed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Library Transaction Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            You have successfully borrowed a book from the GCET Library. Please note the important details below.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="color: #333; margin-top: 0;">📖 Book Details</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Author:</strong> ${author}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> Please return the book on or before the due date to avoid fines. 
              Late returns are charged ₹5 per day.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            <strong>Library Hours:</strong><br>
            Monday - Friday: 8:00 AM - 8:00 PM<br>
            Saturday: 9:00 AM - 5:00 PM<br>
            Sunday: Closed
          </p>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>📧 Need Help?</strong> Contact library@gcet.edu or visit the library counter
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>GCET Library Team</strong>
          </p>
        </div>
      </div>
    `,
  }),
};

export default sendEmail;
