const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret key (đảm bảo thêm vào .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

// Middleware để xác thực JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            message: 'Vui lòng cung cấp token xác thực'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
        
        req.user = user;
        next();
    });
};

// Middleware để kiểm tra role helper
const requireHelper = (req, res, next) => {
    if (req.user && req.user.role === 'helper') {
        next();
    } else {
        return res.status(403).json({ 
            error: 'Helper access required',
            message: 'Chỉ helper mới có thể truy cập endpoint này'
        });
    }
};

// Middleware để kiểm tra role customer
const requireCustomer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        return res.status(403).json({ 
            error: 'Customer access required',
            message: 'Chỉ customer mới có thể truy cập endpoint này'
        });
    }
};

// Middleware để kiểm tra quyền truy cập resource của chính user đó
const requireOwnership = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Yêu cầu đăng nhập để thực hiện hành động này'
            });
        }

        // Lấy resource ID từ các tham số phổ biến
        const resourceUserId = req.params.phone || req.params.id || req.params.helper_id || req.params.customer_id;
        
        // Kiểm tra các trường hợp đặc biệt - không yêu cầu ownership cho các route đặc biệt
        const specialRoutes = ['my-assigned', 'my-requests', 'profile'];
        if (specialRoutes.includes(resourceUserId)) {
            // Đây là route đặc biệt, không cần kiểm tra ownership
            return next();
        }
        
        if (!resourceUserId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Resource ID không được tìm thấy trong request'
            });
        }
        
        let currentUserId;
        
        // Xử lý khác nhau cho customer và helper
        if (req.user.role === 'customer') {
            // Customer sử dụng phone hoặc id
            currentUserId = String(req.user.phone || req.user.id);
        } else if (req.user.role === 'helper') {
            // Helper sử dụng helper_id hoặc id tùy thuộc vào resource
            currentUserId = String(req.user.helper_id || req.user.id);
        } else {
            currentUserId = String(req.user.id);
        }
        
        // Chuyển đổi ID thành string để so sánh chính xác
        const resourceId = String(resourceUserId);
        
        // Log chỉ trong môi trường phát triển
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Resource User ID: ${resourceId}, Current User ID: ${currentUserId}, Role: ${req.user.role}`);
        }

        // So sánh ID sau khi đã chuẩn hóa
        if (currentUserId === resourceId) {
            next();
        } else {
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Bạn chỉ có thể truy cập thông tin của chính mình'
            });
        }
    } catch (error) {
        console.error('Error in requireOwnership middleware:', error);
        return res.status(500).json({
            error: 'Internal server error', 
            message: 'Đã xảy ra lỗi khi xác thực quyền truy cập'
        });
    }
};

// Function để tạo JWT token
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Function để tạo refresh token
const generateRefreshToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = {
    authenticateToken,
    requireHelper,
    requireCustomer,
    requireOwnership,
    generateToken,
    generateRefreshToken
};
