const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const generalController = require('./generalController')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
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

      const dailyHours = (end.diff(start, "hour",true));

      
      let T1 = 0; 
      let T2 = 0; 
      
      if (start.isBefore(officeStartTime)) {
        T1 += (officeStartTime.diff(start, "hour",true));
      }
      
      if (end.isAfter(officeEndTime)) {
        T1 += (end.diff(officeEndTime, "hour",true));
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
      totalCost = (basicCost * HSDV * (overtimeCost + normalCost));
      console.log("total",totalCost);
    
        return {
            totalCost: totalCost,
            servicePrice: basicCost,
            HSDV: HSDV,
            HSovertime: HSovertime,
            HScuoituan: HScuoituan,
            isWeekend: isWeekend,
            totalOvertimeHours: T1,
            totalNormalHours: T2,
            applicableWeekendCoefficient: applicableWeekendCoefficient,
            overtimeCost: overtimeCost,
            normalCost: normalCost
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
                status: "notDone"
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
            status:  "notDone"
        })
        await newOrder.save()
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    },
    confirm: async (req,res,next)=>{
        let id = req.body.id;
        let request = await Request.findOne({ _id: id })
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        if(!request){
            return res.status(500).send("Cannot find request");
        }
        let scheduleIds = request.scheduleIds;
        console.log(scheduleIds)
        for(let scheduleId of scheduleIds){
            let schedule = await RequestDetail.findOne({_id:scheduleId})
            .then(data=>data)
            .catch(err=>res.status(500).send(err))

            schedule.status = "assigned";
            await schedule.save()
            .then(data=>console.log("Schedule updated successfully"))
        }
        request.status = "assigned";
        await request.save()
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    }
    ,
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
        let request =await Request.findById(req.body.id)
        .then((data)=>data)
        .catch((err)=> res.status(500).json(err))
            for(let scheduleId of request.scheduleIds){
                await RequestDetail.findById(scheduleId)
                .then(
                    async (schedule)=>{
                    if(schedule.status!="notDone"){
                        res.status(500).json("cannot cancel this request")
                    }
                })
                .catch((err)=> res.status(500).json(err))
            }
            for(let scheduleId of request.scheduleIds){
                await RequestDetail.findOne(scheduleId)
                .then(async (schedule)=>{
                    schedule.status="cancelled"
                    await schedule.save()
                    .then(()=>console.log("success"))
                    .catch((err)=> res.status(500).json(err))
                })
                .catch((err)=> res.status(500).json(err))
            }
            request.status="cancelled"
            await request.save()
            .then(()=>res.status(200).json("success"))
            .catch((err)=> res.status(500).json(err))

    },
    assign: async (req,res,next)=>{
        let id = req.body.id;
        let order = await Request.findOne({_id:id}) 
        .then(data=>data)
        .catch(err=>res.status(500).send(err))
        let scheduleIds = order.scheduleIds;
        console.log(scheduleIds)
        for (let scheduleId of scheduleIds) {
            let schedule = await RequestDetail.findOne({ _id: scheduleId });
            if (!schedule) {
                return res.status(500).send(`Cannot find schedule with ID`);
            }

            if (schedule.status === "notDone") {
                schedule.status = "assigned";
                 await schedule.save();
            } else {
                return res.status(500).send("Cannot change status of detail");
            }
        }

        order.status = "assigned";
        await order.save()
        .then(()=>res.status(200).json("success"))
        .catch((err)=> res.status(500).json(err))
    },
    startWork:  async (req,res,next)=>{
        let detailId = req.body.detailId;
        let detail = await RequestDetail.findOne({_id:detailId}) 
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        let request  = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)}).populate("scheduleIds")
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        if(detail){
            request.status = "processing";
            await request.save()
            .then(()=>console.log("success"))
            .catch(err => res.status(500).send(err))

            if(detail.status=="assigned"){
                detail.status ="processing";
                await detail.save()
                .then(data=>res.status(200) .send("success"))
                .catch(err => res.status(500).send(err) )
            }
            else{
                res.status(500).send("can not change status of detail") 
            }

        }
        else{
            res.status(500).send("can not find detail")        
        }
    },
    finishRequest: async (req,res,next)=>{
        let detailId = req.body.detailId;
        let detail = await RequestDetail.findOne({_id:detailId}) 
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        let request  = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)}).populate("scheduleIds")
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        if(detail){
            if(detail.status=="processing"){
                detail.status ="done";

                for(let scheduleId of request.scheduleIds){
                    let schedule = await RequestDetail.findOne({_id:scheduleId})
                    .then(data=>data)
                    .catch(err=>res.status(500).send(err))
                    if(schedule.status!="done"){
                        await detail.save()
                        .then(data=>res.status(200) .send("success"))
                        .catch(err => res.status(500).send(err) )
                    }
                }
                request.status = "waitPayment";
                await request.save()
                .catch(err => res.status(500).send(err))

                await detail.save()
                .then(data=>res.status(200) .send("success"))
                .catch(err => res.status(500).send(err))
            }
            else{
                res.status(500).send("can not change status of detail") 
            }
        }
        else{
            res.status(500).send("can not find detail")        
        }
    },
    finishPayment: async (req,res,next)=>{
        try {
            let id = req.body.id;
            let order = await Request.findOne({ _id: id }).then(data => data)
            if (!order) {
                return res.status(500).send("Cannot find order");
            }
    
            let scheduleIds = order.scheduleIds;
            console.log(scheduleIds)
            for (let scheduleId of scheduleIds) {
                let schedule = await RequestDetail.findOne({ _id: scheduleId });
                console.log(schedule)

                if (!schedule) {
                    return res.status(500).send(`Cannot find schedule with ID`);
                }
    
                if (schedule.status != "done"){
                    return res.status(500).send("Cannot change status of detail");
                }
            }
    
            order.status = "done";
            await order.save();
            return res.status(200).send("Success");
        } catch (err) {
            console.error(err);
            return res.status(500).send(err.message || "An error occurred");
        }
    },
    // confirmFinish:  async (req,res,next)=>{
    //     try {
    //         let id = req.body.id;
    //         let order = await Request.findOne({ _id: id }).then(data => data)
    //         if (!order) {
    //             return res.status(500).send("Cannot find order");
    //         }
    //         order.status = "waitPayment";
    //         await order.save();
    //         return res.status(200).send("Success");
    //     } catch (err) {
    //         console.error(err);
    //         return res.status(500).send(err.message || "An error occurred");
    //     }
    // },

    calculateCost: async (req,res,next)=>{
        console.log(req.body)
        const {servicePrice, startTime, endTime,workDate,officeStartTime,officeEndTime,coefficient_other,serviceFactor} = req.body;

        let cost = calculateTotalCost(servicePrice, startTime, endTime,workDate,officeStartTime,officeEndTime,coefficient_other,serviceFactor)
        res.status(200).json(cost)
    }
}

module.exports = requestController;