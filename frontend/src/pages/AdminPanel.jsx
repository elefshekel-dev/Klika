import React, { useState, useEffect } from 'react';
import { getBookings, updateBookingStatus, getRooms } from '../api';

const STATUS_LABELS = {
  pending: 'ממתין',
  approved: 'מאושר',
  rejected: 'נדחה',
};

const STATUS_CLASSES = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

export default function AdminPanel() {
  const [tab, setTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [rejectModal, setRejectModal] = useState(null); // booking id
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRooms().then(setRooms).catch(console.error);
  }, []);

  useEffect(() => {
    loadBookings();
  }, [tab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = tab === 'pending' ? { status: 'pending' } : {};
      const data = await getBookings(params);
      setBookings(data);
    } catch (err) {
      setError('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try {
      const updated = await updateBookingStatus(id, 'approved', '');
      setBookings(bs => bs.map(b => b.id === id ? { ...b, ...updated } : b));
      if (tab === 'pending') {
        setBookings(bs => bs.filter(b => b.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה באישור ההזמנה');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectModal(id);
    setRejectNotes('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal + '-reject');
    try {
      const updated = await updateBookingStatus(rejectModal, 'rejected', rejectNotes);
      setBookings(bs => bs.map(b => b.id === rejectModal ? { ...b, ...updated } : b));
      if (tab === 'pending') {
        setBookings(bs => bs.filter(b => b.id !== rejectModal));
      }
      setRejectModal(null);
      setRejectNotes('');
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בדחיית ההזמנה');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const filteredBookings = bookings.filter(b => {
    if (filterRoom && b.room_id !== Number(filterRoom)) return false;
    if (filterDate && b.date !== filterDate) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>פאנל ניהול</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          ממתינות לאישור
          {tab === 'pending' && bookings.length > 0 && (
            <span className="tab-count">{bookings.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          כל ההזמנות
        </button>
      </div>

      <div className="filters">
        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
          <option value="">כל החדרים</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          placeholder="סנן לפי תאריך"
        />
        {(filterRoom || filterDate) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterRoom(''); setFilterDate(''); }}>
            נקה סינון
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">טוען...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>{tab === 'pending' ? 'אין הזמנות ממתינות לאישור' : 'לא נמצאו הזמנות'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>חדר</th>
                <th>תאריך</th>
                <th>שעות</th>
                <th>שם המזמין</th>
                <th>מטרה</th>
                <th>משתתפים</th>
                <th>סטטוס</th>
                <th>הערות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.room_name}</strong></td>
                  <td>{formatDate(b.date)}</td>
                  <td>{b.start_time}–{b.end_time}</td>
                  <td>{b.booker_name}</td>
                  <td>{b.purpose}</td>
                  <td>{b.participants}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASSES[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td>{b.notes || '—'}</td>
                  <td>
                    {b.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(b.id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === b.id + '-approve' ? '...' : 'אשר'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => openRejectModal(b.id)}
                          disabled={!!actionLoading}
                        >
                          דחה
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>דחיית הזמנה</h3>
            <p>הוסף הערה (אופציונלי):</p>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="סיבת הדחייה..."
              rows={3}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={!!actionLoading}
              >
                {actionLoading ? 'דוחה...' : 'דחה הזמנה'}
              </button>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
