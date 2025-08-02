const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { authenticateToken } = require('../middleware/auth');

// Route đăng ký cho customer 
router.post('/register/customer', authController.registerCustomer);

// Route đăng nhập cho customer (password)
router.post('/login/customer', authController.loginCustomer);

// Route đăng nhập cho helper
router.post('/login/helper', authController.loginHelper);

// Route đổi mật khẩu (cần authentication)
router.post('/change-password', authenticateToken, authController.changePassword);

// Route refresh token
router.post('/refresh', authController.refreshToken);

module.exports = router;
