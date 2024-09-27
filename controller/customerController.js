const Customer = require('../model/customer.model')

const customerController ={
    getOne: async(req,res,next)=>{
        Customer.findOne({phone:req.params.phone})
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    },
    create: async(req,res,next)=>{
        Customer.create(req.body)
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    },
    getAll: async (req,res,next)=>{
        Customer.find({})
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    },
    update: async(req,res,next)=>{
        console.log(req.body)
        Customer.updateOne({'_id':req.body._id})
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    }
}

module.exports=customerController;