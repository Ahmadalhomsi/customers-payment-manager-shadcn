"use client";

import React from 'react';
import { authManager } from '@/lib/auth';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Check if it's an authentication error
    if (error.message === 'Authentication required' || 
        error.message.includes('token') || 
        error.message.includes('401')) {
      authManager.handleTokenExpiration();
    }
    
    // Check for JSON parsing errors
    if (error.message.includes('JSON.parse') || 
        error.message.includes('unexpected character') ||
        error.message.includes('Failed to parse JSON')) {
      console.error('JSON parsing error detected:', error);
      // These are usually caused by receiving HTML error pages instead of JSON
    }
    
    // Check for network/response errors
    if (error.message.includes("can't access property") && 
        error.message.includes('response')) {
      console.error('Response object error detected:', error);
      // These happen when trying to access properties on undefined response objects
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
