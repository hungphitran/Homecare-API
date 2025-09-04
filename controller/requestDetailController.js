const RequestDetail = require('../model/requestDetail.model')
const Request = require('../model/request.model')
const GeneralSetting = require('../model/generalSetting.model')
const moment = require("moment");
const mongoose = require('mongoose')

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

            // Find the Request that contains this RequestDetail
            // Convert to ObjectId for proper comparison since scheduleIds contains ObjectIds
            const requestDetailObjectId = new mongoose.Types.ObjectId(requestDetail._id);
            console.log(requestDetailObjectId);
            const request = await Request.findOne({ 
                scheduleIds: { $in: [requestDetailObjectId] }
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
            if (req.body.comment && req.body.comment.loseThings !== undefined) {
                commentData['comment.loseThings'] = req.body.comment.loseThings;
            }
            
            // Handle breakThings boolean
            if (req.body.comment && req.body.comment.breakThings !== undefined) {
                commentData['comment.breakThings'] = req.body.comment.breakThings;
            }

            // Update the request detail with the complete comment
            await RequestDetail.findByIdAndUpdate(req.body.detailId, {
                $set: commentData
            });
            
            res.status(200).json({ message: "Review updated successfully" });
        } catch (err) {
            console.error('Error updating review:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = requestDetailController;