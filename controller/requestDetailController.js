const RequestDetail = require('../model/requestDetail.model')
const GeneralSetting = require('../model/general.model')
const moment = require("moment");
const mongoose = require('mongoose')

const requestDetailController ={
    getByIds: async (req,res,next)=>{
        try {
            //separate query to ids list
            let ids = req.query.ids.split(',').map(id => {
                if (mongoose.Types.ObjectId.isValid(id)) return mongoose.Types.ObjectId(id);
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
            if (mongoose.Types.ObjectId.isValid(helperId)) {
                helperId = mongoose.Types.ObjectId(helperId);
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
            //update the request detail with the review
            await RequestDetail.findByIdAndUpdate(req.body.detailId,{
                $set:{
                    'comment':req.body.comment,
                }
            });
            res.status(200).json({ message: "Review updated successfully" });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = requestDetailController;