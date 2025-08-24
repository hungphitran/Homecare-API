const TimeOff = require('../model/timeOff.model');

const timeOffController={
    //return all timeOffs of an helper
    getAll: async (req,res,next)=>{
        try {
            // Kiểm tra quyền: helper chỉ có thể xem time off của mình
            // req.params.id là helper_id (string), req.user.helper_id từ JWT
            if(req.user.role === 'helper' && req.params.id !== req.user.helper_id) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Bạn chỉ có thể xem time off của chính mình'
                });
            }

            // Tìm theo helper_id chứ không phải _id
            const data = await TimeOff.find({"helper_id":req.params.id, status: "approved"})
                .select('-createdBy -_id -__v -deletedAt -status');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports=timeOffController;