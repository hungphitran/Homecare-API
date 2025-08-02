# Phân Tích Logic API Tính Tiền Đơn Hàng

## 📋 Tổng Quan

Hệ thống có **2 logic tính tiền** riêng biệt:
1. **Tính tiền cho Customer** (giá dịch vụ cuối cùng)
2. **Tính lương cho Helper** (chi phí nhân công)

## 🎯 Logic Tính Tiền Customer (`calculateTotalCost`)

### Công Thức:
```
Tổng tiền = BasicCost × HSDV × [(HSovertime × T1 × HScuoituan) + (HScuoituan × T2)]
```

### Các Thành Phần:

| Thành phần | Mô tả | Nguồn |
|------------|--------|-------|
| `BasicCost` | Giá cơ bản dịch vụ/giờ | `Service.basicPrice` |
| `HSDV` | Hệ số dịch vụ | `CostFactor` với `applyTo: "service"` |
| `HSovertime` | Hệ số ngoài giờ | `CostFactor.coefficientList[0].value` |
| `HScuoituan` | Hệ số cuối tuần | `CostFactor.coefficientList[1].value` |
| `T1` | Số giờ ngoài giờ hành chính | Tính toán từ `officeStartTime/EndTime` |
| `T2` | Số giờ trong giờ hành chính | `dailyHours - T1` |

### Workflow:
```javascript
// 1. Lấy thông tin cơ bản
const service = await Service.findOne({title: serviceTitle})
const basicCost = service.basicPrice
const HSDV = await CostFactor.findOne({applyTo: "service"})

// 2. Tính số giờ làm việc
const dailyHours = end.diff(start, "hour", true)

// 3. Phân loại giờ làm việc
let T1 = 0 // Overtime hours
let T2 = 0 // Normal hours

if (start.isBefore(officeStartTime)) {
    T1 += officeStartTime.diff(start, "hour", true)
}
if (end.isAfter(officeEndTime)) {
    T1 += end.diff(officeEndTime, "hour", true)
}
T2 = Math.max(0, dailyHours - T1)

// 4. Áp dụng hệ số cuối tuần
const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6)
const applicableWeekendCoefficient = isWeekend ? HScuoituan : 1

// 5. Tính toán cuối cùng
const overtimeCost = HSovertime × T1 × applicableWeekendCoefficient
const normalCost = applicableWeekendCoefficient × T2
totalCost = basicCost × HSDV × (overtimeCost + normalCost)
```

## 💰 Logic Tính Lương Helper (`calculateCost`)

### Công Thức:
```
Lương Helper = baseSalary × coefficient_service × coefficient_helper × 
               [(coefficient_OT × OTTotalHour) + (coefficient_weekend × (hoursDiff - OTTotalHour))]
```

### Các Thành Phần:

| Thành phần | Mô tả | Nguồn |
|------------|--------|-------|
| `baseSalary` | Lương cơ bản/giờ | `GeneralSetting.baseSalary` |
| `coefficient_service` | Hệ số dịch vụ | Truyền vào từ tham số |
| `coefficient_helper` | Hệ số helper | Truyền vào từ tham số |
| `coefficient_OT` | Hệ số ngoài giờ | `CostFactor.coefficientList[0].value` |
| `coefficient_weekend` | Hệ số cuối tuần | `CostFactor.coefficientList[1].value` |

### Workflow:
```javascript
// 1. Tính tổng giờ làm việc
const hoursDiff = Math.ceil(endTime.getUTCHours() - startTime.getUTCHours())

// 2. Tính giờ overtime
const OTStartTime = officeStartTime - startTime.getUTCHours() >= 0 ? 
                   officeStartTime - startTime.getUTCHours() : 0
const OTEndTime = endTime.getUTCHours() - officeEndTime >= 0 ? 
                 endTime.getUTCHours() - officeStartTime : 0
const OTTotalHour = OTStartTime + OTEndTime

// 3. Áp dụng hệ số cuối tuần
const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6)
const applicableWeekendCoefficient = isWeekend ? coefficient_weekend : 1

// 4. Tính lương cuối cùng
totalCost = baseSalary × coefficient_service × coefficient_helper × 
           ((coefficient_OT × OTTotalHour) + (coefficient_weekend × (hoursDiff - OTTotalHour)))
```

## 🔍 Endpoints API

### 1. `/request/calculateCost` (Public)
**Mục đích:** Tính giá cho customer trước khi đặt dịch vụ

**Request:**
```json
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "startTime": "08:00",
  "endTime": "12:00", 
  "workDate": "2024-01-15"
}
```

**Response:**
```json
{
  "totalCost": 264000,
  "servicePrice": 50000,
  "HSDV": 1.2,
  "HSovertime": 1.5,
  "HScuoituan": 1.3,
  "isWeekend": false,
  "totalOvertimeHours": 0,
  "totalNormalHours": 4,
  "applicableWeekendCoefficient": 1,
  "overtimeCost": 0,
  "normalCost": 4
}
```

## ⚠️ Vấn Đề và Lỗi Phát Hiện

### 🔴 Lỗi Nghiêm Trọng:

#### 1. **Inconsistent Logic giữa Customer và Helper**
- Customer sử dụng `dayjs` và `moment`
- Helper chỉ sử dụng `moment` và `getUTCHours()`
- Có thể dẫn đến sai lệch thời gian

#### 2. **Sai Logic Tính OT cho Helper**
```javascript
// ❌ Logic SAI:
const OTEndTime = endTime.getUTCHours() - officeEndTime >= 0 ? 
                 endTime.getUTCHours() - officeStartTime : 0
//                                        ^^^^^^^^^^^^^^^^ 
// Phải là officeEndTime, không phải officeStartTime
```

#### 3. **Missing Error Handling**
```javascript
// ❌ Không check null/undefined:
const serviceFactor = await CostFactor.findOne(...)
    .then(data => data.coefficientList[0].value) // Có thể lỗi nếu data null
```

#### 4. **Inconsistent Data Types**
```javascript
// Customer logic sử dụng dayjs/moment
// Helper logic sử dụng getUTCHours() - có thể sai timezone
```

### 🟡 Vấn Đề Tiềm Ẩn:

#### 1. **Performance Issues**
- Mỗi lần tính toán phải query database nhiều lần
- Không cache `GeneralSetting` và `CostFactor`

#### 2. **Timezone Handling**
- Sử dụng `getUTCHours()` có thể gây nhầm lẫn timezone
- Client và server có thể ở timezone khác nhau

#### 3. **Validation Thiếu**
- Không validate `startTime < endTime`
- Không validate `workDate` là ngày hợp lệ
- Không check service tồn tại

#### 4. **Formula Complexity**
- Logic tính toán phức tạp, khó maintain
- Không có unit tests để verify

### 🟢 Điểm Tốt:

1. ✅ **Có tách biệt logic Customer và Helper**
2. ✅ **Có xử lý cuối tuần và overtime**
3. ✅ **Sử dụng coefficients linh hoạt**
4. ✅ **Return detailed breakdown cho debug**

## 📝 Khuyến Nghị Cải Thiện

### 1. **Fix Logic Bugs**
```javascript
// Fix OT calculation for helper:
const OTEndTime = endTime.getUTCHours() - officeEndTime >= 0 ? 
                 endTime.getUTCHours() - officeEndTime : 0  // ✅ Đúng
```

### 2. **Unify Time Handling**
```javascript
// Sử dụng consistent library và timezone:
const moment = require('moment-timezone')
const timezone = 'Asia/Ho_Chi_Minh'
```

### 3. **Add Validation**
```javascript
// Validate inputs:
if (moment(startTime, 'HH:mm').isAfter(moment(endTime, 'HH:mm'))) {
    throw new Error('startTime must be before endTime')
}
```

### 4. **Add Caching**
```javascript
// Cache settings to improve performance:
const settings = await redis.get('generalSettings') || 
                 await GeneralSetting.findOne({})
```

### 5. **Add Unit Tests**
```javascript
// Test various scenarios:
describe('calculateTotalCost', () => {
    it('should calculate normal hours correctly', () => {})
    it('should calculate overtime correctly', () => {})
    it('should apply weekend coefficient', () => {})
})
```

### 6. **Improve Error Handling**
```javascript
try {
    const service = await Service.findOne({title: serviceTitle})
    if (!service) {
        throw new Error(`Service "${serviceTitle}" not found`)
    }
    // ... rest of logic
} catch (error) {
    console.error('Calculate cost error:', error)
    throw error
}
```

## 🎯 Priority Actions

1. **🔴 HIGH:** Fix OT calculation bug cho Helper
2. **🔴 HIGH:** Add input validation 
3. **🟡 MEDIUM:** Unify time handling libraries
4. **🟡 MEDIUM:** Add comprehensive error handling
5. **🟢 LOW:** Add caching và performance optimization
6. **🟢 LOW:** Add unit tests
