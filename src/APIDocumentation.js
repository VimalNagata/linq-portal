// APIDocumentation.js
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

const CodeBlock = ({ language, code }) => (
  <div className="code-block">
    <div className="code-header">
      <span>{language}</span>
    </div>
    <SyntaxHighlighter language={language} style={dracula}>
      {code}
    </SyntaxHighlighter>
  </div>
);

const APIDocumentation = () => {
  const curlExample = `curl -X POST 'https://linq.red/urls' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{"long_url": "https://example.com/very/long/path/to/document.html"}'`;

  const curlResponse = `{
  "short_url": "https://linq.red/a1b2c3",
  "short_code": "a1b2c3",
  "long_url": "https://example.com/very/long/path/to/document.html",
  "creation_date": "2023-04-12T14:23:45Z"
}`;

  const jsExample = `fetch('https://linq.red/urls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({ long_url: 'https://example.com/path' })
})
.then(response => response.json())
.then(data => {
  console.log('Shortened URL:', data.short_url);
})
.catch(error => console.error('Error:', error));`;

  const pythonExample = `import requests

response = requests.post(
    'https://linq.red/urls',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={'long_url': 'https://example.com/path'}
)

data = response.json()
print(f"Shortened URL: {data['short_url']}")`;

  const nodeExample = `const axios = require('axios');

async function shortenUrl(longUrl) {
  try {
    const response = await axios.post('https://linq.red/urls', 
      { long_url: longUrl },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY'
        }
      }
    );
    
    return response.data.short_url;
  } catch (error) {
    console.error('Error shortening URL:', error.response?.data || error.message);
    throw error;
  }
}`;

  const errorResponseExample = `// 400 - Bad Request
{
  "error": "Invalid URL format"
}

// 401 - Unauthorized
{
  "error": "Authentication required"
}

// 403 - Forbidden
{
  "error": "API key invalid or expired"
}

// 429 - Too Many Requests
{
  "error": "Rate limit exceeded",
  "retry_after": 3600
}`;

  return (
    <div className="api-docs-container">
      <h1>Lin.q API Documentation</h1>
      
      <section id="authentication">
        <h2>Authentication</h2>
        <p>
          All requests to the Lin.q API require authentication using an API key. 
          You can obtain an API key by <a href="/register">registering here</a>.
        </p>
        <p>
          Your API key should be included in the <code>x-api-key</code> header with every request.
        </p>
        <div className="info-box">
          <h4>Security Note</h4>
          <p>
            Never expose your API key in client-side code. If you're building a web application,
            make API calls from your server to protect your key.
          </p>
        </div>
      </section>
      
      <section id="url-shortening">
        <h2>URL Shortening Endpoint</h2>
        <div className="endpoint">
          <span className="method">POST</span>
          <span className="url">https://linq.red/urls</span>
        </div>
        
        <h3>Request Parameters</h3>
        <table className="params-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>long_url</td>
              <td>string</td>
              <td>Yes</td>
              <td>The URL to be shortened. Must include http:// or https://</td>
            </tr>
            <tr>
              <td>custom_code</td>
              <td>string</td>
              <td>No</td>
              <td>Custom short code (available on paid plans only)</td>
            </tr>
          </tbody>
        </table>
        
        <h3>Example Request</h3>
        <CodeBlock language="bash" code={curlExample} />
        
        <h3>Example Response</h3>
        <CodeBlock language="json" code={curlResponse} />
      </section>
      
      <section id="code-examples">
        <h2>Code Examples</h2>
        
        <h3>JavaScript</h3>
        <CodeBlock language="javascript" code={jsExample} />
        
        <h3>Python</h3>
        <CodeBlock language="python" code={pythonExample} />
        
        <h3>Node.js</h3>
        <CodeBlock language="javascript" code={nodeExample} />
      </section>
      
      <section id="rate-limits">
        <h2>Rate Limits & Usage Plans</h2>
        <table className="params-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Daily Limit</th>
              <th>Features</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>8 requests/day</td>
              <td>Basic URL shortening, QR code generation</td>
            </tr>
            <tr>
              <td>Starter</td>
              <td>32 requests/day</td>
              <td>+ Basic analytics</td>
            </tr>
            <tr>
              <td>Advanced</td>
              <td>256 requests/day</td>
              <td>+ Custom short codes, detailed analytics</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>65536 requests/day</td>
              <td>+ Branded domains, priority support</td>
            </tr>
          </tbody>
        </table>
        <p>
          When you exceed your rate limit, the API will return a 429 status code 
          with information about when you can resume making requests.
        </p>
      </section>
      
      <section id="error-handling">
        <h2>Error Handling</h2>
        <p>
          The API uses standard HTTP status codes to indicate the success or failure of requests.
          Error responses include a JSON body with an <code>error</code> field containing a description.
        </p>
        
        <h3>Common Error Codes</h3>
        <CodeBlock language="javascript" code={errorResponseExample} />
        
        <h3>Recommended Error Handling</h3>
        <p>
          Implement retry logic for 429 and 5xx errors, with exponential backoff.
          For 4xx errors, check the request parameters and authentication before retrying.
        </p>
      </section>
      
      <section id="best-practices">
        <h2>Best Practices</h2>
        <ul>
          <li>Validate URLs before submission to prevent 400 errors</li>
          <li>Include error handling in your integration</li>
          <li>Store your API key securely and never expose it in client-side code</li>
          <li>Implement exponential backoff for retries when rate limited</li>
          <li>Consider caching shortened URLs to reduce API calls</li>
        </ul>
      </section>
    </div>
  );
};

export default APIDocumentation;