import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const testResend = async () => {
    try {
        console.log("Using API Key:", process.env.RESEND_API_KEY ? "Yes" : "No");
        console.log("From:", process.env.EMAIL_FROM);
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: "awadhkishorsingh241@gmail.com",
            subject: "Resend Test",
            html: "<p>Test</p>"
        });

        if (error) {
            console.error("Resend API Error:", error);
        } else {
            console.log("Success! Data:", data);
        }
    } catch (e) {
        console.error("Catch Error:", e);
    }
}

testResend();
