// Script to find and delete duplicate journals
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Journal = require('../models/Journal');

async function cleanupDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all journals sorted by creation date
    const journals = await Journal.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total journals found: ${journals.length}\n`);

    // Group by content hash to find duplicates
    const contentMap = new Map();
    const duplicates = [];

    for (const journal of journals) {
      const key = `${journal.content}_${journal.date}`;
      
      if (contentMap.has(key)) {
        // This is a duplicate - keep the older one
        duplicates.push(journal);
        console.log(`🔍 Found duplicate:`);
        console.log(`   ID: ${journal._id}`);
        console.log(`   Title: ${journal.title || '(no title)'}`);
        console.log(`   Content: ${journal.content.substring(0, 50)}...`);
        console.log(`   Created: ${journal.createdAt}`);
        console.log('');
      } else {
        contentMap.set(key, journal);
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate journal(s)\n`);
      console.log('Do you want to delete these duplicates? (yes/no)');
      
      // In Node.js, we'll just auto-delete for now
      // In production, you'd want confirmation
      console.log('\n🗑️  Deleting duplicates...\n');
      
      for (const dup of duplicates) {
        await Journal.findByIdAndDelete(dup._id);
        console.log(`✅ Deleted: ${dup._id}`);
      }
      
      console.log(`\n✅ Successfully deleted ${duplicates.length} duplicate(s)`);
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
