// src/auth/Profile.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboard } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import '../App.css';

const Profile = () => {
  const { currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiKey = localStorage.getItem('apiKey');

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    navigate('/signin');
    setLoading(false);
  };

  const handleCopyAPIKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copied to clipboard');
  };

  if (!currentUser) {
    return (
      <div className="container">
        <p className="error-message">You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>User Profile</h1>
      
      <div className="success-message">
        <p><strong>Email:</strong> {currentUser.email}</p>
        <p><strong>Created:</strong> {new Date(currentUser.created_at).toLocaleDateString()}</p>
        
        {apiKey && (
          <div>
            <p><strong>API Key:</strong></p>
            <div className="api-key-container">
              <code>{apiKey}</code>
              <button className="copy-button" onClick={handleCopyAPIKey}>
                <FaClipboard />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('/shorten')}
        style={{ marginTop: '20px', marginRight: '10px' }}
      >
        Shorten URL
      </button>
      
      <button 
        onClick={handleSignOut}
        disabled={loading}
        style={{ marginTop: '20px' }}
      >
        {loading ? 'Processing...' : 'Sign Out'}
      </button>
    </div>
  );
};

export default Profile;