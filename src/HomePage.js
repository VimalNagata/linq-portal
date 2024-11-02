// HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => (
  <div className="homepage">
    <h1>Welcome to Linq Red</h1>
    <p>Register for an API key to access our URL Shortening Service, or start shortening URLs directly if you already have a key.</p>
    <div className="homepage-buttons">
      <Link to="/register" className="homepage-button">Register for API Key</Link>
      <Link to="/shorten" className="homepage-button">Go to URL Shortener</Link>
    </div>
  </div>
);

export default HomePage;