const { getUserRole } = require('../utils/roleUtils');

/**
 * Middleware để tự động xác định và gán role cho user
 * Sử dụng sau authenticateToken để có req.user.id
 */
const autoDetectRole = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Vui lòng đăng nhập'
            });
        }

        // Nếu role đã có trong token và hợp lệ, bỏ qua
        if (req.user.role && ['customer', 'helper'].includes(req.user.role)) {
            return next();
        }

        // Tự động xác định role dựa trên collection
        const detectedRole = await getUserRole(req.user.id);
        
        if (!detectedRole) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng trong hệ thống'
            });
        }

        // Gán role vào req.user
        req.user.role = detectedRole;
        next();

    } catch (error) {
        console.error('Auto detect role error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Lỗi hệ thống khi xác định quyền truy cập'
        });
    }
};

module.exports = { autoDetectRole };
