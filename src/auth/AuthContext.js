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
  const [userSubscription, setUserSubscription] = useState(null);
  
  // Clean up any mock data that might have been left over
  useEffect(() => {
    localStorage.removeItem('mockEmail');
  }, []);

  // Check for existing token on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile(token);
      fetchSubscription(token);
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
  
  const fetchSubscription = async (token) => {
    try {
      const response = await fetch('https://linq.red/api/subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Default to free plan if there's an error
        setUserSubscription({ plan: 'free', status: 'active' });
        return;
      }
      
      const subscriptionData = await response.json();
      setUserSubscription(subscriptionData);
      
      // Update user with subscription plan
      setCurrentUser(prev => prev ? {...prev, plan: subscriptionData.plan} : null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setUserSubscription({ plan: 'free', status: 'active' });
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
      await fetchSubscription(data.token);
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
      
      // New users start with free plan
      setUserSubscription({ plan: 'free', status: 'active' });
      
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
    setUserSubscription(null);
  };
  
  const updateSubscription = (subscription) => {
    setUserSubscription(subscription);
    
    // Update user object with new plan
    if (subscription && currentUser) {
      setCurrentUser({
        ...currentUser,
        plan: subscription.plan
      });
    }
  };

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  
  const value = {
    currentUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    token, // Explicitly expose the token
    userSubscription, // Expose the subscription
    updateSubscription // Expose method to update subscription
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