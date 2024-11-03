// ShortenURL.js
import React, { useState } from 'react';

const ShortenURL = () => {
  const [longURL, setLongURL] = useState('');
  const [email, setEmail] = useState('');
  const [shortURL, setShortURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch API key based on email
  const fetchApiKey = async (email) => {
    try {
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW' // Replace with your admin or default API key
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok && data.api_key) {
        return data.api_key;
      } else {
        setError(data.error || 'Error retrieving API key');
        return null;
      }
    } catch (err) {
      setError('Failed to retrieve API key. Please try again.');
      console.error('API Key Fetch Error:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShortURL(null);
    setLoading(true);

    // Get the API key for the provided email
    const apiKey = await fetchApiKey(email);
    if (!apiKey) {
      setLoading(false);
      return; // Exit if there’s an error fetching the API key
    }

    // Use the retrieved API key to call the shorten URL API
    try {
      const response = await fetch('https://linq.red/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ long_url: longURL })
      });

      const data = await response.json();

      if (response.ok) {
        setShortURL(data.short_url);
      } else {
        setError(data.error || 'Error shortening URL');
      }
    } catch (err) {
      setError('An error occurred while shortening the URL. Please try again.');
    }
    setLoading(false);
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(shortURL);
    alert('Short URL copied to clipboard!');
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="Enter long URL"
          value={longURL}
          onChange={(e) => setLongURL(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Shorten'}
        </button>
      </form>
      {shortURL && (
        <div className="success-message">
          <p>Short URL:</p>
          <div className="short-url-container">
            <a href={shortURL} target="_blank" rel="noopener noreferrer" className="short-url-link">{shortURL}</a>
            <button className="copy-button" onClick={handleCopyURL}>Copy URL</button>
          </div>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ShortenURL;