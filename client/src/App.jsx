import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Issue from './pages/Issue';
import Verify from './pages/Verify';
import History from './pages/History';
import Login from './pages/Login';

function Nav({ isAuthenticated, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="nav-links">
        <Link to="/" className={isActive('/') ? 'active' : ''}>Issue Document</Link>
        <Link to="/verify" className={isActive('/verify') ? 'active' : ''}>Verify Document</Link>
        {isAuthenticated && (
          <Link to="/history" className={isActive('/history') ? 'active' : ''}>History</Link>
        )}
      </div>
      <div className="nav-actions">
        {isAuthenticated ? (
          <button onClick={onLogout} className="logout-btn">Logout</button>
        ) : (
          <Link to="/login" className={isActive('/login') ? 'active' : ''}>Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (token && tokenExpiry) {
      if (Date.now() < parseInt(tokenExpiry)) {
        setIsAuthenticated(true);
      } else {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        setIsAuthenticated(false);
      }
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 6000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #2a2a2a',
            },
          }}
        />
        
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#0070f3"/>
                <path d="M16 8L24 24H8L16 8Z" fill="white"/>
              </svg>
              <h1>TrustChain</h1>
            </div>
            <p>Tamper-proof document verification on XDC blockchain</p>
          </div>
        </header>
        
        <Nav isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        
        <main className="main">
          <Routes>
            <Route path="/" element={<Issue />} />
            <Route path="/verify" element={<Verify />} />
            <Route 
              path="/history" 
              element={isAuthenticated ? <History /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/history" /> : <Login onLogin={handleLogin} />} 
            />
          </Routes>
        </main>
        
        <footer className="footer">
          <p>Secured by XDC Network</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;