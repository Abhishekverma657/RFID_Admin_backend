const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("Skipping email: EMAIL_USER/PASS not set.");
            return;
        }

        const mailOptions = {
            from: `"Test System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log. We don't want to break the flow if email fails.
    }
};

exports.sendStudentCredentials = async (student, test, password) => {
    const subject = `Your Exam Credentials for ${test.title}`;
    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/test/${test._id}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Exam Registration Successful</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>You have been registered for the exam: <strong>${test.title}</strong>.</p>
            <p><strong>Exam Details:</strong></p>
            <ul>
                <li><strong>Start Time:</strong> ${test.startTime ? new Date(test.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</li>
                <li><strong>End Time:</strong> ${test.endTime ? new Date(test.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</li>
                <li><strong>Duration:</strong> ${test.duration} Minutes</li>
                <li><strong>Total Marks:</strong> ${test.totalMarks}</li>
            </ul>
            <p><strong>Your Credentials:</strong></p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>User ID:</strong> ${student.userId}</p>
            </div>
            <p>Please use the button below to start your test:</p>
            <div style="margin: 20px 0;">
                <a href="${loginLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    START EXAM NOW
                </a>
            </div>
            <p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this link in your browser:</p>
            <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${loginLink}</p>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <strong>Instructions:</strong><br>
                1. Ensure you have a stable internet connection.<br>
                2. Webcam must be enabled.<br>
                3. Do not switch tabs during the exam.
            </p>
        </div>
    `;

    return sendEmail(student.email, subject, html);
};

exports.sendSubmissionConfirmation = async (student, test, submissionTime) => {
    const subject = `Exam Submitted: ${test.title}`;
    const dateStr = new Date(submissionTime).toLocaleString();

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #16a34a;">Exam Submitted Successfully</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>Your attempt for <strong>${test.title}</strong> has been received.</p>
            <p><strong>Submission Time:</strong> ${dateStr}</p>
            <p>Your results will be communicated shortly after evaluation.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
        </div>
    `;

    return sendEmail(student.email, subject, html);
};

exports.sendResultNotification = async (student, test, result) => {
    const subject = `Exam Results: ${test.title}`;
    const isPass = result.score >= test.passingMarks;
    const color = isPass ? '#16a34a' : '#dc2626';
    const status = isPass ? 'PASSED' : 'FAILED';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Exam Results Announced</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>The results for <strong>${test.title}</strong> have been declared.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: ${color}; margin: 0; font-size: 36px;">${result.score} / ${test.totalMarks}</h1>
                <h3 style="color: #475569; margin: 10px 0 0 0;">${status}</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center;">
                <div style="background: #f0fff4; padding: 10px; border-radius: 4px;">
                    <span style="display: block; font-size: 12px; color: #16a34a;">Correct</span>
                    <strong>${result.correct}</strong>
                </div>
                <div style="background: #fef2f2; padding: 10px; border-radius: 4px;">
                    <span style="display: block; font-size: 12px; color: #dc2626;">Incorrect</span>
                    <strong>${result.incorrect}</strong>
                </div>
                <div style="background: #f3f4f6; padding: 10px; border-radius: 4px;">
                    <span style="display: block; font-size: 12px; color: #4b5563;">Unattempted</span>
                    <strong>${result.unattempted}</strong>
                </div>
                <div style="background: #eff6ff; padding: 10px; border-radius: 4px;">
                    <span style="display: block; font-size: 12px; color: #2563eb;">Accuracy</span>
                    <strong>${result.accuracy}%</strong>
                </div>
            </div>
        </div>
    `;

    return sendEmail(student.email, subject, html);
};
