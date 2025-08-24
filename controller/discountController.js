const Discount = require('../model/discount.model')

const discountController ={
    getByIds: async (req,res,next)=>{
        try {
            //separate query to ids list
            let ids=req.query.ids.split(',')
            //get all the requests which id in ids
            const data = await Discount.find({'_id':{$in : ids}})
                .select('-__v -deleted -createdBy -updatedBy -deletedBy');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAll: async (req,res,next)=>{
        try {
            const data = await Discount.find({status: true})
                .select('-__v -deleted -createdBy -updatedBy -deletedBy');
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
}

module.exports = discountController;