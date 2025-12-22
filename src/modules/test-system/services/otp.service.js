const { mailer } = require("../../../config/mailer");

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} studentName - Student name for personalization
 */
async function sendOTPEmail(email, otp, studentName) {
    try {
        await mailer.sendMail({
            from: `"Test System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Test Access OTP",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Test Access Verification</h2>
          <p>Hello ${studentName},</p>
          <p>Your OTP for test access is:</p>
          <h1 style="background: #F3F4F6; padding: 20px; text-align: center; color: #4F46E5; letter-spacing: 5px;">
            ${otp}
          </h1>
          <p style="color: #6B7280;">This OTP will expire in 10 minutes.</p>
          <p style="color: #DC2626; font-size: 12px;">
            <strong>Do not share this OTP with anyone.</strong>
          </p>
        </div>
      `,
        });
        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
}

module.exports = {
    generateOTP,
    sendOTPEmail,
};
