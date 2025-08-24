const Helper= require('../model/helper.model')

const helperController={
    //return all helpers
    getAll : async (req,res,next)=>{
        try {
            const data = await Helper.find()
                .select('-password -baseFactor -__v -deleted -createdBy -updatedBy -deletedBy -createdAt -updatedAt');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    // return only one helper
    getOneById: async (req,res,next)=>{
        try {
            let id = req.params.id;
            if (require('mongoose').Types.ObjectId.isValid(id)) {
                id = require('mongoose').Types.ObjectId(id);
            }
            const data = await Helper.findOne({_id: id})
                .select('-password -baseFactor -__v -deleted -createdBy -updatedBy -deletedBy -createdAt -updatedAt');
            
            if (!data) {
                return res.status(404).json({ error: 'Helper not found' });
            }
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
}

module.exports=helperController;