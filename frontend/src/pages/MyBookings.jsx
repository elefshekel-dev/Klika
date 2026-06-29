import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, deleteBooking } from '../api';

const ROOM_COLORS = {
  'אולם סדנאות': '#2563eb',
  'חדר ישיבות': '#7c3aed',
  'משרד פרטי': '#059669',
};

const STATUS_LABELS = { pending: 'ממתין', approved: 'מאושר', rejected: 'נדחה' };
const STATUS_CLASSES = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const rooms = ['אולם סדנאות', 'חדר ישיבות', 'משרד פרטי'];

function getMonthDates(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  const days = [];
  const cur = new Date(startDate);
  while (cur <= endDate) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

function formatDate(date) { return date.toISOString().split('T')[0]; }
function formatMonthLabel(date) { return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }); }

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [monthBase, setMonthBase] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try { setBookings(await getBookings()); }
    catch { setError('שגיאה בטעינת ההזמנות'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך לבטל הזמנה זו?')) return;
    setCancellingId(id);
    try {
      await deleteBooking(id);
      setBookings(b => b.filter(x => x.id !== id));
      setSelectedBooking(null);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בביטול ההזמנה');
    } finally { setCancellingId(null); }
  };

  const monthDays = getMonthDates(monthBase);
  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) weeks.push(monthDays.slice(i, i + 7));
  const currentMonth = monthBase.getMonth();
  const todayStr = formatDate(new Date());

  const getBookingsForDay = (date) =>
    bookings.filter(b => b.date === formatDate(date) && b.status !== 'rejected');

  if (loading) return <div className="loading">טוען...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>ההזמנות שלי</h1>
        <Link to="/new-booking" className="btn btn-primary">+ הזמנה חדשה</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="calendar-nav">
        <button onClick={() => { const d = new Date(monthBase); d.setMonth(d.getMonth()-1); setMonthBase(d); }} className="btn btn-outline btn-sm">&#8249; חודש קודם</button>
        <button onClick={() => setMonthBase(new Date())} className="btn btn-outline btn-sm">היום</button>
        <span className="week-label">{formatMonthLabel(monthBase)}</span>
        <button onClick={() => { const d = new Date(monthBase); d.setMonth(d.getMonth()+1); setMonthBase(d); }} className="btn btn-outline btn-sm">חודש הבא &#8250;</button>
      </div>

      <div className="calendar-container">
        <table className="calendar-table month-table">
          <thead>
            <tr>
              {DAY_NAMES.map((name, i) => (
                <th key={i} className={i === 6 ? 'sat-col' : ''}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const isSat = day.getDay() === 6;
                  const isOtherMonth = day.getMonth() !== currentMonth;
                  const isToday = formatDate(day) === todayStr;
                  const dayBookings = getBookingsForDay(day);
                  return (
                    <td key={di} className={[
                      'calendar-cell month-cell',
                      isSat ? 'sat-day' : '',
                      isOtherMonth ? 'other-month' : '',
                      isToday ? 'today-cell' : '',
                    ].join(' ')}>
                      <div className={`day-number${isToday ? ' today-number' : ''}`}>{day.getDate()}</div>
                      {!isSat && dayBookings.map(b => (
                        <div
                          key={b.id}
                          className="booking-chip"
                          style={{ background: ROOM_COLORS[b.room_name] || '#6b7280', cursor: 'pointer' }}
                          onClick={() => setSelectedBooking(b)}
                          title={`${b.room_name} | ${b.purpose} (${b.start_time}-${b.end_time})`}
                        >
                          <span>{b.start_time} {b.purpose}</span>
                          <span className={`chip-status badge ${STATUS_CLASSES[b.status]}`}>{STATUS_LABELS[b.status]}</span>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="legend">
        {rooms.map(room => (
          <div key={room} className="legend-item">
            <span className="legend-dot" style={{ background: ROOM_COLORS[room] }}></span>
            <span>{room}</span>
          </div>
        ))}
      </div>

      {/* Booking detail popup */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{selectedBooking.room_name}</h3>
            <div className="booking-detail">
              <p><strong>תאריך:</strong> {new Date(selectedBooking.date + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>שעות:</strong> {selectedBooking.start_time}–{selectedBooking.end_time}</p>
              <p><strong>מטרה:</strong> {selectedBooking.purpose}</p>
              <p><strong>משתתפים:</strong> {selectedBooking.participants}</p>
              <p><strong>סטטוס:</strong> <span className={`badge ${STATUS_CLASSES[selectedBooking.status]}`}>{STATUS_LABELS[selectedBooking.status]}</span></p>
              {selectedBooking.notes && <p><strong>הערות:</strong> {selectedBooking.notes}</p>}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => handleCancel(selectedBooking.id)}
                disabled={cancellingId === selectedBooking.id}
              >
                {cancellingId === selectedBooking.id ? 'מבטל...' : 'בטל הזמנה'}
              </button>
              <button className="btn btn-outline" onClick={() => setSelectedBooking(null)}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
