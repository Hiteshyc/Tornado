import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailUser,
    pass: env.gmailAppPassword,
  },
});

export const emailService = {
  async sendOtpEmail(toEmail, otp) {
    const subject = "Your Password Reset Code";
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Password Reset Code</h2>
        <p style="color: #555;">
          Use the code below to reset your password. It expires in
          <strong>${env.otpExpiryMinutes} minutes</strong>.
        </p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 12px;
          text-align: center;
          padding: 24px;
          background: #f4f4f4;
          border-radius: 8px;
          color: #111;
          margin: 24px 0;
        ">${otp}</div>
        <p style="color: #999; font-size: 13px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    if (!env.emailUser || !env.gmailAppPassword) {
      // Development fallback — no Gmail credentials configured
      console.log(`\n[emailService] DEV MODE — OTP for ${toEmail}: ${otp}\n`);
      return;
    }

    await transporter.sendMail({
      from: env.emailFrom,
      to: toEmail,
      subject,
      html,
    });
  },
};
