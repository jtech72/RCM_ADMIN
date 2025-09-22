const Category = require('../models/Category');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, DatabaseError } = require('../utils/customErrors');
const logger = require('../utils/logger');

/**
 * Category Controller
 * Handles all category-related operations
 */

/**
 * Create a new category
 * POST /api/categories
 * Requires admin role
 */
const createCategory = catchAsync(async (req, res) => {
    const { name, description, icon } = req.body;

    if (!name) {
        throw new ValidationError('Category name is required');
    }

    logger.info('Creating new category', {
        name: name?.trim(),
        createdBy: req.user._id
    });

    const categoryData = {
        name: name.trim(),
        createdBy: req.user._id
    };

    if (description) categoryData.description = description.trim();
    if (icon) categoryData.icon = icon.trim();

    try {
        const category = new Category(categoryData);
        await category.save();

        await category.populate('createdBy', 'username email');

        logger.info('Category created successfully', {
            categoryId: category._id,
            name: category.name,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new ValidationError('Category with this name already exists');
        }
        throw new DatabaseError('Failed to create category');
    }
});

/**
 * Get all categories
 * GET /api/categories
 * Public endpoint
 */
const getCategories = catchAsync(async (req, res) => {
    const { 
        includeInactive = false, 
        withBlogCount = true,
        page = 1,
        limit = 10,
        search = ''
    } = req.query;

    let filter = {};
    if (!includeInactive) {
        filter.isActive = true;
    }

    // Add search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [categories, totalCount] = await Promise.all([
        Category.find(filter)
            .populate('createdBy', 'username')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Category.countDocuments(filter)
    ]);

    // Optionally include actual blog counts
    if (withBlogCount) {
        for (let category of categories) {
            const actualCount = await Blog.countDocuments({ 
                category: category.name, 
                status: 'published' 
            });
            category.actualBlogCount = actualCount;
        }
    }

    res.status(200).json({
        success: true,
        data: categories,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalCount,
            hasNext: pageNum < Math.ceil(totalCount / limitNum),
            hasPrev: pageNum > 1
        }
    });
});

/**
 * Get single category by slug
 * GET /api/categories/:slug
 * Public endpoint
 */
const getCategoryBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true })
        .populate('createdBy', 'username email');

    if (!category) {
        throw new NotFoundError(`No category found with slug: ${slug}`);
    }

    // Get actual blog count
    const actualBlogCount = await Blog.countDocuments({ 
        category: category.name, 
        status: 'published' 
    });

    const categoryObj = category.toObject();
    categoryObj.actualBlogCount = actualBlogCount;

    res.status(200).json({
        success: true,
        data: categoryObj
    });
});

/**
 * Update category
 * PUT /api/categories/:id
 * Requires admin role
 */
const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid category ID format');
    }

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new NotFoundError('Category not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    try {
        // If name is being changed, update all blogs with the old category name
        if (name && name.trim() !== existingCategory.name) {
            await Blog.updateMany(
                { category: existingCategory.name },
                { category: name.trim() }
            );
            
            logger.info('Updated blog categories', {
                oldCategory: existingCategory.name,
                newCategory: name.trim()
            });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'username email');

        res.status(200).json({
            success: true,
            data: updatedCategory,
            message: 'Category updated successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new ValidationError('Category with this name already exists');
        }
        throw new DatabaseError('Failed to update category');
    }
});

/**
 * Delete category
 * DELETE /api/categories/:id
 * Requires admin role
 */
const deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reassignTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError('Invalid category ID format');
    }

    const category = await Category.findById(id);
    if (!category) {
        throw new NotFoundError('Category not found');
    }

    // Check if there are blogs using this category
    const blogCount = await Blog.countDocuments({ category: category.name });
    
    if (blogCount > 0) {
        if (!reassignTo) {
            throw new ValidationError(
                `Cannot delete category. ${blogCount} blogs are using this category. ` +
                'Please provide a "reassignTo" category name to reassign these blogs.'
            );
        }

        // Verify the reassign category exists
        const reassignCategory = await Category.findOne({ name: reassignTo, isActive: true });
        if (!reassignCategory) {
            throw new ValidationError('Reassign category not found or inactive');
        }

        // Reassign all blogs to the new category
        await Blog.updateMany(
            { category: category.name },
            { category: reassignTo }
        );

        logger.info('Reassigned blogs to new category', {
            deletedCategory: category.name,
            reassignedTo: reassignTo,
            blogCount
        });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        data: {
            id: category._id,
            name: category.name,
            reassignedBlogs: blogCount,
            reassignedTo: reassignTo || null
        },
        message: 'Category deleted successfully'
    });
});

/**
 * Get categories with blog statistics
 * GET /api/categories/stats
 * Public endpoint
 */
const getCategoryStats = catchAsync(async (req, res) => {
    const stats = await Category.aggregate([
        {
            $match: { isActive: true }
        },
        {
            $lookup: {
                from: 'blogs',
                let: { categoryName: '$name' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$category', '$$categoryName'] },
                                    { $eq: ['$status', 'published'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'blogs'
            }
        },
        {
            $addFields: {
                actualBlogCount: { $size: '$blogs' },
                totalViews: { $sum: '$blogs.viewCount' },
                totalLikes: { $sum: { $size: '$blogs.likes' } }
            }
        },
        {
            $project: {
                name: 1,
                slug: 1,
                description: 1,
                icon: 1,
                actualBlogCount: 1,
                totalViews: 1,
                totalLikes: 1,
                createdAt: 1
            }
        },
        {
            $sort: { actualBlogCount: -1 }
        }
    ]);

    res.status(200).json({
        success: true,
        data: stats
    });
});

/**
 * Validate category name
 * POST /api/categories/validate
 * Public endpoint
 */
const validateCategory = catchAsync(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        throw new ValidationError('Category name is required');
    }

    const category = await Category.findOne({ 
        name: name.trim(), 
        isActive: true 
    });

    res.status(200).json({
        success: true,
        data: {
            exists: !!category,
            valid: !!category,
            category: category || null
        }
    });
});

module.exports = {
    createCategory,
    getCategories,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    getCategoryStats,
    validateCategory
};