// RegisterAPIKey.js
import React, { useState } from 'react';

const RegisterAPIKey = () => {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Call the Lambda function with ?action=register
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW'
        },
        body: JSON.stringify({ email })
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

  return (
    <div>
      <h1>Register for an API Key</h1>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {apiKey && (
        <div>
          <p>Your API Key:</p>
          <p style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>{apiKey}</p>
          <p style={{ color: 'blue', fontSize: 'small' }}>
            (Save this API key securely; you will need it to access the URL shortening service.)
          </p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default RegisterAPIKey;