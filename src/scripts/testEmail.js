
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { sendEmail } from "../utils/sendEmail.js";

// Load .env from backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

console.log("Testing email configuration...");
console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
// obfuscate pass
const pass = process.env.EMAIL_PASS || "";
console.log(`EMAIL_PASS: ${pass.substring(0, 3)}...${pass.substring(pass.length - 3)} (length: ${pass.length})`);

async function runTest() {
    console.log("Attempting to send test email...");
    const result = await sendEmail({
        to: "awadhkishorsingh8081@gmail.com",
        subject: "Verify your Email",
        text: "Your verification code is 123456",
        html: "<p>Your verification code is <b>123456</b>. It expires in 10 minutes.</p>"
    });

    if (result.success) {
        console.log("✅ Email sent successfully!");
        console.log("Message ID:", result.messageId);
    } else {
        console.error("❌ Email failed to send.");
        console.error("Error:", result.error);
    }
}

runTest();
