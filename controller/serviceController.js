const Service= require('../model/service.model')

const serviceController={
    getAll : async (req,res,next)=>{
        try {
            const data = await Service.find({status:"active"})
                .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getOneById: async (req, res, next) => {
        try {
            const { idOrTitle } = req.params;
            let query;
            const mongoose = require('mongoose');
            
            if (mongoose.Types.ObjectId.isValid(idOrTitle)) {
                query = { _id: idOrTitle };
            } else {
                query = { title: idOrTitle };
            }
            
            const data = await Service.findOne(query)
                .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted');
            
            if (!data) {
                return res.status(404).json({ message: 'Service not found' });
            }
            
            // Transform data to match frontend expectations
            const transformedData = {
                _id: data._id,
                title: data.title,
                cost: data.basicPrice || 0,  // Map basicPrice to cost
                coefficient_id: data.coefficient_id,
                description: data.description
            };
            
            res.status(200).json(transformedData);
        } catch (err) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
module.exports=serviceController;