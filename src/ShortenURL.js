import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaClipboard } from 'react-icons/fa'; // Import icons from react-icons
import './ShortenURL.css';

const ShortenURL = () => {
  const [longURL, setLongURL] = useState('');
  const [email, setEmail] = useState('');
  const [shortURL, setShortURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 3000;
  const FALLBACK_API_KEY = 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW';

  const fetchApiKey = async (email) => {
    try {
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': FALLBACK_API_KEY
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok && data.api_key) {
        return data.api_key;
      } else {
        console.error(data.error || 'Error retrieving API key');
        return null;
      }
    } catch (err) {
      console.error('Failed to retrieve API key.');
      return null;
    }
  };

  const retryShortenURL = async (apiKey, attempt = 1) => {
    const apiKeyToUse = attempt === 2 ? FALLBACK_API_KEY : apiKey;
    try {
      const response = await fetch('https://linq.red/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyToUse
        },
        body: JSON.stringify({ long_url: longURL })
      });

      const data = await response.json();
      if (response.ok) {
        setShortURL(data.short_url);
        return true;
      } else {
        console.error(data.error || 'Error shortening URL');
        return false;
      }
    } catch (err) {
      console.error('Error occurred while shortening the URL.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShortURL(null);
    setLoading(true);

    const apiKey = await fetchApiKey(email);
    if (!apiKey) {
      setLoading(false);
      setError('Failed to retrieve API key.');
      return;
    }

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      success = await retryShortenURL(apiKey, attempt);
      if (success) break;

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!success) {
      setError('Failed to shorten URL after multiple attempts.');
    }
    setLoading(false);
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(shortURL);
    alert('Short URL copied to clipboard: ' + shortURL);
  };

  const handleDownloadQRCode = () => {
    const svg = document.querySelector('.qr-code-container svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.svg';
    link.click();
    URL.revokeObjectURL(url);
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
         <div className="success-message">
          
         <div className="qr-code-box">
           <QRCodeSVG value={shortURL} size={128} />
           
           <button className="download-button" onClick={handleDownloadQRCode}>
             <FaDownload />
           </button>
         </div>
         <div className="url-box">
           <a href={shortURL} target="_blank" rel="noopener noreferrer" className="short-url-link">
             {shortURL}
           </a>
           <button className="copy-button" onClick={handleCopyURL}>
             <FaClipboard />
           </button>
         </div>
         <div className="url-box">{longURL}</div> 
       </div>
        
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ShortenURL;