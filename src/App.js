// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import RegisterAPIKey from './RegisterAPIKey';
import ShortenURL from './ShortenURL';
import { AuthProvider, useAuth, PrivateRoute } from './auth/AuthContext';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import Profile from './auth/Profile';
import './App.css';

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
  
  return (
    <div className="ide-layout">
      <aside className="sidebar">
        <h2>
          linq.<span className="red-text">red</span>
        </h2>
        <nav>
          <ul>
            <li><Link to="/shorten">Shorten a Link</Link></li>
            {currentUser ? (
              <>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/signout">Sign Out</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/signin">Sign In</Link></li>
                <li><Link to="/signup">Sign Up</Link></li>
              </>
            )}
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/shorten" element={<ShortenURL />} />
          <Route path="/register" element={<RegisterAPIKey />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/signout" element={<SignOut />} />
          <Route path="/" element={<ShortenURL />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;