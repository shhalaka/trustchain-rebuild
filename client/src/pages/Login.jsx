import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: email.trim(),
        password
      });

      const { token, expiresIn } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiry', Date.now() + (2 * 60 * 60 * 1000)); // 2 hours
      
      toast.success('Login successful!');
      onLogin();
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      
      if (err.response?.status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card login-card">
      <h2>Admin Login</h2>
      <p className="subtitle">Access document history and management</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="admin@trustchain.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="form-group password-group">
          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size={16} /> Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
        
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Login;