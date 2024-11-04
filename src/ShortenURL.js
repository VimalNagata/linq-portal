import React, { useState } from 'react';
import './ShortenURL.css';

const ShortenURL = () => {
  const [longURL, setLongURL] = useState('');
  const [email, setEmail] = useState('');
  const [shortURL, setShortURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const MAX_RETRIES = 2; // Number of retries (one retry with the fallback API key)
  const RETRY_DELAY = 3000; // Delay between retries in milliseconds
  const FALLBACK_API_KEY = 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW';

  // Fetch API key based on email
  const fetchApiKey = async (email) => {
    try {
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': FALLBACK_API_KEY // Use fallback key to register new keys
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
      console.error('Failed to retrieve API key. Please try again.');
      return null;
    }
  };

  // Retry mechanism for shortening URL with fallback key on the second attempt
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
        return true; // Success
      } else {
        console.error(data.error || 'Error shortening URL');
        return false; // Failure
      }
    } catch (err) {
      console.error('An error occurred while shortening the URL. Please try again.');
      return false; // Failure
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    setShortURL(null); // Clear any previous short URL
    setLoading(true);

    // Get the API key for the provided email
    const apiKey = await fetchApiKey(email);
    if (!apiKey) {
      setLoading(false);
      setError('Failed to retrieve API key. Please try again.');
      return; // Exit if there’s an error fetching the API key
    }

    // Attempt to shorten the URL with retry mechanism
    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      success = await retryShortenURL(apiKey, attempt);
      if (success) break; // Exit loop if successful

      if (attempt < MAX_RETRIES) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Show error message only if all retries fail
    if (!success) {
      setError('Failed to shorten URL after multiple attempts. Please try again later.');
    }
    setLoading(false);
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(shortURL);
    alert('Short URL copied to clipboard!');
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