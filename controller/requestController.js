const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')

const requestController ={
    //POST a new request
    create: async (req,res,next)=>{
        console.log(req.body)
        if( typeof req.body.customerInfo == "string"){
            req.body.customerInfo = JSON.parse(req.body.customerInfo);
        }
            let orderDate = req.body.orderDate;
            let tmp=orderDate.split('-')
            let month = tmp[1];
            if(month.length<2){
                month="0"+month;
            }
            let day = tmp[2];  
            if(day.length<2){
                day="0"+day;
            }
            req.body.orderDate = tmp[0]+"-"+month+"-"+day;

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
        res.send(newOrder)
        await newOrder.save()
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