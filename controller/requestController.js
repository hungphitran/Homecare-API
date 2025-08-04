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
const timeUtils = require('../utils/timeUtils');

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
  
    let start = dayjs(moment(startTime, "HH:mm").toDate());
    let end = dayjs(moment(endTime, "HH:mm").toDate());
  
    // Handle cross-midnight shifts
    if (end.isBefore(start)) {
        end = end.add(1, 'day');
    }
  
    officeStartTime = dayjs(moment(officeStartTime, "HH:mm").toDate(), "HH:mm");
    officeEndTime = dayjs(moment(officeEndTime, "HH:mm").toDate(), "HH:mm");
  
    let totalCost = 0;

      const dayOfWeek = dayjs(workDate).day();

      const dailyHours = Math.abs(end.diff(start, "hour", true));

      
      let T1 = 0; 
      let T2 = 0; 
      
      // Handle cross-midnight calculation differently
      if (start.isBefore(officeStartTime)) {
        T1 += Math.abs(officeStartTime.diff(start, "hour", true));
      }
      
      // For cross-midnight shifts, we need to handle end time carefully
      let endForComparison = end;
      if (end.date() > start.date()) {
        // Cross-midnight case: compare with office end time of the same day as start
        const officeEndTimeNextDay = officeEndTime.add(1, 'day');
        if (end.isAfter(officeEndTimeNextDay)) {
          T1 += Math.abs(end.diff(officeEndTimeNextDay, "hour", true));
        }
      } else {
        // Same day case
        if (end.isAfter(officeEndTime)) {
          T1 += Math.abs(end.diff(officeEndTime, "hour", true));
        }
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
        try {
            console.log(req.body)
            if( typeof req.body.customerInfo == "string"){
                req.body.customerInfo = JSON.parse(req.body.customerInfo);
            }
            
            console.log("Original input times:", {
                originalStartTime: req.body.startTime,
                originalEndTime: req.body.endTime,
                originalOrderDate: req.body.orderDate
            });
            
            // Standardize time inputs using timeUtils
            const standardizedStartTime = timeUtils.standardizeTime(req.body.startTime);
            const standardizedEndTime = timeUtils.standardizeTime(req.body.endTime);
            
            if (!standardizedStartTime || !standardizedEndTime) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid time format. Please use HH:mm or ISO format"
                });
            }
            
            // Validate time range
            if (!timeUtils.isValidTimeRange(standardizedStartTime, standardizedEndTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid time range. End time must be after start time"
                });
            }
            
            // Handle orderDate - standardize and derive from startTime if not provided
            let orderDate = req.body.orderDate;
            if (!orderDate && req.body.startTime) {
                orderDate = timeUtils.extractDate(req.body.startTime);
            }
            
            const standardizedOrderDate = timeUtils.standardizeDate(orderDate) || timeUtils.standardizeDate(new Date());
            
            // Extract individual dates for start and end times to handle cross-day scenarios
            const extractedStartDate = req.body.startTime ? timeUtils.extractDate(req.body.startTime) : standardizedOrderDate;
            const extractedEndDate = req.body.endTime ? timeUtils.extractDate(req.body.endTime) : standardizedOrderDate;
            
            // Handle startDate - derive from startTime if not provided
            let startDate = req.body.startDate || extractedStartDate;
            
            // Format dates array
            const workingDates = timeUtils.formatDateArray(startDate);
            if (workingDates.length === 0) {
                // If no working dates provided, use the order date
                workingDates.push(standardizedOrderDate);
            }

            req.body.customerInfo.usedPoint = 0;

            // Convert standardized times back to Date objects for database storage
            // For local time inputs (no timezone), treat the standardized time as UTC to preserve user intent
            // For timezone-aware inputs, treat standardized time as UTC (since it's already converted)
            const startHasTimezone = req.body.startTime && req.body.startTime.includes('T') && 
                                   (req.body.startTime.split('T')[1] || '').match(/[Z\+\-]/);
            const endHasTimezone = req.body.endTime && req.body.endTime.includes('T') && 
                                 (req.body.endTime.split('T')[1] || '').match(/[Z\+\-]/);
            
            // Always treat standardized times as UTC to preserve the intended time values
            const startTimeObj = timeUtils.timeToDate(standardizedStartTime, extractedStartDate, true);
            const endTimeObj = timeUtils.timeToDate(standardizedEndTime, extractedEndDate, true);
            
            console.log("Standardized times:", {
                originalStartTime: req.body.startTime,
                originalEndTime: req.body.endTime,
                startTime: standardizedStartTime,
                endTime: standardizedEndTime,
                extractedStartDate,
                extractedEndDate,
                startHasTimezone,
                endHasTimezone,
                startTimeObj,
                endTimeObj,
                orderDate: standardizedOrderDate,
                workingDates
            });
        
        // Check if service title is provided
        if (!req.body.service || !req.body.service.title) {
            return res.status(400).json({
                success: false,
                message: "Service title is required"
            });
        }
        
        let service = await Service.findOne({title:req.body.service.title}).select("coefficient_id")
        if (!service) {
            return res.status(404).json({
                success: false,
                message: `Service "${req.body.service.title}" not found`
            });
        }
        
        let serviceFactor = await CostFactor.findOne({})
        .then(data=>{
            if (!data) throw new Error("Cost factor not found");
            return data.coefficientList;//get all the coefficient of  services
        })
        .then(coefs=>{
            return coefs.filter((coef,index)=>{
                return coef._id == service.coefficient_id;
            })
        })
        .then(coef=>{
            if (!coef || coef.length === 0) throw new Error("Service coefficient not found");
            return coef[0].value;
        })

        let scheduleIds = [];
        let helperId = req.body.helperId || req.body.helper_id || "";
        let coef_helper = 0;
        
        if (helperId) {
            coef_helper = await Helper.findOne({_id: helperId})
            .then(data => {
                console.log("coefficient id", data);
                return data.baseFactor; // get the coefficient 
            });
        }
        
        let totalHelperCost = 0;
        
        for (let workingDate of workingDates) {
            let helperCost = await calculateCost(new Date(workingDate), startTimeObj, endTimeObj, serviceFactor, coef_helper);
            console.log("helper cost", helperCost);
            
            let cost = await calculateTotalCost(req.body.service.title, standardizedStartTime, standardizedEndTime, workingDate)
            .then(data => {  
                console.log("cost", data);
                return data.totalCost;
            });
            
            totalHelperCost += helperCost;
            
            let reqDetail = new RequestDetail({
                startTime: startTimeObj,
                endTime: endTimeObj,
                workingDate: new Date(workingDate),
                helper_id: helperId || "notAvailable",
                cost: cost || 0,
                helper_cost: helperCost || 0,
                status: "notDone"
            });
            
            console.log("reqDetail", reqDetail);
            await reqDetail.save()
            .then(() => scheduleIds.push(reqDetail._id))
            .catch(err => res.status(500).send(err));
        }
        
        console.log("total helper cost", totalHelperCost, "total cost", req.body.totalCost);
        
        let location = req.body.location || {  // handle location
            province: req.body.province,
            district: req.body.district,
            ward: req.body.ward,
        };

        let newOrder = new Request({
            orderDate: new Date(standardizedOrderDate),
            requestType: req.body.requestType,
            scheduleIds: scheduleIds,
            startTime: startTimeObj,
            endTime: endTimeObj,
            customerInfo: req.body.customerInfo,
            service: req.body.service,
            location: location,
            profit: (req.body.totalCost - totalHelperCost) || 0,
            totalCost: req.body.totalCost,
            status: "notDone"
        });
        
        console.log("new order", newOrder);
        await newOrder.save()
        .then(() => res.status(200).json("success"))
        .catch((err) => res.status(500).json(err));
        } catch (error) {
            console.error("Error in create request:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
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
        try {
            const requests = await Request.find()
            .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt');
            
            // Lấy schedules từ RequestDetail cho mỗi request
            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const schedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds }
                    }).select('-__v -createdAt -updatedAt');
                    
                    return {
                        ...request.toObject(),
                        schedules: schedules
                    };
                })
            );
            
            res.status(200).json(requestsWithSchedules);
        } catch (err) {
            res.status(500).json(err);
        }
    },
    getByPhone: async (req,res,next)=>{
        try {
            const requests = await Request.find({"customerInfo.phone":req.params.phone})
            .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt');
            
            // Lấy schedules từ RequestDetail cho mỗi request
            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const schedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds }
                    }).select('-__v -createdAt -updatedAt');
                    
                    return {
                        ...request.toObject(),
                        schedules: schedules
                    };
                })
            );
            
            res.status(200).json(requestsWithSchedules);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    cancelRequest: async (req,res,next)=>{
        let request = await Request.findById(req.body.id)
        .then((data)=>data)
        .catch((err)=> res.status(500).json(err))
        
        // Kiểm tra quyền: customer chỉ có thể cancel request của mình
        if(req.user.role === 'customer' && request.customerInfo.phone !== req.user.phone) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'Bạn chỉ có thể hủy request của chính mình'
            });
        }

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

    calculateCost: async (req, res, next) => {
        try {
            console.log("Request body:", req.body);
            const { serviceId, serviceTitle, startTime, endTime, workDate, location } = req.body;
            
            // Determine service title
            let finalServiceTitle = serviceTitle;
            if (serviceId && !serviceTitle) {
                // Check if serviceId is a valid ObjectId format
                const mongoose = require('mongoose');
                if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                    return res.status(400).json({
                        error: "Invalid service ID format",
                        message: `Service ID "${serviceId}" is not a valid ObjectId`
                    });
                }
                
                const service = await Service.findById(serviceId).select("title");
                if (!service) {
                    return res.status(404).json({
                        error: "Service not found",
                        message: `Service with ID "${serviceId}" not found`
                    });
                }
                finalServiceTitle = service.title;
                console.log("Resolved service title:", finalServiceTitle);
            }
            
            // Standardize time inputs using timeUtils
            let finalStartTime, finalEndTime, finalWorkDate;
            
            // Handle different input formats
            if (startTime && startTime.includes('T')) {
                // ISO timestamp format
                finalStartTime = timeUtils.extractTime(startTime);
                finalEndTime = timeUtils.extractTime(endTime);
                finalWorkDate = workDate || timeUtils.extractDate(startTime);
            } else {
                // Direct time format
                finalStartTime = timeUtils.standardizeTime(startTime);
                finalEndTime = timeUtils.standardizeTime(endTime);
                finalWorkDate = timeUtils.standardizeDate(workDate);
            }
            
            console.log("Standardized inputs:", {
                originalStart: startTime,
                originalEnd: endTime,
                originalWorkDate: workDate,
                finalStartTime,
                finalEndTime,
                finalWorkDate
            });
            
            // Validate required parameters
            if (!finalServiceTitle || !finalStartTime || !finalEndTime || !finalWorkDate) {
                console.error("Missing required parameters:", {
                    serviceTitle: finalServiceTitle,
                    startTime: finalStartTime,
                    endTime: finalEndTime,
                    workDate: finalWorkDate
                });
                return res.status(400).json({
                    error: "Missing required parameters",
                    message: "serviceTitle (or serviceId), startTime, endTime, and workDate are required",
                    received: {
                        serviceTitle: finalServiceTitle,
                        startTime: finalStartTime,
                        endTime: finalEndTime,
                        workDate: finalWorkDate
                    }
                });
            }
            
            // Validate time range
            if (!timeUtils.isValidTimeRange(finalStartTime, finalEndTime)) {
                return res.status(400).json({
                    error: "Invalid time range",
                    message: "End time must be after start time"
                });
            }
            
            let cost = await calculateTotalCost(finalServiceTitle, finalStartTime, finalEndTime, finalWorkDate);
            console.log("Calculated cost:", cost);
            res.status(200).json(cost);
            
        } catch (error) {
            console.error("Error calculating cost:", error);
            res.status(500).json({
                error: "Internal server error",
                message: "Không thể tính toán chi phí",
                details: error.message
            });
        }
    }
    

    
}

module.exports = requestController;