const Customer = require('../model/customer.model')

const customerController ={
    getOne: async (req,res,next)=>{
        Customer.findOne({_id:req.params.id})
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
    create: async(req,res,next)=>{
        Customer.create(req.body)
        .then(data=>res.status(200).end())
        .catch(err=>res.status(500).json(err))
    },
    getAll: async (req,res,next)=>{
        Customer.find({})
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
}

module.exports=customerController;