// src/auth/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboard, FaLink, FaChartBar, FaTrash, FaExternalLinkAlt, FaCopy, FaRedo } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from './AuthContext';
import '../App.css';
import './Profile.css';

const Profile = () => {
  const { currentUser, signOut, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [urls, setUrls] = useState([]);
  const [urlsLoading, setUrlsLoading] = useState(true);
  const [urlsError, setUrlsError] = useState(null);
  const [deletingUrlIds, setDeletingUrlIds] = useState([]);
  const navigate = useNavigate();
  const apiKey = localStorage.getItem('apiKey');
  
  // Fetch user's shortened URLs
  useEffect(() => {
    fetchUserUrls();
  }, [token]);
  
  const fetchUserUrls = async () => {
    setUrlsLoading(true);
    setUrlsError(null);
    
    try {
      // Check if token exists
      if (!token) {
        setUrlsError('Authentication token missing. Please sign in again.');
        setUrlsLoading(false);
        return;
      }
      
      // Set timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://linq.red/urls', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error fetching URLs: ${response.status}`);
      }
      
      const data = await response.json();
      setUrls(data.urls || []);
    } catch (err) {
      // Handle abort error specially
      if (err.name === 'AbortError') {
        setUrlsError('Request timed out. The server might be experiencing issues.');
      } else {
        setUrlsError(`Failed to load URLs: ${err.message}`);
      }
      console.error('Error fetching URLs:', err);
    } finally {
      setUrlsLoading(false);
    }
  };
  
  const handleDeleteUrl = async (urlId) => {
    if (!window.confirm('Are you sure you want to delete this shortened URL? This action cannot be undone.')) {
      return;
    }
    
    // Add this URL ID to the deleting state
    setDeletingUrlIds(prev => [...prev, urlId]);
    
    try {
      const response = await fetch(`https://linq.red/urls/${urlId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete URL: ${response.statusText}`);
      }
      
      // Remove the URL from the local state
      setUrls(prevUrls => prevUrls.filter(url => url.short_code !== urlId));
      setNotification({ type: 'success', message: 'URL deleted successfully' });
    } catch (error) {
      console.error('Failed to delete URL:', error);
      setNotification({ type: 'error', message: 'Failed to delete URL. Please try again.' });
    } finally {
      // Remove this URL ID from the deleting state
      setDeletingUrlIds(prev => prev.filter(id => id !== urlId));
    }
  };
  
  // Add useEffect to clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCopyShortUrl = (url) => {
    try {
      navigator.clipboard.writeText(url);
      setNotification({ type: 'success', message: 'URL copied to clipboard' });
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setNotification({ type: 'error', message: 'Failed to copy URL' });
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    navigate('/signin');
    setLoading(false);
  };

  const handleCopyAPIKey = () => {
    try {
      navigator.clipboard.writeText(apiKey);
      setNotification({ type: 'success', message: 'API Key copied to clipboard' });
    } catch (error) {
      console.error('Failed to copy API Key:', error);
      setNotification({ type: 'error', message: 'Failed to copy API Key' });
    }
  };
  
  const handleCopyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setNotification({ type: 'success', message: 'Code snippet copied to clipboard' });
    } catch (error) {
      console.error('Failed to copy code:', error);
      setNotification({ type: 'error', message: 'Failed to copy code' });
    }
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
      {notification && (
        <div className={`notification ${notification.type === 'success' ? 'notification-success' : 'notification-error'}`}>
          {notification.message}
        </div>
      )}
      <h1>My Account</h1>
      
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
      
      {/* URLs Section */}
      <div className="profile-section" style={{marginTop: '30px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <h2 style={{color: 'var(--text-dark)', fontSize: '1.2rem', margin: 0}}>
            My Shortened URLs
          </h2>
          <button 
            className="refresh-button" 
            onClick={fetchUserUrls} 
            disabled={urlsLoading}
            title="Refresh URLs"
          >
            <FaRedo />
          </button>
        </div>
        
        {urlsLoading ? (
          <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-medium)', background: 'var(--background-light)', borderRadius: 'var(--border-radius-md)'}}>
            <p>Loading your URLs...</p>
          </div>
        ) : urlsError ? (
          <div className="bright-error-message">
            <p>{urlsError}</p>
            <button 
              className="secondary-button" 
              onClick={fetchUserUrls} 
              style={{marginTop: '10px', width: 'auto'}}
            >
              Try Again
            </button>
          </div>
        ) : urls.length === 0 ? (
          <div style={{textAlign: 'center', padding: '30px 20px', color: 'var(--text-medium)', background: 'var(--background-light)', borderRadius: 'var(--border-radius-md)'}}>
            <div className="empty-state-icon">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9C4 7.89543 4.89543 7 6 7H9" stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15M12 15L9 12M12 15L15 12" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p>You haven't created any shortened URLs yet.</p>
            <button 
              className="primary-button" 
              onClick={() => navigate('/shorten')} 
              style={{marginTop: '20px'}}
            >
              Create Your First Short URL
            </button>
          </div>
        ) : (
          <div className="url-cards">
            {urls.map(url => (
              <div className="url-card profile-url-card" key={url.short_code}>
                <div className="url-card-icon">
                  <FaLink />
                </div>
                <div className="url-card-details">
                  <div className="url-card-header">
                    <h3>{url.short_code}</h3>
                    <div className="url-actions">
                      <button 
                        className="url-action-button" 
                        onClick={() => handleCopyShortUrl(url.short_url)}
                        title="Copy URL"
                      >
                        <FaCopy />
                      </button>
                      <a 
                        href={url.short_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="url-action-button"
                        title="Open URL"
                      >
                        <FaExternalLinkAlt />
                      </a>
                      <button 
                        className="url-action-button url-delete-button" 
                        onClick={() => handleDeleteUrl(url.short_code)}
                        title="Delete URL"
                        disabled={deletingUrlIds.includes(url.short_code)}
                      >
                        {deletingUrlIds.includes(url.short_code) ? '...' : <FaTrash />}
                      </button>
                    </div>
                  </div>
                  <p className="long-url">{url.long_url}</p>
                  <div className="url-card-meta">
                    <span className="url-card-clicks">
                      <FaChartBar /> {url.total_clicks || 0} clicks
                    </span>
                    <span className="url-card-date">
                      Created: {new Date(url.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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