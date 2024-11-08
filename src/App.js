// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RegisterAPIKey from './RegisterAPIKey';
import ShortenURL from './ShortenURL';
import './App.css';

const App = () => (
  <Router>
    <div className="ide-layout">
      <aside className="sidebar">
      <h2>
        linq.<span className="red-text">red</span>
      </h2>
        <nav>
          <ul>
            <li><Link to="/shorten">Shorten a Link</Link></li>
            <li><Link to="/register">API Key</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/shorten" element={<ShortenURL />} />
          <Route path="/register" element={<RegisterAPIKey />} />
          <Route path="/" element={<ShortenURL />} />
        </Routes>
      </main>
    </div>
  </Router>
);

export default App;