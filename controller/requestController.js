const Request = require('../model/request.model')

const requestController ={
    create: async (req,res,next)=>{
        Request.create(req.body)
        .then(()=>res.status(200).end())
        .catch((err)=> res.status(500).json(err))
    },
    get: async (req,res,next)=>{
        let filter={};
        Request.find()
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    }
}

module.exports = requestController;