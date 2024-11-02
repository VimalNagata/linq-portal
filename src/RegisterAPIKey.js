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
      const response = await fetch('https://linq.red/?action=register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'uXQ1FBRW2I9ESih8QzH2m8OFdESF7Jzb22AwTWQW' // Replace with a default or admin key if needed
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

  const codeSnippet = (
    <pre>
      <code>
        <span className="keyword">fetch</span>(<span className="string">'https://linq.red'</span>, {'{'}
        <br />
        &nbsp;&nbsp;method: <span className="string">'POST'</span>,<br />
        &nbsp;&nbsp;headers: {'{'}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">'Content-Type'</span>: <span className="string">'application/json'</span>,<br />
        &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">'x-api-key'</span>: <span className="string">'{apiKey}'</span><br />
        &nbsp;&nbsp;{'}'},<br />
        &nbsp;&nbsp;body: <span className="function">JSON.stringify</span>({'{'} long_url: <span className="string">'https://example.com'</span> {'}'})<br />
        {'}'})
        .<span className="function">then</span>(<span className="variable">response</span> =&gt; <span className="variable">response</span>.<span className="function">json</span>())<br />
        .<span className="function">then</span>(<span className="variable">data</span> =&gt; {'{'}<br />
        &nbsp;&nbsp;<span className="keyword">if</span> (<span className="variable">data</span>.<span className="variable">short_url</span>) {'{'}<br />
        &nbsp;&nbsp;&nbsp;&nbsp;<span className="function">console.log</span>(<span className="string">'Shortened URL:'</span>, <span className="variable">data</span>.<span className="variable">short_url</span>);<br />
        &nbsp;&nbsp;{'}'} <span className="keyword">else</span> {'{'}<br />
        &nbsp;&nbsp;&nbsp;&nbsp;<span className="function">console.error</span>(<span className="string">'Error:'</span>, <span className="variable">data</span>.<span className="variable">error</span>);<br />
        &nbsp;&nbsp;{'}'}<br />
        {'}'})<br />
        .<span className="function">catch</span>(<span className="variable">error</span> =&gt; <span className="function">console.error</span>(<span className="string">'Fetch error:'</span>, <span className="variable">error</span>));
      </code>
    </pre>
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet.props.children.map(child => child.props.children).join(""));
    alert('Code copied to clipboard!');
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
        <button type="submit">Register</button>
      </form>
      {apiKey && (
        <div className="success-message">
          <p>Your API Key:</p>
          <code>{apiKey}</code>
          <p style={{ color: 'lightgray', fontSize: 'small' }}>
            (Save this API key securely; you will need it to access the URL shortening service.)
          </p>

          {/* Instructions for calling the Shorten URL API */}
          <h3>Using Your API Key</h3>
          <p>Below is an example of how to use your API key to shorten URLs programmatically:</p>

          <div className="code-block">
            <p><strong>JavaScript Example:</strong></p>
            <button className="copy-button" onClick={handleCopyCode}>Copy Code</button>
            {codeSnippet}
          </div>

          <p style={{ marginTop: '10px' }}>Replace <code>'https://example.com'</code> with the URL you want to shorten. This example will log the shortened URL to the console.</p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default RegisterAPIKey;