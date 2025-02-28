// App.js
import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaLink, FaUser, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaChartBar } from 'react-icons/fa';
import RegisterAPIKey from './RegisterAPIKey';
import ShortenURL from './ShortenURL';
import { AuthProvider, useAuth, PrivateRoute } from './auth/AuthContext';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import Profile from './auth/Profile';
import ForgotPassword from './auth/ForgotPassword';
import HomePage from './HomePage';
import APIDocumentation from './APIDocumentation';
import Analytics from './analytics/Analytics';
import './App.css';
import './api-docs.css';
import './iframe-mode.css';

// Create a protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }
  
  return children;
};

// Simple sign out component
const SignOut = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    signOut();
    navigate('/signin');
  }, [signOut, navigate]);
  
  return <div>Signing out...</div>;
};

const AppContent = () => {
  const { currentUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <div className="top-nav-layout">
      <header className="top-nav">
        <div className="top-nav-brand">
          <Link to="/">
            <h2>
              linq.<span className="red-text">red</span>
            </h2>
          </Link>
        </div>
        
        <button className="menu-button" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        <nav className={`nav-links ${menuOpen ? 'show' : ''}`}>
          <ul>
            {currentUser ? (
              <>
                <li>
                  <Link className={isActive('/shorten')} to="/shorten" onClick={closeMenu}>
                    <FaLink className="nav-icon" /> Shorten URL
                  </Link>
                </li>
                <li>
                  <Link className={isActive('/analytics')} to="/analytics" onClick={closeMenu}>
                    <FaChartBar className="nav-icon" /> Analytics
                  </Link>
                </li>
                <li>
                  <Link className={isActive('/profile')} to="/profile" onClick={closeMenu}>
                    <FaUser className="nav-icon" /> My Account
                  </Link>
                </li>
                <li>
                  <Link to="/signout" onClick={closeMenu}>
                    <FaSignOutAlt className="nav-icon" /> Sign Out
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className={isActive('/signin')} to="/signin" onClick={closeMenu}>
                    <FaSignInAlt className="nav-icon" /> Sign In
                  </Link>
                </li>
                <li>
                  <Link className={isActive('/signup')} to="/signup" onClick={closeMenu}>
                    <FaUserPlus className="nav-icon" /> Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>
      
      <main className="page-content">
        <Routes>
          <Route path="/shorten" element={
            <ProtectedRoute>
              <ShortenURL />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute>
              <RegisterAPIKey />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/signout" element={<SignOut />} />
          <Route path="/api-docs" element={<APIDocumentation />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} linq.red - All rights reserved.</p>
      </footer>
    </div>
  );
};

const App = () => {
  // Check if app is loaded in iframe
  const isInIframe = window.self !== window.top;
  
  // Force to homepage if loaded in iframe with no specific route
  React.useEffect(() => {
    if (isInIframe) {
      // Get current path from the iframe
      const currentPath = window.location.pathname;
      
      // If we're at the root and in an iframe, explicitly set hash to ensure
      // homepage loads within the iframe context
      if (currentPath === '/' || currentPath === '') {
        console.log('App loaded in iframe - ensuring homepage is displayed');
        // We use a small timeout to ensure React has initialized
        setTimeout(() => {
          window.location.hash = '#/';
          // Force a re-render by adding a class to body
          document.body.classList.add('iframe-homepage-view');
        }, 100);
      }
    }
  }, [isInIframe]);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;