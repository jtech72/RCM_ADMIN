const mongoose = require('mongoose');

/**
 * Category Schema for dynamic blog categorization
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            maxlength: [50, 'Category name cannot exceed 50 characters'],
            index: true
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters']
        },

        color: {
            type: String,
            default: '#6366f1',
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
        },

        icon: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        blogCount: {
            type: Number,
            default: 0,
            min: [0, 'Blog count cannot be negative']
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required']
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Pre-save hook for slug generation
categorySchema.pre('save', function (next) {
    if (this.isModified('name') || (this.isNew && !this.slug)) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Static method to find active categories
categorySchema.statics.findActive = function () {
    return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to increment blog count
categorySchema.statics.incrementBlogCount = function (categoryName) {
    return this.findOneAndUpdate(
        { name: categoryName, isActive: true },
        { $inc: { blogCount: 1 } },
        { new: true }
    );
};

// Static method to decrement blog count
categorySchema.statics.decrementBlogCount = function (categoryName) {
    return this.findOneAndUpdate(
        { name: categoryName },
        { $inc: { blogCount: -1 } },
        { new: true }
    );
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;