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
    const resourceUserId = req.params.phone || req.params.id;
    let currentUserId;
    
    // Xử lý khác nhau cho customer và helper
    if (req.user.role === 'customer') {
        // Customer sử dụng phone hoặc id
        currentUserId = req.user.phone || req.user.id;
    } else if (req.user.role === 'helper') {
        // Helper sử dụng helper_id hoặc id tùy thuộc vào resource
        currentUserId = req.user.helper_id || req.user.id;
    } else {
        currentUserId = req.user.id;
    }
    
    console.log(`Resource User ID: ${resourceUserId}, Current User ID: ${currentUserId}, Role: ${req.user.role}`);

    if (currentUserId === resourceUserId) {
        next();
    } else {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'Bạn chỉ có thể truy cập thông tin của chính mình'
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
