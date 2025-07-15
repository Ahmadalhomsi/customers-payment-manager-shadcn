# Trial Service API Documentation

## Overview

The Trial Service API allows external applications to create and manage 15-day trial services. This API is designed for applications that need to provide trial access to their services.

## Endpoints

### POST `/api/external/new`

Creates a new 15-day trial service for a device.

#### Request Body

```json
{
  "deviceToken": "string (required, max 255 chars)",
  "serviceName": "string (required, max 100 chars)"
}
```

#### Success Response (201)

```json
{
  "success": true,
  "service": {
    "id": "clxxxxx",
    "name": "Service Name",
    "startingDate": "2025-07-15T10:00:00.000Z",
    "endingDate": "2025-07-30T10:00:00.000Z",
    "deviceToken": "device_token_here",
    "trialDaysRemaining": 15
  }
}
```

#### Error Responses

- **400 Bad Request**: Missing required fields or invalid input
- **409 Conflict**: Service already exists and is still active
- **500 Internal Server Error**: Database or server error

### GET `/api/external/new?deviceToken={token}`

Retrieves existing trial services for a specific device token.

#### Query Parameters

- `deviceToken`: The device token to search for (required)

#### Success Response (200)

```json
{
  "success": true,
  "deviceToken": "device_token_here",
  "services": [
    {
      "id": "clxxxxx",
      "name": "Service Name",
      "description": "Trial service description",
      "startingDate": "2025-07-15T10:00:00.000Z",
      "endingDate": "2025-07-30T10:00:00.000Z",
      "deviceToken": "device_token_here",
      "customer": {
        "id": "clyyyyy",
        "name": "Trial Customer"
      },
      "totalTrialDays": 15,
      "daysRemaining": 10,
      "isActive": true,
      "isExpired": false,
      "status": "active"
    }
  ],
  "totalServices": 1
}
```

## Features

### Automatic Trial Customer Management

The API automatically manages a trial customer:
- Creates a "Trial Customer" if one doesn't exist
- Associates all trial services with this customer
- Uses default contact information for the trial customer

### Trial Service Details

- **Duration**: 15 days from creation date
- **Price**: Free (0.00 TL)
- **Payment Type**: Custom
- **Status**: Active by default

### Automatic Reminders

- Creates a reminder 2 days before trial expiry
- Reminder message includes service name and expiry warning
- Reminders are managed by the system's cron job scheduler

### Duplicate Prevention

- Prevents creating duplicate services for the same device token and service name
- Returns existing service information if still active
- Allows new service creation if previous service has expired

## Usage Examples

### JavaScript/Node.js

```javascript
// Create a trial service
const response = await fetch('/api/external/new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    deviceToken: 'my_device_token',
    serviceName: 'My App Trial'
  })
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
# Create trial service
curl -X POST http://localhost:3000/api/external/new \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "test_device_001",
    "serviceName": "Test Mobile App"
  }'

# Check existing services
curl -X GET "http://localhost:3000/api/external/new?deviceToken=test_device_001"
```

### Python

```python
import requests

# Create trial service
response = requests.post('http://localhost:3000/api/external/new', 
  json={
    'deviceToken': 'python_device_123',
    'serviceName': 'Python App Trial'
  }
)

if response.status_code == 201:
    data = response.json()
    print(f"Service created: {data['service']['name']}")
else:
    print(f"Error: {response.json()['error']}")
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (in development)"
}
```

Common error scenarios:
- Missing required fields (deviceToken, serviceName)
- Input validation failures (too long strings)
- Duplicate active services
- Database connection issues

## Security Considerations

- No authentication required (external API)
- Input validation and sanitization
- Rate limiting should be implemented at the reverse proxy level
- Monitor for abuse patterns

## Database Impact

Each trial service creation involves:
1. Finding/creating trial customer (minimal impact)
2. Creating service record
3. Creating reminder record
4. All operations are wrapped in database transactions

## Integration Notes

- API is stateless and can be called independently
- Compatible with mobile apps, web applications, and other services
- Returns consistent JSON responses
- Follows REST API conventions

## Monitoring and Analytics

Consider tracking:
- Number of trial services created per day
- Device tokens creating multiple services
- Trial conversion rates
- Most common service names

## Future Enhancements

Potential improvements:
- Configurable trial duration
- Custom trial customer per application
- Analytics endpoints
- Webhook notifications for trial expiry
- API key authentication for enhanced security
