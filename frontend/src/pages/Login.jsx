import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🏢</span>
          <h1>מערכת הזמנת חדרים</h1>
          <p>התחבר כדי להמשיך</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">שם משתמש</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="הכנס שם משתמש"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הכנס סיסמה"
              required
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
        <div className="login-hint">
          <p><strong>מנהל:</strong> admin / admin123</p>
          <p><strong>עובד:</strong> employee1 / pass123</p>
        </div>
      </div>
    </div>
  );
}
