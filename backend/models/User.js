const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for authentication and authorization
 */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters long'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
            match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false // Don't include password in queries by default
        },

        role: {
            type: String,
            enum: {
                values: ['admin', 'editor', 'reader'],
                message: 'Role must be either admin, editor, or reader'
            },
            default: 'reader'
        },

        profile: {
            firstName: {
                type: String,
                trim: true,
                maxlength: [50, 'First name cannot exceed 50 characters']
            },
            lastName: {
                type: String,
                trim: true,
                maxlength: [50, 'Last name cannot exceed 50 characters']
            },
            avatar: {
                type: String,
                default: ''
            },
            bio: {
                type: String,
                maxlength: [500, 'Bio cannot exceed 500 characters']
            }
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
            type: Date
        },

        passwordResetToken: {
            type: String,
            select: false
        },

        passwordResetExpires: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                return ret;
            }
        }
    }
);

// Virtual field for full name
userSchema.virtual('fullName').get(function () {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.profile.firstName || this.profile.lastName || this.username;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update lastLogin
userSchema.pre('save', function (next) {
    if (this.isModified('lastLogin')) {
        this.lastLogin = new Date();
    }
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        // Compare the candidate password with the hashed password
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Instance method to check if user has specific role
userSchema.methods.hasRole = function (role) {
    return this.role === role;
};

// Instance method to check if user has admin privileges
userSchema.methods.isAdmin = function () {
    return this.role === 'admin';
};

// Instance method to check if user has editor privileges or higher
userSchema.methods.canEdit = function () {
    return this.role === 'admin' || this.role === 'editor';
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
    return this.find({ role: role, isActive: true });
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function (identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
        ],
        isActive: true
    }).select('+password');
};

// Comprehensive indexes for efficient queries
// Single field indexes
userSchema.index({ email: 1 }); // Email lookup (unique)
userSchema.index({ username: 1 }); // Username lookup (unique)
userSchema.index({ role: 1 }); // Role-based queries
userSchema.index({ isActive: 1 }); // Active user filtering
userSchema.index({ lastLogin: -1 }); // Recent login sorting

// Compound indexes for complex queries
userSchema.index({ role: 1, isActive: 1 }); // Active users by role
userSchema.index({ isActive: 1, createdAt: -1 }); // Active users by registration date
userSchema.index({ role: 1, lastLogin: -1 }); // Role-based activity tracking
userSchema.index({ isActive: 1, lastLogin: -1 }); // Active users by last login

// Text index for user search
userSchema.index({
    username: 'text',
    email: 'text',
    'profile.firstName': 'text',
    'profile.lastName': 'text'
}, {
    weights: {
        username: 10,
        email: 8,
        'profile.firstName': 5,
        'profile.lastName': 5
    },
    name: 'user_text_search'
});

// Sparse indexes for optional fields
userSchema.index({ 'profile.firstName': 1 }, { sparse: true });
userSchema.index({ 'profile.lastName': 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true, expireAfterSeconds: 3600 }); // Auto-expire reset tokens

const User = mongoose.model('User', userSchema);

module.exports = User;