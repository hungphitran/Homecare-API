const Discount = require('../model/discount.model')

const discountController ={
    getByIds: async (req,res,next)=>{
        //separate query to ids list
        let ids=req.query.ids.split(',')
        //get all the requests which id in ids
        await Discount.find({'_id':{$in : ids}})
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    getAll: async (req,res,next)=>{
        await Discount.find({status: true})
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
}

module.exports = discountController;