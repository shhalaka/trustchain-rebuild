import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import Spinner from '../components/Spinner';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorTimerRef = useRef(null);

  const clearErrorAfterDelay = (delay = 8000) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = setTimeout(() => {
      setError('');
    }, delay);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      clearErrorAfterDelay(8000);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      clearErrorAfterDelay(8000);
      return false;
    }

    if (!password) {
      setError('Password is required');
      clearErrorAfterDelay(8000);
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      clearErrorAfterDelay(8000);
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
      const res = await api.post('/auth/login', {
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
      clearErrorAfterDelay(8000);

      if (err.response?.status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="card login-card">
      <h2>Admin Dashboard Access</h2>
      <p className="subtitle">Issue documents and manage verification records</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
        
        {error && (
          <div className="error-message">
            <span className="error-icon">&#9888;</span>
            <span className="error-text">{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
