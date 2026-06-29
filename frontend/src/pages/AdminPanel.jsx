import React, { useState, useEffect } from 'react';
import { getBookings, updateBookingStatus, getRooms, deleteBooking } from '../api';
import api from '../api';

const PURPOSE_OPTIONS = ['ישיבה', 'שעת קהילה', 'הרצאה/סדנה', 'הפסקת אוכל'];

const STATUS_LABELS = { pending: 'ממתין', approved: 'מאושר', rejected: 'נדחה' };
const STATUS_CLASSES = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };

export default function AdminPanel() {
  const [tab, setTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { getRooms().then(setRooms).catch(console.error); }, []);
  useEffect(() => { loadBookings(); }, [tab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = tab === 'pending' ? { status: 'pending' } : {};
      setBookings(await getBookings(params));
    } catch { setError('שגיאה בטעינת ההזמנות'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try {
      await updateBookingStatus(id, 'approved', '');
      setBookings(bs => bs.filter(b => b.id !== id));
    } catch (err) { setError(err.response?.data?.error || 'שגיאה'); }
    finally { setActionLoading(null); }
  };

  const openRejectModal = (id) => { setRejectModal(id); setRejectNotes(''); };

  const handleReject = async () => {
    setActionLoading(rejectModal + '-reject');
    try {
      await updateBookingStatus(rejectModal, 'rejected', rejectNotes);
      setBookings(bs => bs.filter(b => b.id !== rejectModal));
      setRejectModal(null);
    } catch (err) { setError(err.response?.data?.error || 'שגיאה'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את ההזמנה לצמיתות?')) return;
    setActionLoading(id + '-delete');
    try {
      await deleteBooking(id);
      setBookings(bs => bs.filter(b => b.id !== id));
    } catch (err) { setError(err.response?.data?.error || 'שגיאה במחיקה'); }
    finally { setActionLoading(null); }
  };

  const openEditModal = (booking) => {
    setEditModal(booking.id);
    setEditForm({
      room_id: booking.room_id,
      booker_name: booking.booker_name,
      purpose: booking.purpose,
      participants: booking.participants,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      notes: booking.notes || '',
    });
  };

  const handleEdit = async () => {
    setActionLoading('edit');
    try {
      const updated = await api.patch(`/bookings/${editModal}`, editForm).then(r => r.data);
      setBookings(bs => bs.map(b => b.id === editModal ? { ...b, ...updated } : b));
      setEditModal(null);
    } catch (err) { setError(err.response?.data?.error || 'שגיאה בעריכה'); }
    finally { setActionLoading(null); }
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

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="page">
      <div className="page-header"><h1>פאנל ניהול</h1></div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          ממתינות לאישור
          {tab === 'pending' && pendingCount > 0 && <span className="tab-count">{pendingCount}</span>}
        </button>
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          כל ההזמנות
        </button>
      </div>

      <div className="filters">
        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
          <option value="">כל החדרים</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        {(filterRoom || filterDate) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setFilterRoom(''); setFilterDate(''); }}>נקה</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">טוען...</div> : filteredBookings.length === 0 ? (
        <div className="empty-state"><p>{tab === 'pending' ? 'אין הזמנות ממתינות' : 'לא נמצאו הזמנות'}</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>חדר</th><th>תאריך</th><th>שעות</th><th>שם המזמין</th>
                <th>מטרה</th><th>משתתפים</th><th>סטטוס</th><th>הערות</th><th>פעולות</th>
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
                  <td><span className={`badge ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span></td>
                  <td>{b.notes || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(b)}>ערוך</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)} disabled={!!actionLoading}>מחק</button>
                      {b.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)} disabled={!!actionLoading}>אשר</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openRejectModal(b.id)} disabled={!!actionLoading}>דחה</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>עריכת הזמנה</h3>
            <div className="edit-grid">
              <div className="form-group">
                <label>חדר</label>
                <select value={editForm.room_id} onChange={e => setEditForm(f => ({ ...f, room_id: Number(e.target.value) }))}>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>שם המזמין</label>
                <input value={editForm.booker_name} onChange={e => setEditForm(f => ({ ...f, booker_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>מטרה</label>
                <select value={editForm.purpose} onChange={e => setEditForm(f => ({ ...f, purpose: e.target.value }))}>
                  {PURPOSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>משתתפים</label>
                <input type="number" value={editForm.participants} onChange={e => setEditForm(f => ({ ...f, participants: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label>תאריך</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>שעת התחלה</label>
                <input type="time" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>שעת סיום</label>
                <input type="time" value={editForm.end_time} onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>הערות</label>
                <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleEdit} disabled={!!actionLoading}>
                {actionLoading === 'edit' ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditModal(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>דחיית הזמנה</h3>
            <p>הוסף הערה (אופציונלי):</p>
            <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="סיבת הדחייה..." rows={3} autoFocus />
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleReject} disabled={!!actionLoading}>
                {actionLoading ? 'דוחה...' : 'דחה הזמנה'}
              </button>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
