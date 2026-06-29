import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';
import { useAuth } from '../contexts/AuthContext';

const ROOM_COLORS = {
  'אולם סדנאות': '#2563eb',
  'חדר ישיבות': '#7c3aed',
  'משרד פרטי': '#059669',
};

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

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
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

const rooms = ['אולם סדנאות', 'חדר ישיבות', 'משרד פרטי'];

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [monthBase, setMonthBase] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

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

  const monthDays = getMonthDates(monthBase);
  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) weeks.push(monthDays.slice(i, i + 7));

  const currentMonth = monthBase.getMonth();
  const todayStr = formatDate(new Date());

  const getBookingsForDayAndRoom = (date, roomName) =>
    bookings.filter(b => b.date === formatDate(date) && b.room_name === roomName);

  if (loading) return <div className="loading">טוען...</div>;

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
        <button onClick={() => { const d = new Date(monthBase); d.setMonth(d.getMonth()-1); setMonthBase(d); }} className="btn btn-outline btn-sm">&#8249; חודש קודם</button>
        <button onClick={() => setMonthBase(new Date())} className="btn btn-outline btn-sm">היום</button>
        <span className="week-label">{formatMonthLabel(monthBase)}</span>
        <button onClick={() => { const d = new Date(monthBase); d.setMonth(d.getMonth()+1); setMonthBase(d); }} className="btn btn-outline btn-sm">חודש הבא &#8250;</button>
      </div>

      <div className="calendar-container">
        <table className="calendar-table month-table">
          <thead>
            <tr>
              <th className="room-col">חדר</th>
              {DAY_NAMES.map((name, i) => (
                <th key={i} className={i === 6 ? 'sat-col' : ''}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) =>
              rooms.map((room, ri) => (
                <tr key={`${wi}-${ri}`}>
                  <td className="room-name-cell">
                    {ri === 0 && (
                      <div className="week-range">
                        {week[0].toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                      </div>
                    )}
                    <span className="room-dot" style={{ background: ROOM_COLORS[room] }}></span>
                    <span className="room-label">{room}</span>
                  </td>
                  {week.map((day, di) => {
                    const isSat = day.getDay() === 6;
                    const isOtherMonth = day.getMonth() !== currentMonth;
                    const isToday = formatDate(day) === todayStr;
                    const dayBookings = getBookingsForDayAndRoom(day, room);
                    return (
                      <td key={di} className={[
                        'calendar-cell',
                        isSat ? 'sat-day' : '',
                        isOtherMonth ? 'other-month' : '',
                        isToday ? 'today-cell' : '',
                      ].join(' ')}>
                        {ri === 0 && (
                          <div className={`day-number${isToday ? ' today-number' : ''}`}>
                            {day.getDate()}
                          </div>
                        )}
                        {isSat ? null : dayBookings.map(b => (
                          <div
                            key={b.id}
                            className="booking-chip"
                            style={{ background: ROOM_COLORS[room] }}
                            title={`${b.booker_name} - ${b.purpose} (${b.start_time}-${b.end_time})`}
                          >
                            <span>{b.start_time}-{b.end_time}</span>
                            <span className="chip-purpose">{b.purpose}</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
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
