import React, { useState } from 'react';
import BlogList from '../components/blog/BlogList.jsx';
import BlogForm from '../components/blog/BlogForm.jsx';

function BlogManagement() {
    const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedBlog, setSelectedBlog] = useState(null);

    // Handle create blog
    const handleCreateBlog = () => {
        setSelectedBlog(null);
        setCurrentView('create');
    };

    // Handle edit blog
    const handleEditBlog = (blog) => {
        setSelectedBlog(blog);
        setCurrentView('edit');
    };

    // Handle save blog (create or update)
    const handleSaveBlog = (savedBlog) => {
        // Return to list view after successful save
        setCurrentView('list');
        setSelectedBlog(null);
    };

    // Handle cancel form
    const handleCancelForm = () => {
        setCurrentView('list');
        setSelectedBlog(null);
    };

    return (
        <div className="mx-auto max-h-screen overflow-auto py-6 pt-0 sm:px-6 lg:px-8">
            <div className="px-4 py-6 pt-0 sm:px-0">
                {currentView === 'list' && (
                    <BlogList
                        onCreateBlog={handleCreateBlog}
                        onEditBlog={handleEditBlog}
                    />
                )}

                {currentView === 'create' && (
                    <BlogForm
                        mode="create"
                        onSave={handleSaveBlog}
                        onCancel={handleCancelForm}
                    />
                )}

                {currentView === 'edit' && selectedBlog && (
                    <BlogForm
                        blogSlug={selectedBlog?.slug}
                        mode="edit"
                        onSave={handleSaveBlog}
                        onCancel={handleCancelForm}
                    />
                )}
            </div>
        </div>
    );
}

export default BlogManagement;