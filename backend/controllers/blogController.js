const Blog = require('../models/Blog');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { clearCacheByPattern } = require('../middleware/cache');
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, DatabaseError } = require('../utils/customErrors');
const logger = require('../utils/logger');
const {
    searchBlogs,
    getRelatedBlogs,
    getPopularBlogs,
    monitorQuery,
    paginateQuery
} = require('../utils/queryOptimization');

/**
 * Blog Controller
 * Handles all blog-related operations including CRUD, pagination, and interactions
 */

/**
 * Create a new blog post
 * POST /api/blogs
 * Requires admin or editor role
 */
const createBlog = catchAsync(async (req, res) => {
    const {
        title,
        content,
        excerpt,
        coverImage,
        category,
        tags,
        status,
        featured,
        seoMetadata
    } = req.body;

    // Validate required fields
    if (!title || !content || !excerpt || !category) {
        throw new ValidationError('Title, content, excerpt, and category are required');
    }

    // Validate category exists and is active
    const categoryExists = await Category.findOne({ name: category.trim(), isActive: true });
    if (!categoryExists) {
        throw new ValidationError('Invalid category. Please select a valid active category.');
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
        throw new DatabaseError('Database connection not available');
    }

    logger.info('Creating new blog post', {
        title: title?.trim(),
        category: category?.trim(),
        author: req.user._id,
        status: status || 'draft'
    });

    // Create blog object
    const blogData = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim(),
        category: category.trim(),
        author: req.user._id, // Set from authenticated user
        status: status || 'draft',
        featured: featured || false
    };

    // Add optional fields if provided
    if (coverImage) {
        blogData.coverImage = {
            url: coverImage.url || '',
            alt: coverImage.alt || ''
        };
    }

    if (tags && Array.isArray(tags)) {
        blogData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag);
    }

    if (seoMetadata) {
        blogData.seoMetadata = {
            metaTitle: seoMetadata.metaTitle?.trim() || '',
            metaDescription: seoMetadata.metaDescription?.trim() || '',
            keywords: Array.isArray(seoMetadata.keywords)
                ? seoMetadata.keywords.map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword)
                : [],
            ogImage: seoMetadata.ogImage || ''
        };
    }

    try {
        // Create and save blog
        const blog = new Blog(blogData);
        await blog.save();

        // Update category blog count
        await Category.incrementBlogCount(category.trim());

        // Populate author information for response
        await blog.populate('author', 'username email profile.firstName profile.lastName');

        logger.info('Blog created successfully', {
            blogId: blog._id,
            title: blog.title,
            author: req.user._id
        });

        res.status(201).json({
            success: true,
            data: blog,
            message: 'Blog created successfully'
        });
    } catch (error) {
        console.error('Blog creation error:', error);
        if (error.code === 11000) {
            throw new ValidationError('Blog with similar title already exists. Please choose a different title.');
        }
        throw new DatabaseError(`Failed to create blog post: ${error.message}`);
    }
});

/**
 * Get blogs with pagination, filtering, and search
 * GET /api/blogs
 * Public endpoint (no authentication required)
 */
// const getBlogs = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 10,
//             status,
//             category,
//             tags,
//             query: search,
//             featured,
//             author,
//             exclude,
//             sortBy = 'createdAt',
//             sortOrder = 'desc'
//         } = req.query;

//         // Prepare search parameters for optimized search
//         const searchParams = {
//             query: search,
//             category,
//             tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
//             status: (!status || status === 'all') ? undefined : status,
//             // status: status === 'all' ? undefined : status,
//             featured,
//             author,
//             page: parseInt(page),
//             limit: parseInt(limit),
//             sortBy,
//             sortOrder
//         };

//         // Add exclude filter if provided (for related posts)
//         let filter = {};
//         if (exclude) {
//             filter._id = { $ne: exclude };
//         }

//         // Use optimized search with performance monitoring
//         const result = await monitorQuery(
//             () => searchBlogs(searchParams),
//             `getBlogs - page:${page}, limit:${limit}, search:${search || 'none'}`
//         );

//         // If exclude filter is needed, apply it manually
//         if (exclude && result.data.data) {
//             result.data.data = result.data.data.filter(blog => blog._id.toString() !== exclude);
//             result.data.pagination.total -= 1;
//         }

//         res.status(200).json({
//             success: true,
//             data: result.data.data,
//             pagination: result.data.pagination,
//             filters: {
//                 status: searchParams.status,
//                 category,
//                 tags,
//                 search,
//                 featured,
//                 author,
//                 sortBy,
//                 sortOrder
//             },
//             performance: {
//                 executionTime: result.performance.executionTime,
//                 optimized: true
//             }
//         });

//     } catch (error) {
//         console.error('Get blogs error:', error);

//         res.status(500).json({
//             success: false,
//             error: 'Failed to retrieve blogs',
//             details: error.message
//         });
//     }
// };


const getBlogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            category,
            tags,
            query: search,
            featured,
            author,
            exclude,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build search parameters
        let searchParams = {
            query: search,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
            status: (!status || status === 'all') ? undefined : status, // let searchBlogs skip if undefined
            featured,
            author,
            exclude,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sortBy,
            sortOrder
        };

        // Remove undefined values so they don’t interfere
        Object.keys(searchParams).forEach(key => {
            if (searchParams[key] === undefined) {
                delete searchParams[key];
            }
        });

        // Execute query with monitoring
        const result = await monitorQuery(
            () => searchBlogs(searchParams),
            `getBlogs - page:${page}, limit:${limit}, search:${search || 'none'}`
        );

        res.status(200).json({
            success: true,
            data: result.data.data,
            pagination: result.data.pagination,
            filters: {
                status: status || 'all',
                category: searchParams.category || null,
                tags: searchParams.tags || [],
                search: searchParams.query || null,
                featured: searchParams.featured || null,
                author: searchParams.author || null,
                sortBy: searchParams.sortBy,
                sortOrder: searchParams.sortOrder
            },
            performance: {
                executionTime: result.performance.executionTime,
                optimized: true
            }
        });

    } catch (error) {
        console.error('Get blogs error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve blogs',
            details: error.message
        });
    }
};


/**
 * Get single blog by slug
 * GET /api/blogs/:slug
 * Public endpoint (no authentication required)
 */
const getBlogBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;

    if (!slug) {
        throw new ValidationError('Blog slug is required');
    }

    // Find blog by slug and populate author information
    const blog = await Blog.findOne({ slug })
        .populate('author', 'username email profile.firstName profile.lastName profile.avatar profile.bio');

    if (!blog) {
        throw new NotFoundError(`No blog found with slug: ${slug}`);
    }

    logger.info('Blog retrieved by slug', {
        slug,
        blogId: blog._id,
        title: blog.title
    });

    // Convert to object to include virtuals
    const blogObj = blog.toObject();

    // Include SEO metadata and all blog information in response
    res.status(200).json({
        success: true,
        data: {
            ...blogObj,
            // Ensure virtual fields are included
            likeCount: blog.likeCount,
            // Include SEO metadata for frontend consumption
            seo: {
                title: blogObj.seoMetadata?.metaTitle || blogObj.title,
                description: blogObj.seoMetadata?.metaDescription || blogObj.excerpt,
                keywords: blogObj.seoMetadata?.keywords || blogObj.tags || [],
                ogImage: blogObj.seoMetadata?.ogImage || blogObj.coverImage?.url,
                url: `/blog/${blogObj.slug}`,
                type: 'article',
                publishedTime: blogObj.createdAt,
                modifiedTime: blogObj.updatedAt,
                author: blogObj.author?.username || 'Anonymous',
                section: blogObj.category,
                tags: blogObj.tags
            }
        }
    });
});

/**
 * Update blog by ID
 * PUT /api/blogs/:id
 * Requires admin or editor role
 */
const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            excerpt,
            coverImage,
            category,
            tags,
            status,
            featured,
            seoMetadata
        } = req.body;

        // Validate blog ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid blog ID format'
            });
        }

        // Find the blog
        const existingBlog = await Blog.findById(id);
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Check if user is admin or the author (editor can edit their own blogs)
        const isAdmin = req.user.role === 'admin';
        const isAuthor = existingBlog.author.toString() === req.user._id.toString();

        if (!isAdmin && !isAuthor) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only edit your own blogs or need admin privileges.'
            });
        }

        // Build update object with only provided fields
        const updateData = {};

        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content;
        if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
        if (category !== undefined) {
            // Validate new category exists and is active
            const categoryExists = await Category.findOne({ name: category.trim(), isActive: true });
            if (!categoryExists) {
                throw new ValidationError('Invalid category. Please select a valid active category.');
            }
            updateData.category = category.trim();
        }
        if (status !== undefined) updateData.status = status;
        if (featured !== undefined) updateData.featured = featured;

        // Handle cover image
        if (coverImage !== undefined) {
            updateData.coverImage = {
                url: coverImage.url || '',
                alt: coverImage.alt || ''
            };
        }

        // Handle tags
        if (tags !== undefined && Array.isArray(tags)) {
            updateData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag);
        }

        // Handle SEO metadata
        if (seoMetadata !== undefined) {
            updateData.seoMetadata = {
                metaTitle: seoMetadata.metaTitle?.trim() || '',
                metaDescription: seoMetadata.metaDescription?.trim() || '',
                keywords: Array.isArray(seoMetadata.keywords)
                    ? seoMetadata.keywords.map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword)
                    : [],
                ogImage: seoMetadata.ogImage || ''
            };
        }

        // Handle category change for blog count updates
        if (category && category.trim() !== existingBlog.category) {
            // Decrement old category count
            await Category.decrementBlogCount(existingBlog.category);
            // Increment new category count
            await Category.incrementBlogCount(category.trim());
        }

        // Update the blog
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true, // Return updated document
                runValidators: true // Run schema validations
            }
        ).populate('author', 'username email profile.firstName profile.lastName');

        res.status(200).json({
            success: true,
            data: updatedBlog,
            message: 'Blog updated successfully'
        });

    } catch (error) {
        console.error('Update blog error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Handle duplicate key errors (slug uniqueness)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Blog with similar title already exists',
                details: 'Please choose a different title'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update blog',
            details: error.message
        });
    }
};

/**
 * Delete blog by ID
 * DELETE /api/blogs/:id
 * Requires admin role only
 */
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate blog ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid blog ID format'
            });
        }

        // Find and delete the blog
        const deletedBlog = await Blog.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Decrement category blog count
        await Category.decrementBlogCount(deletedBlog.category);

        res.status(200).json({
            success: true,
            data: {
                id: deletedBlog._id,
                title: deletedBlog.title,
                slug: deletedBlog.slug
            },
            message: 'Blog deleted successfully'
        });

    } catch (error) {
        console.error('Delete blog error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to delete blog',
            details: error.message
        });
    }
};

/**
 * Toggle like/unlike for a blog
 * PATCH /api/blogs/:id/like
 * Requires authentication (any role)
 */
const toggleBlogLike = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate blog ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid blog ID format'
            });
        }

        // Find the blog
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Use the blog model's toggleLike method
        const updatedBlog = await blog.toggleLike(req.user._id);

        // Check if user liked or unliked
        const isLiked = updatedBlog.isLikedBy(req.user._id);
        const action = isLiked ? 'liked' : 'unliked';

        res.status(200).json({
            success: true,
            data: {
                blogId: updatedBlog._id,
                likeCount: updatedBlog.likeCount,
                isLiked: isLiked,
                action: action
            },
            message: `Blog ${action} successfully`
        });

    } catch (error) {
        console.error('Toggle blog like error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to toggle blog like',
            details: error.message
        });
    }
};

/**
 * Increment view count for a blog
 * PATCH /api/blogs/:id/view
 * Public endpoint (no authentication required)
 */
const incrementBlogView = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate blog ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid blog ID format'
            });
        }

        // Find the blog
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        // Use the blog model's incrementViewCount method
        const updatedBlog = await blog.incrementViewCount();

        res.status(200).json({
            success: true,
            data: {
                blogId: updatedBlog._id,
                viewCount: updatedBlog.viewCount
            },
            message: 'View count incremented successfully'
        });

    } catch (error) {
        console.error('Increment blog view error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to increment view count',
            details: error.message
        });
    }
};

/**
 * Get popular blogs based on views and likes
 * GET /api/blogs/popular
 * Public endpoint (no authentication required)
 */
const getPopularBlogsEndpoint = async (req, res) => {
    try {
        const {
            limit = 10,
            timeframe,
            category
        } = req.query;

        const result = await monitorQuery(
            () => getPopularBlogs({
                limit: parseInt(limit),
                timeframe,
                category
            }),
            `getPopularBlogs - limit:${limit}, timeframe:${timeframe || 'all'}`
        );

        res.status(200).json({
            success: true,
            data: result.data,
            performance: {
                executionTime: result.performance.executionTime,
                optimized: true
            }
        });

    } catch (error) {
        console.error('Get popular blogs error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve popular blogs',
            details: error.message
        });
    }
};

/**
 * Get related blogs for a specific blog
 * GET /api/blogs/:slug/related
 * Public endpoint (no authentication required)
 */
const getRelatedBlogsEndpoint = async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 5 } = req.query;

        // First get the current blog
        const currentBlog = await Blog.findOne({ slug, status: 'published' })
            .select('_id category tags')
            .lean();

        if (!currentBlog) {
            return res.status(404).json({
                success: false,
                error: 'Blog not found'
            });
        }

        const result = await monitorQuery(
            () => getRelatedBlogs(currentBlog, parseInt(limit)),
            `getRelatedBlogs - slug:${slug}, limit:${limit}`
        );

        res.status(200).json({
            success: true,
            data: result.data,
            performance: {
                executionTime: result.performance.executionTime,
                optimized: true
            }
        });

    } catch (error) {
        console.error('Get related blogs error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to retrieve related blogs',
            details: error.message
        });
    }
};

module.exports = {
    createBlog,
    getBlogs,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    toggleBlogLike,
    incrementBlogView,
    getPopularBlogsEndpoint,
    getRelatedBlogsEndpoint
};