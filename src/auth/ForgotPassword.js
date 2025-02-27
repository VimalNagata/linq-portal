// src/auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    // Network connectivity check
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://linq.red/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
      } else {
        throw new Error(data.error || 'Failed to process request');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card">
        <h1>Password Reset</h1>
        <div className="bright-success-message">
          <p>If your email exists in our system, you will receive your password shortly.</p>
          <p>Please check your email inbox and follow the instructions.</p>
        </div>
        <div className="bright-auth-links">
          <p>
            Ready to sign in? <Link to="/signin">Go to Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Forgot Password</h1>
      <form className="bright-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            required
          />
          <label>Email</label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Reset Password'}
        </button>
      </form>
      
      {error && <p className="bright-error-message">{error}</p>}
      
      <div className="bright-auth-links">
        <p>
          Remembered your password? <Link to="/signin">Sign In</Link>
        </p>
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;