const { sendToCustomerPhone } = require('../utils/notifications');

/**
 * Notification Helper với tính năng kiểm tra kết quả
 */
class NotificationHelper {
    
    /**
     * Gửi notification và trả về kết quả chi tiết
     * @param {string} phone - Số điện thoại
     * @param {string} title - Tiêu đề thông báo
     * @param {string} body - Nội dung thông báo
     * @param {Object} data - Data bổ sung
     * @returns {Promise<Object>} Kết quả chi tiết
     */
    static async sendWithCheck(phone, title, body, data = {}) {
        try {
            const result = await sendToCustomerPhone(phone, title, body, data);
            
            // Log kết quả
            console.log(`[NOTIFICATION CHECK] Phone: ${phone}`);
            console.log(`[NOTIFICATION CHECK] Success: ${result.success}`);
            console.log(`[NOTIFICATION CHECK] Sent: ${result.sent || 0}`);
            console.log(`[NOTIFICATION CHECK] Failed: ${result.failed || 0}`);
            
            if (result.details) {
                result.details.forEach((detail, index) => {
                    console.log(`[NOTIFICATION CHECK] Token ${index + 1}: ${detail.success ? 'SUCCESS' : 'FAILED'}`);
                    if (detail.error) {
                        console.log(`[NOTIFICATION CHECK] Error: ${detail.error.code} - ${detail.error.message}`);
                    }
                });
            }
            
            return {
                ...result,
                timestamp: new Date().toISOString(),
                phone,
                title,
                body
            };
            
        } catch (error) {
            console.error('[NOTIFICATION CHECK] Unexpected error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                phone,
                title,
                body
            };
        }
    }

    /**
     * Kiểm tra xem notification có được gửi thành công hay không
     * @param {Object} result - Kết quả từ sendWithCheck
     * @returns {boolean} true nếu có ít nhất 1 token nhận được notification
     */
    static isSuccess(result) {
        return result && result.success && result.sent > 0;
    }

    /**
     * Kiểm tra xem có notification nào thất bại hay không
     * @param {Object} result - Kết quả từ sendWithCheck
     * @returns {boolean} true nếu có token bị thất bại
     */
    static hasFailures(result) {
        return result && result.failed > 0;
    }

    /**
     * Lấy thống kê chi tiết
     * @param {Object} result - Kết quả từ sendWithCheck
     * @returns {Object} Thống kê
     */
    static getStats(result) {
        if (!result) {
            return { total: 0, sent: 0, failed: 0, successRate: 0 };
        }

        const total = (result.sent || 0) + (result.failed || 0);
        const sent = result.sent || 0;
        const failed = result.failed || 0;
        const successRate = total > 0 ? (sent / total * 100).toFixed(2) : 0;

        return {
            total,
            sent,
            failed,
            successRate: parseFloat(successRate),
            phone: result.phone
        };
    }

    /**
     * Tạo response cho API với thông tin notification
     * @param {Object} result - Kết quả từ sendWithCheck
     * @returns {Object} Response object
     */
    static createResponse(result) {
        const stats = this.getStats(result);
        
        return {
            notification: {
                sent: this.isSuccess(result),
                stats,
                details: result.details || [],
                timestamp: result.timestamp
            }
        };
    }
}

module.exports = NotificationHelper;
