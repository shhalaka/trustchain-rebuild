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
          <h1>TrustChain Docs</h1>
          <p>Tamper-proof document verification on XDC blockchain</p>
        </header>
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/" element={<Issue />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;