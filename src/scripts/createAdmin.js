
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { hashPassword } from '../utils/hash.js';

dotenv.config();

const connectMongo = async () => {
    try {
        if (!process.env.MONGO_DB_URI) {
            console.warn("MONGO_DB_URI is not defined.");
            return;
        }
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log("MongoDB Connected for Script");
    } catch (err) {
        console.error("MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
};

const createAdmin = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log("\nUsage: node src/scripts/createAdmin.js <username> <email> <password>");
    console.log("Example: node src/scripts/createAdmin.js superadmin admin@example.com secret123\n");
    process.exit(1);
  }

  const [username, email, password] = args;

  console.log(`\nCreating/Updating SuperAdmin: ${username} (${email})...`);

  await connectMongo();

  try {
    const hashed = await hashPassword(password);
    
    // Check if user exists
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username }]
    });

    let userId;

    if (existingUser) {
        console.log("User already exists. Updating to superadmin role and password...");
        existingUser.password = hashed;
        existingUser.role = 'superadmin';
        existingUser.isEmailVerified = true;
        existingUser.verificationStatus = 'verified'; // Auto-verify
        await existingUser.save();
        userId = existingUser._id;
        
        console.log(`✓ User ${username} updated to SuperAdmin.`);
    } else {
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashed,
            role: 'superadmin',
            isEmailVerified: true,
            verificationStatus: 'verified'
        });
        await newUser.save();
        userId = newUser._id;

        console.log(`✓ New SuperAdmin ${username} created.`);
    }

    // Ensure Admin detail doc exists
    const adminDetail = await Admin.findOne({ userId: userId });
    if (!adminDetail) {
        await new Admin({ 
            userId: userId, 
            verificationStatus: 'verified',
            fullName: username,
            phoneNumber: 'N/A'
        }).save();
        console.log(`✓ Created Admin detail record.`);
    } else {
        adminDetail.verificationStatus = 'verified';
        await adminDetail.save();
        console.log(`✓ Updated Admin detail record.`);
    }

    console.log(`\n✅ SUCCESS! SuperAdmin ${username} is ready.`);
    console.log(`📊 Collections updated:`);
    console.log(`   - users (role: superadmin, status: verified)`);
    console.log(`   - admins (detail record)`);

  } catch (e) {
    console.error("ERROR creating admin:", e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
