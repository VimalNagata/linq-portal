// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegisterAPIKey from './RegisterAPIKey';
import ShortenURL from './ShortenURL';

const App = () => (
  <Router>
    <Routes>
      <Route path="/shorten" element={<ShortenURL />} />
      <Route path="/" element={<RegisterAPIKey />} />
    </Routes>
  </Router>
);

export default App;