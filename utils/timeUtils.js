const moment = require('moment');

/**
 * Utility functions for time formatting and standardization
 */
const timeUtils = {
    /**
     * Standardize date input to YYYY-MM-DD format
     * @param {string|Date} dateInput - Date in various formats
     * @returns {string} Date in YYYY-MM-DD format
     */
    standardizeDate: (dateInput) => {
        if (!dateInput) return null;
        
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } catch (error) {
            console.error('Error standardizing date:', error);
            return null;
        }
    },

    /**
     * Standardize time input to HH:mm format
     * @param {string|Date} timeInput - Time in various formats
     * @returns {string} Time in HH:mm format (UTC)
     */
    standardizeTime: (timeInput) => {
        if (!timeInput) return null;
        
        try {
            // If it's already in HH:mm format
            if (typeof timeInput === 'string' && /^\d{2}:\d{2}$/.test(timeInput)) {
                return timeInput;
            }
            
            // If it's an ISO string with timezone
            if (typeof timeInput === 'string' && timeInput.includes('T')) {
                const date = new Date(timeInput);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid time');
                }
                // Use UTC hours and minutes to avoid timezone issues
                const hours = date.getUTCHours().toString().padStart(2, '0');
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            
            // If it's a Date object
            if (timeInput instanceof Date) {
                const hours = timeInput.getUTCHours().toString().padStart(2, '0');
                const minutes = timeInput.getUTCMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            
            throw new Error('Unsupported time format');
        } catch (error) {
            console.error('Error standardizing time:', error);
            return null;
        }
    },

    /**
     * Convert time string and date to full ISO datetime
     * @param {string} timeStr - Time in HH:mm format
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {Date} Full datetime object (UTC)
     */
    timeToDate: (timeStr, dateStr) => {
        if (!timeStr || !dateStr) return null;
        
        try {
            // Create UTC datetime to avoid timezone issues
            const [hours, minutes] = timeStr.split(':').map(Number);
            const [year, month, day] = dateStr.split('-').map(Number);
            
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error('Invalid time values');
            }
            
            const datetime = new Date(Date.UTC(year, month - 1, day, hours, minutes));
            if (isNaN(datetime.getTime())) {
                throw new Error('Invalid datetime combination');
            }
            return datetime;
        } catch (error) {
            console.error('Error converting time to date:', error);
            return null;
        }
    },

    /**
     * Extract date from various datetime formats
     * @param {string|Date} input - Datetime input
     * @returns {string} Date in YYYY-MM-DD format
     */
    extractDate: (input) => {
        if (!input) return null;
        
        try {
            const date = new Date(input);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date input');
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error extracting date:', error);
            return null;
        }
    },

    /**
     * Extract time from various datetime formats
     * @param {string|Date} input - Datetime input
     * @returns {string} Time in HH:mm format (UTC)
     */
    extractTime: (input) => {
        if (!input) return null;
        
        try {
            const date = new Date(input);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid time input');
            }
            // Use UTC to avoid timezone issues
            const hours = date.getUTCHours().toString().padStart(2, '0');
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('Error extracting time:', error);
            return null;
        }
    },

    /**
     * Validate time range
     * @param {string} startTime - Start time in HH:mm format
     * @param {string} endTime - End time in HH:mm format
     * @returns {boolean} True if valid range
     */
    isValidTimeRange: (startTime, endTime) => {
        if (!startTime || !endTime) return false;
        
        try {
            const start = moment(startTime, 'HH:mm');
            const end = moment(endTime, 'HH:mm');
            
            if (!start.isValid() || !end.isValid()) {
                return false;
            }
            
            // Handle cross-midnight shifts (e.g., 23:30 to 01:30)
            // If end time is earlier than start time, it means it's the next day
            if (end.isBefore(start)) {
                // Add one day to end time for comparison
                end.add(1, 'day');
            }
            
            return end.isAfter(start);
        } catch (error) {
            console.error('Error validating time range:', error);
            return false;
        }
    },

    /**
     * Format date array from comma-separated string
     * @param {string} dateString - Comma-separated date string
     * @returns {string[]} Array of standardized dates
     */
    formatDateArray: (dateString) => {
        if (!dateString) return [];
        
        try {
            return dateString
                .split(',')
                .map(date => date.trim())
                .filter(date => date.length > 0)
                .map(date => timeUtils.standardizeDate(date))
                .filter(date => date !== null);
        } catch (error) {
            console.error('Error formatting date array:', error);
            return [];
        }
    }
};

module.exports = timeUtils;
