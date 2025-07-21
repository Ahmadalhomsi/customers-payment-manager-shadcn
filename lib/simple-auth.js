// lib/simple-auth.js - Simplified authentication utilities for testing
"use client";

import { authManager } from './auth';

/**
 * Simple, safe API call specifically for authentication endpoints
 */
export async function simpleAuthenticatedGet(url) {
  try {
    console.log(`[SimpleAuth] Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[SimpleAuth] Response status: ${response?.status}`);
    console.log(`[SimpleAuth] Response URL: ${response?.url}`);
    console.log(`[SimpleAuth] Content-Type: ${response?.headers?.get("content-type")}`);

    // Check if we got an HTML response (redirect to login)
    const contentType = response?.headers?.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.log(`[SimpleAuth] HTML response detected - likely redirected to login`);
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Check for 401 status
    if (response?.status === 401) {
      console.log(`[SimpleAuth] 401 Unauthorized - handling token expiration`);
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Check if response is ok
    if (!response?.ok) {
      console.log(`[SimpleAuth] Response not ok: ${response?.status} ${response?.statusText}`);
      throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
    }

    // Try to parse JSON only if content-type indicates JSON
    if (contentType.includes("application/json")) {
      try {
        const data = await response.json();
        console.log(`[SimpleAuth] Successfully parsed JSON response`);
        return data;
      } catch (jsonError) {
        console.error(`[SimpleAuth] JSON parsing failed:`, jsonError);
        throw new Error('Failed to parse response as JSON');
      }
    } else {
      console.log(`[SimpleAuth] Non-JSON response content-type: ${contentType}`);
      throw new Error('Expected JSON response but got: ' + contentType);
    }

  } catch (error) {
    console.error(`[SimpleAuth] Error in simpleAuthenticatedGet:`, error);
    throw error;
  }
}
