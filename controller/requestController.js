const Request = require('../model/request.model')
const RequestDetail= require('../model/requestDetail.model')
const generalController = require('./generalController')
const mongoose = require('mongoose');
const GeneralSetting = require('../model/generalSetting.model')
const Service = require('../model/service.model')
const CostFactor = require('../model/costFactorType.model')
const Helper = require('../model/helper.model')
// Helper model không cần thiết khi tạo đơn hàng - helper sẽ được gán sau
const dayjs = require('dayjs');
const moment = require('moment');
const timeUtils = require('../utils/timeUtils');
const { notifyOrderStatusChange, notifyDetailStatusChange, notifyPaymentRequest } = require('../utils/notifications');

const CostFactorType = require('../model/costFactorType.model');

/**
 * Helper function to validate status transitions according to STATUS_FLOW.md
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Desired new status
 * @param {string} type - 'request' or 'requestDetail'
 * @returns {boolean} - Whether the transition is valid
 */
function isValidStatusTransition(currentStatus, newStatus, type = 'requestDetail') {
    const validTransitions = {
        requestDetail: {
            'pending': ['assigned', 'cancelled'],
            'assigned': ['inProgress'],
            'inProgress': ['completed'],
            'completed': [], // Final state
            'cancelled': [] // Final state
        },
        request: {
            'pending': ['inProgress', 'cancelled'],
            'inProgress': ['waitPayment'],
            'waitPayment': ['completed'],
            'completed': [], // Final state
            'cancelled': [] // Final state
        }
    };
    
    const transitions = validTransitions[type];
    if (!transitions || !transitions[currentStatus]) {
        return false;
    }
    
    return transitions[currentStatus].includes(newStatus);
}

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
 * Helper function to populate helper information for requestDetails
 * @param {Array} schedules - Array of requestDetail objects
 * @returns {Array} schedules with populated helper information
 */
async function populateHelperInfo(schedules) {
    if (!schedules || schedules.length === 0) {
        return schedules;
    }

    // Get unique helper_ids from schedules
    const helperIds = [...new Set(schedules
        .map(schedule => schedule.helper_id)
        .filter(id => id && id != 'notAvailable')
    )];

    if (helperIds.length === 0) {
        return schedules;
    }

    try {
        // Fetch helper information
        const helpers = await Helper.find({ 
            _id: { $in: helperIds },
            deleted: { $ne: true }
        }).select('_id fullName phone avatar averageRating');

        // Create a map for quick lookup
        const helperMap = {};
        helpers.forEach(helper => {
            helperMap[helper._id] = {
                _id: helper._id,
                fullName: helper.fullName,
                phone: helper.phone,
                avatar: helper.avatar,
                averageRating: helper.averageRating
            };
        });

        // Populate helper info in schedules
        return schedules.map(schedule => ({
            ...schedule,
            helper: schedule.helper_id && schedule.helper_id != 'notAvailable' 
                ? helperMap[schedule.helper_id] || null 
                : null
        }));

    } catch (error) {
        console.error('Error populating helper info:', error);
        // Return original schedules if error occurs
        return schedules;
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

    // Fetch service details
    const service = await Service.findOne({ title: serviceTitle })
    .select('basicPrice coefficient_id')
    .then(s => s)
    if (!service) {
        throw new Error(`Service "${serviceTitle}" not found`);
    }
    console.log(`Service found: basePrice=${service.basicPrice}, coefficient_id=${service.coefficient_id}`);

    const basicCost = service.basicPrice;

    // calculate total hours
    let [start_hour, start_minute] = startTime.split(':');
    let [end_hour, end_minute] = endTime.split(':');

    let start = dayjs(`${workDate}T${start_hour.padStart(2, '0')}:${start_minute.padStart(2, '0')}:00.000Z`);
    let end = dayjs(`${workDate}T${end_hour.padStart(2, '0')}:${end_minute.padStart(2, '0')}:00.000Z`);

    const total_hours = end.diff(start, 'hour', true); // true for float result
    if (total_hours <= 0) {
        throw new Error("End time must be after start time");
    }
    let totalHours = end.diff(start, 'hour', true); // true for float result
    console.log(`Total hours: ${totalHours}`);
    //calculate overtime hours
    let overtimeHours = 0;
    const settings = await GeneralSetting.findOne().select('officeStartTime officeEndTime');
    if (!settings) {
        throw new Error("General settings not found");
    }
    const officeStart = dayjs(`${workDate}T${settings.officeStartTime}:00.000Z`);
    const officeEnd = dayjs(`${workDate}T${settings.officeEndTime}:00.000Z`);
    if (start.isBefore(officeStart)) {
        if (end.isBefore(officeStart)) {
            overtimeHours = totalHours;
        } else {
            overtimeHours += officeStart.diff(start, 'hour', true);
            start = officeStart;
        }
    }
    else if (start.isAfter(officeEnd)) {
        overtimeHours = totalHours;
    }
    else{
        if (end.isAfter(officeEnd)) {
            overtimeHours += end.diff(officeEnd, 'hour', true);
            end = officeEnd;
        }
    }
    console.log(`Overtime hours after morning check: ${overtimeHours}`);


    // determine if workDate is weekend or holiday

    

    //coefficient other
    const time_coefficient = await CostFactorType.findOne({ applyTo: "other" })
    .select('coefficientList')
    if (!time_coefficient) {
        throw new Error("Cost factor settings not found");
    }

    const dayOfWeek = dayjs(workDate).day();
    console.log(`Day of week: ${dayOfWeek} (0=Sunday, 6=Saturday)`);
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isHoliday = time_coefficient.coefficientList[2].status == 'active'
    console.log(`isWeekend: ${isWeekend}, isHoliday: ${isHoliday}`);
    const weekend_coef = time_coefficient.coefficientList[1].value || 1; // weekend
    const holiday_coef = time_coefficient.coefficientList[2].value || 1; // holiday
    const overtime_coef = time_coefficient.coefficientList[0].value || 1; // overtime
    const other_coef = isHoliday&&isWeekend ? Math.max(holiday_coef,weekend_coef) : (isHoliday ? holiday_coef : (isWeekend ? weekend_coef : 1));




    const service_coef = await CostFactorType.findOne({ applyTo: "service" })
    .select('coefficientList')
    .then(data=>{
        if (!data) {
            throw new Error("Service cost factor settings not found");
        }
        const matchingCoefficient = data.coefficientList.find(
            coef => coef._id.toString() === service.coefficient_id.toString()
        );
        if (matchingCoefficient) {
            return parseFloat(matchingCoefficient.value);
        } else {
            console.warn(`Service coefficient not found for service: ${serviceTitle}`);
            return 1; // default
        }
    })
    .catch(err=>{
        console.warn("Error fetching service coefficient:", err);
        return 1; // default
    });
    let totalCost = basicCost * service_coef * other_coef *  (overtimeHours * overtime_coef   + (totalHours - overtimeHours));
    
    return {
        // round to 2 decimal places
        totalCost: parseFloat(totalCost.toFixed(2)),
        servicePrice: basicCost,
        HSDV: service_coef,
        HSovertime: overtime_coef,
        HScuoituan: weekend_coef,
        isWeekend: isWeekend,
        isHoliday: isHoliday,
        totalOvertimeHours: overtimeHours,
        totalNormalHours: totalHours - overtimeHours,
        overtimeCost: parseFloat((basicCost * service_coef * other_coef * overtimeHours * overtime_coef).toFixed(2)),
    }
  };


async function calculateHelperCost (serviceTitle, startTime, endTime,workDate,coefficient_helper=1) {
    if (!startTime || !endTime || !workDate || !serviceTitle) {
        return 0;
    }
    const service = await Service.findOne({ title: serviceTitle })
    .select('basicPrice coefficient_id')
    // Fetch service details
    const coefficient_service = await CostFactorType.findOne({ applyTo: "service" })
    .select('coefficientList')
    .then(data=>{
        if (!data) {
            throw new Error("Service cost factor settings not found");
        }
        const matchingCoefficient = data.coefficientList.find(
            coef => coef._id.toString() == service.coefficient_id.toString()
        );
        if (matchingCoefficient) {
            return parseFloat(matchingCoefficient.value);
        } else {
            console.warn(`Service coefficient not found for service: ${serviceTitle}`);
            return 1; // default
        }
    })


    
    const coefficient_other = await CostFactorType.findOne({ applyTo: "other" })
    .select('coefficientList')
    const weekend_coef = coefficient_other.coefficientList[1].value || 1; // weekend
    const holiday_coef = coefficient_other.coefficientList[2].value || 1; // holiday
    const overtime_coef = coefficient_other.coefficientList[0].value || 1; // overtime
    
    // Check if workDate is weekend or holiday (similar to calculateTotalCost)
    const dayOfWeek = moment(workDate).day();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isHoliday = coefficient_other.coefficientList[2].status == 'active';
    const other_coef = isHoliday && isWeekend ? Math.max(holiday_coef, weekend_coef) : 
                      (isHoliday ? holiday_coef : (isWeekend ? weekend_coef : 1));
    
    const generalSetting = await GeneralSetting.findOne({ id: "generalSetting" })
        .select("officeStartTime officeEndTime baseSalary");

    const officeStartHour = parseInt(moment(generalSetting.officeStartTime, "HH:mm").format("H"));
    const officeEndHour = parseInt(moment(generalSetting.officeEndTime, "HH:mm").format("H"));

    // Handle string time format like "HH:mm" similar to calculateTotalCost
    let startHour, endHour;
    if (typeof startTime === 'string') {
        startHour = parseInt(startTime.split(':')[0]);
        endHour = parseInt(endTime.split(':')[0]);
    } else {
        startHour = startTime.getHours(); 
        endHour = endTime.getHours();
    }

    const totalHours = endHour - startHour; 

    // Số giờ OT đầu ca
    const otStartHours = startHour < officeStartHour
        ? officeStartHour - startHour
        : 0;

    // Số giờ OT cuối ca
    const otEndHours = endHour > officeEndHour
        ? endHour - officeEndHour
        : 0;

    // Tổng giờ OT
    const totalOtHours = otStartHours + otEndHours;

    // Tổng giờ thường
    const totalNormalHours = totalHours - totalOtHours;

    // Tính lương với logic similar to calculateTotalCost
    const totalCost =
        generalSetting.baseSalary *
        coefficient_service * // Chia 1000 để chuyển từ VND sang K VND
        coefficient_helper *
        other_coef *
        (
            (overtime_coef * totalOtHours) +
            (totalNormalHours)
        );

    return Number.parseInt(totalCost);
}

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
                    orderDate = new Date().toISOString().split('T')[0];
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
            .then(() => scheduleIds.push(reqDetail._id.toString()))
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
            requestType: req.body.requestType,
            customerInfo: req.body.customerInfo,
            service: req.body.service,
            startTime: mainStartTimeObj,
            endTime: mainEndTimeObj,
            orderDate: new Date(`${standardizedOrderDate}T00:00:00.000Z`),
            scheduleIds: scheduleIds,
            location: req.body.location,
            totalCost: totalCost, // Sử dụng tổng chi phí đã tính toán
            status: "pending"
        });
        
        await newOrder.save();
        await notifyOrderStatusChange(newOrder, "pending");
        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            costBreakdown: {
                totalServiceCost: totalCost,
                workingDates: finalWorkingDates.length,
                schedules: scheduleIds.length
            },
            note: "Người giúp việc sẽ được gán sau khi đơn hàng được tạo",
        });
        } catch (error) {
            console.error("Error in create request:", error);            
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
                        if (schedule.status == 'pending' && schedule.helper_id=="notAvailable" ) {
                            // Tính chênh lệch thời gian bằng milliseconds, sau đó chuyển sang phút
                            const timeDiffMinutes = (schedule.startTime.getTime() - currentTime.getTime()) / (1000 * 60);
                            // Chỉ hiển thị nếu thời gian bắt đầu cách hiện tại tối đa 120 phút (2 giờ)
                            // và là trong tương lai (>= 0)
                            return timeDiffMinutes >= 0 && timeDiffMinutes <= 120;
                        }
                        return false;
                    });
                    
                    // Populate helper information for filtered schedules
                    const schedulesWithHelperInfo = await populateHelperInfo(filteredSchedules.map(schedule => schedule.toObject()));
                    
                    // Convert UTC times to Vietnam time for response
                    const requestWithVietnamTime = {
                        ...request.toObject(),
                        orderDate: convertUTCToVietnamDate(request.orderDate),
                        startTime: convertUTCToVietnamTime(request.startTime),
                        endTime: convertUTCToVietnamTime(request.endTime),
                        schedules: schedulesWithHelperInfo.map(schedule => ({
                            ...schedule,
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
            )
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

            // Extract all the request detail IDs
            const detailIds = myRequestDetails.map(detail => detail._id);
            
            // More efficient approach: Find requests containing these schedules in a single query
            const requests = await Request.find({
                scheduleIds: { $in: detailIds }
            }).select('-__v -createdBy -updatedBy -deletedBy -deleted -profit -createdAt -updatedAt').lean();
            
            // Optimize by grouping schedules by request ID
            const schedulesByRequestId = {};
            myRequestDetails.forEach(schedule => {
                // Find which request this schedule belongs to
                const request = requests.find(req => 
                    req.scheduleIds && req.scheduleIds.some(sid => 
                        sid.toString() == schedule._id.toString()
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
            const requestsWithSchedules = await Promise.all(requests.map(async request => {
                const requestId = request._id.toString();
                const mySchedules = schedulesByRequestId[requestId] || [];
                
                // Populate helper information for schedules
                const schedulesWithHelperInfo = await populateHelperInfo(mySchedules);
                
                // Convert UTC times to Vietnam time for response
                return {
                    ...request,
                    orderDate: convertUTCToVietnamDate(request.orderDate),
                    startTime: convertUTCToVietnamTime(request.startTime),
                    endTime: convertUTCToVietnamTime(request.endTime),
                    schedules: schedulesWithHelperInfo.map(schedule => ({
                        ...schedule,
                        startTime: convertUTCToVietnamTime(schedule.startTime),
                        endTime: convertUTCToVietnamTime(schedule.endTime),
                        workingDate: convertUTCToVietnamDate(schedule.workingDate)
                    }))
                };
            }));
            
            // Only include requests with schedules
            const validRequests = requestsWithSchedules.filter(req => req.schedules && req.schedules.length > 0);

            res.status(200).json(validRequests);
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
            //sắp xếp ngày đặt gần nhất lên đầu
            requests.sort((a, b) => b.orderDate - a.orderDate);
            // Lấy schedules từ RequestDetail cho mỗi request
            const requestsWithSchedules = await Promise.all(
                requests.map(async (request) => {
                    const schedules = await RequestDetail.find({
                        _id: { $in: request.scheduleIds }
                    }).select('-__v -createdAt -updatedAt');
                    // sắp xếp ngày đặt gần nhất lên đầu
                    // Populate helper information for schedules
                    const schedulesWithHelperInfo = await populateHelperInfo(schedules.map(schedule => schedule.toObject()));
                    // Convert UTC times to Vietnam time for response
                    const requestWithVietnamTime = {
                        ...request.toObject(),
                        orderDate: convertUTCToVietnamDate(request.orderDate),
                        startTime: convertUTCToVietnamTime(request.startTime),
                        endTime: convertUTCToVietnamTime(request.endTime),
                        schedules: schedulesWithHelperInfo.map(schedule => ({
                            ...schedule,
                            startTime: convertUTCToVietnamTime(schedule.startTime),
                            endTime: convertUTCToVietnamTime(schedule.endTime),
                            workingDate: convertUTCToVietnamDate(schedule.workingDate),
                            comment: schedule.comment || null
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
        const nonCancellableDetails = detailDocs.filter(d => 
            !isValidStatusTransition(d.status, "cancelled", "requestDetail")
        );
        
        if (nonCancellableDetails.length > 0) {
            const invalidStatuses = nonCancellableDetails.map(d => d.status).join(', ');
            return res.status(400).json({
                success: false,
                message: `Cannot cancel request. Some details have invalid status for cancellation: ${invalidStatuses}`
            });
        }
        
        // Validate request status transition
        if (!isValidStatusTransition(request.status, "cancelled", "request")) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel request. Invalid status transition from ${request.status} to cancelled`
            });
        }
        // Cancel all
        for (const d of detailDocs) {
            d.status = 'cancelled';
            await d.save();
            
            // Send detail notification for each cancelled detail
            try {
                await notifyDetailStatusChange(request, d, "cancelled");
            } catch (e) {
                console.warn(`Notify detail cancellation failed for detail ${d._id}:`, e?.message || e);
            }
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
        return res.status(200).json({
            success: true,
            message: "Request cancelled successfully",
            request: {
                id: request._id,
                status: request.status
            }
        });

    },
    assign: async (req,res,next)=>{
        let detailId = req.body.detailId; // Change to receive requestDetail ID
        let helperId = req.user.id || req.user.phone; // Get helper ID from JWT token
        
        try {
            let schedule = await RequestDetail.findOne({ _id: detailId });
            if (!schedule) {
                return res.status(500).send("Cannot find requestDetail");
            }

            if (schedule.status != "pending") {
                return res.status(400).json({
                    success: false,
                    message: "RequestDetail is not available for assignment. Current status: " + schedule.status
                });
            }
            
            // Validate status transition
            if (!isValidStatusTransition(schedule.status, "assigned", "requestDetail")) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from ${schedule.status} to assigned`
                });
            }

            // Check if helper exists and is available
            let helper = await Helper.findOne({_id: helperId});
            if (!helper) {
                return res.status(404).json({
                    success: false,
                    message: "Helper not found"
                });
            }
            
            if (helper.workingStatus !== "online") {
                return res.status(400).json({
                    success: false,
                    message: `Helper is not available. Current status: ${helper.workingStatus}`
                });
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
            console.log(`Assigning helper ${helperId} to requestDetail ${schedule._id} ` +  typeof schedule._id);
            schedule.helper_id = helperId;
            schedule.status = "assigned";        
            // Update helper status to working
            helper.workingStatus = "working";            
            // Find parent request for notification
            console.log('Looking for request with scheduleId:', schedule._id);
            const request = await Request.findOne({ scheduleIds: { $in: [schedule._id] } })
            .populate("scheduleIds");
            
            console.log('Found request:', request ? request._id : 'null');
            
            if (!request) {
                return res.status(500).send("Cannot find parent request for this detail");
            }
            
            // Update request status to inProgress if it was pending
            if (request.status === "pending") {
                request.status = "inProgress";
            }

            schedule.helper_cost = await calculateHelperCost(
                request.service.title,
                schedule.startTime,
                schedule.endTime,
                schedule.workingDate,
                helper.coefficient_id
            );
            console.log(`Calculated helper cost: ${schedule.helper_cost}`);
            
            // Save all changes
            await schedule.save()
            .then(() => console.log("Schedule saved"))
            await request.save()
            .then(() => console.log("Request saved"))
            await helper.save()
            .then(() => console.log("Helper status updated to working"));

            try {
                // Send detail notification when helper is assigned
                // await notifyDetailStatusChange(request, schedule, "assigned");
                
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
            console.error("Error in assign:", err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    startWork:  async (req,res,next)=>{
        try {
            let detailId = req.body.detailId;
            let detail = await RequestDetail.findOne({_id:detailId});
            
            if(!detail){
                return res.status(500).send("can not find detail");        
            }
            
            // Find parent request for this detail
            const request = await Request.findOne({ scheduleIds: { $in: [detail._id] } })
            .populate("scheduleIds")
            .then((data)=>data)
            .catch((err)=> res.status(500).json(err));
            
            if (!request) {
                return res.status(500).send("Cannot find parent request for this detail");
            }

            // Updated to accept assigned status (after helper assignment) (update both requestDetail and parent Request)
            if(detail.status==="assigned"){
                // Validate status transition
                if (!isValidStatusTransition(detail.status, "inProgress", "requestDetail")) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid status transition from ${detail.status} to inProgress`
                    });
                }
                
                // Update detail status
                detail.status ="inProgress";
                
                // Update parent request status to inProgress if it was pending
                const prev = request.status;
                if(request.status === "pending"){
                    // Validate request status transition
                    if (!isValidStatusTransition(request.status, "inProgress", "request")) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid request status transition from ${request.status} to inProgress`
                        });
                    }
                    request.status = "inProgress";
                }
                
                // Save all changes together
                await detail.save();
                if (prev !== request.status) {
                    await request.save();
                }
                
                // Send notification
                try {
                    // Always send detail notification when status changes
                    await notifyDetailStatusChange(request, detail, "inProgress");
                    
                    // Send request notification only if request status changed
                    if (prev !== request.status) {
                        await notifyOrderStatusChange(request, request.status);
                    }
                } catch (e) {
                    console.warn('Notify (startWork) failed:', e?.message || e);
                }
                return res.status(200).json({
                    success: true,
                    message: "Work started successfully",
                    requestDetail: {
                        id: detail._id,
                        status: detail.status
                    },
                    request: {
                        id: request._id,
                        status: request.status
                    }
                });
            }
            else{
                res.status(400).json({
                    success: false,
                    message: `Cannot start work. RequestDetail status must be 'assigned', current status: ${detail.status}`
                });
            }
        } catch (err) {
            console.error("Error in startWork:", err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    finishRequest: async (req,res,next)=>{
        try {
            let detailId = req.body.detailId;
            let detail = await RequestDetail.findOne({_id:detailId});

            if(!detail){
                return res.status(500).send("can not find detail");        
            }

            // Find parent request for this detail
            const request = await Request.findOne({ scheduleIds: { $in: [detail._id] } })
            .populate("scheduleIds")
            .then((data)=>data)
                    
            if (!request) {
                // Debug: Check if this scheduleId exists in any request
                return res.status(500).send("Cannot find parent request for this detail");
            }

            if(detail.status==="inProgress"){
                // Validate status transition
                if (!isValidStatusTransition(detail.status, "completed", "requestDetail")) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid status transition from ${detail.status} to completed`
                    });
                }
                
                // Update detail status
                detail.status ="completed";

                // Check if all details are completed for parent request status update
                const details = await RequestDetail.find({ _id: { $in: request.scheduleIds } }).select('status');
                const allCompleted = details.every(d => [ 'completed','cancelled'].includes(d.status));
                const prev = request.status;
                
                // Update parent request status to waitPayment if all details are completed
                if (allCompleted && request.status != 'waitPayment') {
                    // Validate request status transition
                    if (!isValidStatusTransition(request.status, "waitPayment", "request")) {
                        console.warn(`Invalid request status transition from ${request.status} to waitPayment`);
                    } else {
                        request.status = 'waitPayment';
                    }
                }
                
                // Get helper to update status
                let helper = await Helper.findOne({_id:detail.helper_id});
                if(helper){
                    helper.workingStatus = "online";
                }
                
                // Save all changes together
                await detail.save();
                if (prev !== request.status) {
                    await request.save();
                }
                if(helper){
                    await helper.save()
                    .catch(err=>console.warn("Cannot update helper status to online:", err));
                }
                
                // Send notification
                try {
                    // Always send detail notification when status changes
                    await notifyDetailStatusChange(request, detail, "completed");
                    
                    // If all details are completed, send payment request notification
                    if (allCompleted && prev != request.status) {
                        await notifyPaymentRequest(request);
                    }
                } catch (e) {
                    console.warn('Notify (finishRequest) failed:', e?.message || e);
                }
                return res.status(200).json({
                    success: true,
                    message: "RequestDetail completed successfully",
                    requestDetail: {
                        id: detail._id,
                        status: detail.status
                    },
                    request: {
                        id: request._id,
                        status: request.status,
                        allDetailsCompleted: allCompleted
                    }
                });
            }
            else{
                res.status(400).json({
                    success: false,
                    message: `Cannot finish request. RequestDetail status must be 'inProgress', current status: ${detail.status}`
                });
            }
        } catch (err) {
            console.error("Error in finishRequest:", err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    finishPayment: async (req,res,next)=>{
        try {
            let id = req.body.id;
            let order = await Request.findOne({ _id: id })
            .then(data => data)
            if (!order) {
                return res.status(500).send("Không tìm thấy đơn hàng");
            }
            if (order.status !== "waitPayment") {
                return res.status(400).json({
                    success: false,
                    message: `Order is not in waitPayment status. Current status: ${order.status}`
                });
            }
            
            // Validate status transition
            if (!isValidStatusTransition(order.status, "completed", "request")) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from ${order.status} to completed`
                });
            }

            const prev = order.status;
            order.status = "completed";
            await order.save();
            
            // Send notification for status change
            try {
                if (prev !== order.status) {
                    await notifyOrderStatusChange(order, order.status);
                }
            } catch (e) {
                console.warn('Notify (finishPayment) failed:', e?.message || e);
            }
            
            res.status(200).json({
                success: true,
                message: "Payment confirmed and order completed successfully",
                order: {
                    id: order._id,
                    status: order.status
                }
            });

        } catch (err) {
            console.error("Error in finishPayment:", err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    rejectHelper:  async (req,res,next)=>{
        try {
            let id = req.body.id;
            let order = await Request.findOne({ _id: id }).then(data => data)
            if (!order) {
                return res.status(500).send("order not found");
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
            console.error("Error in rejectHelper:", err);
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
                        error: "service not found",
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
            console.error("Error in calculateCost:", error);
            res.status(500).json({
                error: "Internal server error",
                message: "Không thể tính toán chi phí"
            });
        }
    }    ,
    testHelperCost: async (req, res, next) => {
        console.log("Test helper cost endpoint hit with params:", req.query);
        try {
            const { serviceTitle, startTime, endTime, workDate,helper_coeff} = req.query;
            if (!serviceTitle || !startTime || !endTime || !workDate ) {
                return res.status(400).json({
                    error: "Missing required parameters",
                    message: "serviceTitle, startTime, endTime, workDate, and coefficientId are required"
                });
            }
            if (!timeUtils.isValidTimeRange(startTime, endTime)) {
                return res.status(400).json({
                    error: "Invalid time range",
                    message: "End time must be after start time"
                });
            }
            let cost = await calculateHelperCost(serviceTitle, startTime, endTime, workDate,helper_coeff);

            res.status(200).json({ helperCost: cost });
        } catch (error) {
            console.error("Error in testHelperCost:", error);
            res.status(500).json({
                error: "Internal server error",
                message: "Cannot calculate helper cost"
            });
        }
    }
}

module.exports = requestController;