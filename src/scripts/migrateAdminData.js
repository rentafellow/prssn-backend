import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

dotenv.config();

const migrateAdminPhotos = async () => {
    try {
        if (!process.env.MONGO_DB_URI) {
            console.error("MONGO_DB_URI is not defined.");
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log("MongoDB Connected for Migration");

        // Find all admins in Admin collection
        const admins = await Admin.find({});
        console.log(`Found ${admins.length} admin detail records`);

        let updated = 0;
        for (const admin of admins) {
            // Find corresponding User
            const user = await User.findById(admin.userId);
            
            if (!user) {
                console.log(`⚠️  User not found for admin ${admin.userId}`);
                continue;
            }

            // Check if User already has profilePhotoUrl
            if (user.profilePhotoUrl) {
                console.log(`✓ User ${user.username} already has profilePhotoUrl`);
                continue;
            }

            // Migrate data from Admin to User if missing
            let needsUpdate = false;
            
            if (admin.frontAadharPhoto && !user.profilePhotoUrl) {
                // If there's a verification doc but no profile photo, we can't migrate
                // because frontAadharPhoto is the verification document, not profile photo
                console.log(`⚠️  Admin ${user.username} has verification doc but no profile photo in Admin collection`);
            }

            if (admin.fullName && !user.fullName) {
                user.fullName = admin.fullName;
                needsUpdate = true;
            }

            if (admin.phoneNumber && !user.phoneNumber) {
                user.phoneNumber = admin.phoneNumber;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await user.save();
                updated++;
                console.log(`✓ Updated user ${user.username} with data from Admin collection`);
            }
        }

        console.log(`\n✅ Migration complete! Updated ${updated} users.`);
        console.log(`\nNote: Profile photos cannot be migrated automatically.`);
        console.log(`Admins without profile photos need to re-onboard or have their photo manually added.`);

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

migrateAdminPhotos();
