// src/auth/Profile.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboard } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
            
            <h3 style={{marginTop: '20px'}}>How to use your API key</h3>
            <p>Use one of these code snippets to shorten URLs from your application:</p>
            
            <div style={{marginTop: '15px'}}>
              <p><strong>cURL</strong></p>
              <div style={{position: 'relative'}}>
                <SyntaxHighlighter language="bash" style={vscDarkPlus}>
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
                <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
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
                <SyntaxHighlighter language="python" style={vscDarkPlus}>
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