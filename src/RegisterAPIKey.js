// RegisterAPIKey.js
import React, { useState } from 'react';
import './RegisterAPIKey.css'; // Import the CSS file

const RegisterAPIKey = () => {
  const [email, setEmail] = useState('');
  const [usagePlan, setUsagePlan] = useState('0byjpr'); // Default plan ID
  const [apiKey, setApiKey] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW', // Admin or default key
        },
        body: JSON.stringify({ email, usage_plan: usagePlan })
      });

      const data = await response.json();

      if (response.ok) {
        setApiKey(data.api_key);
      } else {
        setError(data.error || 'Error registering for API key');
      }
    } catch (err) {
      setError('An error occurred while registering. Please try again.');
      console.error('Registration error:', err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copied to clipboard!');
  };

  return (
    <div className="container">
      <h1>Register for an API Key</h1>
      <form onSubmit={handleRegister}>
        <div className="input-container">
          <input
            type="email"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Email Address</label>
        </div>
        
        <div className="input-container">
          <select value={usagePlan} onChange={(e) => setUsagePlan(e.target.value)} required>
            <option value="0byjpr">Free (8 calls/day)</option>
            <option value="226ngv">Starter (32 calls/day)</option>
            <option value="c07ot4">Advanced (256 calls/day)</option>
            <option value="26iuz8">Enterprise (65536 calls/day)</option>
          </select>
          <label>Usage Plan</label>
        </div>
        
        <button type="submit">Register</button>
      </form>
      
      {apiKey && (
        <div className="success-message">
          <p>Your API Key:</p>
          <code>{apiKey}</code>
          <p style={{ color: 'lightgray', fontSize: 'small' }}>
            (Save this API key securely; you will need it to access the URL shortening service.)
          </p>
          <button className="copy-button" onClick={handleCopyCode}>Copy API Key</button>
        </div>
      )}
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default RegisterAPIKey;