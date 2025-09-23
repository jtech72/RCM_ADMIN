import React from 'react';
import { Calendar, X } from 'lucide-react';

/**
 * DateRangePicker Component
 * Provides date range selection for analytics filtering
 */
function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) {
    // Format date for input (YYYY-MM-DD)
    const formatDateForInput = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    // Handle date change and convert to ISO string
    const handleDateChange = (value, onChange) => {
        if (value) {
            const date = new Date(value);
            onChange(date.toISOString());
        } else {
            onChange('');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex column items-center gap-4 flex-wrap">
                {/* <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                        <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Filter Analytics</span>
                </div> */}

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-600">
                            From:
                        </label>
                        <input
                            id="start-date"
                            type="date"
                            value={formatDateForInput(startDate)}
                            onChange={(e) => handleDateChange(e.target.value, onStartDateChange)}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date" className="text-sm font-medium text-gray-600">
                            To:
                        </label>
                        <input
                            id="end-date"
                            type="date"
                            value={formatDateForInput(endDate)}
                            onChange={(e) => handleDateChange(e.target.value, onEndDateChange)}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                        />
                    </div>

                    {(startDate || endDate) && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:text-red-600 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {startDate && endDate && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700 font-medium">
                        Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
}

export default DateRangePicker;