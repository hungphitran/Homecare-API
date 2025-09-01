const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const generalController = require('./generalController')
const mongoose = require('mongoose');
const GeneralSetting = require('../model/general.model')
const Service = require('../model/service.model')
const CostFactor = require('../model/costFactorType.model')
// Helper model không cần thiết khi tạo đơn hàng - helper sẽ được gán sau
const dayjs = require('dayjs');
const moment = require('moment');
const timeUtils = require('../utils/timeUtils');
const { notifyOrderStatusChange } = require('../utils/notifications');


/**
 * Helper function to convert UTC time to Vietnam time (+7) for response
 * @param {Date|string} utcTime - UTC time from database
 * @returns {string} Vietnam time in ISO format
 */
function convertUTCToVietnamTime(utcTime) {
    if (!utcTime) return null;
    
    try {
        const date = new Date(utcTime);
        if (isNaN(date.getTime())) return null;
        
        // Add 7 hours to convert UTC to Vietnam time
        const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        return vietnamTime.toISOString();
    } catch (error) {
        console.error('Error converting UTC to Vietnam time:', error);
        return utcTime;
    }
}

/**
 * Helper function to convert UTC date to Vietnam date for response
 * @param {Date|string} utcDate - UTC date from database
 * @returns {string} Vietnam date in YYYY-MM-DD format
 */
function convertUTCToVietnamDate(utcDate) {
    if (!utcDate) return null;
    
    try {
        const date = new Date(utcDate);
        if (isNaN(date.getTime())) return null;
        
        // Add 7 hours to convert UTC to Vietnam time, then extract date
        const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        return vietnamTime.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error converting UTC to Vietnam date:', error);
        return utcDate;
    }
}

/**
 * Helper function to fix inconsistent datetime data
 * Ensures startTime and endTime use the same date as workingDate
 * Also ensures workingDate is at midnight (00:00:00)
 */

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

    let totalCost = 0;

    // Sử dụng UTC để tính toán ngày trong tuần (không chuyển đổi timezone)
    const dayOfWeek = moment.utc(workDate).day();
    const dailyHours = Math.abs(endUTC.diff(startUTC, "hour", true));
    let T1 = 0; // Overtime hours
    let T2 = 0; // Normal hours

    // Calculate overtime before office hours (UTC)
    if (startUTC.isBefore(officeStartUTC)) {
        const otBeforeOffice = officeStartUTC.diff(startUTC, "hour", true);
        T1 += otBeforeOffice;
    }

    // Calculate overtime after office hours (UTC)
    if (endUTC.isAfter(officeEndUTC)) {
        const otAfterOffice = endUTC.diff(officeEndUTC, "hour", true);
        T1 += otAfterOffice;
    }

    T2 = Math.max(0, dailyHours - T1);

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
            if( typeof req.body.customerInfo == "string"){
                req.body.customerInfo = JSON.parse(req.body.customerInfo);
            }
            
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
                try {
                    orderDate = timeUtils.extractDate(req.body.startTime);
                    if (!orderDate) {
                        // If extraction fails, use current date
                        orderDate = new Date().toISOString().split('T')[0];
                        console.warn("Could not extract date from startTime, using current date instead");
                    }
                } catch (err) {
                    console.error("Error extracting date from startTime:", err);
                    // Fallback to current date
                    orderDate = new Date().toISOString().split('T')[0];
                }
            }
            
            const standardizedOrderDate = timeUtils.standardizeDate(orderDate) || timeUtils.standardizeDate(new Date());
            
            // Extract individual dates for start and end times to handle cross-day scenarios
            let extractedStartDate;
            let extractedEndDate;
            
            try {
                extractedStartDate = req.body.startTime ? timeUtils.extractDate(req.body.startTime) : standardizedOrderDate;
                if (!extractedStartDate) extractedStartDate = standardizedOrderDate;
            } catch (err) {
                console.error("Error extracting start date:", err);
                extractedStartDate = standardizedOrderDate;
            }
            
            try {
                extractedEndDate = req.body.endTime ? timeUtils.extractDate(req.body.endTime) : standardizedOrderDate;
                if (!extractedEndDate) extractedEndDate = standardizedOrderDate;
            } catch (err) {
                console.error("Error extracting end date:", err);
                extractedEndDate = standardizedOrderDate;
            }
            
            // Handle startDate - derive from startTime if not provided
            let startDate = req.body.startDate || extractedStartDate;
            
            // Format dates array
            const workingDates = timeUtils.formatDateArray(startDate);
            if (workingDates.length === 0) {
                // If no working dates provided, use the order date
                workingDates.push(standardizedOrderDate);
            }
            
            // Validate working dates are not in the past
            const currentDate = new Date().toISOString().split('T')[0];
            const validWorkingDates = workingDates.filter(date => date >= currentDate);
            
            if (validWorkingDates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "All working dates are in the past. Please provide valid future dates."
                });
            }
            
            // Use valid working dates
            const finalWorkingDates = validWorkingDates.length > 0 ? validWorkingDates : workingDates;

            req.body.customerInfo.usedPoint = 0;
        
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
        
        // Validate service coefficient
        let serviceFactor = 1; // Default value
        try {
            const costFactorData = await CostFactor.findOne({ applyTo: "service" });
            if (costFactorData && costFactorData.coefficientList) {
                const matchingCoefficient = costFactorData.coefficientList.find(
                    coef => coef._id.toString() === service.coefficient_id.toString()
                );
                if (matchingCoefficient) {
                    serviceFactor = parseFloat(matchingCoefficient.value);
                } else {
                    console.warn(`Service coefficient not found for service: ${req.body.service.title}`);
                }
            } else {
                console.warn("Cost factor data not found for services");
            }
        } catch (error) {
            console.warn("Error fetching service coefficient:", error);
            // Continue with default value
        }

        let scheduleIds = [];
        let totalCost = req.body.totalCost; // Tổng chi phí dịch vụ
        
        // Mặc định không có helper khi tạo đơn hàng
        // Helper sẽ được gán sau này thông qua endpoint assign
        
        for (let workingDate of finalWorkingDates) {
            let cost = 0;
            
            const startTimeObj = timeUtils.timeToDate(standardizedStartTime, workingDate, true);
            const endTimeObj = timeUtils.timeToDate(standardizedEndTime, workingDate, true);
            
            // Validation: Đảm bảo startTime được tạo có cùng ngày với workingDate
            if (startTimeObj) {
                const startTimeDate = startTimeObj.toISOString().split('T')[0];
                if (startTimeDate !== workingDate) {
                    console.warn(`Date mismatch detected: workingDate=${workingDate}, startTimeDate=${startTimeDate}`);
                }
            }
            let reqDetail = new RequestDetail({
                startTime: startTimeObj,
                endTime: endTimeObj,
                // Use UTC-midnight Date to ensure UTC storage (with 'Z')
                workingDate: new Date(`${workingDate}T00:00:00.000Z`),
                helper_id: "notAvailable", // Mặc định không có helper
                cost: totalCost/finalWorkingDates.length || 0,
                helper_cost: 0, // Không có helper cost khi tạo đơn
                status: "pending"
            });
            
            // Validation: Ensure data consistency before saving
            if (startTimeObj && reqDetail.workingDate) {
                const startTimeDate = startTimeObj.toISOString().split('T')[0];
                const workingDateStr = reqDetail.workingDate.toISOString().split('T')[0];
                const workingDateHour = reqDetail.workingDate.toISOString().split('T')[1];
                
                if (startTimeDate !== workingDateStr) {
                    console.warn(`Date mismatch in RequestDetail: startTimeDate=${startTimeDate}, workingDateStr=${workingDateStr}`);
                }
                
                if (workingDateHour !== '00:00:00.000Z') {
                    console.warn(`WorkingDate should be at midnight: workingDate=${reqDetail.workingDate.toISOString()}`);
                }
            }
            
            await reqDetail.save()
            .then(() => scheduleIds.push(reqDetail._id))
            .catch(err => res.status(500).send(err));
        }
        
        // Validate total cost calculation
        if (totalCost <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid cost calculation. Total cost must be greater than 0."
            });
        }
        
        // Create new order
        const firstWorkingDate = finalWorkingDates[0] || standardizedOrderDate;
        const mainStartTimeObj = timeUtils.timeToDate(standardizedStartTime, firstWorkingDate, true);
        const mainEndTimeObj = timeUtils.timeToDate(standardizedEndTime, firstWorkingDate, true);
        
        let newOrder = new Request({
            customerInfo: req.body.customerInfo,
            service: req.body.service,
            startTime: mainStartTimeObj,
            endTime: mainEndTimeObj,
            orderDate: new Date(`${standardizedOrderDate}T00:00:00.000Z`),
            scheduleIds: scheduleIds,
            totalCost: totalCost, // Sử dụng tổng chi phí đã tính toán
            helper_cost: 0, // Không có helper cost khi tạo đơn
            status: "pending"
        });
        
        await newOrder.save();
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            costBreakdown: {
                totalServiceCost: totalCost,
                workingDates: finalWorkingDates.length,
                schedules: scheduleIds.length
            },
            note: "Helper will be assigned later through assign endpoint"
        });
        } catch (error) {
            console.error("Error in create request:", error);
            
            // Provide more specific error messages
            let errorMessage = "Internal server error";
            if (error.name === 'ValidationError') {
                errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(', ');
            } else if (error.name === 'CastError') {
                errorMessage = "Invalid data format";
            } else if (error.code === 11000) {
                errorMessage = "Duplicate entry found";
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    // DEPRECATED: confirm method removed - status flow now skips confirm state
    // assign method now handles the transition directly
    
    // GET all request in database (sử dụng UTC cho tất cả tính toán thời gian)
    getAll: async (req,res,next)=>{
        try {
            const requests = await Request.find()
            .select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt');
            
            // Lấy thời gian hiện tại theo UTC
            let currentTime = new Date();

            // No timezone conversion needed - keep UTC
            const helperId = req.user.id || req.user.phone; // Lấy ID của helper hiện tại

            // Lấy schedules từ RequestDetail cho mỗi request với điều kiện lọc
            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const allSchedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds },
                        //lấy startTime có ngày == ngày hiện tại 
                        workingDate: { $gte: new Date(currentTime.toISOString().split('T')[0] + 'T00:00:00.000Z') }
                    }).select('-__v -createdAt -updatedAt')
                    .sort({ workingDate: 1 }); // Sắp xếp theo workingDate và startTime
                    
                    // Lọc schedules theo yêu cầu: chỉ hiển thị những requestDetail chưa có helper nào được gán
                    const filteredSchedules = allSchedules.filter(schedule => {
                        // Chỉ hiển thị RequestDetail chưa được gán helper (status = pending, helper_id = null) 
                        // và thời gian bắt đầu cách hiện tại <= 2h (tính theo UTC)
                        if (schedule.status === 'pending' && schedule.helper_id=="notAvailable" && schedule.startTime ) {
                            // Tính chênh lệch thời gian bằng milliseconds, sau đó chuyển sang phút
                            const timeDiffMinutes = (schedule.startTime.getTime() - currentTime.getTime()) / (1000 * 60);
                            
                            // Chỉ hiển thị nếu thời gian bắt đầu cách hiện tại tối đa 120 phút (2 giờ)
                            // và là trong tương lai (>= 0)
                            return timeDiffMinutes >= 0 && timeDiffMinutes <= 120;
                        }
                        
                        return false;
                    });
                    
                    // Convert UTC times to Vietnam time for response
                    const requestWithVietnamTime = {
                        ...request.toObject(),
                        orderDate: convertUTCToVietnamDate(request.orderDate),
                        startTime: convertUTCToVietnamTime(request.startTime),
                        endTime: convertUTCToVietnamTime(request.endTime),
                        schedules: filteredSchedules.map(schedule => ({
                            ...schedule.toObject(),
                            startTime: convertUTCToVietnamTime(schedule.startTime),
                            endTime: convertUTCToVietnamTime(schedule.endTime),
                            workingDate: convertUTCToVietnamDate(schedule.workingDate)
                        }))
                    };
                    
                    return requestWithVietnamTime;
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
            const helperId = req.user.id || req.user.phone || req.user.helper_id; // Get helper ID from JWT token
            
            // Find all requestDetails assigned to this helper
            const myRequestDetails = await RequestDetail.find({
                helper_id: String(helperId),  // Ensure consistent string comparison
                // Optional: Filter by status if needed
                // status: { $in: ['assigned', 'inProgress', 'waitPayment'] }
            }).select('-__v -createdAt -updatedAt').lean();

            if (!myRequestDetails.length) {
                return res.status(200).json([]);
            }

            // Extract all the request detail IDs
            const detailIds = myRequestDetails.map(detail => detail._id);
            
            // More efficient approach: Find requests containing these schedules in a single query
            const requests = await Request.find({
                scheduleIds: { $in: detailIds }
            }).select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt').lean();
            
            // Create a map for quick lookups
            const requestMap = new Map(requests.map(req => [req._id.toString(), req]));

            // Optimize by grouping schedules by request ID
            const schedulesByRequestId = {};
            myRequestDetails.forEach(schedule => {
                // Find which request this schedule belongs to
                const request = requests.find(req => 
                    req.scheduleIds && req.scheduleIds.some(sid => 
                        sid.toString() === schedule._id.toString()
                    )
                );
                
                if (request) {
                    const requestId = request._id.toString();
                    if (!schedulesByRequestId[requestId]) {
                        schedulesByRequestId[requestId] = [];
                    }
                    schedulesByRequestId[requestId].push(schedule);
                }
            });
            
            // Format response with proper time conversions
            const requestsWithSchedules = requests.map(request => {
                const requestId = request._id.toString();
                const mySchedules = schedulesByRequestId[requestId] || [];
                
                // Convert UTC times to Vietnam time for response
                return {
                    ...request,
                    orderDate: convertUTCToVietnamDate(request.orderDate),
                    startTime: convertUTCToVietnamTime(request.startTime),
                    endTime: convertUTCToVietnamTime(request.endTime),
                    schedules: mySchedules.map(schedule => ({
                        ...schedule,
                        startTime: convertUTCToVietnamTime(schedule.startTime),
                        endTime: convertUTCToVietnamTime(schedule.endTime),
                        workingDate: convertUTCToVietnamDate(schedule.workingDate)
                    }))
                };
            }).filter(req => req.schedules && req.schedules.length > 0); // Only include requests with schedules

            res.status(200).json(requestsWithSchedules);
        } catch (err) {
            console.error('Error in getMyAssignedRequests:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng'
            });
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
                    
                    // Convert UTC times to Vietnam time for response
                    const requestWithVietnamTime = {
                        ...request.toObject(),
                        orderDate: convertUTCToVietnamDate(request.orderDate),
                        startTime: convertUTCToVietnamTime(request.startTime),
                        endTime: convertUTCToVietnamTime(request.endTime),
                        schedules: schedules.map(schedule => ({
                            ...schedule.toObject(),
                            startTime: convertUTCToVietnamTime(schedule.startTime),
                            endTime: convertUTCToVietnamTime(schedule.endTime),
                            workingDate: convertUTCToVietnamDate(schedule.workingDate)
                        }))
                    };
                    
                    return requestWithVietnamTime;
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
        console.log("Assigning helper to requestDetail", req.body);
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
            // Use UTC time consistently - no timezone conversion needed
            const currentTime = new Date();
            // No timezone conversion needed - keep UTC
            
            const scheduleStartTime = new Date(schedule.startTime);
            const timeDiffMinutes = (scheduleStartTime.getTime() - currentTime.getTime()) / (1000 * 60);
            
            // Allow assignment if work time is between now and 2 hours from now
            if (timeDiffMinutes < 0 || timeDiffMinutes > 120) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot assign: work time is not within 2 hours window"
                });
            }

            // Update the schedule
            schedule.helper_id = helperId;
            schedule.status = "assigned";
            await schedule.save();
            
            // Find parent request for notification
            const request = await Request.findOne({ scheduleIds: { $in: [detailId] } });
            
            if (!request) {
                // Try alternative search methods
                let requestWithObjectId = null;
                try {
                    const objectId = new mongoose.Types.ObjectId(detailId);
                    requestWithObjectId = await Request.findOne({ scheduleIds: { $in: [objectId] } });
                    if (requestWithObjectId) {
                        request = requestWithObjectId;
                    }
                } catch (objIdError) {
                    // ObjectId conversion failed, continue with error handling
                }
                
                if (!request) {
                    return res.status(200).json({
                        message: "Successfully assigned to requestDetail, but could not find parent request for notification",
                        requestDetail: {
                            _id: schedule._id,
                            helper_id: schedule.helper_id,
                            status: schedule.status
                        },
                        warning: "Notification not sent - parent request not found"
                    });
                }
            }

            try {
                const notificationResult = await notifyOrderStatusChange(request, "assigned");
                
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
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    startWork:  async (req,res,next)=>{
        let detailId = req.body.detailId;
        let detail = await RequestDetail.findOne({_id:detailId}) 
        .then(data=>data)
        .catch(err=>res.status(500).send(err))
        
        // lấy request  chứa detailId
        let request = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)})
        .populate("scheduleIds")
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        if(!detail){
            return res.status(500).send("can not find detail");        
        }
        // Updated to accept assigned status (after helper assignment) (update both requestDetail and parent Request)
        if(detail.status==="assigned"){
            detail.status ="inProgress";
            await detail.save()
            .catch(err => res.status(500).send(err));
            // Update parent request status to inProgress if it was pending
            if(request.status === "pending"){
                const prev = request.status;
                request.status = "inProgress";
                await request.save();
                try {
                    if (prev !== request.status) {
                        await notifyOrderStatusChange(request, request.status);
                    }
                } catch (e) {
                    console.warn('Notify (startWork) failed:', e?.message || e);
                }
            }
            return res.status(200).send("success");
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

        let request  = await Request.findOne({scheduleIds : new mongoose.Types.ObjectId(detailId)})
        .populate("scheduleIds")
        .then(data=>data)
        .catch(err=>res.status(500).send(err))

        

        if(!detail){
            return res.status(500).send("can not find detail");        
        }
        if(detail.status==="inProgress"){
            detail.status ="waitPayment";
            await detail.save().catch(err => res.status(500).send(err));

            // Update parent request status to waitPayment if all details are in waitPayment or completed
            const details = await RequestDetail.find({ _id: { $in: request.scheduleIds } }).select('status');
            const allWaitPaymentOrCompleted = details.every(d => ['waitPayment', 'completed','cancelled'].includes(d.status));
            const prev = request.status;
            if (allWaitPaymentOrCompleted && request.status !== 'waitPayment') {
                request.status = 'waitPayment';
                await request.save();
                try {
                    if (prev !== request.status) {
                        await notifyOrderStatusChange(request, request.status);
                    }
                } catch (e) {
                    console.warn('Notify (finishRequest) failed:', e?.message || e);
                }
            }

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
            return res.status(500).json({ error: 'Internal server error' });
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
                await schedule.save()
            }
            res.status(200).send("Success")

        } catch (err) {
            return res.status(500).json({ error: 'Internal server error' });
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
            }
            
            // Sử dụng thời gian UTC một cách nhất quán
            let finalStartTime, finalEndTime, finalWorkDate;
            
            // Handle different input formats - always convert to UTC
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
            
            // Validate required parameters
            if (!finalServiceTitle || !finalStartTime || !finalEndTime || !finalWorkDate) {
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
            res.status(200).json(cost);
            
        } catch (error) {
            res.status(500).json({
                error: "Internal server error",
                message: "Không thể tính toán chi phí"
            });
        }
    }    
}

module.exports = requestController;