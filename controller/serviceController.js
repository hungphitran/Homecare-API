const Service= require('../model/service.model')

const serviceController={
    getAll : async (req,res,next)=>{
        await Service.find({status:"active"})
        .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted')
        .then((data)=> res.status(200).json(data))
        .catch((err)=>{console.error(err)})
    },
    getOneById: async (req, res, next) => {
        const { idOrTitle } = req.params;
        let query;
        const mongoose = require('mongoose');
        
        console.log('Searching for service with idOrTitle:', idOrTitle);
        
        if (mongoose.Types.ObjectId.isValid(idOrTitle)) {
            query = { _id: idOrTitle };
            console.log('Using ObjectId query:', query);
        } else {
            query = { title: idOrTitle };
            console.log('Using title query:', query);
        }
        
        try {
            const data = await Service.findOne(query)
                .select('-__v -updatedBy -deletedBy -createdBy -createdAt -updatedAt -status -deleted');
            
            if (!data) {
                console.log('Service not found for query:', query);
                return res.status(404).json({ message: 'Service not found' });
            }
            
            console.log('Found service:', {
                _id: data._id,
                title: data.title,
                basicPrice: data.basicPrice,
                coefficient_id: data.coefficient_id
            });
            
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
            console.error('Error in getOneById:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
module.exports=serviceController;