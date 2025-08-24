const moment = require('moment');

/**
 * Utility functions for time formatting and standardization
 * IMPORTANT: All functions convert Vietnam timezone (UTC+7) to UTC for storage
 * - Vietnam time is converted to UTC by subtracting 7 hours
 * - All database timestamps are stored in UTC
 * - All datetime operations use UTC after conversion
 * - This ensures consistency across different server timezones
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
     * Standardize time input to HH:mm format (UTC)
     * Converts Vietnam timezone (UTC+7) to UTC by subtracting 7 hours
     * @param {string|Date} timeInput - Time in various formats
     * @returns {string} Time in HH:mm format (UTC)
     */
    standardizeTime: (timeInput) => {
        if (!timeInput) return null;
        
        try {
            // If it's already in HH:mm format, treat as Vietnam time and convert to UTC
            if (typeof timeInput === 'string' && /^\d{2}:\d{2}$/.test(timeInput)) {
                const [hours, minutes] = timeInput.split(':').map(Number);
                // Convert Vietnam time to UTC by subtracting 7 hours
                let utcHours = hours - 7;
                // Handle negative hours (cross-midnight)
                if (utcHours < 0) {
                    utcHours += 24;
                }
                return `${utcHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            // If it's a timestamp (number)
            if (typeof timeInput === 'number') {
                const date = new Date(timeInput);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid timestamp');
                }
                // Always use UTC hours for consistency
                const hours = date.getUTCHours().toString().padStart(2, '0');
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            
            // If it's an ISO datetime string
            if (typeof timeInput === 'string' && timeInput.includes('T')) {
                const date = new Date(timeInput);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid time');
                }

                // If the string contains a 'Z' (explicit UTC), use UTC getters.
                // If it doesn't contain 'Z', treat as Vietnam time and convert to UTC
                const useUtc = timeInput.includes('Z');
                let hours, minutes;
                
                if (useUtc) {
                    // Already UTC, use UTC getters
                    hours = date.getUTCHours();
                    minutes = date.getUTCMinutes();
                } else {
                    // Treat as Vietnam time, convert to UTC by subtracting 7 hours
                    hours = date.getHours() - 7;
                    minutes = date.getMinutes();
                    // Handle negative hours (cross-midnight)
                    if (hours < 0) {
                        hours += 24;
                    }
                }
                
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            // If it's a Date object
            if (timeInput instanceof Date) {
                // Treat as Vietnam time, convert to UTC by subtracting 7 hours
                let hours = timeInput.getHours() - 7;
                const minutes = timeInput.getMinutes();
                // Handle negative hours (cross-midnight)
                if (hours < 0) {
                    hours += 24;
                }
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            throw new Error('Unsupported time format');
        } catch (error) {
            console.error('Error standardizing time:', error);
            return null;
        }
    },

    /**
     * Convert time string and date to full ISO datetime
     * Time string is expected to be in UTC (after Vietnam time conversion)
     * @param {string} timeStr - Time in HH:mm format (UTC)
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {boolean} treatAsUtc - Whether to treat the time as UTC (true) or local time (false)
     * @returns {Date} Full datetime object
     */
    timeToDate: (timeStr, dateStr, treatAsUtc = true) => {
        if (!timeStr || !dateStr) return null;
        
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const [year, month, day] = dateStr.split('-').map(Number);
            
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error('Invalid time values');
            }
            
            // Always create UTC datetime since timeStr is already converted to UTC
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
     * Extract date from various datetime formats (UTC)
     * Converts Vietnam timezone (UTC+7) to UTC for date extraction
     * @param {string|Date} input - Datetime input
     * @returns {string} Date in YYYY-MM-DD format (UTC)
     */
    extractDate: (input) => {
        if (!input) return null;
        
        try {
            // Handle timestamp (number)
            if (typeof input === 'number') {
                const date = new Date(input);
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid timestamp');
                }
                // Use UTC date to avoid timezone shifts
                const year = date.getUTCFullYear();
                const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                const day = date.getUTCDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            const date = new Date(input);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date input');
            }

            // If input string explicitly has 'Z', use UTC date parts.
            // Otherwise treat as Vietnam time and convert to UTC
            const inputStr = typeof input === 'string' ? input : '';
            const useUtc = inputStr.includes('Z');
            
            let year, month, day;
            if (useUtc) {
                // Already UTC, use UTC date parts
                year = date.getUTCFullYear();
                month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                day = date.getUTCDate().toString().padStart(2, '0');
            } else {
                // Treat as Vietnam time, convert to UTC by subtracting 7 hours
                const utcDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
                year = utcDate.getUTCFullYear();
                month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
                day = utcDate.getUTCDate().toString().padStart(2, '0');
            }
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error extracting date:', error);
            return null;
        }
    },

    /**
     * Extract time from various datetime formats (UTC)
     * Converts Vietnam timezone (UTC+7) to UTC for time extraction
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

            // If input string includes 'Z', use UTC time; otherwise treat as Vietnam time
            const inputStr = typeof input === 'string' ? input : '';
            const useUtc = inputStr.includes('Z');
            
            let hours, minutes;
            if (useUtc) {
                // Already UTC, use UTC time
                hours = date.getUTCHours();
                minutes = date.getUTCMinutes();
            } else {
                // Treat as Vietnam time, convert to UTC by subtracting 7 hours
                hours = date.getHours() - 7;
                minutes = date.getMinutes();
                // Handle negative hours (cross-midnight)
                if (hours < 0) {
                    hours += 24;
                }
            }
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

    // NOTE: All timezone operations convert Vietnam time (UTC+7) to UTC
    // Vietnam time is converted to UTC by subtracting 7 hours for storage
    
    /**
     * Convert UTC datetime to Vietnam timezone for display (UNUSED - keeping UTC only)
     * @param {Date|string} utcDateTime - UTC datetime
     * @returns {string} Vietnam local time in format "YYYY-MM-DD HH:mm"
     */
    // utcToVietnamTime: (utcDateTime) => { ... }

    /**
     * Convert Vietnam local time to UTC for storage (UNUSED - keeping UTC only)
     * @param {string} vietnamDateTime - Vietnam local time in format "YYYY-MM-DD HH:mm"
     * @returns {Date} UTC Date object
     */
    // vietnamTimeToUtc: (vietnamDateTime) => { ... }
};

module.exports = timeUtils;
