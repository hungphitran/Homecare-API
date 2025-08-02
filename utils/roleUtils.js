const Customer = require('../model/customer.model');
const Helper = require('../model/helper.model');

/**
 * Xác định role của user dựa trên collection chứa record
 * @param {string} userId - ID của user
 * @returns {Promise<string|null>} - 'customer', 'helper' hoặc null nếu không tìm thấy
 */
async function getUserRole(userId) {
    try {
        // Kiểm tra trong collection customers trước
        const customer = await Customer.findById(userId);
        if (customer) {
            return 'customer';
        }

        // Kiểm tra trong collection helpers
        const helper = await Helper.findById(userId);
        if (helper) {
            return 'helper';
        }

        return null; // Không tìm thấy user
    } catch (error) {
        console.error('Error determining user role:', error);
        return null;
    }
}

/**
 * Xác định role cho phone number (chỉ dành cho customer)
 * @param {string} phone - Số điện thoại
 * @returns {Promise<string|null>} - 'customer' hoặc null
 */
async function getCustomerRoleByPhone(phone) {
    try {
        const customer = await Customer.findOne({ phone });
        return customer ? 'customer' : null;
    } catch (error) {
        console.error('Error determining customer role by phone:', error);
        return null;
    }
}

/**
 * Xác định role cho helper_id
 * @param {string} helperId - Helper ID
 * @returns {Promise<string|null>} - 'helper' hoặc null
 */
async function getHelperRoleById(helperId) {
    try {
        const helper = await Helper.findOne({ helper_id: helperId });
        return helper ? 'helper' : null;
    } catch (error) {
        console.error('Error determining helper role by ID:', error);
        return null;
    }
}

/**
 * Lấy thông tin user và role
 * @param {string} identifier - ID, phone, hoặc helper_id
 * @param {string} type - 'id', 'phone', hoặc 'helper_id'
 * @returns {Promise<{user: object, role: string}|null>}
 */
async function getUserWithRole(identifier, type = 'id') {
    try {
        let user = null;
        let role = null;

        switch (type) {
            case 'phone':
                user = await Customer.findOne({ phone: identifier });
                role = user ? 'customer' : null;
                break;
            case 'helper_id':
                user = await Helper.findOne({ helper_id: identifier });
                role = user ? 'helper' : null;
                break;
            case 'id':
            default:
                user = await Customer.findById(identifier);
                if (user) {
                    role = 'customer';
                } else {
                    user = await Helper.findById(identifier);
                    role = user ? 'helper' : null;
                }
                break;
        }

        return user && role ? { user, role } : null;
    } catch (error) {
        console.error('Error getting user with role:', error);
        return null;
    }
}

module.exports = {
    getUserRole,
    getCustomerRoleByPhone,
    getHelperRoleById,
    getUserWithRole
};
