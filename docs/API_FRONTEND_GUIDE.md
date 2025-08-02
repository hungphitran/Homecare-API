# API Documentation for Frontend Developers

## Base Information

**Base URL**: `https://your-vercel-app.vercel.app`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`

## Quick Start

### 1. Authentication Flow

```javascript
// 1. Register a new customer
const registerData = {
  phone: "0123456789",
  password: "password123",
  fullName: "Nguyễn Văn A",
  email: "example@email.com"
};

const registerResponse = await fetch('/auth/register/customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData)
});

// 2. Login customer
const loginData = {
  phone: "0123456789",
  password: "password123"
};

const loginResponse = await fetch('/auth/login/customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});

const { accessToken, refreshToken, user } = await loginResponse.json();

// 3. Use token for authenticated requests
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 2. Common API Calls

```javascript
// Get all services
const services = await fetch('/service').then(res => res.json());

// Get all helpers
const helpers = await fetch('/helper').then(res => res.json());

// Get locations
const locations = await fetch('/location').then(res => res.json());

// Calculate service cost
const costData = {
  serviceId: "service_id_here",
  startTime: "2024-01-15T08:00:00.000Z",
  endTime: "2024-01-15T12:00:00.000Z",
  location: {
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Nghĩa Đô"
  }
};

const cost = await fetch('/request/calculateCost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(costData)
}).then(res => res.json());
```

## API Endpoints Summary

### Authentication (No auth required)
- `POST /auth/register/customer` - Register customer
- `POST /auth/login/customer` - Login customer
- `POST /auth/login/helper` - Login helper
- `POST /auth/refresh` - Refresh access token

### Authentication (Auth required)
- `POST /auth/change-password` - Change password

### Customer Management (Auth required)
- `GET /customer/{phone}` - Get customer info (owner only)
- `PATCH /customer/{phone}` - Update customer info (owner only)

### Service Requests
- `POST /request/calculateCost` - Calculate cost (no auth)
- `POST /request` - Create request (customer only)
- `GET /request/{phone}` - Get customer requests (owner only)
- `POST /request/cancel` - Cancel request (customer only)
- `POST /request/assign` - Accept request (helper only)
- `POST /request/reject` - Reject request (helper only)
- `POST /request/processing` - Start work (helper only)
- `POST /request/finish` - Finish work (helper only)
- `POST /request/finishpayment` - Complete payment (helper only)

### Public Data (No auth required)
- `GET /service` - Get all services
- `GET /service/{id}` - Get service details
- `GET /helper` - Get all helpers
- `GET /helper/{id}` - Get helper details
- `GET /location` - Get location data
- `GET /blog` - Get all blogs
- `GET /blog/{id}` - Get blog details

### Other Features (Auth required)
- `GET /general` - Get general settings
- Message endpoints (coming soon)

## Request/Response Examples

### 1. Service Request Creation

**Request:**
```javascript
const requestData = {
  service: {
    title: "Dọn dẹp nhà cửa",
    coefficient_service: 1.2,
    coefficient_other: 1.1,
    cost: 50000
  },
  startTime: "2024-01-15T08:00:00.000Z",
  endTime: "2024-01-15T12:00:00.000Z",
  customerInfo: {
    fullName: "Nguyễn Văn A",
    phone: "0123456789",
    address: "123 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội",
    usedPoint: 0
  },
  location: {
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Nghĩa Đô"
  },
  requestType: "regular",
  totalCost: 264000
};

const response = await fetch('/request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```

**Response:**
```json
{
  "message": "Tạo yêu cầu thành công",
  "request": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "orderDate": "2024-01-15T07:00:00.000Z",
    "status": "notDone",
    "totalCost": 264000,
    "service": {
      "title": "Dọn dẹp nhà cửa"
    }
  }
}
```

### 2. Cost Calculation

**Request:**
```javascript
const costRequest = {
  serviceId: "60f7b3b3b3b3b3b3b3b3b3b3",
  startTime: "2024-01-15T08:00:00.000Z",
  endTime: "2024-01-15T12:00:00.000Z",
  location: {
    province: "Hà Nội",
    district: "Cầu Giấy",
    ward: "Nghĩa Đô"
  }
};
```

**Response:**
```json
{
  "service": {
    "title": "Dọn dẹp nhà cửa",
    "coefficient_service": 1.2,
    "coefficient_other": 1.1,
    "cost": 50000
  },
  "totalCost": 264000,
  "breakdown": {
    "baseCost": 200000,
    "serviceCoefficient": 1.2,
    "timeCoefficient": 1.1,
    "finalCost": 264000
  }
}
```

## Status Codes & Error Handling

### Success Codes
- `200` - OK
- `201` - Created
- `204` - No Content

### Error Codes
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

## Frontend Integration Tips

### 1. Token Management

```javascript
class TokenManager {
  getToken() {
    return localStorage.getItem('accessToken');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        this.setTokens(accessToken, newRefreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }
}
```

### 2. API Client with Auto-Retry

```javascript
class APIClient {
  constructor() {
    this.baseURL = 'https://your-api-domain.vercel.app';
    this.tokenManager = new TokenManager();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.tokenManager.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.tokenManager.refreshToken();
        if (refreshed) {
          // Retry with new token
          config.headers.Authorization = `Bearer ${this.tokenManager.getToken()}`;
          return fetch(url, config);
        } else {
          // Redirect to login
          window.location.href = '/login';
          return;
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Helper methods
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
```

### 3. React Hook Example

```javascript
// hooks/useAPI.js
import { useState, useEffect } from 'react';

export const useAPI = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(endpoint);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Usage in component
const ServicesList = () => {
  const { data: services, loading, error } = useAPI('/service');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {services?.map(service => (
        <div key={service.id}>{service.title}</div>
      ))}
    </div>
  );
};
```

## Environment Configuration

### Development
```javascript
const config = {
  API_BASE_URL: 'http://localhost:80',
  NODE_ENV: 'development'
};
```

### Production
```javascript
const config = {
  API_BASE_URL: 'https://your-vercel-app.vercel.app',
  NODE_ENV: 'production'
};
```

## Testing API Endpoints

### Using curl
```bash
# Test registration
curl -X POST http://localhost:80/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","password":"test123","fullName":"Test User"}'

# Test authenticated endpoint
curl -X GET http://localhost:80/customer/0123456789 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman
1. Create environment variables for `baseURL` and `accessToken`
2. Set up authorization to use Bearer Token with `{{accessToken}}`
3. Create requests for each endpoint
4. Set up tests to validate response structure

---

This documentation provides everything frontend developers need to integrate with the Homecare API efficiently. For additional support, please refer to the main README or contact the development team.
