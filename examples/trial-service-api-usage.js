// Example usage of the Trial Service API
// This file demonstrates how to interact with the /api/external/new endpoint

/**
 * Example 1: Create a new trial service
 */
async function createTrialService() {
    const response = await fetch('/api/external/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            deviceToken: 'device_123456789',
            serviceName: 'My Mobile App Trial'
        })
    });

    const data = await response.json();
    
    if (response.ok) {
        console.log('Trial service created successfully:', data);
        // Response will include:
        // - success: true
        // - service: { id, name, startingDate, endingDate, deviceToken, trialDaysRemaining: 15 }
    } else {
        console.error('Error creating trial service:', data.error);
    }
}

/**
 * Example 2: Check existing trial services for a device
 */
async function checkExistingServices() {
    const deviceToken = 'device_123456789';
    const response = await fetch(`/api/external/new?deviceToken=${deviceToken}`);
    
    const data = await response.json();
    
    if (response.ok) {
        console.log('Existing services:', data);
        // Response will include:
        // - success: true
        // - deviceToken: string
        // - services: array of service objects with trial info
        // - totalServices: number
    } else {
        console.error('Error fetching services:', data.error);
    }
}

/**
 * Example 3: Using with async/await and error handling
 */
async function createServiceWithErrorHandling() {
    try {
        const response = await fetch('/api/external/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceToken: 'unique_device_token_123',
                serviceName: 'Another Trial Service'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error occurred');
        }

        const successData = await response.json();
        console.log('Success:', successData);
        
        // You can now use the service data
        const { service } = successData;
        console.log(`Service "${service.name}" created with ID: ${service.id}`);
        console.log(`Trial expires on: ${new Date(service.endingDate).toLocaleDateString()}`);
        
    } catch (error) {
        console.error('Failed to create trial service:', error.message);
    }
}

/**
 * Example 4: cURL commands for testing
 */
/*
// Create a new trial service
curl -X POST http://localhost:3000/api/external/new \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "test_device_001",
    "serviceName": "Test Mobile App"
  }'

// Check existing services for a device
curl -X GET "http://localhost:3000/api/external/new?deviceToken=test_device_001"
*/

// Export functions for use in other files
export {
    createTrialService,
    checkExistingServices,
    createServiceWithErrorHandling
};
