const RequestDetail = require('../model/requestDetail.model')
const Request = require('../model/request.model')
const GeneralSetting = require('../model/generalSetting.model')
const Helper = require('../model/helper.model')
const Service = require('../model/service.model')
const Customer = require('../model/customer.model')
const moment = require("moment");
const mongoose = require('mongoose')
const { sendToCustomerPhone } = require('../utils/notifications');
const emailService = require('../utils/emailService');


const requestDetailController ={
    getByIds: async (req,res,next)=>{
        try {
            //separate query to ids list
            let ids = req.query.ids.split(',').map(id => {
                if (mongoose.Types.ObjectId.isValid(id)) return id; // Let Mongoose handle the conversion
                return id;
            });
            //get all the requests which id in ids
            const data = await RequestDetail.find({'_id':{$in : ids}})
                .select('-__v -createdAt -updatedAt -deletedAt');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByHelperId: async (req,res,next)=>{
        try {
            // Kiểm tra quyền: helper chỉ có thể xem request detail của mình
            // req.params.id là helper_id (ObjectId hoặc string)
            // req.user.helper_id từ JWT payload
            let helperId = req.params.id;
            
            // Validate ObjectId format but let Mongoose handle conversion
            if (!mongoose.Types.ObjectId.isValid(helperId)) {
                return res.status(400).json({ error: 'Invalid helper ID format' });
            }
            if(req.user.role === 'helper' && helperId.toString() !== req.user.helper_id.toString()) {
                return res.status(403).json({
                    error: 'Access denied', 
                    message: 'Bạn chỉ có thể xem request detail của chính mình'
                });
            }
            const data = await RequestDetail.find({helper_id: helperId})
                .select('-__v -createdAt -updatedAt -deletedAt')
                .sort({ workingDate: -1 });// sort by working date
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },    
    //update the request detail with the review
    postReview: async (req,res,next)=>{
        console.log("Request body:", req.body);
        try {
            // Validate required fields
            if (!req.body.detailId) {
                return res.status(400).json({ 
                    error: 'Missing required field',
                    message: 'detailId là bắt buộc'
                });
            }

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(req.body.detailId)) {
                return res.status(400).json({
                    error: 'Invalid ObjectId format',
                    message: 'detailId phải có định dạng ObjectId hợp lệ'
                });
            }

            // Find the RequestDetail
            const requestDetail = await RequestDetail.findById(req.body.detailId);
            if (!requestDetail) {
                return res.status(404).json({ 
                    error: 'RequestDetail not found',
                    message: 'Không tìm thấy chi tiết đơn hàng'
                });
            }
            // Check if RequestDetail status is "completed"
            if (requestDetail.status !== 'completed') {
                return res.status(400).json({
                    error: 'Invalid status',
                    message: 'Chỉ có thể đánh giá các đơn hàng đã hoàn thành'
                });
            }

            // check if already reviewed
            if ((requestDetail.comment.review != "")) {
                return res.status(400).json({
                    error: 'Already reviewed',
                    message: 'Đơn hàng này đã được đánh giá'
                });
            }

            // Find the Request that contains this RequestDetail
            // Convert to ObjectId for proper comparison since scheduleIds contains ObjectIds
            const requestDetailObjectId = new mongoose.Types.ObjectId(requestDetail._id);
            console.log("RequestDetail ObjectId:", requestDetail._id);
            const request = await Request.findOne({ 
                scheduleIds: { $in: [req.body.detailId] }
            });

            if (!request) {
                return res.status(404).json({
                    error: 'Request not found',
                    message: 'Không tìm thấy đơn hàng chứa chi tiết này'
                });
            }

            // Check if the current user is the customer who placed the order
            if (req.user.role === 'customer' && request.customerInfo.phone !== req.user.phone) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Bạn chỉ có thể đánh giá đơn hàng của chính mình'
                });
            }

            // Prepare comment object with all components
            const commentData = {};
            
            // Handle review text
            if (req.body.comment && req.body.comment.review !== undefined) {
                commentData['comment.review'] = req.body.comment.review;
            }
            
            // Handle loseThings boolean
            if (req.body.comment && req.body.comment.loseThings != undefined) {
                commentData['comment.loseThings'] = req.body.comment.loseThings;
            }
            
            // Handle breakThings boolean
            if (req.body.comment && req.body.comment.breakThings != undefined) {
                commentData['comment.breakThings'] = req.body.comment.breakThings;
            }

            requestDetail.set(commentData);

            let helperId = requestDetail.helper_id;
            if (helperId) {
                // Update helper's review statistics
                const helper = await Helper.findById(helperId);
                if (helper) {
                    // Update average rating
                    if(helper.averageRating ==0) helper.averageRating = req.body.rating;
                    else helper.averageRating = (helper.averageRating + req.body.rating) / 2;
                    await helper.save();
                }
            }

            await requestDetail.save();
            await sendToCustomerPhone(request.customerInfo.phone,"Đánh giá đơn hàng thành công.","Bạn đã đánh giá đơn hàng thành công. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!");
            
            res.status(200).json({ message: "Review updated successfully" });
        } catch (err) {
            console.error('Error updating review:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    sendReport: async (req,res,next)=>{
        try {
            console.log('[SEND REPORT] Starting report sending process...');
            
            // Validate required fields
            if (!req.body.detailId) {
                console.log('[SEND REPORT] Missing required fields');
                return res.status(400).json({ 
                    error: 'Missing required field',
                    message: 'detailId là bắt buộc'
                });
            }
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(req.body.detailId)) {
                console.log('[SEND REPORT] Invalid ObjectId format');
                return res.status(400).json({
                    error: 'Invalid ObjectId format',
                    message: 'detailId phải có định dạng ObjectId hợp lệ'
                });
            }

            let reportType = req.body.type || ""
            let description = req.body.description || ''

            console.log(`[SEND REPORT] Looking for RequestDetail with ID: ${req.body.detailId}`);

            // Find the RequestDetail with populated data
            const requestDetail = await RequestDetail.findById({"_id": new mongoose.Types.ObjectId(req.body.detailId)})
                
            if (!requestDetail) {
                console.log('[SEND REPORT] RequestDetail not found');
                return res.status(404).json({
                    error: 'RequestDetail not found',
                    message: 'Không tìm thấy chi tiết đơn hàng'
                });
            }

            console.log('[SEND REPORT] RequestDetail found, gathering additional data...');
            // Get helper info
            if (requestDetail.helper_id) {
                if (requestDetail.helper_id) {
                    helperInfo = requestDetail.helper_id;
                } else {
                    const helper = await Helper.findById(requestDetail.helper_id);
                    helperInfo = helper;
                }
            }

            // Prepare report data for email
            const reportData = {
                detailId: req.body.detailId,
                type: reportType,
                description: description,
            };

            console.log('[SEND REPORT] Report data prepared:', {
                detailId: reportData.detailId,
                type: reportData.type,
                description: reportData.description
            });

            // Send email
            console.log('[SEND REPORT] Attempting to send email...');
            const emailResult = await emailService.sendReport(reportData);

            if (emailResult.success) {
                console.log('[SEND REPORT] ✅ Email sent successfully!');
                res.status(200).json({ 
                    message: "Report sent successfully",
                    email: {
                        sent: true,
                        recipient: emailResult.recipient,
                        messageId: emailResult.messageId
                    }
                });
            } else {
                console.error('[SEND REPORT] ❌ Email sending failed:', emailResult.error);
                res.status(500).json({ 
                    error: 'Email sending failed',
                    message: emailResult.error,
                    details: 'Báo cáo được tạo thành công nhưng không thể gửi email. Vui lòng kiểm tra cấu hình email.'
                });
            }
        }
        catch (err) {
            console.error('[SEND REPORT] Unexpected error:', err);
            res.status(500).json({ 
                error: 'Internal server error',
                message: err.message 
            });
        }
    },

    testEmailConnection: async (req, res, next) => {
        try {
            console.log('[TEST EMAIL] Testing email connection...');
            
            // Test email connection
            const testResult = await emailService.testConnection();
            
            if (testResult.success) {
                console.log('[TEST EMAIL] ✅ Email connection successful');
                res.status(200).json({
                    success: true,
                    message: 'Email connection is working properly',
                    details: testResult.message
                });
            } else {
                console.log('[TEST EMAIL] ❌ Email connection failed:', testResult.message);
                res.status(500).json({
                    success: false,
                    message: 'Email connection failed',
                    error: testResult.message,
                    suggestion: 'Please check your email environment variables configuration'
                });
            }
        } catch (err) {
            console.error('[TEST EMAIL] Unexpected error:', err);
            res.status(500).json({
                success: false,
                message: 'Error testing email connection',
                error: err.message
            });
        }
    }
}

module.exports = requestDetailController;