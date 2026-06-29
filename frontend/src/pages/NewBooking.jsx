import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRooms, createBooking } from '../api';
import { useAuth } from '../contexts/AuthContext';

const PURPOSE_OPTIONS = ['ישיבה', 'שעת קהילה', 'הרצאה/סדנה'];

function validateHoursClient(date, startTime, endTime) {
  if (!date || !startTime || !endTime) return null;
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();

  if (day === 5 || day === 6) return 'אין הזמנות בשישי ושבת';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (end <= start) return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';

  const open = 8 * 60;
  const close = 22 * 60;

  if (start < open || end > close) {
    return 'שעות הפעילות הן 08:00-22:00 (ראשון-חמישי)';
  }
  return null;
}

export default function NewBooking() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    room_id: '',
    booker_name: user?.name || '',
    booker_company: '',
    purpose: '',
    participants: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRooms().then(setRooms).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hoursError = validateHoursClient(form.date, form.start_time, form.end_time);
    if (hoursError) { setError(hoursError); return; }

    setLoading(true);
    try {
      await createBooking({
        room_id: Number(form.room_id),
        booker_name: `${form.booker_name} / ${form.booker_company}`,
        purpose: form.purpose,
        participants: Number(form.participants),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      setSuccess(true);
      setForm({
        room_id: '',
        booker_name: user?.name || '',
        booker_company: '',
        purpose: '',
        participants: '',
        date: '',
        start_time: '',
        end_time: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה ביצירת הזמנה');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const today = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <div className="page">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>ההזמנה נשלחה בהצלחה!</h2>
          <p>בקשתך נשלחה לאישור המנהל. תוכל לעקוב אחרי הסטטוס בעמוד ההזמנות שלי.</p>
          <div className="success-actions">
            <Link to="/my-bookings" className="btn btn-primary">ההזמנות שלי</Link>
            <button onClick={() => setSuccess(false)} className="btn btn-outline">הזמנה נוספת</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>הזמנה חדשה</h1>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="room_id">חדר *</label>
              <select id="room_id" name="room_id" value={form.room_id} onChange={handleChange} required>
                <option value="">בחר חדר...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} (תפוסה: {r.capacity})
                  </option>
                ))}
              </select>
              {selectedRoom && <p className="field-hint">{selectedRoom.description}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="booker_name">שם המזמין *</label>
              <input
                id="booker_name"
                name="booker_name"
                type="text"
                value={form.booker_name}
                onChange={handleChange}
                placeholder="שם מלא"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="booker_company">שם החברה/ארגון *</label>
              <input
                id="booker_company"
                name="booker_company"
                type="text"
                value={form.booker_company}
                onChange={handleChange}
                placeholder="לדוגמה: קליקה, סיראז'"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="purpose">מטרת הפגישה *</label>
              <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange} required>
                <option value="">בחר מטרה...</option>
                {PURPOSE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="participants">מספר משתתפים *</label>
              <input
                id="participants"
                name="participants"
                type="number"
                value={form.participants}
                onChange={handleChange}
                min="1"
                max={selectedRoom?.capacity || 999}
                placeholder="כמה משתתפים?"
                required
              />
              {selectedRoom && (
                <p className="field-hint">תפוסה מקסימלית: {selectedRoom.capacity} אנשים</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="date">תאריך *</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                min={today}
                required
              />
              <p className="field-hint">ראשון-חמישי 08:00-22:00 | שישי ושבת סגור</p>
            </div>

            <div className="form-group form-row">
              <div>
                <label htmlFor="start_time">שעת התחלה *</label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={handleChange}
                  min="08:00"
                  required
                />
              </div>
              <div>
                <label htmlFor="end_time">שעת סיום *</label>
                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'שולח...' : 'שלח בקשת הזמנה'}
            </button>
            <Link to="/dashboard" className="btn btn-outline">ביטול</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
