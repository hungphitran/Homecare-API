const Customer = require('../model/customer.model')

const customerController ={
    get: async (req,res,next)=>{
        Customer.findOne()
        .then(data=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
    create: async(req,res,next)=>{
        Customer.create(req.body)
        .then(data=>res.status(200).end())
        .catch(err=>res.status(500).json(err))
    }
}

module.exports=customerController;