// hooks/useAuth.js - Custom hook for authentication state management
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authManager, authenticatedFetch } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch('/api/auth/me');
      
      if (response && response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const userData = await response.json();
            setUser(userData);
          } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            setError('Failed to parse user data');
            setUser(null);
          }
        } else {
          console.error('Non-JSON response received');
          setError('Invalid response format');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.message !== 'Authentication required' && error.message !== 'Network error occurred') {
        setError(error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authManager.clearTokens();
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    checkAuth,
    logout,
  };
}

// Component wrapper for protected routes
export function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user, loading, isAuthenticated } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Auth manager will handle redirect
    }

    return <WrappedComponent {...props} user={user} />;
  };
}
