// RegisterAPIKey.js
import React, { useState } from 'react';

const RegisterAPIKey = () => {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('Free'); // Default plan
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
          'x-api-key': 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW' // Replace with a default or admin key if needed
        },
        body: JSON.stringify({ email, usage_plan: plan })
      });

      const data = await response.json();

      if (response.ok) {
        setApiKey(data.api_key);
      } else {
        setError(data.error || 'Error registering for API key');
      }
    } catch (err) {
      setError('An error occurred while registering. Please check your input and try again.');
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
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={plan} onChange={(e) => setPlan(e.target.value)} required>
          <option value="Free">Free (8 requests/day)</option>
          <option value="Starter">Starter (32 requests/day)</option>
          <option value="Advanced">Advanced (256 requests/day)</option>
          <option value="Enterprise">Enterprise (65536 requests/day)</option>
        </select>
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