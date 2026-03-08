import nodemailer from "nodemailer";

/**
 * sendEmail.js - Email Utility using Nodemailer
 * 
 * Requirements in .env:
 * - EMAIL_USER: Your Gmail address
 * - EMAIL_PASS: Your 16-digit Google App Password
 */

// Create the transporter globally (or lazily)
// Using lazy initialization prevents issues if environment variables aren't loaded yet.
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        // Validation
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ CRITICAL: EMAIL_USER or EMAIL_PASS missing in .env file.");
            // We assume caller handles this, or setup forces it.
        }

        transporter = nodemailer.createTransport({
            service: "gmail",
            pool: true, // Enable connection pooling for faster delivery
            maxConnections: 5,
            debug: true, // Show detailed debug info from SMTP
            logger: true, // Log to console
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, 
            },
        });
    }
    return transporter;
};

/**
 * Sends an email using the configured transporter.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Subject line
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const emailTransporter = getTransporter();

        // Send Logic
        const info = await emailTransporter.sendMail({
            from: process.env.EMAIL_USER, // Sender address (must match auth user for Gmail)
            to,
            subject,
            text,
            html,
        });

        console.log(`✅ Email sent to ${to}. ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        // Log full error for debugging if needed
        // console.error(error); 
        return { success: false, error: error.message };
    }
};
