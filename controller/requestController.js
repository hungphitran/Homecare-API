const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const {ObjectId} = require('mongoose').Types

const requestController ={
    //POST a new request
    create: async (req,res,next)=>{
            req.body._id = new ObjectId()
        req.body.customerInfo = req.body.customerInfo;
        req.body.orderDate =new Date(req.body.orderDate)
        let dates =(req.body.startDate).split(',')
        let scheduleIds= []
        for(let workingDate of dates){
            let reqDetail= new RequestDetail({
                startTime:req.body.startTime,
                endTime :req.body.endTime,
                workingDate: new Date(workingDate),
                helper_id:req.body.helperId,
                helper_cost: Number.parseInt(req.body.totalCost)/(dates.length) ,
                status:"Chưa tiến hành"
            })
            await reqDetail.save()
            .catch(err=>res.status(500).send(err))

            scheduleIds.push(reqDetail._id)
        }
        req.body.scheduleIds=scheduleIds

        let option={
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        }
        await Request.create(req.body)
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    },
    // GET all request in database
    getAll: async (req,res,next)=>{
        await Request.find()
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    }
}

module.exports = requestController;