const {
    requireRole,
    requireAdmin,
    requireEditor,
    requireAuth,
    requireMinimumRole,
    requireOwnershipOrAdmin
} = require('../middleware/roles');

describe('Roles Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('requireRole', () => {
        it('should allow access for user with correct role', () => {
            req.user = { _id: 'user123', role: 'admin' };
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for user with one of multiple allowed roles', () => {
            req.user = { _id: 'user123', role: 'editor' };
            const middleware = requireRole(['admin', 'editor']);

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for user with incorrect role', () => {
            req.user = { _id: 'user123', role: 'reader' };
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Insufficient permissions.',
                details: 'Required role(s): admin. Your role: reader'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access when user is not authenticated', () => {
            req.user = null;
            const middleware = requireRole('admin');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireAdmin', () => {
        it('should allow access for admin user', () => {
            req.user = { _id: 'user123', role: 'admin' };

            requireAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for non-admin user', () => {
            req.user = { _id: 'user123', role: 'editor' };

            requireAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Insufficient permissions.',
                details: 'Required role(s): admin. Your role: editor'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireEditor', () => {
        it('should allow access for admin user', () => {
            req.user = { _id: 'user123', role: 'admin' };

            requireEditor(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for editor user', () => {
            req.user = { _id: 'user123', role: 'editor' };

            requireEditor(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for reader user', () => {
            req.user = { _id: 'user123', role: 'reader' };

            requireEditor(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Insufficient permissions.',
                details: 'Required role(s): admin, editor. Your role: reader'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireAuth', () => {
        it('should allow access for any authenticated user', () => {
            req.user = { _id: 'user123', role: 'reader' };

            requireAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for unauthenticated user', () => {
            req.user = null;

            requireAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireMinimumRole', () => {
        it('should allow access for user with exact required role', () => {
            req.user = { _id: 'user123', role: 'editor' };
            const middleware = requireMinimumRole('editor');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for user with higher role', () => {
            req.user = { _id: 'user123', role: 'admin' };
            const middleware = requireMinimumRole('editor');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for user with lower role', () => {
            req.user = { _id: 'user123', role: 'reader' };
            const middleware = requireMinimumRole('editor');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Insufficient permissions.',
                details: 'Required minimum role: editor. Your role: reader'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access for unauthenticated user', () => {
            req.user = null;
            const middleware = requireMinimumRole('reader');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireOwnershipOrAdmin', () => {
        it('should allow access for admin user', () => {
            req.user = { _id: 'user123', role: 'admin' };
            req.params = { userId: 'different-user' };
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow access for resource owner', () => {
            req.user = { _id: 'user123', role: 'reader' };
            req.params = { userId: 'user123' };
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for non-owner non-admin user', () => {
            req.user = { _id: 'user123', role: 'reader' };
            req.params = { userId: 'different-user' };
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. You can only access your own resources.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when resource owner ID is not provided', () => {
            req.user = { _id: 'user123', role: 'reader' };
            req.params = {};
            req.body = {};
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Resource owner ID not provided'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should check body for resource owner ID when not in params', () => {
            req.user = { _id: 'user123', role: 'reader' };
            req.params = {};
            req.body = { userId: 'user123' };
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny access for unauthenticated user', () => {
            req.user = null;
            req.params = { userId: 'user123' };
            const middleware = requireOwnershipOrAdmin('userId');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});