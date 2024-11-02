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
        <h2>linq.red</h2>
        <nav>
          <ul>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/shorten">Shorten an URL</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/register" element={<RegisterAPIKey />} />
          <Route path="/shorten" element={<ShortenURL />} />
          <Route path="/" element={<div>Select a tool from the Navigator</div>} />
        </Routes>
      </main>
    </div>
  </Router>
);

export default App;