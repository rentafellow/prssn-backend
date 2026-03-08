/**
 * Script to verify MongoDB indexes are created
 * Run this after starting the server to ensure indexes are in place
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const verifyIndexes = async () => {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('📊 Checking User collection indexes...');
        const indexes = await User.collection.getIndexes();
        
        console.log('\n📋 Current Indexes:');
        console.log('='.repeat(50));
        Object.entries(indexes).forEach(([name, index]) => {
            console.log(`\n Index: ${name}`);
            console.log(`   Keys:`, index.key);
            if (index.unique) console.log(`   Unique: true`);
        });
        console.log('\n' + '='.repeat(50));

        // Count documents
        const totalUsers = await User.countDocuments();
        const companions = await User.countDocuments({ role: 'companion', verificationStatus: 'verified' });
        
        console.log('\n📈 Collection Statistics:');
        console.log(`   Total Users: ${totalUsers}`);
        console.log(`   Verified Companions: ${companions}`);

        // Test query performance
        console.log('\n⚡ Testing Query Performance...');
        
        const start = Date.now();
        await User.find({ role: 'companion', verificationStatus: 'verified' })
            .select('fullName email city')
            .lean()
            .limit(10);
        const end = Date.now();
        
        console.log(`   Query time: ${end - start}ms`);
        
        if (end - start < 100) {
            console.log('   ✅ Query performance is excellent!');
        } else if (end - start < 500) {
            console.log('   ⚠️  Query performance is acceptable');
        } else {
            console.log('   ❌ Query performance needs improvement');
        }

        console.log('\n✅ Index verification complete!\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

verifyIndexes();
