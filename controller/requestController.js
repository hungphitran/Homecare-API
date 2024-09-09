const Request = require('../model/request.model')

const requestController ={
    create: async (req,res,next)=>{

        req.body.customerInfo = JSON.parse(req.body.customerInfo);
        await Request.create(req.body)
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    get: async (req,res,next)=>{
        await Request.find()
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    }
}

module.exports = requestController;