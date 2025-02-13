const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')

const requestController ={
    //POST a new request
    create: async (req,res,next)=>{
        if( typeof req.body.customerInfo == "string"){
            req.body.customerInfo = JSON.parse(req.body.customerInfo);
        }
        req.body.customerInfo.usedpoint=0;

        req.body.orderDate =new Date(req.body.orderDate)
        req.body.startTime = new Date(req.body.startTime+"Z")
        req.body.endTime = new Date(req.body.endTime+"Z")

        let dates =(req.body.startDate).split(',')
        dates=dates.filter((value,index)=>{
            return value;
        })
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
            .then(()=>scheduleIds.push(reqDetail._id))
            .catch(err=>res.status(500).send(err))
        }

        

        let newOrder= new Request({
            orderDate:req.body.orderDate,
            requestType:req.body.requestType,
            scheduleIds:scheduleIds,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            customerInfo:req.body.customerInfo,
            requestType:req.body.requestType,
            service:req.body.service,
            totalCost:req.body.totalCost,
            status:"Chưa tiến hành"
        })

        await newOrder.save()
        //.then(()=>res.status(200).json("success"))
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