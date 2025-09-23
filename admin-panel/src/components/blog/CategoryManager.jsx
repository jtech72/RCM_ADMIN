import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Check, Trash2 } from 'lucide-react';
import categoryService from '../../services/category.js';

function CategoryManager({
    selectedCategory,
    onCategoryChange,
    disabled = false
}) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const result = await categoryService.getCategories({ limit: 1000 }); // Get all for dropdown
        if (result.success) {
            setCategories(result.data.map(cat => cat.name));
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const trimmedCategory = newCategory.trim();

        if (trimmedCategory && !categories.includes(trimmedCategory)) {
            setLoading(true);
            const result = await categoryService.createCategory({ name: trimmedCategory });
            if (result.success) {
                await fetchCategories();
                setNewCategory('');
                setShowAddForm(false);
            }
            setLoading(false);
        }
    };

    // Removed inline editing for simplicity - use main category management page

    // Removed inline deletion for simplicity - use main category management page

    // Removed inline editing functions

    return (
        <div className="space-y-4">
            {/* Category Selection */}
            <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className='text-red-500'>*</span>
                </label>
                <div className="flex gap-2">
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        disabled={disabled || loading}
                        required
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    {/* <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        disabled={disabled || loading}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add new category"
                    >
                        <Plus className="h-4 w-4" />
                    </button> */}
                </div>
            </div>

            {/* Add New Category Form */}
            {/* {showAddForm && (
                <div className="bg-gray-50 p-4 rounded-md border">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Add New Category</h4>
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            {loading ? '...' : <Check className="h-4 w-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(false);
                                setNewCategory('');
                            }}
                            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )} */}

            {/* Note about category management */}
            {/* {categories.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800">
                        To edit or delete categories, use the Category Management page.
                    </p>
                </div>
            )} */}
        </div>
    );
}

export default CategoryManager;