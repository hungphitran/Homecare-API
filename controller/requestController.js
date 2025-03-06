const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const generalController = require('./generalController')
const dayjs = require('dayjs');
const moment = require('moment');



const calculateTotalCost = (servicePrice, startTime, endTime,workDate,officeStartTime,officeEndTime,coefficient_other,serviceFactor) => {
    if (!servicePrice || !startTime || !endTime || !workDate ||  !coefficient_other || !officeStartTime || !officeEndTime || !serviceFactor) {
        return 0;
    }  


    const basicCost = parseFloat(servicePrice);
    const HSDV = parseFloat(serviceFactor);
    const HSovertime = parseFloat(coefficient_other.coefficientList[0].value);
    const HScuoituan = parseFloat(coefficient_other.coefficientList[1].value); 
  
    const start = dayjs(moment(startTime, "HH:mm").toDate());
    const end = dayjs(moment(endTime, "HH:mm").toDate());
  
    officeStartTime = dayjs(moment(officeStartTime, "HH:mm").toDate(), "HH:mm");
    officeEndTime = dayjs(moment(officeEndTime, "HH:mm").toDate(), "HH:mm");
  
    let totalCost = 0;

      const dayOfWeek = dayjs(workDate).day();

      const dailyHours = Math.floor(end.diff(start, "hour"));

      
      let T1 = 0; 
      let T2 = 0; 
      
      if (start.isBefore(officeStartTime)) {
        T1 += Math.floor(officeStartTime.diff(start, "hour"));
      }
      
      if (end.isAfter(officeEndTime)) {
        T1 += Math.floor(end.diff(officeEndTime, "hour"));
      }
      
      T2 = Math.max(0, dailyHours - T1);
      
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const applicableWeekendCoefficient = isWeekend ? HScuoituan : 1;
      //console.log(applicableWeekendCoefficient);
      
      // Calculate cost based on your formula:
      // cost = basicCost * HSDV * [(HSovertime * T1 * max(Hscuoituan, lễ)(if applicable)) + (max(Hscuoituan, lễ) * T2)]
      const overtimeCost = HSovertime * T1 * applicableWeekendCoefficient;
      console.log("overtime: ",overtimeCost);
      const normalCost = applicableWeekendCoefficient * T2;
        console.log("normal",normalCost);
      console.log("basic and hsdv",basicCost,HSDV);
      totalCost = Math.floor(basicCost * HSDV * (overtimeCost + normalCost));
      console.log("total",totalCost);
    
        return {
            totalCost: Math.floor(totalCost/1000) * 1000,
            servicePrice: basicCost,
            HSDV: HSDV,
            HSovertime: HSovertime,
            HScuoituan: HScuoituan,
            isWeekend: isWeekend,
        }
  };

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
                helper_id:req.body.helperId || req.body.helper_id || "notAvailable",
                helper_cost: 0,
                status:"notDone"
            })

            await reqDetail.save()
            .then(()=>scheduleIds.push(reqDetail._id))
            .catch(err=>res.status(500).send(err))
        }

        let location = req.body.location ||{  //handle location
            province:req.body.province,
            district:req.body.district,
            ward:req.body.ward,
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
            location:location,
            totalCost:req.body.totalCost,
            status:"notDone"
        })
        await newOrder.save()
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    },
    // GET all request in database
    getAll: async (req,res,next)=>{
        await Request.find()
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    getByPhone: async (req,res,next)=>{
        await Request.find({"customerInfo.phone":req.params.phone})
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },

    cancelRequest: async (req,res,next)=>{
        await Request.findById(req.body.id)
        .then(async (data)=>{
            if(data.status=="notDone"){
                data.status="cancelled"
                await data.save()
                .then(()=>res.status(200).json("success"))
                .catch((err)=> res.status(500).json(err))
            }
            else{
                res.status(500).json("cannot cancel this request")
            }
        })
        .catch((err)=> res.status(500).json(err))
    },
    finishRequest: async (req,res,next)=>{
        await
        Request.findById(req
            .body.id)
        .then(async (data)=>{
            if(data.status=="processing"){
                data.status="done"
                await data.save()
                .then(()=>res.status(200).json("success"))
                .catch((err)=> res.status(500).json(err))
            }
            else{
                res.status(500).json("cannot finish this request")
            }
        }
        )
        .catch((err)=> res.status(500).json(err))
    }
    ,

    calculateCost: async (req,res,next)=>{
        console.log(req.body)
        const {servicePrice, startTime, endTime,workDate,officeStartTime,officeEndTime,coefficient_other,serviceFactor} = req.body;

        let cost = calculateTotalCost(servicePrice, startTime, endTime,workDate,officeStartTime,officeEndTime,coefficient_other,serviceFactor)
        res.status(200).json(cost)
    }
}

module.exports = requestController;