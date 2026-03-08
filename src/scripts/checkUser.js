
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkUser = async () => {
    const email = 'awadhkishorsingh241@gmail.com';
    
    try {
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log("Connected to MongoDB...");
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            console.log("\n--- USER FOUND ---");
            console.log(`ID: ${user._id}`);
            console.log(`Username: ${user.username}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: '${user.role}'`); // quotes to see spacing
            console.log(`isEmailVerified: ${user.isEmailVerified}`);
            console.log(`VerificationStatus: ${user.verificationStatus}`);
            console.log("------------------\n");
            
            // Force fix if needed
            if (user.role !== 'superadmin' || !user.isEmailVerified) {
                console.log("⚠️ Fixing user status...");
                user.role = 'superadmin';
                user.isEmailVerified = true;
                user.verificationStatus = 'verified';
                // user.markModified('role'); 
                await user.save();
                console.log("✅ User updated manually to superadmin/verified");
            } else {
                console.log("✅ User is already configured correctly as SuperAdmin.");
            }
            
        } else {
            console.log("❌ User not found!");
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
