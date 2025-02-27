// src/auth/Profile.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboard } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code snippet copied to clipboard');
  };

  if (!currentUser) {
    return (
      <div className="container">
        <p className="error-message">You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>User Profile</h1>
      
      <div className="profile-section">
        <h2 style={{color: 'var(--text-dark)', fontSize: '1.2rem', marginBottom: '15px'}}>Account Information</h2>
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{currentUser.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Created:</span>
            <span className="info-value">{new Date(currentUser.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        {apiKey && (
          <div style={{marginTop: '30px'}}>
            <h2 style={{color: 'var(--text-dark)', fontSize: '1.2rem', marginBottom: '15px'}}>Your API Key</h2>
            <div className="bright-api-key-container">
              <code style={{color: 'var(--primary-color)', fontWeight: '500'}}>{apiKey}</code>
              <button className="bright-copy-button" onClick={handleCopyAPIKey}>
                <FaClipboard />
              </button>
            </div>
            
            <h2 style={{color: 'var(--text-dark)', fontSize: '1.2rem', marginTop: '30px', marginBottom: '15px'}}>Developer Resources</h2>
            <p style={{color: 'var(--text-dark)', marginBottom: '15px'}}>Use these code snippets to integrate with our API:</p>
            
            <div style={{marginTop: '15px'}}>
              <p><strong>cURL</strong></p>
              <div style={{position: 'relative'}}>
                <SyntaxHighlighter language="bash" style={vs}>
                  {`curl -X POST 'https://linq.red/urls' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey}' \\
  -d '{"long_url": "https://example.com/your-long-url"}'`}
                </SyntaxHighlighter>
                <button 
                  className="copy-button" 
                  onClick={() => handleCopyCode(`curl -X POST 'https://linq.red/urls' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey}' \\
  -d '{"long_url": "https://example.com/your-long-url"}'`)}
                  style={{position: 'absolute', top: '10px', right: '10px'}}
                >
                  <FaClipboard />
                </button>
              </div>
            </div>
            
            <div style={{marginTop: '15px'}}>
              <p><strong>JavaScript (fetch)</strong></p>
              <div style={{position: 'relative'}}>
                <SyntaxHighlighter language="javascript" style={vs}>
                  {`const response = await fetch('https://linq.red/urls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify({
    long_url: 'https://example.com/your-long-url'
  })
});

const data = await response.json();
const shortUrl = data.short_url;`}
                </SyntaxHighlighter>
                <button 
                  className="copy-button" 
                  onClick={() => handleCopyCode(`const response = await fetch('https://linq.red/urls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}'
  },
  body: JSON.stringify({
    long_url: 'https://example.com/your-long-url'
  })
});

const data = await response.json();
const shortUrl = data.short_url;`)}
                  style={{position: 'absolute', top: '10px', right: '10px'}}
                >
                  <FaClipboard />
                </button>
              </div>
            </div>
            
            <div style={{marginTop: '15px'}}>
              <p><strong>Python (requests)</strong></p>
              <div style={{position: 'relative'}}>
                <SyntaxHighlighter language="python" style={vs}>
                  {`import requests
import json

url = "https://linq.red/urls"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
}
payload = {
    "long_url": "https://example.com/your-long-url"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
data = response.json()
short_url = data["short_url"]`}
                </SyntaxHighlighter>
                <button 
                  className="copy-button" 
                  onClick={() => handleCopyCode(`import requests
import json

url = "https://linq.red/urls"
headers = {
    "Content-Type": "application/json", 
    "x-api-key": "${apiKey}"
}
payload = {
    "long_url": "https://example.com/your-long-url"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
data = response.json()
short_url = data["short_url"]`)}
                  style={{position: 'absolute', top: '10px', right: '10px'}}
                >
                  <FaClipboard />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '30px'}}>
        <button 
          className="primary-button"
          onClick={() => navigate('/shorten')}
        >
          Shorten URL
        </button>
        
        <button 
          className="secondary-button"
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};

export default Profile;