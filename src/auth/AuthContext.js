// src/auth/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';

// Create the auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('https://linq.red/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token invalid or expired');
      }

      const userData = await response.json();
      setCurrentUser(userData.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      localStorage.removeItem('authToken');
      setError('Session expired. Please sign in again.');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://linq.red/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('apiKey', data.api_key);
      await fetchUserProfile(data.token);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
      return false;
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://linq.red/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('apiKey', data.api_key);
      
      // Fetch user profile with the new token
      await fetchUserProfile(data.token);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('apiKey');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// PrivateRoute component for protected routes
export const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }
  
  return children;
};