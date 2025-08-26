const Customer = require('../model/customer.model');
const Helper = require('../model/helper.model');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { getUserRole, getUserWithRole } = require('../utils/roleUtils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    // Đăng ký cho customer
    registerCustomer: async (req, res) => {
        try {
            const { phone, password, fullName, email, address } = req.body;

            if (!phone || !password) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Vui lòng cung cấp số điện thoại và mật khẩu'
                });
            }

            // Kiểm tra địa chỉ bắt buộc
            if (!address || !address.province || !address.district || !address.ward || !address.detailAddress) {
                return res.status(400).json({
                    error: 'Missing address information',
                    message: 'Vui lòng cung cấp đầy đủ thông tin địa chỉ (tỉnh/thành phố, quận/huyện, phường/xã, địa chỉ chi tiết)'
                });
            }

            // Kiểm tra customer đã tồn tại
            const existingCustomer = await Customer.findOne({ phone })
            if (existingCustomer) {
                return res.status(409).json({
                    error: 'Phone already exists',
                    message: 'Số điện thoại này đã được đăng ký'
                });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Tạo customer mới với địa chỉ bắt buộc
            const customer = new Customer({
                phone,
                password: hashedPassword,
                fullName,
                email,
                signedUp: true,
                addresses: [address] // Thêm địa chỉ đầu tiên
            });

            await customer.save();

            // Tạo JWT token
            const payload = {
                id: customer._id,
                phone: customer.phone,
                role: 'customer'
            };

            const accessToken = generateToken(payload, '24h');
            const refreshToken = generateRefreshToken(payload, '7d');

            res.status(201).json({
                message: 'Đăng ký thành công',
                accessToken,
                refreshToken,
                user: {
                    id: customer._id,
                    phone: customer.phone,
                    fullName: customer.fullName,
                    email: customer.email,
                    role: 'customer'
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    },

    // Đăng nhập cho customer bằng phone + password
    loginCustomer: async (req, res) => {
        try {
            const { phone, password } = req.body;

            if (!phone || !password) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Vui lòng cung cấp số điện thoại và mật khẩu'
                });
            }

            // Tìm customer
            const customer = await Customer.findOne({ phone });
            if (!customer) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Số điện thoại hoặc mật khẩu không đúng'
                });
            }

            // Kiểm tra mật khẩu
            if (!customer.password) {
                return res.status(401).json({
                    error: 'Password not set',
                    message: 'Tài khoản chưa được thiết lập mật khẩu'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, customer.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Số điện thoại hoặc mật khẩu không đúng'
                });
            }

            // Tạo JWT token
            const payload = {
                id: customer._id,
                phone: customer.phone,
                role: 'customer'
            };

            const accessToken = generateToken(payload, '24h');
            const refreshToken = generateRefreshToken(payload, '7d');

            res.status(200).json({
                message: 'Đăng nhập thành công',
                accessToken,
                refreshToken,
                user: {
                    id: customer._id,
                    phone: customer.phone,
                    fullName: customer.fullName,
                    email: customer.email,
                    role: 'customer'
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    },

    // Đăng nhập cho helper bằng phone + password
    loginHelper: async (req, res) => {
        try {
        const { phone, password } = req.body;

        if (!phone || !password) {
                return res.status(400).json({
                    error: 'Missing required fields',
            message: 'Vui lòng cung cấp số điện thoại và mật khẩu'
                });
            }

            // Tìm helper
        const helper = await Helper.findOne({ phone })
            if (!helper) {
                return res.status(401).json({
                    error: 'Invalid credentials',
            message: 'Số điện thoại hoặc mật khẩu không đúng'
                });
            }

            // Kiểm tra mật khẩu (giả định có field password trong helper model)
            // Nếu chưa có, cần thêm field password vào helper model
            if (!helper.password) {
                return res.status(401).json({
                    error: 'Password not set',
                    message: 'Tài khoản chưa được thiết lập mật khẩu'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, helper.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    message: 'Số điện thoại hoặc mật khẩu không đúng'
                });
            }

            // Tạo JWT token
            const payload = {
                id: helper._id,
                helper_id: helper.helper_id,
                phone: helper.phone,
                role: 'helper'
            };

            const accessToken = generateToken(payload, '24h');
            const refreshToken = generateRefreshToken(payload, '7d');

            res.status(200).json({
                message: 'Đăng nhập thành công',
                accessToken,
                refreshToken,
                user: {
                    id: helper._id,
                    helper_id: helper.helper_id,
                    fullName: helper.fullName,
                    phone: helper.phone,
                    role: 'helper'
                }
            });

        } catch (error) {
            console.error('Helper login error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    },

    // Đổi mật khẩu cho customer
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id; // From JWT middleware

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    error: 'Password too short',
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
                });
            }

            const customer = await Customer.findById(userId);
            if (!customer) {
                return res.status(404).json({
                    error: 'Customer not found',
                    message: 'Không tìm thấy tài khoản'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid current password',
                    message: 'Mật khẩu hiện tại không đúng'
                });
            }

            // Hash new password
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await Customer.updateOne(
                { _id: userId },
                { password: hashedNewPassword }
            );

            res.status(200).json({
                message: 'Đổi mật khẩu thành công'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    },

    // Refresh token
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token required',
                    message: 'Vui lòng cung cấp refresh token'
                });
            }

            jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file', async (err, user) => {
                if (err) {
                    return res.status(403).json({
                        error: 'Invalid refresh token',
                        message: 'Refresh token không hợp lệ'
                    });
                }

                // Xác định role động dựa trên collection
                const currentRole = await getUserRole(user.id);
                if (!currentRole) {
                    return res.status(404).json({
                        error: 'User not found',
                        message: 'Không tìm thấy người dùng'
                    });
                }

                const payload = {
                    id: user.id,
                    phone: user.phone,
                    helper_id: user.helper_id,
                    username: user.username,
                    role: currentRole // Sử dụng role động
                };

                const newAccessToken = generateToken(payload, '24h');

                res.status(200).json({
                    message: 'Token đã được làm mới',
                    accessToken: newAccessToken
                });
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Lỗi hệ thống, vui lòng thử lại'
            });
        }
    }
};

module.exports = authController;
