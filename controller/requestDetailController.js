const RequestDetail = require('../model/requestDetail.model')

const requestDetailController ={
    create: async (req,res,next)=>{
        req.body.customerInfo = JSON.parse(req.body.customerInfo);
        await RequestDetail.create(req.body)
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    },
    getByIds: async (req,res,next)=>{
        //separate query to ids list
        let ids=req.query.ids.split(',')
        //get all the requests which id in ids
        await RequestDetail.find({'_id':{$in : ids}})
        .then(data=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    }
}

module.exports = requestDetailController;