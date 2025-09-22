const mongoose = require('mongoose');

/**
 * Query optimization utilities for improved database performance
 */

/**
 * Optimized pagination helper
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated results with metadata
 */
const paginateQuery = async (model, filter = {}, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        populate = null,
        select = null,
        lean = true
    } = options;

    const skip = (page - 1) * limit;

    // Build the base query
    let query = model.find(filter);

    // Apply field selection for better performance
    if (select) {
        query = query.select(select);
    }

    // Apply population if needed
    if (populate) {
        if (Array.isArray(populate)) {
            populate.forEach(pop => {
                query = query.populate(pop);
            });
        } else {
            query = query.populate(populate);
        }
    }

    // Apply sorting, pagination, and lean for better performance
    query = query
        .sort(sort)
        .skip(skip)
        .limit(limit);

    if (lean) {
        query = query.lean();
    }

    // Execute query and count in parallel for better performance
    const [results, total] = await Promise.all([
        query.exec(),
        model.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data: results,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    };
};

/**
 * Optimized blog search with text search and filters
 * @param {Object} searchParams - Search parameters
 * @returns {Object} Search results with pagination
 */
// const searchBlogs = async (searchParams = {}) => {
//     const {
//         query,
//         category,
//         tags,
//         status,
//         featured,
//         author,
//         page = 1,
//         limit = 10,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//     } = searchParams;

//     // Build filter object
//     const filter = { status };

//     // Add text search if query provided
//     if (query && query.trim()) {
//         try {
//             filter.$text = { $search: query.trim() };
//         } catch (error) {
//             // Fallback to regex search if text index is not available
//             filter.$or = [
//                 { title: { $regex: query.trim(), $options: 'i' } },
//                 { content: { $regex: query.trim(), $options: 'i' } },
//                 { excerpt: { $regex: query.trim(), $options: 'i' } }
//             ];
//         }
//     }

//     // Add category filter
//     if (category) {
//         filter.category = category;
//     }

//     // Add tags filter
//     if (tags && tags.length > 0) {
//         filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
//     }

//     // Add featured filter
//     if (featured !== undefined) {
//         filter.featured = featured === 'true' || featured === true;
//     }

//     // Add author filter
//     if (author) {
//         filter.author = mongoose.Types.ObjectId(author);
//     }

//     // Build sort object
//     const sort = {};
//     if (query && query.trim()) {
//         // If text search, sort by text score first, then by specified field
//         sort.score = { $meta: 'textScore' };
//         sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
//     } else {
//         sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
//     }

//     // Optimized field selection for blog list
//     const select = 'title slug excerpt coverImage category tags status featured readingTime viewCount likeCount author createdAt updatedAt';

//     // Population for author info
//     const populate = {
//         path: 'author',
//         select: 'username profile.firstName profile.lastName profile.avatar',
//         options: { lean: true }
//     };

//     const Blog = mongoose.model('Blog');
//     return await paginateQuery(Blog, filter, {
//         page,
//         limit,
//         sort,
//         select,
//         populate,
//         lean: true
//     });
// };


const searchBlogs = async (searchParams = {}) => {
    const {
        query,
        category,
        tags,
        status, // remove default
        featured,
        author,
        exclude, // add exclude support
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = searchParams;

    // Build filter object
    const filter = {};

    // Only add status if provided
    if (status) {
        filter.status = status;
    }

    // Add text search if query provided
    if (query && query.trim()) {
        try {
            filter.$text = { $search: query.trim() };
        } catch (error) {
            // Fallback to regex search if text index is not available
            filter.$or = [
                { title: { $regex: query.trim(), $options: 'i' } },
                { content: { $regex: query.trim(), $options: 'i' } },
                { excerpt: { $regex: query.trim(), $options: 'i' } }
            ];
        }
    }

    // Add category filter
    if (category) {
        filter.category = category;
    }

    // Add tags filter
    if (tags && tags.length > 0) {
        filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    // Add featured filter
    if (featured !== undefined) {
        filter.featured = featured === 'true' || featured === true;
    }

    // Add author filter
    if (author) {
        filter.author = mongoose.Types.ObjectId(author);
    }

    // Add exclude filter
    if (exclude) {
        filter._id = { $ne: exclude };
    }

    // Build sort object
    const sort = {};
    if (query && query.trim()) {
        // If text search, sort by text score first, then by specified field
        sort.score = { $meta: 'textScore' };
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Optimized field selection for blog list
    const select =
        'title slug excerpt coverImage category tags status featured readingTime viewCount likeCount author createdAt updatedAt';

    // Population for author info
    const populate = {
        path: 'author',
        select: 'username profile.firstName profile.lastName profile.avatar',
        options: { lean: true }
    };

    const Blog = mongoose.model('Blog');
    return await paginateQuery(Blog, filter, {
        page,
        limit,
        sort,
        select,
        populate,
        lean: true
    });
};

/**
 * Get related blogs based on category and tags
 * @param {Object} blog - Current blog object
 * @param {number} limit - Number of related blogs to return
 * @returns {Array} Related blogs
 */
const getRelatedBlogs = async (blog, limit = 5) => {
    const Blog = mongoose.model('Blog');

    // Build query for related blogs
    const relatedQuery = {
        _id: { $ne: blog._id },
        status: 'published',
        $or: [
            { category: blog.category },
            { tags: { $in: blog.tags || [] } }
        ]
    };

    return await Blog
        .find(relatedQuery)
        .select('title slug excerpt coverImage category tags readingTime viewCount likeCount createdAt')
        .populate('author', 'username profile.firstName profile.lastName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

/**
 * Get popular blogs based on view count and likes
 * @param {Object} options - Query options
 * @returns {Array} Popular blogs
 */
const getPopularBlogs = async (options = {}) => {
    const {
        limit = 10,
        timeframe = null, // 'week', 'month', 'year'
        category = null
    } = options;

    const Blog = mongoose.model('Blog');
    const filter = { status: 'published' };

    // Add category filter if specified
    if (category) {
        filter.category = category;
    }

    // Add timeframe filter if specified
    if (timeframe) {
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }

        if (startDate) {
            filter.createdAt = { $gte: startDate };
        }
    }

    return await Blog
        .find(filter)
        .select('title slug excerpt coverImage category tags readingTime viewCount likeCount createdAt')
        .populate('author', 'username profile.firstName profile.lastName profile.avatar')
        .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
        .limit(limit)
        .lean();
};

/**
 * Performance monitoring for database queries
 * @param {Function} queryFunction - Function that executes the query
 * @param {string} queryName - Name of the query for logging
 * @returns {Object} Query result with performance metrics
 */
const monitorQuery = async (queryFunction, queryName = 'Unknown Query') => {
    const startTime = Date.now();

    try {
        const result = await queryFunction();
        const executionTime = Date.now() - startTime;

        // Log performance metrics
        console.log(`[Query Performance] ${queryName}: ${executionTime}ms`);

        // Log slow queries (> 1000ms)
        if (executionTime > 1000) {
            console.warn(`[Slow Query Alert] ${queryName} took ${executionTime}ms`);
        }

        return {
            data: result,
            performance: {
                executionTime,
                queryName,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`[Query Error] ${queryName} failed after ${executionTime}ms:`, error.message);
        throw error;
    }
};

/**
 * Aggregate blog statistics for analytics
 * @param {Object} filters - Optional filters for the aggregation
 * @returns {Object} Blog statistics
 */
const getBlogStatistics = async (filters = {}) => {
    const Blog = mongoose.model('Blog');

    const matchStage = { status: 'published', ...filters };

    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalBlogs: { $sum: 1 },
                totalViews: { $sum: '$viewCount' },
                totalLikes: { $sum: { $size: '$likes' } },
                avgReadingTime: { $avg: '$readingTime' },
                avgViewCount: { $avg: '$viewCount' }
            }
        },
        {
            $project: {
                _id: 0,
                totalBlogs: 1,
                totalViews: 1,
                totalLikes: 1,
                avgReadingTime: { $round: ['$avgReadingTime', 1] },
                avgViewCount: { $round: ['$avgViewCount', 1] }
            }
        }
    ];

    const [stats] = await Blog.aggregate(pipeline);
    return stats || {
        totalBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        avgReadingTime: 0,
        avgViewCount: 0
    };
};

/**
 * Get category-wise blog statistics
 * @returns {Array} Category statistics
 */
const getCategoryStatistics = async () => {
    const Blog = mongoose.model('Blog');

    const pipeline = [
        { $match: { status: 'published' } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalViews: { $sum: '$viewCount' },
                totalLikes: { $sum: { $size: '$likes' } },
                avgReadingTime: { $avg: '$readingTime' }
            }
        },
        {
            $project: {
                category: '$_id',
                count: 1,
                totalViews: 1,
                totalLikes: 1,
                avgReadingTime: { $round: ['$avgReadingTime', 1] },
                _id: 0
            }
        },
        { $sort: { count: -1 } }
    ];

    return await Blog.aggregate(pipeline);
};

module.exports = {
    paginateQuery,
    searchBlogs,
    getRelatedBlogs,
    getPopularBlogs,
    monitorQuery,
    getBlogStatistics,
    getCategoryStatistics
};