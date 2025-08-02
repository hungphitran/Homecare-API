# API Input Format Fixes

## 🔍 Vấn Đề Phát Hiện

User gửi request với format:
```javascript
{
  serviceId: '67c5d72c78f7a2a704b027ee',          // ❌ API expect serviceTitle
  startTime: '2025-08-14T06:30:00.000Z',         // ❌ API expect HH:mm format  
  endTime: '2025-08-14T08:30:00.000Z',           // ❌ API expect HH:mm format
  location: { province: 'Cao Bằng', district: 'Bảo Lâm' }
}
```

Nhưng `calculateTotalCost` function expect:
```javascript
{
  serviceTitle: "Dọn dẹp nhà cửa",               // ✅ String title
  startTime: "06:30",                           // ✅ HH:mm format
  endTime: "08:30",                             // ✅ HH:mm format  
  workDate: "2025-08-14"                        // ✅ YYYY-MM-DD format
}
```

## 🔧 Fix Đã Áp Dụng

### 1. Enhanced calculateCost endpoint

```javascript
calculateCost: async (req,res,next)=>{
    try {
        console.log("Request body:", req.body)
        const { serviceId, serviceTitle, startTime, endTime, workDate, location } = req.body;
        
        // Handle different input formats
        let finalServiceTitle = serviceTitle;
        let finalStartTime = startTime;
        let finalEndTime = endTime;
        let finalWorkDate = workDate;
        
        // If serviceId is provided instead of serviceTitle, look up the service
        if (serviceId && !serviceTitle) {
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
        
        // Handle ISO timestamp format (e.g., "2025-08-14T06:30:00:00.000Z")
        if (startTime && startTime.includes('T')) {
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            
            // Extract date for workDate if not provided
            if (!workDate) {
                finalWorkDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            
            // Extract time in HH:mm format
            finalStartTime = startDate.toTimeString().substring(0, 5); // HH:mm
            finalEndTime = endDate.toTimeString().substring(0, 5); // HH:mm
            
            console.log("Converted times:", {
                originalStart: startTime,
                originalEnd: endTime,
                finalStartTime,
                finalEndTime,
                finalWorkDate
            });
        }
        
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
        
        let cost = await calculateTotalCost(finalServiceTitle, finalStartTime, finalEndTime, finalWorkDate)
        console.log("Calculated cost:", cost)
        res.status(200).json(cost)
    } catch (error) {
        console.error("Error calculating cost:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Không thể tính toán chi phí",
            details: error.message
        })
    }
}
```

## ✅ Cải Thiện

### 1. **Flexible Input Handling**
- ✅ Accepts both `serviceId` and `serviceTitle`
- ✅ Converts ISO timestamps to HH:mm format
- ✅ Auto-extracts workDate from timestamp
- ✅ Better error messages with details

### 2. **Backward Compatibility**
- ✅ Still works with old format (`serviceTitle`, `HH:mm` times)
- ✅ Still works with new format (`serviceId`, ISO timestamps)

### 3. **Better Error Handling**
- ✅ Detailed error messages
- ✅ Shows what was received vs expected
- ✅ Proper HTTP status codes

## 🧪 Test Cases

### Test với format cũ:
```javascript
POST /request/calculateCost
{
  "serviceTitle": "Dọn dẹp nhà cửa",
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2024-01-15"
}
```

### Test với format mới:
```javascript
POST /request/calculateCost
{
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "2025-08-14T06:30:00.000Z",
  "endTime": "2025-08-14T08:30:00.000Z"
}
```

### Test với mixed format:
```javascript
POST /request/calculateCost
{
  "serviceId": "67c5d72c78f7a2a704b027ee",
  "startTime": "08:00",
  "endTime": "12:00",
  "workDate": "2024-01-15"
}
```

## 🔍 Time Conversion Examples

| Input (ISO) | Extracted Date | Extracted Time | Notes |
|-------------|----------------|----------------|-------|
| `2025-08-14T06:30:00.000Z` | `2025-08-14` | `06:30` | UTC → Local conversion |
| `2025-08-14T08:30:00.000Z` | `2025-08-14` | `08:30` | 2 hour duration |
| `2025-08-14T16:30:00.000Z` | `2025-08-14` | `16:30` | Afternoon time |

## 🚀 Usage

Chạy test script để verify:
```bash
node scripts/testUserCase.js
```

Hoặc test trực tiếp API:
```bash
curl -X POST http://localhost:3000/request/calculateCost \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "67c5d72c78f7a2a704b027ee",
    "startTime": "2025-08-14T06:30:00.000Z",
    "endTime": "2025-08-14T08:30:00.000Z",
    "location": {
      "province": "Cao Bằng",
      "district": "Bảo Lâm"
    }
  }'
```

## 🎯 Next Steps

1. **Test the fix** với user's actual request
2. **Update API documentation** để reflect new flexibility
3. **Add timezone handling** nếu cần thiết
4. **Consider caching** service lookups for performance
