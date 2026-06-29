import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewBooking from './pages/NewBooking';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🏢</span>
        <span className="navbar-title">Klika Rooms</span>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">לוח מחוונים</Link>
        <Link to="/new-booking">הזמנה חדשה</Link>
        <Link to="/my-bookings">ההזמנות שלי</Link>
        {user.role === 'manager' && (
          <Link to="/admin" className="admin-link">ניהול</Link>
        )}
      </div>
      <div className="navbar-user">
        <span className="user-name">שלום, {user.name}</span>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">התנתק</button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">טוען...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (managerOnly && user.role !== 'manager') return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">טוען...</div>;

  return (
    <>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/new-booking" element={<ProtectedRoute><NewBooking /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute managerOnly><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
