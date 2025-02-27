// HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaLink, FaCode, FaChartLine, FaServer, FaShieldAlt, FaQrcode } from 'react-icons/fa';
import './App.css';

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const CodeExample = ({ language, code }) => (
  <div className="code-example">
    <div className="code-header">
      <span>{language}</span>
    </div>
    <pre>
      <code>{code}</code>
    </pre>
  </div>
);

const HomePage = () => {
  const curlExample = `curl -X POST 'https://linq.red/urls' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{"long_url": "https://example.com/very/long/path/to/document.html"}'

# Response
{
  "short_url": "https://linq.red/a1b2c3",
  "short_code": "a1b2c3",
  "long_url": "https://example.com/very/long/path/to/document.html",
  "creation_date": "2023-04-12T14:23:45.123Z"
}`;

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>Developer-Friendly URL Shortening API</h1>
          <p>Fast, reliable, and secure URL shortening service with comprehensive API access</p>
          <div className="hero-buttons">
            <Link to="/signin" className="primary-button">Get Started</Link>
            <Link to="/signup" className="secondary-button">View API Docs</Link>
          </div>
        </div>
      </section>
      
      <section className="features-section">
        <h2>Designed for Developers</h2>
        <div className="features-grid">
          <FeatureCard 
            icon={<FaLink />}
            title="RESTful API"
            description="Simple and intuitive RESTful API for programmatic URL shortening."
          />
          <FeatureCard 
            icon={<FaCode />}
            title="Multiple Language Support"
            description="SDKs and examples for JavaScript, Python, Ruby, PHP, and more."
          />
          <FeatureCard 
            icon={<FaChartLine />}
            title="Advanced Analytics"
            description="Track clicks, referrers, and geographic data for each shortened URL."
          />
          <FeatureCard 
            icon={<FaServer />}
            title="High Performance"
            description="Built on serverless architecture with sub-100ms response times."
          />
          <FeatureCard 
            icon={<FaShieldAlt />}
            title="Security Features"
            description="JWT-based authentication and fine-grained access controls."
          />
          <FeatureCard 
            icon={<FaQrcode />}
            title="QR Code Generation"
            description="Automatic QR code generation for mobile-friendly access."
          />
        </div>
      </section>
      
      <section className="api-example">
        <h2>Simple Integration</h2>
        <div className="api-content">
          <div className="api-description">
            <p>Lin.q provides a straightforward REST API that can be integrated with any programming language. Create shortened URLs with a single API call.</p>
            <ul>
              <li>Secure JWT authentication</li>
              <li>Rate limiting and usage tiers</li>
              <li>Comprehensive error handling</li>
              <li>JSON response format</li>
              <li>Optional custom short codes</li>
            </ul>
            <Link to="/signup" className="primary-button">Create Account</Link>
          </div>
          <div className="api-code">
            <CodeExample 
              language="cURL" 
              code={curlExample}
            />
          </div>
        </div>
      </section>
      
      <section className="pricing-section">
        <h2>Transparent Pricing</h2>
        <div className="pricing-tiers">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Free</h3>
              <p className="price">$0</p>
            </div>
            <ul>
              <li>500 URLs per month</li>
              <li>Basic analytics</li>
              <li>API access</li>
              <li>QR code generation</li>
              <li>24-hour support</li>
            </ul>
            <Link to="/signup" className="primary-button">Get Started</Link>
          </div>
          
          <div className="pricing-card featured">
            <div className="pricing-header">
              <h3>Developer</h3>
              <p className="price">$15<span>/month</span></p>
            </div>
            <ul>
              <li>10,000 URLs per month</li>
              <li>Advanced analytics</li>
              <li>Custom short codes</li>
              <li>Branded domains</li>
              <li>Priority support</li>
            </ul>
            <Link to="/signup" className="primary-button">Get Started</Link>
          </div>
          
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Enterprise</h3>
              <p className="price">Custom</p>
            </div>
            <ul>
              <li>Unlimited URLs</li>
              <li>Advanced security</li>
              <li>Dedicated infrastructure</li>
              <li>SLA guarantees</li>
              <li>24/7 support</li>
            </ul>
            <Link to="/signup" className="primary-button">Contact Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;