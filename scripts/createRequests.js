require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');

// Import models
const Request = require('../model/request.model');
const RequestDetail = require('../model/requestDetail.model');
const Service = require('../model/service.model');
const Helper = require('../model/helper.model');
const Customer = require('../model/customer.model');
const CostFactor = require('../model/costFactorType.model');
const GeneralSetting = require('../model/generalSetting.model');

// Import utilities
const { isHoliday } = require('../utils/holidays');

// Function to calculate cost (từ requestController.js)
async function calculateTotalCost(serviceTitle, startTime, endTime, workDate) {
    if (!startTime || !endTime || !workDate || !serviceTitle) {
        return 0;
    }

    const generalSetting = await GeneralSetting.findOne({}).select("officeStartTime officeEndTime");
    let officeStartTime = generalSetting?.officeStartTime || "08:00";
    let officeEndTime = generalSetting?.officeEndTime || "17:00";

    const service = await Service.findOne({ title: serviceTitle }).select("coefficient_id basicPrice");
    const servicePrice = service?.basicPrice || 100000;
    const serviceFactorData = await CostFactor.findOne(
        { applyTo: "service" },
        { coefficientList: { $elemMatch: { _id: service?.coefficient_id } } }
    );
    const serviceFactor = serviceFactorData?.coefficientList[0]?.value || 1;

    const coefficient_other = await CostFactor.findOne({ applyTo: "other" }).select("coefficientList");

    const basicCost = parseFloat(servicePrice);
    const HSDV = parseFloat(serviceFactor);
    const HSovertime = parseFloat(coefficient_other?.coefficientList[0]?.value || 1.2);
    const HScuoituan = parseFloat(coefficient_other?.coefficientList[1]?.value || 1.5);
    const HSle = parseFloat(coefficient_other?.coefficientList[2]?.value || 2.0);

    // Tất cả thời gian được xử lý theo UTC để đảm bảo tính nhất quán
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

    // Sử dụng UTC để tính toán ngày trong tuần
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
    };
}

// Generate random time in HH:mm format (6AM to 8PM Vietnam time in UTC)
function generateRandomTime(isStart = true, startHour = null) {
    // Vietnam UTC+7, so 6AM Vietnam = 23:00 UTC (previous day)
    // 8PM Vietnam = 13:00 UTC (same day)
    let hour, minute;
    
    if (isStart) {
        // Start time: 6AM-6PM Vietnam (23:00 prev day - 11:00 same day UTC)
        const possibleHours = [23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
    } else {
        // End time should be after start time
        const minHour = startHour === 23 ? 0 : startHour + 1; // Handle midnight crossing
        const maxHour = 13; // 8PM Vietnam = 13:00 UTC
        
        if (startHour === 23) {
            // If start is 23:00 UTC, end can be 0-13 UTC next day
            hour = Math.floor(Math.random() * 14); // 0-13
        } else {
            // Normal case
            hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
        }
    }
    
    minute = Math.floor(Math.random() * 2) * 30; // 00, 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Generate random date between 30 days ago and 30 days from now
function generateRandomDate() {
    const today = new Date();
    const daysOffset = Math.floor(Math.random() * 61) - 30; // -30 to +30 days
    const randomDate = new Date(today);
    randomDate.setDate(today.getDate() + daysOffset);
    
    // Set to UTC midnight
    randomDate.setUTCHours(0, 0, 0, 0);
    return randomDate;
}

// Generate random working date with UTC time
function generateWorkingDateUTC(orderDate) {
    const workingDate = new Date(orderDate);
    // For short-term: same day or next few days
    // For long-term: can be several days later
    const daysLater = Math.floor(Math.random() * 5) + 1; // 1-5 days later
    workingDate.setDate(orderDate.getDate() + daysLater);
    workingDate.setUTCHours(0, 0, 0, 0);
    return workingDate;
}

// Generate start/end time for RequestDetail (full UTC datetime)
function generateRequestDetailTime(workingDate, baseStartTime, baseEndTime) {
    const [startHour, startMinute] = baseStartTime.split(':').map(Number);
    const [endHour, endMinute] = baseEndTime.split(':').map(Number);
    
    const startTime = new Date(workingDate);
    startTime.setUTCHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(workingDate);
    if (endHour < startHour) {
        // Cross midnight
        endTime.setDate(endTime.getDate() + 1);
    }
    endTime.setUTCHours(endHour, endMinute, 0, 0);
    
    return { startTime, endTime };
}

async function createRequests() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        // Get existing data
        const services = await Service.find({ status: 'active' });
        const helpers = await Helper.find({ deleted: false });
        const customers = await Customer.find();

        if (services.length === 0 || customers.length === 0) {
            console.log('No services or customers found. Please seed the database first.');
            return;
        }

        const requestTypes = ['Ngắn hạn', 'Dài hạn'];
        const statuses = ['pending', 'cancelled', 'completed'];
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        console.log('Creating 100 requests with corresponding request details...\n');

        for (let i = 1; i <= 100; i++) {
            try {
                // Random selections
                const service = services[Math.floor(Math.random() * services.length)];
                const customer = customers[Math.floor(Math.random() * customers.length)];
                const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
                
                // Generate order date
                const orderDate = generateRandomDate();
                
                // Generate basic times for the request
                const startTimeStr = generateRandomTime(true);
                const startHour = parseInt(startTimeStr.split(':')[0]);
                const endTimeStr = generateRandomTime(false, startHour);
                
                // Convert string times to Date objects for Request model
                const requestStartTime = new Date(`2000-01-01T${startTimeStr}:00.000Z`);
                const requestEndTime = new Date(`2000-01-01T${endTimeStr}:00.000Z`);
                
                // Determine status based on date
                let status = 'pending';
                if (orderDate < today) {
                    status = statuses[Math.floor(Math.random() * 2) + 1]; // cancelled or completed
                }

                // Create service info with cost calculation
                const costResult = await calculateTotalCost(service.title, startTimeStr, endTimeStr, orderDate.toISOString().split('T')[0]);
                
                const serviceInfo = {
                    title: service.title,
                    coefficient_service: costResult.HSDV,
                    coefficient_other: costResult.applicableWeekendCoefficient,
                    coefficient_ot: costResult.HSovertime,
                    cost: costResult.servicePrice
                };

                // Select random customer address
                const customerAddress = customer.addresses[Math.floor(Math.random() * customer.addresses.length)];
                
                // Generate request details
                const requestDetails = [];
                let scheduleIds = [];
                
                // Number of request details based on type
                const numDetails = requestType === 'Ngắn hạn' ? 1 : Math.floor(Math.random() * 4) + 2; // 2-5 for long-term
                
                let totalRequestCost = 0;

                for (let j = 0; j < numDetails; j++) {
                    const workingDate = generateWorkingDateUTC(orderDate);
                    const { startTime, endTime } = generateRequestDetailTime(workingDate, startTimeStr, endTimeStr);
                    
                    // Determine helper assignment
                    let helperId = 'notAvailable';
                    let detailStatus = 'pending';
                    
                    if (workingDate <= today && status !== 'pending') {
                        // Past dates should have assigned helpers
                        const helper = helpers[Math.floor(Math.random() * helpers.length)];
                        helperId = helper._id.toString();
                        detailStatus = status;
                    }

                    // Calculate cost for this detail
                    const workDateStr = workingDate.toISOString().split('T')[0];
                    const detailCostResult = await calculateTotalCost(service.title, startTimeStr, endTimeStr, workDateStr);
                    
                    const requestDetail = new RequestDetail({
                        workingDate: workingDate,
                        startTime: startTime,
                        endTime: endTime,
                        helper_id: helperId,
                        cost: detailCostResult.totalCost,
                        comment: {
                            review: '',
                            loseThings: false,
                            breakThings: false
                        },
                        status: detailStatus,
                        helper_cost: detailStatus === 'completed' ? Math.floor(detailCostResult.totalCost * 0.7) : 0
                    });

                    const savedDetail = await requestDetail.save();
                    scheduleIds.push(savedDetail._id);
                    totalRequestCost += detailCostResult.totalCost;
                }

                // Create the main request
                const request = new Request({
                    orderDate: orderDate,
                    scheduleIds: scheduleIds,
                    startTime: requestStartTime,
                    endTime: requestEndTime,
                    customerInfo: {
                        fullName: customer.fullName,
                        phone: customer.phone,
                        address: `${customerAddress.detailAddress}, ${customerAddress.ward}, ${customerAddress.district}, ${customerAddress.province}`,
                        usedPoint: Math.floor(Math.random() * 50) // Random points used
                    },
                    requestType: requestType,
                    service: serviceInfo,
                    totalCost: totalRequestCost,
                    status: status,
                    location: {
                        province: customerAddress.province,
                        district: customerAddress.district,
                        ward: customerAddress.ward
                    },
                    createdBy: {
                        account_id: customer._id.toString(),
                        createdAt: orderDate
                    },
                    updatedBy: [],
                    deletedBy: {}
                });

                await request.save();
                
                if (i % 10 === 0) {
                    console.log(`✓ Created ${i} requests...`);
                }

            } catch (error) {
                console.error(`Error creating request ${i}:`, error.message);
            }
        }

        console.log('\n🎉 Successfully created 100 requests with corresponding request details!');
        
        // Display summary
        const requestCount = await Request.countDocuments();
        const requestDetailCount = await RequestDetail.countDocuments();
        const pendingRequests = await Request.countDocuments({ status: 'pending' });
        const completedRequests = await Request.countDocuments({ status: 'completed' });
        const cancelledRequests = await Request.countDocuments({ status: 'cancelled' });
        const shortTermRequests = await Request.countDocuments({ requestType: 'Ngắn hạn' });
        const longTermRequests = await Request.countDocuments({ requestType: 'Dài hạn' });

        console.log('\n' + '='.repeat(50));
        console.log('Summary:');
        console.log(`✓ Total Requests: ${requestCount}`);
        console.log(`✓ Total Request Details: ${requestDetailCount}`);
        console.log(`✓ Pending Requests: ${pendingRequests}`);
        console.log(`✓ Completed Requests: ${completedRequests}`);
        console.log(`✓ Cancelled Requests: ${cancelledRequests}`);
        console.log(`✓ Short-term Requests: ${shortTermRequests}`);
        console.log(`✓ Long-term Requests: ${longTermRequests}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Error creating requests:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run if executed directly
if (require.main === module) {
    createRequests();
}

module.exports = createRequests;
