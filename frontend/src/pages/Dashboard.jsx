import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';
import { useAuth } from '../contexts/AuthContext';

const ROOM_COLORS = {
  'אולם סדנאות': '#2563eb',
  'חדר ישיבות': '#7c3aed',
  'משרד קטן': '#059669',
};

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

function getWeekDates(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();
  // Start from Sunday
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const days = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [weekBase, setWeekBase] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getBookings({ status: 'approved' });
      setBookings(data);
      if (user.role === 'manager') {
        const pending = await getBookings({ status: 'pending' });
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = getWeekDates(weekBase);

  const getBookingsForDayAndRoom = (date, roomName) => {
    const dateStr = formatDate(date);
    return bookings.filter(b => b.date === dateStr && b.room_name === roomName);
  };

  const rooms = ['אולם סדנאות', 'חדר ישיבות', 'משרד קטן'];

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };

  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  const goToday = () => setWeekBase(new Date());

  if (loading) return <div className="loading">טוען...</div>;

  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  return (
    <div className="page">
      <div className="page-header">
        <h1>לוח מחוונים</h1>
        <div className="header-actions">
          {user.role === 'manager' && pendingCount > 0 && (
            <Link to="/admin" className="badge-link">
              <span className="badge badge-warning">{pendingCount} הזמנות ממתינות לאישור</span>
            </Link>
          )}
          <Link to="/new-booking" className="btn btn-primary">+ הזמנה חדשה</Link>
        </div>
      </div>

      <div className="calendar-nav">
        <button onClick={prevWeek} className="btn btn-outline btn-sm">&#8249; שבוע קודם</button>
        <button onClick={goToday} className="btn btn-outline btn-sm">היום</button>
        <span className="week-label">
          {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
        </span>
        <button onClick={nextWeek} className="btn btn-outline btn-sm">שבוע הבא &#8250;</button>
      </div>

      <div className="calendar-container">
        <table className="calendar-table">
          <thead>
            <tr>
              <th className="room-col">חדר</th>
              {weekDays.map((day, i) => {
                const isToday = formatDate(day) === formatDate(new Date());
                return (
                  <th key={i} className={isToday ? 'today-col' : ''}>
                    <div>{DAY_NAMES[i]}</div>
                    <div className="date-sub">{formatDisplayDate(day)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room}>
                <td className="room-name-cell">
                  <span className="room-dot" style={{ background: ROOM_COLORS[room] }}></span>
                  {room}
                </td>
                {weekDays.map((day, i) => {
                  const dayBookings = getBookingsForDayAndRoom(day, room);
                  const isSat = day.getDay() === 6;
                  return (
                    <td key={i} className={`calendar-cell ${isSat ? 'closed-day' : ''}`}>
                      {isSat ? (
                        <span className="closed-label">סגור</span>
                      ) : (
                        dayBookings.map(b => (
                          <div
                            key={b.id}
                            className="booking-chip"
                            style={{ background: ROOM_COLORS[room] }}
                            title={`${b.booker_name} - ${b.purpose} (${b.start_time}-${b.end_time})`}
                          >
                            <span>{b.start_time}-{b.end_time}</span>
                            <span className="chip-purpose">{b.purpose}</span>
                          </div>
                        ))
                      )}
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
    </div>
  );
}
