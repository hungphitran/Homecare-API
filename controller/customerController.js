const Customer = require('../model/customer.model')

const customerController ={
    getOne: async(req,res,next)=>{
        Customer.findOne({phone:req.params.phone})
        .then((data)=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
    create: async(req,res,next)=>{
        Customer.create(req.body)
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    },
    getAll: async (req,res,next)=>{
        Customer.find({})
        .then((data)=>res.status(200).json(data))
        .catch(err=>res.status(500).json(err))
    },
    update: async(req,res,next)=>{        
        Customer.findOneAndUpdate({"phone":req.params.phone},req.body)
        .then(()=>res.status(200).json("success"))
        .catch(err=>res.status(500).json(err))
    }
}

module.exports=customerController;