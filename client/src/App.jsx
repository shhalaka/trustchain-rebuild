import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Issue from './pages/Issue';
import Verify from './pages/Verify';
import History from './pages/History';

function Nav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <Link to="/" className={isActive('/') ? 'active' : ''}>Issue Document</Link>
      <Link to="/verify" className={isActive('/verify') ? 'active' : ''}>Verify Document</Link>
      <Link to="/history" className={isActive('/history') ? 'active' : ''}>History</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
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
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/" element={<Issue />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/history" element={<History />} />
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