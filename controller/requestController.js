const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const generalController = require('./generalController')
const mongoose = require('mongoose');
const GeneralSetting = require('../model/general.model')
const Service = require('../model/service.model')
const CostFactor = require('../model/costFactorType.model')
const Helper = require('../model/helper.model')
const dayjs = require('dayjs');
const moment = require('moment');

async function calculateCost(workDate,startTime, endTime, coefficient_service, coefficient_helper) {
    const generalSetting = await GeneralSetting.findOne({}).select("officeStartTime officeEndTime baseSalary");
    const coefficient_others = await CostFactor.findOne({}).select("coefficientList");
    const coefficient_OT = coefficient_others.coefficientList[0].value;
    const coefficient_weekend = coefficient_others.coefficientList[1].value;
    // const coefficient_holiday = coefficient_others.coefficientList[2].value;
    const coefficient_holiday = 1;

    console.log("General Setting: ", generalSetting);
    const hoursDiff = Math.ceil(endTime.getUTCHours() - startTime.getUTCHours());
    const officeStartTime = moment(generalSetting.officeStartTime, "HH:mm").hours();
    const officeEndTime = moment(generalSetting.officeEndTime, "HH:mm").hours();
    const OTStartTime = officeStartTime - startTime.getUTCHours() >= 0 ? officeStartTime - startTime.getUTCHours() : 0;
    const OTEndTime = endTime.getUTCHours() - officeEndTime >= 0 ? endTime.getUTCHours() - officeStartTime : 0;
    const OTTotalHour = OTStartTime + OTEndTime;
    console.log("OTStartTime: ", OTStartTime);
    console.log("OTEndTime: ", OTEndTime); 
    console.log("OTTotalHour: ", OTTotalHour);
    console.log("hoursDiff: ", hoursDiff);
    console.log("coefficient_service: ", coefficient_service);
    console.log("coefficient_helper: ", coefficient_helper);
    console.log("coefficient_OT: ", coefficient_OT);

    const dayOfWeek = dayjs(workDate).day();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const applicableWeekendCoefficient = isWeekend ? coefficient_weekend : 1;

    const totalCost = generalSetting.baseSalary * coefficient_service * coefficient_helper * ((coefficient_OT * OTTotalHour) + (coefficient_weekend * (hoursDiff - OTTotalHour)));
    return totalCost;
}

async function calculateTotalCost (serviceTitle, startTime, endTime,workDate) {
    if ( !startTime || !endTime || !workDate || !serviceTitle) {
        console.log("Missing required parameters: startTime, endTime, workDate, serviceTitle");
        return 0;
    }  

    const generalSetting = await GeneralSetting.findOne({}).select("officeStartTime officeEndTime");
    let officeStartTime = generalSetting.officeStartTime;
    let officeEndTime = generalSetting.officeEndTime;

    const service = await Service.findOne({title:serviceTitle}).select("coefficient_id basicPrice")
    const servicePrice = service.basicPrice;
    const serviceFactor = await CostFactor.findOne(
        { applyTo: "service" },
        { coefficientList: { $elemMatch: { _id: service.coefficient_id }}} )
        .then(data=>{
            console.log("serviceFactor",data)
            return data.coefficientList[0].value;//get the coefficient of service
        })

    const coefficient_other = await CostFactor.findOne({applyTo:"other"}).select("coefficientList")

    console.log("coefficient_other",coefficient_other)
    console.log("serviceFactor",serviceFactor)

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
        console.log("start time",req.body.startTime)
        console.log("end time",req.body.endTime)
        let service=  await Service.findOne({title:req.body.service.title}).select("coefficient_id")
        let serviceFactor = await CostFactor.findOne({})
        .then(data=>{
            return data.coefficientList;//get all the coefficient of  services
        })
        .then(coefs=>{
            return coefs.filter((coef,index)=>{
                return coef._id == service.coefficient_id;
            })
        })
        .then(coef=>{
            return coef[0].value;
        })

        let dates =(req.body.startDate).split(',')
        dates=dates.filter((value,index)=>{
            return value;
        })
        let scheduleIds= []
        let startTime = req.body.startTime//moment(`${moment().format('YYYY-MM-DD')} ${req.body.startTime}`, 'YYYY-MM-DD HH:mm').add(7, 'hours').toDate();
        let endTime = req.body.endTime//moment(`${moment().format('YYYY-MM-DD')} ${req.body.endTime}`, 'YYYY-MM-DD HH:mm').add(7, 'hours').toDate();
        let helperId = req.body.helperId || req.body.helper_id||"";
        let coef_helper=0 ;
        if(helperId){
            coef_helper = await Helper.findOne({_id:helperId})
            .then(data=>{
                console.log("coefficient id",data)
                return data.baseFactor;//get the coefficient 
            })
        }

        // if(helperId){
        //     coef_helper = await GeneralSetting.findOne({})
        //     .then(data=>data[0].coefficientList)//get all the coefficient of helpers
        //     .then(coefs=>{
        //         return coefs.filter((coef,index)=>{
        //             return coef._id == helperId;
        //         })
        //     })
        // }
        
        let totalHelperCost = 0;
        for(let workingDate of dates){
            let helperCost = await calculateCost(new Date(workingDate),startTime, endTime, serviceFactor, coef_helper)
            console.log("helper cost",helperCost)
            let cost =await calculateTotalCost(req.body.service.title, startTime, endTime,workingDate)
            .then(data=>{  
                console.log("cost",data)
                return data.totalCost;
            })
            totalHelperCost += helperCost;
            let reqDetail= new RequestDetail({
                startTime:req.body.startTime,
                endTime :req.body.endTime,
                workingDate: new Date(workingDate),
                helper_id: helperId|| "notAvailable",
                cost: cost || 0,
                helper_cost:  helperCost || 0,
                status: "notDone"
            })
            console.log("reqDetail",reqDetail)
            await reqDetail.save()
            .then(()=>scheduleIds.push(reqDetail._id))
            .catch(err=>res.status(500).send(err))
        }
        console.log("total helper cost",totalHelperCost, "total cost",req.body.totalCost)
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
            profit: (req.body.totalCost-totalHelperCost)||0,
            totalCost:req.body.totalCost,
            status:  "notDone"
        })
        console.log("new order",newOrder)
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
        .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt')
        .then((data)=>res.status(200).json(data))
        .catch((err)=> res.status(500).json(err))
    },
    getByPhone: async (req,res,next)=>{
        await Request.find({"customerInfo.phone":req.params.phone})
        .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt')
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
        console.log("request",request)
        console.log("detail",detail)
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

        // let request  = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)}).populate("scheduleIds")
        // .then(data=>data)
        // .catch(err=>res.status(500).send(err))

        if(detail){
            if(detail.status=="processing"){
                detail.status ="waitPayment";

                // for(let scheduleId of request.scheduleIds){
                //     let schedule = await RequestDetail.findOne({_id:scheduleId})
                //     .then(data=>data)
                //     .catch(err=>res.status(500).send(err))
                // }
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
            let detailId = req.body.detailId;
            let detail = await RequestDetail.findOne({ _id: detailId }).then(data => data)
            let request  = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)}).populate("scheduleIds")
            .then(data=>data)
            .catch(err=>res.status(500).send(err))
            if (!detail) {
                return res.status(500).send("Cannot find detail");
            }
            else if(detail.status == "waitPayment") {
                detail.status = "done";
                for(let scheduleId of request.scheduleIds){
                    let schedule = await RequestDetail.findOne({_id:scheduleId})
                    .then(data=>data)
                    .catch(err=>res.status(500).send(err))
                    if(schedule.status!="done"){
                        await detail.save();
                        res.status(200).send("Success");
                    }
                }
                request.status = "done";
                await request.save()
                .then(()=>console.log("success"))
                .catch(err => res.status(500).send(err))
                return res.status(200).send("Success");
            }
            return res.status(500).send("Cannot change status of detail");

        } catch (err) {
            console.error(err);
            return res.status(500).send(err.message || "An error occurred");
        }
    },
    rejectHelper:  async (req,res,next)=>{
        try {
            let id = req.body.id;
            let order = await Request.findOne({ _id: id }).then(data => data)
            if (!order) {
                return res.status(500).send("Cannot find order");
            }
            for(let scheduleId of order.scheduleIds){
                let schedule = await RequestDetail.findOne({_id:scheduleId})
                .then(data=>data)
                .catch(err=>res.status(500).send(err))
                schedule.helper_id = "notAvailable"
                schedule.save()
                .then(()=>console.log("Schedule updated successfully"))
                .catch(err=>res.status(500).send(err))
            }
            res.status(200).send("Success")

        } catch (err) {
            console.error(err);
            return res.status(500).send(err.message || "An error occurred");
        }
    },

    calculateCost: async (req,res,next)=>{
        console.log(req.body)
        const { serviceTitle,startTime, endTime,workDate} = req.body;
        let cost = await calculateTotalCost(serviceTitle,startTime, endTime,workDate)
        .then(data=>{
            console.log("cost",data)
            return data;
        })
        .catch(err=>res.status(500).send("không thể tính toán chi phí"))
        res.status(200).json(cost)
    }
    

    
}

module.exports = requestController;