// lib/api-utils.js - Utility functions for safe API interactions
"use client";

import { authManager, safeJsonParse } from './auth';

/**
 * Safe API call wrapper that handles common errors
 */
export async function safeApiCall(url, options = {}) {
  try {
    console.log(`Making API call to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`API Response status: ${response?.status}`);
    console.log(`API Response URL: ${response?.url}`);

    // Handle different response scenarios
    if (!response) {
      throw new Error('No response received from server');
    }

    // Check if we got redirected to login page
    if (response.url && response.url.includes('/login')) {
      console.log('Detected redirect to login page in safeApiCall');
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Check if response is HTML (indicating a redirect to login page)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.log('HTML response detected (likely redirected to login)');
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Check for authentication errors
    if (response.status === 401) {
      console.log('401 Unauthorized detected, handling token expiration');
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Check for other HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to get error details from response body if it's JSON
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await safeJsonParse(response);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch (parseError) {
        console.log('Could not parse error response as JSON:', parseError.message);
        // Use the basic HTTP error message
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    console.error('Safe API call error:', error);
    
    // Re-throw authentication errors without modification
    if (error.message === 'Authentication required') {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network connection failed');
    }
    
    // Handle other errors
    throw error;
  }
}

/**
 * GET request with error handling
 */
export async function safeGet(url, options = {}) {
  const response = await safeApiCall(url, {
    ...options,
    method: 'GET',
  });
  
  return await safeJsonParse(response);
}

/**
 * POST request with error handling
 */
export async function safePost(url, data, options = {}) {
  const response = await safeApiCall(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  return await safeJsonParse(response);
}

/**
 * PUT request with error handling
 */
export async function safePut(url, data, options = {}) {
  const response = await safeApiCall(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  return await safeJsonParse(response);
}

/**
 * DELETE request with error handling
 */
export async function safeDelete(url, options = {}) {
  const response = await safeApiCall(url, {
    ...options,
    method: 'DELETE',
  });
  
  // DELETE requests might not return JSON content
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await safeJsonParse(response);
  }
  
  return { success: true };
}
