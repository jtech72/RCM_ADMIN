import React from 'react';
import { Calendar } from 'lucide-react';

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
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="start-date" className="text-sm text-gray-600">
                        From:
                    </label>
                    <input
                        id="start-date"
                        type="date"
                        value={formatDateForInput(startDate)}
                        onChange={(e) => handleDateChange(e.target.value, onStartDateChange)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="end-date" className="text-sm text-gray-600">
                        To:
                    </label>
                    <input
                        id="end-date"
                        type="date"
                        value={formatDateForInput(endDate)}
                        onChange={(e) => handleDateChange(e.target.value, onEndDateChange)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {(startDate || endDate) && (
                    <button
                        onClick={onClear}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {startDate && endDate && (
                <div className="mt-2 text-xs text-gray-500">
                    Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}

export default DateRangePicker;