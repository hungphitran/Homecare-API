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
const { notifyOrderStatusChange } = require('../utils/notifications');

/**
 * IMPORTANT: All time calculations in this controller use UTC timezone
 * - No timezone conversions are performed 
 * - All database timestamps are stored in UTC
 * - All time comparisons and calculations use UTC
 * - This ensures consistency across different server timezones
 */

/**
 * Helper function to fix inconsistent datetime data
 * Ensures startTime and endTime use the same date as workingDate
 * Also ensures workingDate is at midnight (00:00:00)
 */
function fixDateTimeConsistency(schedule) {
    if (!schedule.startTime || !schedule.workingDate) {
        return schedule;
    }
    
    // Fix workingDate to be at midnight if it's not
    const workingDate = new Date(schedule.workingDate);
    const workingDateStr = workingDate.toISOString().split('T')[0]; // Get just the date part
    const correctedWorkingDate = new Date(`${workingDateStr}T00:00:00.000Z`);
    
    const startTime = new Date(schedule.startTime);
    const endTime = schedule.endTime ? new Date(schedule.endTime) : null;
    
    // Extract time components from original startTime and endTime
    const startHours = startTime.getUTCHours().toString().padStart(2, '0');
    const startMinutes = startTime.getUTCMinutes().toString().padStart(2, '0');
    const startTimeStr = `${startHours}:${startMinutes}`;
    
    // Create corrected startTime with workingDate
    const correctedStartTime = new Date(`${workingDateStr}T${startTimeStr}:00.000Z`);
    
    let correctedEndTime = null;
    if (endTime) {
        const endHours = endTime.getUTCHours().toString().padStart(2, '0');
        const endMinutes = endTime.getUTCMinutes().toString().padStart(2, '0');
        const endTimeStr = `${endHours}:${endMinutes}`;
        correctedEndTime = new Date(`${workingDateStr}T${endTimeStr}:00.000Z`);
    }
    
    const wasFixed = correctedStartTime.toISOString() !== schedule.startTime.toISOString() ||
                    correctedWorkingDate.toISOString() !== schedule.workingDate.toISOString();
    
    if (wasFixed) {
        console.log(`🔧 Fixed datetime consistency for schedule ${schedule._id}:`, {
            original: {
                startTime: schedule.startTime,
                workingDate: schedule.workingDate
            },
            corrected: {
                startTime: correctedStartTime.toISOString(),
                workingDate: correctedWorkingDate.toISOString()
            }
        });
    }
    
    return {
        ...schedule,
        startTime: correctedStartTime,
        endTime: correctedEndTime,
        workingDate: correctedWorkingDate
    };
}

async function calculateTotalCost (serviceTitle, startTime, endTime,workDate) {
    if (!startTime || !endTime || !workDate || !serviceTitle) {
        return 0;
    }

    const generalSetting = await GeneralSetting.findOne({}).select("officeStartTime officeEndTime");
    let officeStartTime = generalSetting.officeStartTime;
    let officeEndTime = generalSetting.officeEndTime;

    const service = await Service.findOne({ title: serviceTitle }).select("coefficient_id basicPrice");
    const servicePrice = service.basicPrice;
    const serviceFactorData = await CostFactor.findOne(
        { applyTo: "service" },
        { coefficientList: { $elemMatch: { _id: service.coefficient_id } } }
    );
    const serviceFactor = serviceFactorData?.coefficientList[0]?.value || 1;

    const coefficient_other = await CostFactor.findOne({ applyTo: "other" }).select("coefficientList");

    const basicCost = parseFloat(servicePrice);
    const HSDV = parseFloat(serviceFactor);
    const HSovertime = parseFloat(coefficient_other.coefficientList[0].value);
    const HScuoituan = parseFloat(coefficient_other.coefficientList[1].value);
    const HSle = parseFloat(coefficient_other.coefficientList[2]?.value || 1);
    const { isHoliday } = require('../utils/holidays');

    // Tất cả thời gian được xử lý theo UTC để đảm bảo tính nhất quán
    // Tạo Date objects với UTC time để so sánh chính xác
    const startUTC = moment.utc(`${workDate}T${startTime}:00`);
    const endUTC = moment.utc(`${workDate}T${endTime}:00`);
    
    // Handle cross-midnight shifts
    if (endUTC.isBefore(startUTC)) {
        endUTC.add(1, 'day');
    }

    // Chuyển đổi giờ hành chính sang UTC để so sánh
    const officeStartUTC = moment.utc(`${workDate}T${officeStartTime}:00`);
    const officeEndUTC = moment.utc(`${workDate}T${officeEndTime}:00`);

    // Log thời gian UTC để debug (không chuyển đổi timezone)
    console.log(`[UTC Time] Bắt đầu: ${startUTC.format("HH:mm")}, Giờ hành chính: ${officeStartUTC.format("HH:mm")}`);
    console.log(`[UTC Time] Kết thúc: ${endUTC.format("HH:mm")}, Giờ hành chính: ${officeEndUTC.format("HH:mm")}`);
    
    let totalCost = 0;

    // Sử dụng UTC để tính toán ngày trong tuần (không chuyển đổi timezone)
    const dayOfWeek = moment.utc(workDate).day();
    const dailyHours = Math.abs(endUTC.diff(startUTC, "hour", true));
    let T1 = 0; // Overtime hours
    let T2 = 0; // Normal hours

    console.log(`[Debug UTC] Thời gian làm việc: ${startUTC.format("HH:mm")} - ${endUTC.format("HH:mm")}`);
    console.log(`[Debug UTC] Giờ hành chính: ${officeStartUTC.format("HH:mm")} - ${officeEndUTC.format("HH:mm")}`);
    console.log(`[Debug UTC] Tổng thời gian làm việc: ${dailyHours} giờ`);

    // Calculate overtime before office hours (UTC)
    if (startUTC.isBefore(officeStartUTC)) {
        const otBeforeOffice = officeStartUTC.diff(startUTC, "hour", true);
        T1 += otBeforeOffice;
        console.log(`[OT UTC] Thời gian OT trước giờ hành chính: ${otBeforeOffice} giờ`);
    }

    // Calculate overtime after office hours (UTC)
    if (endUTC.isAfter(officeEndUTC)) {
        const otAfterOffice = endUTC.diff(officeEndUTC, "hour", true);
        T1 += otAfterOffice;
        console.log(`[OT UTC] Thời gian OT sau giờ hành chính: ${otAfterOffice} giờ`);
    }

    T2 = Math.max(0, dailyHours - T1);
    console.log(`[OT UTC] Tổng thời gian OT (T1): ${T1} giờ, Thời gian thường (T2): ${T2} giờ`);

    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const holiday = isHoliday(workDate);
    const applicableWeekendCoefficient = Math.max(isWeekend ? HScuoituan : 1, holiday ? HSle : 1);

    const overtimeCost = HSovertime * T1 * applicableWeekendCoefficient;
    const normalCost = applicableWeekendCoefficient * T2;
    totalCost = (basicCost * HSDV * (overtimeCost + normalCost));

    return {
        // round to 2 decimal places
        totalCost: parseFloat(totalCost.toFixed(2)),
        servicePrice: basicCost,
        HSDV: HSDV,
        HSovertime: HSovertime,
        HScuoituan: HScuoituan,
        isWeekend: isWeekend,
        isHoliday: holiday,
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
            
            console.log("Input dates processing:", {
                originalStartTime: req.body.startTime,
                originalEndTime: req.body.endTime,
                originalOrderDate: req.body.orderDate,
                originalStartDate: req.body.startDate,
                extractedStartDate,
                extractedEndDate,
                standardizedOrderDate,
                startDate,
                workingDates
            });

            req.body.customerInfo.usedPoint = 0;

            console.log("Standardized UTC times:", {
                originalStartTime: req.body.startTime,
                originalEndTime: req.body.endTime,
                standardizedStartTime,
                standardizedEndTime,
                extractedStartDate,
                extractedEndDate,
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
            let helperCost = 0;
            let cost = 0;
            
            // Tạo startTimeObj và endTimeObj cho từng workingDate cụ thể
            // Đảm bảo startTime và endTime được tạo với đúng workingDate để tránh sự không nhất quán
            const startTimeObj = timeUtils.timeToDate(standardizedStartTime, workingDate, true);
            const endTimeObj = timeUtils.timeToDate(standardizedEndTime, workingDate, true);
            
            // Validation: Đảm bảo startTime được tạo có cùng ngày với workingDate
            if (startTimeObj) {
                const startTimeDate = startTimeObj.toISOString().split('T')[0];
                if (startTimeDate !== workingDate) {
                    console.warn(`Date mismatch detected: workingDate=${workingDate}, startTimeDate=${startTimeDate}`);
                }
            }
            
            console.log(`Processing workingDate: ${workingDate}`, {
                standardizedStartTime,
                standardizedEndTime, 
                workingDate,
                startTimeObj_UTC: startTimeObj?.toISOString(),
                endTimeObj_UTC: endTimeObj?.toISOString(),
                workingDateForStorage: `${workingDate}T00:00:00.000Z`,
                dateConsistencyCheck: startTimeObj ? startTimeObj.toISOString().split('T')[0] === workingDate : 'N/A'
            });
            
            // Calculate helper cost if helper is assigned
            if (helperId && coef_helper) {
                try {
                    // Simple helper cost calculation based on coefficient
                    const costResult = await calculateTotalCost(req.body.service.title, standardizedStartTime, standardizedEndTime, workingDate);
                    helperCost = (costResult.totalCost || 0) * coef_helper;
                    console.log("helper cost", helperCost);
                } catch (error) {
                    console.warn("Error calculating helper cost:", error);
                    helperCost = 0;
                }
            }
            
            // Calculate total cost
            try {
                const costResult = await calculateTotalCost(req.body.service.title, standardizedStartTime, standardizedEndTime, workingDate);
                console.log("cost result", costResult);
                cost = costResult.totalCost || 0;
            } catch (error) {
                console.warn("Error calculating total cost:", error);
                cost = 0;
            }
            
            totalHelperCost += helperCost;
            
            let reqDetail = new RequestDetail({
                startTime: startTimeObj,
                endTime: endTimeObj,
                workingDate: new Date(`${workingDate}T00:00:00.000Z`), // Ensure UTC date at midnight
                helper_id: helperId || null,
                cost: cost || 0,
                helper_cost: helperCost || 0,
                status: "pending"
            });
            
            // Validation: Ensure data consistency before saving
            if (startTimeObj && reqDetail.workingDate) {
                const startTimeDate = startTimeObj.toISOString().split('T')[0];
                const workingDateStr = reqDetail.workingDate.toISOString().split('T')[0];
                const workingDateHour = reqDetail.workingDate.toISOString().split('T')[1];
                
                if (startTimeDate !== workingDateStr) {
                    console.error(`❌ Date mismatch in RequestDetail:`, {
                        scheduleId: reqDetail._id,
                        startTimeDate,
                        workingDateStr,
                        startTime: startTimeObj.toISOString(),
                        workingDate: reqDetail.workingDate.toISOString()
                    });
                }
                
                if (workingDateHour !== '00:00:00.000Z') {
                    console.error(`❌ WorkingDate should be at midnight:`, {
                        scheduleId: reqDetail._id,
                        workingDate: reqDetail.workingDate.toISOString(),
                        expected: `${workingDateStr}T00:00:00.000Z`
                    });
                }
                
                console.log(`✅ RequestDetail validation:`, {
                    scheduleId: reqDetail._id,
                    startTime: startTimeObj.toISOString(),
                    workingDate: reqDetail.workingDate.toISOString(),
                    consistent: startTimeDate === workingDateStr && workingDateHour === '00:00:00.000Z'
                });
            }
            
            console.log("reqDetail", reqDetail);
            await reqDetail.save()
            .then(() => scheduleIds.push(reqDetail._id))
            .catch(err => res.status(500).send(err));
        }
        
        console.log("total helper cost", totalHelperCost, "total cost", req.body.totalCost);
        
        // Tạo startTime và endTime cho main Request dựa trên workingDate đầu tiên
        const firstWorkingDate = workingDates[0] || standardizedOrderDate;
        const mainStartTimeObj = timeUtils.timeToDate(standardizedStartTime, firstWorkingDate, true);
        const mainEndTimeObj = timeUtils.timeToDate(standardizedEndTime, firstWorkingDate, true);
        
        let location = req.body.location || {  // handle location
            province: req.body.province,
            district: req.body.district,
            ward: req.body.ward,
        };

        let newOrder = new Request({
            orderDate: new Date(`${standardizedOrderDate}T00:00:00.000Z`), // Store as UTC date
            requestType: req.body.requestType,
            scheduleIds: scheduleIds,
            startTime: mainStartTimeObj,
            endTime: mainEndTimeObj,
            customerInfo: req.body.customerInfo,
            service: req.body.service,
            location: location,
            profit: (req.body.totalCost - totalHelperCost) || 0,
            totalCost: req.body.totalCost,
            status: "pending"
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
    // DEPRECATED: confirm method removed - status flow now skips confirm state
    // assign method now handles the transition directly
    
    // GET all request in database (sử dụng UTC cho tất cả tính toán thời gian)
    getAll: async (req,res,next)=>{
        console.log("Fetching all requests");
        try {
            const requests = await Request.find()
            .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt');
            
            let currentTime = new Date(); // Current UTC time
            //add 7 hours to current time to match with Vietnam timezone
            currentTime.setHours(currentTime.getHours() + 7);
            const helperId = req.user.id || req.user.phone; // Lấy ID của helper hiện tại

            
            // Lấy schedules từ RequestDetail cho mỗi request với điều kiện lọc
            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const allSchedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds }
                    }).select('-__v -createdAt -updatedAt');
                    
                    // console.log("All schedules for request:", request._id, allSchedules);
                    // Lọc schedules theo yêu cầu: chỉ hiển thị những requestDetail chưa có helper nào được gán
                    const filteredSchedules = allSchedules.filter(schedule => {
                        // Chỉ hiển thị RequestDetail chưa được gán helper (status = pending, helper_id = null) 
                        // và thời gian bắt đầu cách hiện tại <= 2h (tính theo UTC)
                        
                        if (schedule.status === 'pending' && !schedule.helper_id && schedule.startTime) {
                            console.log(`Processing schedule ${schedule.startTime}`);
                            // Fix datetime consistency before E
                            const correctedSchedule = fixDateTimeConsistency(schedule);
                            const scheduleStartTime = new Date(correctedSchedule.startTime);
                            console.log(`Schedule start time (UTC): ${scheduleStartTime.toISOString()}`);
                            const timeDiffMinutes = (scheduleStartTime.getTime() - currentTime) / (1000 * 60);
                            console.log(`Time difference in minutes: ${timeDiffMinutes} , current time: ${currentTime.toISOString()}`);
                            // Update the schedule object with corrected values for response
                            // schedule.startTime = correctedSchedule.startTime;
                            // schedule.endTime = correctedSchedule.endTime;
                            
                            // Chỉ hiển thị nếu thời gian bắt đầu cách hiện tại tối đa 120 phút (2 giờ)
                            return timeDiffMinutes >= 0 && timeDiffMinutes <= 120;
                        }
                        
                        return false;
                    });
                    
                    return {
                        ...request.toObject(),
                        schedules: filteredSchedules
                    };
                })
            );
            
            // Chỉ trả về những request có ít nhất 1 schedule phù hợp
            const validRequests = requestsWithSchedules.filter(request => 
                request.schedules && request.schedules.length > 0
            );
            
            res.status(200).json(validRequests);
        } catch (err) {
            console.error("Error fetching all requests:", err);

            res.status(500).json(err);
        }
    },
    getMyAssignedRequests: async (req,res,next)=>{
        try {
            const helperId = req.user.id || req.user.phone; // Get helper ID from JWT token
            
            // Find all requestDetails assigned to this helper
            const myRequestDetails = await RequestDetail.find({
                helper_id: helperId
            }).select('-__v -createdAt -updatedAt');

            if (!myRequestDetails.length) {
                return res.status(200).json([]);
            }

            // Get unique request IDs
            const requestIds = [];
            for (const detail of myRequestDetails) {
                const request = await Request.findOne({ scheduleIds: { $in: [detail._id] } });
                if (request && !requestIds.some(id => id.equals(request._id))) {
                    requestIds.push(request._id);
                }
            }

            // Get full requests with all their schedules
            const requests = await Request.find({
                _id: { $in: requestIds }
            }).select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt');

            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const allSchedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds }
                    }).select('-__v -createdAt -updatedAt');
                    
                    // Only show schedules assigned to this helper
                    const mySchedules = allSchedules.filter(schedule => 
                        schedule.helper_id === helperId
                    );
                    
                    return {
                        ...request.toObject(),
                        schedules: mySchedules
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

        // Ensure all details are cancellable (pending or assigned status allowed)
        const detailDocs = await RequestDetail.find({ _id: { $in: request.scheduleIds } });
        if (!detailDocs.every(d => ["pending", "assigned"].includes(d.status))) {
            return res.status(400).json("cannot cancel this request");
        }
        // Cancel all
        for (const d of detailDocs) {
            d.status = 'cancelled';
            await d.save();
        }
        const prevCancel = request.status;
        request.status="cancelled"
        await request.save();
        try {
            if (prevCancel !== request.status) {
                await notifyOrderStatusChange(request, request.status);
            }
        } catch (e) {
            console.warn('Notify (cancelled) failed:', e?.message || e);
        }
        return res.status(200).json("success")

    },
    assign: async (req,res,next)=>{
        let detailId = req.body.detailId; // Change to receive requestDetail ID
        let helperId = req.user.id || req.user.phone; // Get helper ID from JWT token
        
        try {
            let schedule = await RequestDetail.findOne({ _id: detailId });
            if (!schedule) {
                return res.status(500).send("Cannot find requestDetail");
            }

            if (schedule.status !== "pending") {
                return res.status(500).send("RequestDetail is not available for assignment");
            }

            // Check if the work time is within 2 hours from now 
            // Add 7 hours to current time to match Vietnam timezone (as done in getAll method)
            const currentTime = new Date();
            currentTime.setHours(currentTime.getHours() + 7);
            
            const scheduleStartTime = new Date(schedule.startTime);
            const timeDiffMinutes = (scheduleStartTime.getTime() - currentTime.getTime()) / (1000 * 60);
            
            console.log(`[ASSIGN DEBUG] Current time (VN): ${currentTime.toISOString()}`);
            console.log(`[ASSIGN DEBUG] Schedule start time: ${scheduleStartTime.toISOString()}`);
            console.log(`[ASSIGN DEBUG] Time difference: ${timeDiffMinutes} minutes`);
            
            // Allow assignment if work time is between now and 2 hours from now
            if (timeDiffMinutes < 0 || timeDiffMinutes > 120) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot assign: work time is not within 2 hours window",
                    debug: {
                        currentTime: currentTime.toISOString(),
                        scheduleStartTime: scheduleStartTime.toISOString(),
                        timeDiffMinutes: timeDiffMinutes,
                        withinWindow: timeDiffMinutes >= 0 && timeDiffMinutes <= 120
                    }
                });
            }

            // Assign helper to this specific requestDetail
            schedule.status = "assigned";
            schedule.helper_id = helperId;
            await schedule.save();

            console.log(`[ASSIGN] ✅ Successfully assigned helper ${helperId} to schedule ${detailId}`);

            // Find the parent request to send notification
            console.log(`[ASSIGN] 🔍 Looking for parent request with scheduleId: ${detailId}`);
            let request = await Request.findOne({ scheduleIds: { $in: [detailId] } });
            
            if (!request) {
                console.error(`[ASSIGN] ❌ Could not find parent request for scheduleId: ${detailId}`);
                console.error(`[ASSIGN] 🔍 Debugging - Let's check what requests exist:`);
                
                // Debug: Find all requests and log their scheduleIds
                const allRequests = await Request.find({}).select('_id scheduleIds customerInfo.phone');
                console.error(`[ASSIGN] Found ${allRequests.length} total requests in database:`);
                
                allRequests.forEach((req, index) => {
                    console.error(`  Request ${index + 1}: ${req._id}`);
                    console.error(`    - ScheduleIds: [${req.scheduleIds.join(', ')}]`);
                    console.error(`    - Phone: ${req.customerInfo?.phone}`);
                    console.error(`    - Contains target schedule? ${req.scheduleIds.some(id => id.toString() === detailId.toString())}`);
                });
                
                // Try alternative search using ObjectId conversion
                try {
                    const mongoose = require('mongoose');
                    const objectIdDetailId = new mongoose.Types.ObjectId(detailId);
                    const requestWithObjectId = await Request.findOne({ scheduleIds: { $in: [objectIdDetailId] } });
                    
                    if (requestWithObjectId) {
                        console.log(`[ASSIGN] ✅ Found parent request using ObjectId conversion: ${requestWithObjectId._id}`);
                        request = requestWithObjectId;
                    }
                } catch (objIdError) {
                    console.error(`[ASSIGN] ObjectId conversion failed:`, objIdError.message);
                }
                
                if (!request) {
                    return res.status(200).json({
                        message: "Successfully assigned to requestDetail, but could not find parent request for notification",
                        requestDetail: {
                            _id: schedule._id,
                            helper_id: schedule.helper_id,
                            status: schedule.status
                        },
                        warning: "Notification not sent - parent request not found",
                        debug: {
                            searchedScheduleId: detailId,
                            totalRequestsInDb: allRequests.length,
                            requestsWithSchedules: allRequests.map(r => ({
                                requestId: r._id,
                                scheduleCount: r.scheduleIds.length,
                                scheduleIds: r.scheduleIds
                            }))
                        }
                    });
                }
            }
            
            console.log(`[ASSIGN] ✅ Found parent request: ${request._id}`);
            console.log(`[ASSIGN] 📋 Request details:`, {
                orderId: request._id,
                customerPhone: request.customerInfo?.phone,
                status: request.status,
                scheduleIds: request.scheduleIds
            });

            try {
                console.log(`[ASSIGN] 📤 Sending notification for status change to "assigned"...`);
                const notificationResult = await notifyOrderStatusChange(request, "assigned");
                
                if (notificationResult.success) {
                    console.log(`[ASSIGN] ✅ Notification sent successfully`);
                } else {
                    console.error(`[ASSIGN] ❌ Notification failed:`, notificationResult.message);
                }
                
                return res.status(200).json({
                    message: "Successfully assigned to requestDetail",
                    requestDetail: {
                        _id: schedule._id,
                        helper_id: schedule.helper_id,
                        status: schedule.status
                    },
                    notification: {
                        sent: notificationResult.success,
                        message: notificationResult.message,
                        details: notificationResult
                    }
                });
                
            } catch (e) {
                console.error('[ASSIGN] 💥 Exception during notification:', e);
                console.error('[ASSIGN] Stack trace:', e.stack);
                
                return res.status(200).json({
                    message: "Successfully assigned to requestDetail, but notification failed",
                    requestDetail: {
                        _id: schedule._id,
                        helper_id: schedule.helper_id,
                        status: schedule.status
                    },
                    notification: {
                        sent: false,
                        error: e.message,
                        details: e.stack
                    }
                });
            }
        } catch (err) {
            console.error('[ASSIGN] 💥 Outer catch block - unexpected error:', err);
            return res.status(500).send(err.message || "An error occurred");
        }
    },
    
    startWork:  async (req,res,next)=>{
        let detailId = req.body.detailId;
        let detail = await RequestDetail.findOne({_id:detailId}) 
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        if(!detail){
            return res.status(500).send("can not find detail");        
        }
        // Updated to accept assigned status (after helper assignment)
        if(detail.status==="assigned"){
            detail.status ="inProgress";
            await detail.save()
            .then(()=>res.status(200).send("success"))
            .catch(err => res.status(500).send(err) )
        }
        else{
            res.status(500).send("can not change status of detail") 
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

        if(!detail){
            return res.status(500).send("can not find detail");        
        }
        if(detail.status==="inProgress"){
            detail.status ="waitPayment";
            await detail.save().catch(err => res.status(500).send(err));
            return res.status(200).send("success");
        }
        else{
            res.status(500).send("can not change status of detail") 
        }
    },
    finishPayment: async (req,res,next)=>{
        try {
            let detailId = req.body.detailId;
            let detail = await RequestDetail.findOne({ _id: detailId }).then(data => data)
            let request = await Request.findOne({ scheduleIds: { $in: [detailId] } }).populate("scheduleIds")
            .then(data=>data)
            .catch(err=>res.status(500).send(err))
            if (!detail) {
                return res.status(500).send("Cannot find detail");
            }
            else if(detail.status == "waitPayment") {
                detail.status = "completed";
                await detail.save();
                // Check if all details completed
                const details = await RequestDetail.find({ _id: { $in: request.scheduleIds } }).select('status');
                const allCompleted = details.every(d => d.status === 'completed');
                const prev = request.status;
                // Skip confirm status - go directly to completed when all details are done
                request.status = allCompleted ? 'completed' : 'pending';
                await request.save();
                try {
                    if (prev !== request.status) {
                        await notifyOrderStatusChange(request, request.status);
                    }
                } catch (e) {
                    console.warn('Notify (finishPayment) failed:', e?.message || e);
                }
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
                schedule.helper_id = null // Reset helper assignment
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
            // console.log("Request body:", req.body);
            const { serviceId, serviceTitle, startTime, endTime, workDate, location } = req.body;
            
            // Determine service title
            let finalServiceTitle = serviceTitle;
            if (serviceId && !serviceTitle) {
                // First try to find by ObjectId if it's valid
                const mongoose = require('mongoose');
                let service;
                
                if (mongoose.Types.ObjectId.isValid(serviceId)) {
                    service = await Service.findById(serviceId).select("title");
                } else {
                    // If not a valid ObjectId, try to find by title
                    service = await Service.findOne({ title: serviceId }).select("title");
                }
                
                if (!service) {
                    return res.status(404).json({
                        error: "Service not found",
                        message: `Service with ID/title "${serviceId}" not found`
                    });
                }
                finalServiceTitle = service.title;
                console.log("Resolved service title:", finalServiceTitle);
            }
            
            // Sử dụng thời gian UTC một cách nhất quán
            let finalStartTime, finalEndTime, finalWorkDate;
            
            // Handle different input formats  
            if (startTime && startTime.includes('T')) {
                // ISO timestamp format - sử dụng UTC time
                const startUTC = new Date(startTime);
                const endUTC = new Date(endTime);
                finalStartTime = startUTC.getUTCHours().toString().padStart(2, '0') + ':' + 
                               startUTC.getUTCMinutes().toString().padStart(2, '0');
                finalEndTime = endUTC.getUTCHours().toString().padStart(2, '0') + ':' + 
                             endUTC.getUTCMinutes().toString().padStart(2, '0');
                finalWorkDate = workDate || timeUtils.extractDate(startTime);
            } else {
                // Direct time format - giả định đã là UTC
                finalStartTime = startTime;
                finalEndTime = endTime;
                finalWorkDate = timeUtils.standardizeDate(workDate);
            }
            
            console.log("Standardized UTC inputs for cost calculation:", {
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
    },

    // Utility method to fix inconsistent datetime data in database
    fixDateTimeInconsistencies: async (req, res, next) => {
        try {
            console.log("🔧 Starting datetime inconsistency fix...");
            
            // Find all RequestDetail records
            const allSchedules = await RequestDetail.find({});
            const fixedSchedules = [];
            const issuesFound = [];
            
            for (const schedule of allSchedules) {
                const original = {
                    id: schedule._id.toString(),
                    startTime: schedule.startTime?.toISOString(),
                    endTime: schedule.endTime?.toISOString(), 
                    workingDate: schedule.workingDate?.toISOString()
                };
                
                // Check for issues
                let hasIssues = false;
                const issues = [];
                
                if (schedule.startTime && schedule.workingDate) {
                    const startTimeDate = schedule.startTime.toISOString().split('T')[0];
                    const workingDateStr = schedule.workingDate.toISOString().split('T')[0];
                    const workingDateTime = schedule.workingDate.toISOString().split('T')[1];
                    
                    if (startTimeDate !== workingDateStr) {
                        hasIssues = true;
                        issues.push('date_mismatch');
                    }
                    
                    if (workingDateTime !== '00:00:00.000Z') {
                        hasIssues = true;
                        issues.push('working_date_not_midnight');
                    }
                }
                
                if (hasIssues) {
                    // Fix the schedule
                    const corrected = fixDateTimeConsistency(schedule);
                    
                    // Update in database
                    await RequestDetail.findByIdAndUpdate(schedule._id, {
                        startTime: corrected.startTime,
                        endTime: corrected.endTime,
                        workingDate: corrected.workingDate
                    });
                    
                    fixedSchedules.push({
                        id: schedule._id.toString(),
                        issues,
                        original,
                        corrected: {
                            startTime: corrected.startTime.toISOString(),
                            endTime: corrected.endTime?.toISOString(),
                            workingDate: corrected.workingDate.toISOString()
                        }
                    });
                    
                    issuesFound.push(...issues);
                }
            }
            
            console.log(`🔧 Fixed ${fixedSchedules.length} schedules out of ${allSchedules.length} total`);
            
            res.status(200).json({
                success: true,
                message: `Fixed ${fixedSchedules.length} inconsistent records`,
                summary: {
                    totalRecords: allSchedules.length,
                    fixedRecords: fixedSchedules.length,
                    issueTypes: [...new Set(issuesFound)]
                },
                details: fixedSchedules
            });
            
        } catch (error) {
            console.error("Error fixing datetime inconsistencies:", error);
            res.status(500).json({
                success: false,
                message: "Error fixing datetime inconsistencies",
                error: error.message
            });
        }
    }
    

    
}

module.exports = requestController;