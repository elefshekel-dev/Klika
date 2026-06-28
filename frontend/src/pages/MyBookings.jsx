import React, { useState, useEffect } from 'react';
import { getBookings, deleteBooking } from '../api';

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

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError('שגיאה בטעינת ההזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל הזמנה זו?')) return;
    setCancellingId(id);
    try {
      await deleteBooking(id);
      setBookings(b => b.filter(x => x.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בביטול ההזמנה');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="loading">טוען...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>ההזמנות שלי</h1>
        <span className="count-badge">{bookings.length} הזמנות</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>אין לך הזמנות עדיין</p>
          <a href="/new-booking" className="btn btn-primary">צור הזמנה ראשונה</a>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>חדר</th>
                <th>תאריך</th>
                <th>שעות</th>
                <th>מטרה</th>
                <th>משתתפים</th>
                <th>סטטוס</th>
                <th>הערות מנהל</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.room_name}</strong></td>
                  <td>{formatDate(b.date)}</td>
                  <td>{b.start_time}–{b.end_time}</td>
                  <td>{b.purpose}</td>
                  <td>{b.participants}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASSES[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td>
                    {b.status === 'rejected' && b.notes ? (
                      <span className="rejection-note">{b.notes}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="btn btn-danger btn-sm"
                        disabled={cancellingId === b.id}
                      >
                        {cancellingId === b.id ? 'מבטל...' : 'בטל'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
