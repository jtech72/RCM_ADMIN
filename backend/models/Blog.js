const mongoose = require('mongoose');

/**
 * Blog Schema with comprehensive fields for content management, SEO, and engagement tracking
 */
const blogSchema = new mongoose.Schema(
    {
        // Content Fields
        title: {
            type: String,
            required: [true, 'Blog title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        content: {
            type: String,
            required: [true, 'Blog content is required']
        },

        excerpt: {
            type: String,
            required: [true, 'Blog excerpt is required'],
            maxlength: [500, 'Excerpt cannot exceed 500 characters']
        },

        coverImage: {
            url: {
                type: String,
                default: ''
            },
            alt: {
                type: String,
                default: ''
            }
        },

        // Metadata Fields
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required']
        },

        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            index: true
        },

        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],

        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true
        },

        featured: {
            type: Boolean,
            default: false,
            index: true
        },

        // SEO Metadata
        seoMetadata: {
            metaTitle: {
                type: String,
                maxlength: [60, 'Meta title cannot exceed 60 characters']
            },
            metaDescription: {
                type: String,
                maxlength: [160, 'Meta description cannot exceed 160 characters']
            },
            keywords: [{
                type: String,
                trim: true,
                lowercase: true
            }],
            ogImage: {
                type: String,
                default: ''
            }
        },

        // Engagement Fields
        readingTime: {
            type: Number,
            default: 0,
            min: [0, 'Reading time cannot be negative']
        },

        viewCount: {
            type: Number,
            default: 0,
            min: [0, 'View count cannot be negative']
        },

        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field for like count
blogSchema.virtual('likeCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Pre-save hook for slug generation
blogSchema.pre('save', function (next) {
    if (this.isModified('title') || (this.isNew && !this.slug)) {
        // Generate slug from title
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

        // Ensure uniqueness by appending timestamp if needed
        if (this.isNew) {
            const timestamp = Date.now().toString().slice(-6);
            this.slug = `${this.slug}-${timestamp}`;
        }
    }
    next();
});

// Pre-save hook for reading time calculation
blogSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Calculate reading time based on word count
        // Average reading speed: 200 words per minute
        const wordCount = this.content.split(/\s+/).length;
        this.readingTime = Math.ceil(wordCount / 200);
    }
    next();
});

// Comprehensive indexes for efficient queries
// Single field indexes
blogSchema.index({ slug: 1 }); // Unique slug lookup
blogSchema.index({ status: 1 }); // Status filtering
blogSchema.index({ category: 1 }); // Category filtering
blogSchema.index({ featured: 1 }); // Featured blogs
blogSchema.index({ viewCount: -1 }); // Popular blogs sorting
blogSchema.index({ createdAt: -1 }); // Recent blogs sorting
blogSchema.index({ updatedAt: -1 }); // Recently updated blogs

// Compound indexes for complex queries
blogSchema.index({ status: 1, createdAt: -1 }); // Published blogs by date
blogSchema.index({ status: 1, featured: 1, createdAt: -1 }); // Featured published blogs
blogSchema.index({ status: 1, category: 1, createdAt: -1 }); // Category filtering with date
blogSchema.index({ status: 1, tags: 1, createdAt: -1 }); // Tag filtering with date
blogSchema.index({ status: 1, viewCount: -1 }); // Popular published blogs
blogSchema.index({ author: 1, status: 1, createdAt: -1 }); // Author's blogs
blogSchema.index({ category: 1, status: 1, featured: 1 }); // Category + featured
blogSchema.index({ tags: 1, status: 1, featured: 1 }); // Tags + featured

// Text index for search functionality
blogSchema.index({
    title: 'text',
    content: 'text',
    excerpt: 'text',
    'seoMetadata.keywords': 'text'
}, {
    weights: {
        title: 10,
        excerpt: 5,
        'seoMetadata.keywords': 3,
        content: 1
    },
    name: 'blog_text_search'
});

// Sparse indexes for optional fields
blogSchema.index({ 'seoMetadata.metaTitle': 1 }, { sparse: true });
blogSchema.index({ 'coverImage.url': 1 }, { sparse: true });

// Static method to find published blogs
blogSchema.statics.findPublished = function () {
    return this.find({ status: 'published' });
};

// Static method to find featured blogs
blogSchema.statics.findFeatured = function () {
    return this.find({ featured: true, status: 'published' });
};

// Instance method to increment view count
blogSchema.methods.incrementViewCount = function () {
    this.viewCount += 1;
    return this.save();
};

// Instance method to toggle like
blogSchema.methods.toggleLike = function (userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const likeIndex = this.likes.findIndex(id => id.toString() === userObjectId.toString());

    if (likeIndex > -1) {
        // User already liked, remove like
        this.likes.splice(likeIndex, 1);
    } else {
        // User hasn't liked, add like
        this.likes.push(userObjectId);
    }

    return this.save();
};

// Instance method to check if user has liked
blogSchema.methods.isLikedBy = function (userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return this.likes.some(id => id.toString() === userObjectId.toString());
};

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;