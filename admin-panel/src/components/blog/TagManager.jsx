import React, { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';

function TagManager({
    selectedTags = [],
    onTagsChange,
    availableTags = [],
    onAvailableTagsUpdate,
    disabled = false,
    maxTags = 10,
    placeholder = "Add a tag"
}) {
    const [tagInput, setTagInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (tagInput.trim()) {
            const filtered = availableTags.filter(tag =>
                tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                !selectedTags.includes(tag)
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [tagInput, availableTags, selectedTags]);

    const handleAddTag = (tagToAdd = null) => {
        const tag = tagToAdd || tagInput.trim();

        if (tag && !selectedTags.includes(tag) && selectedTags.length < maxTags) {
            const updatedTags = [...selectedTags, tag];
            onTagsChange(updatedTags);

            // Add to available tags if it's new
            if (!availableTags.includes(tag)) {
                const updatedAvailableTags = [...availableTags, tag];
                onAvailableTagsUpdate?.(updatedAvailableTags);
            }

            setTagInput('');
            setShowSuggestions(false);
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
        onTagsChange(updatedTags);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
            // Remove last tag if input is empty and backspace is pressed
            handleRemoveTag(selectedTags[selectedTags.length - 1]);
        }
    };

    const handleSuggestionClick = (tag) => {
        handleAddTag(tag);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags {selectedTags.length > 0 && `(${selectedTags.length}/${maxTags})`}
            </label>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                disabled={disabled}
                                className="ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={`Remove ${tag} tag`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Tag Input */}
            <div className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || selectedTags.length >= maxTags}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={selectedTags.length >= maxTags ? `Maximum ${maxTags} tags allowed` : placeholder}
                    />
                    <button
                        type="button"
                        onClick={() => handleAddTag()}
                        disabled={disabled || !tagInput.trim() || selectedTags.length >= maxTags}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {/* Tag Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map((tag, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSuggestionClick(tag)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                            >
                                <Tag className="inline h-3 w-3 mr-2 text-gray-400" />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Popular Tags (if available) */}
            {availableTags.length > 0 && selectedTags.length < maxTags && (
                <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Popular tags:</p>
                    <div className="flex flex-wrap gap-1">
                        {availableTags
                            .filter(tag => !selectedTags.includes(tag))
                            .slice(0, 8)
                            .map((tag, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleAddTag(tag)}
                                    disabled={disabled}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {tag}
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500">
                Press Enter to add a tag, or click from suggestions. Maximum {maxTags} tags allowed.
            </p>
        </div>
    );
}

export default TagManager;