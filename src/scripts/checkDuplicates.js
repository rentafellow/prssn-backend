
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI);
        
        console.log("\n--- SEARCHING FOR DUPLICATES ---\n");

        const email = 'awadhkishorsingh241@gmail.com';
        const usersByEmail = await User.find({ email: email.toLowerCase() });
        console.log(`Users with email '${email}': ${usersByEmail.length}`);
        usersByEmail.forEach((u, i) => {
            console.log(`  [${i+1}] ID: ${u._id}`);
            console.log(`      Username: ${u.username}`);
            console.log(`      Role: ${u.role}`);
            console.log(`      Verified: ${u.isEmailVerified}`);
        });

        const username = 'superadmin';
        const usersByUsername = await User.find({ username: username });
        console.log(`\nUsers with username '${username}': ${usersByUsername.length}`);
        usersByUsername.forEach((u, i) => {
            console.log(`  [${i+1}] ID: ${u._id}`);
            console.log(`      Email: ${u.email}`);
            console.log(`      Role: ${u.role}`);
            console.log(`      Verified: ${u.isEmailVerified}`);
        });
        
        console.log("\n--------------------------------\n");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

checkDuplicates();
