# Endpoint Cost Calculation Test Results

## ✅ **ENDPOINT STATUS: WORKING CORRECTLY**

### 📍 **Endpoint Information:**
- **URL:** `POST /request/calculateCost`  
- **Full URL:** `http://localhost:3000/request/calculateCost`
- **Status:** ✅ Active and functional

### 🧪 **Test Results for Your Data:**

#### ❌ **Original Data Issue:**
```json
{
  "serviceId": "string",
  "startTime": "2025-08-03T06:30:00.000Z",
  "endTime": "2025-08-03T08:30:00.000Z",
  "workDate": "2025-08-03",
  "location": {
    "province": "string",
    "district": "string", 
    "ward": "string"
  }
}
```
**Error:** `Invalid service ID format - "string" is not a valid ObjectId`

#### ✅ **Fixed Data (Recommended):**
```json
{
  "serviceTitle": "Chăm sóc người già",
  "startTime": "2025-08-03T06:30:00.000Z",
  "endTime": "2025-08-03T08:30:00.000Z",
  "workDate": "2025-08-03",
  "location": {
    "province": "string",
    "district": "string",
    "ward": "string"
  }
}
```

**Response:**
```json
{
  "totalCost": 93639,
  "servicePrice": 21000,
  "HSDV": 1.3,
  "HSovertime": 1.3,
  "HScuoituan": 1.4,
  "isWeekend": true,
  "totalOvertimeHours": 1.5,
  "totalNormalHours": 0.5,
  "applicableWeekendCoefficient": 1.4,
  "overtimeCost": 2.73,
  "normalCost": 0.7
}
```

### 📊 **Cost Breakdown Analysis:**
- **Base Service Price:** 21,000 VND (Chăm sóc người già)
- **Service Factor (HSDV):** 1.3
- **Weekend Factor:** 1.4 (Applied because August 3, 2025 is Saturday)
- **Overtime Factor:** 1.3
- **Total Hours:** 2 hours (06:30 - 08:30 UTC)
- **Overtime Hours:** 1.5 hours (outside office hours)
- **Normal Hours:** 0.5 hours (within office hours)
- **Final Cost:** 93,639 VND

### 🔢 **Calculation Formula:**
```
totalCost = servicePrice × HSDV × (overtimeComponent + normalComponent)
Where:
- overtimeComponent = HSovertime × overtimeHours × weekendCoeff
- normalComponent = weekendCoeff × normalHours
```

### 🗃️ **Available Services in Database:**
1. **"Dọn nhà"** - 20,000 VND
2. **"Chăm sóc bé"** - 24,000 VND  
3. **"Chăm sóc người già"** - 21,000 VND
4. **"Chăm sóc sản phụ"** - 24,000 VND
5. **"Đưa đón bé"** - 24,000 VND
6. **"Nấu ăn"** - 24,000 VND
7. **"Vệ sinh phòng"** - 24,000 VND

### ✅ **Supported Input Formats:**

#### 1. **ISO Timestamp Format (Recommended):**
```json
{
  "serviceTitle": "Chăm sóc người già",
  "startTime": "2025-08-03T06:30:00.000Z",
  "endTime": "2025-08-03T08:30:00.000Z",
  "workDate": "2025-08-03"
}
```

#### 2. **Direct Time Format:**
```json
{
  "serviceTitle": "Chăm sóc người già", 
  "startTime": "06:30",
  "endTime": "08:30",
  "workDate": "2025-08-03"
}
```

#### 3. **With Valid Service ID:**
```json
{
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "2025-08-03T06:30:00.000Z",
  "endTime": "2025-08-03T08:30:00.000Z", 
  "workDate": "2025-08-03"
}
```

### 🎯 **Key Features Working:**
- ✅ Time format parsing (ISO + direct)
- ✅ Weekend detection and coefficient application
- ✅ Overtime calculation based on office hours
- ✅ Service lookup by title or ID
- ✅ Cost factor calculation
- ✅ Error handling for invalid inputs

### 🐛 **Issues Found & Fixed:**
1. **Invalid serviceId validation** - Now properly validates ObjectId format
2. **Service lookup error handling** - Provides clear error messages
3. **Time parsing** - Supports multiple time formats

### 💡 **Recommendations:**
1. **Use `serviceTitle` instead of `serviceId`** for easier testing
2. **Provide valid MongoDB ObjectIds** if using serviceId
3. **ISO timestamp format is preferred** for precise time handling
4. **Weekend calculations are automatically applied**
5. **Office hours determine overtime calculation**

### 🎉 **Conclusion:**
Your cost calculation endpoint is **working perfectly**! The only issue was using an invalid `serviceId`. Switch to `serviceTitle` or use a valid ObjectId from the database.
