const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

/**
 * Migration script to create Category documents from existing blog categories
 * This script should be run once after implementing the dynamic category system
 */

async function migrateCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find an admin user to assign as creator
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // Get all unique categories from existing blogs
        const existingCategories = await Blog.distinct('category');
        console.log(`📊 Found ${existingCategories.length} unique categories:`, existingCategories);

        // Create Category documents for each unique category
        const createdCategories = [];
        
        for (const categoryName of existingCategories) {
            if (!categoryName || categoryName.trim() === '') continue;

            // Check if category already exists
            const existingCategory = await Category.findOne({ name: categoryName });
            if (existingCategory) {
                console.log(`⏭️  Category "${categoryName}" already exists, skipping...`);
                continue;
            }

            // Count blogs for this category
            const blogCount = await Blog.countDocuments({ 
                category: categoryName, 
                status: 'published' 
            });

            // Create new category
            const category = new Category({
                name: categoryName,
                description: `Auto-generated category for ${categoryName}`,
                blogCount: blogCount,
                createdBy: adminUser._id,
                isActive: true
            });

            await category.save();
            createdCategories.push({
                name: categoryName,
                blogCount: blogCount,
                slug: category.slug
            });

            console.log(`✅ Created category: "${categoryName}" with ${blogCount} blogs`);
        }

        console.log('\n📋 Migration Summary:');
        console.log(`✅ Successfully created ${createdCategories.length} categories`);
        console.log('\n📊 Created Categories:');
        createdCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.blogCount} blogs) - slug: ${cat.slug}`);
        });

        console.log('\n🎉 Category migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateCategories();
}

module.exports = migrateCategories;