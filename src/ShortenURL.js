// ShortenURL.js
import React, { useState } from 'react';

const ShortenURL = () => {
  const [longURL, setLongURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [shortURL, setShortURL] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      setError('An error occurred. Please try again.');
    }
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
          type="url"
          placeholder="Enter long URL"
          value={longURL}
          onChange={(e) => setLongURL(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Enter your API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
        <button type="submit">Shorten</button>
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