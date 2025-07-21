// lib/auth.js - Centralized auth utilities
"use client";

import { toast } from "@/hooks/use-toast";

class AuthManager {
  constructor() {
    this.isRedirecting = false;
  }

  // Handle token expiration globally
  handleTokenExpiration() {
    if (this.isRedirecting) return;
    
    this.isRedirecting = true;
    
    // Clear all stored tokens
    this.clearTokens();
    
    // Only show toast if we're not already on the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // Show user-friendly message
      toast({
        title: "Oturum Süresi Doldu",
        description: "Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
    }
    
    // Redirect to login after a short delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
    }, 1500);
  }

  // Handle API errors globally
  handleApiError(error, response) {
    // Safely check response status
    const status = response?.status;
    
    if (status === 401) {
      this.handleTokenExpiration();
      return true; // Indicates error was handled
    }
    
    // Log other errors for debugging
    if (error) {
      console.error('API Error:', error);
    }
    
    return false; // Let other error handlers deal with it
  }

  // Clear all token storage
  clearTokens() {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      
      // Clear cookie by setting it to expire
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get token from storage
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
}

// Create singleton instance
const authManager = new AuthManager();

// Utility function to safely parse JSON responses
export async function safeJsonParse(response) {
  if (!response) {
    throw new Error('No response provided');
  }
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error('Response is not JSON');
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Failed to parse JSON response');
  }
}

// Enhanced fetch wrapper with automatic error handling
export async function authenticatedFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if we got redirected to login page (HTML response)
    if (response && response.url && response.url.includes('/login')) {
      console.log('Detected redirect to login page');
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    // Handle token expiration and other auth errors
    if (response && response.status === 401) {
      console.log('401 Unauthorized detected');
      authManager.handleApiError(null, response);
      throw new Error('Authentication required');
    }

    // Check if response is HTML (indicating a redirect to login page)
    const contentType = response?.headers?.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.log('HTML response detected (likely redirected to login)');
      authManager.handleTokenExpiration();
      throw new Error('Authentication required');
    }

    return response;
  } catch (error) {
    console.error('Fetch error details:', error);
    
    // Check if it's our custom authentication error
    if (error.message === 'Authentication required') {
      throw error;
    }
    
    // Handle network errors or other fetch failures
    if (!error.response && (error.name === 'TypeError' || error.message.includes('fetch'))) {
      console.error('Network or fetch error:', error);
      // Don't trigger auth expiration for network errors
      throw new Error('Network error occurred');
    }
    
    // For other errors, check if they might be auth-related
    if (error.response && error.response.status === 401) {
      authManager.handleApiError(error, error.response);
      throw new Error('Authentication required');
    }
    
    throw error;
  }
}

export { authManager };
