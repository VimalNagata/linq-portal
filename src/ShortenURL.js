import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaClipboard } from 'react-icons/fa'; // Import icons from react-icons
import './App.css';

const ShortenURL = () => {
  const [longURL, setLongURL] = useState('');
  const [email, setEmail] = useState('');
  const [shortURL, setShortURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef(null);

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 3000;
  const FALLBACK_API_KEY = process.env.REACT_APP_FALLBACK_API_KEY || '';

  const fetchApiKey = async (email) => {
    // First try to get the API key from localStorage (set during login)
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      return storedApiKey;
    }
    
    // Fall back to requesting a new API key if not logged in
    try {
      if (!FALLBACK_API_KEY) {
        throw new Error('Missing API key configuration');
      }
      
      const response = await fetch('https://linq.red/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': FALLBACK_API_KEY
        },
        body: JSON.stringify({ email, password: 'temporary' })
      });

      // Check for network errors first
      if (!response.ok) {
        const statusCode = response.status;
        if (statusCode === 403) {
          throw new Error('Authorization failed. Please sign in to use this feature.');
        } else if (statusCode === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else if (statusCode >= 500) {
          throw new Error(`Server error (${statusCode}). Please try again later.`);
        } else {
          throw new Error(`Request failed with status: ${statusCode}`);
        }
      }

      const data = await response.json();
      if (data.api_key) {
        return data.api_key;
      } else {
        throw new Error(data.error || 'API key not found in response');
      }
    } catch (err) {
      console.error('API Key Error:', err.message);
      throw err;
    }
  };

  const retryShortenURL = async (apiKey, attempt = 1) => {
    const apiKeyToUse = attempt === 2 ? FALLBACK_API_KEY : apiKey;
    const token = localStorage.getItem('authToken');
    
    try {
      if (!longURL) {
        throw new Error('URL is required');
      }
      
      // Validate URL format
      try {
        new URL(longURL);
      } catch (e) {
        throw new Error('Invalid URL format. Please enter a complete URL including http:// or https://');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyToUse
      };
      
      // Add authorization token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('https://linq.red/urls', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ long_url: longURL })
      });

      // Check for specific status codes and provide helpful messages
      if (!response.ok) {
        const statusCode = response.status;
        if (statusCode === 400) {
          throw new Error('Invalid request. Please check the URL format.');
        } else if (statusCode === 403) {
          throw new Error('API key unauthorized. Using fallback on next attempt.');
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (statusCode >= 500) {
          throw new Error(`Server error (${statusCode}). Please try again later.`);
        } else {
          throw new Error(`Request failed with status: ${statusCode}`);
        }
      }

      const data = await response.json();
      if (data.short_url) {
        setShortURL(data.short_url);
        return true;
      } else {
        throw new Error(data.error || 'No short URL in response');
      }
    } catch (err) {
      console.error('URL Shortening Error:', err.message);
      if (attempt === 1) {
        // Only log specific error on first attempt for user feedback
        setError(`Error: ${err.message}`);
      }
      return false;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShortURL(null);
    setLoading(true);

    // Input validation
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    // Network connectivity check
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    try {
      const apiKey = await fetchApiKey(email);
      
      let success = false;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt} of ${MAX_RETRIES}`);
        }
        
        success = await retryShortenURL(apiKey, attempt);
        if (success) break;

        if (attempt < MAX_RETRIES) {
          // Show retry message to user
          setError(`Attempt ${attempt} failed. Retrying in ${RETRY_DELAY/1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }

      if (!success) {
        setError('Failed to shorten URL after multiple attempts. Please try again later.');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(shortURL);
    alert('Short URL copied to clipboard: ' + shortURL);
  };

  const handleDownloadQRCode = () => {
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'QRCode.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } else {
      console.error('QR code element not found');
    }
  };

  return (
    <div className="container">
      <h1>Shorten a link</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Email</label>
        </div>
        <div className="input-container">
          <input
            type="url"
            value={longURL}
            onChange={(e) => setLongURL(e.target.value)}
            required
          />
          <label>Long URL</label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Shorten'}
        </button>
      </form>
      {shortURL && (
         <div >
          
         <div className="success-message" ref={qrCodeRef}>
         <p>QR Code:</p>
           <QRCodeSVG value={shortURL} size={128} />
           &nbsp;
           <button className="download-button" onClick={handleDownloadQRCode}>
             <FaDownload />
           </button>
         </div>
         <div className="success-message">
         <p>Short URL:</p>
           <a href={shortURL} target="_blank" rel="noopener noreferrer" className="short-url-link">
             {shortURL}
           </a> &nbsp;
           <button className="copy-button" onClick={handleCopyURL}>
             <FaClipboard />
           </button>
         </div>
        
       </div>
        
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ShortenURL;