import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRooms, createBooking } from '../api';
import { useAuth } from '../contexts/AuthContext';

const PURPOSE_OPTIONS = ['ישיבה', 'שעת קהילה', 'הרצאה/סדנה'];

// Booker options: Latin names first, then Hebrew names in alphabetical order
const BOOKER_OPTIONS = [
  'Connect',
  'Cybreex',
  'MARKETAPI',
  'RETAMA',
  'אביב ואנונו',
  'אוריאל חכימי',
  'אלון נבו',
  'דניאל בלנקוביץ׳',
  'הודיה בן חמו',
  'הנהלה',
  'יהודה ועקנין',
  'נוה מבורך',
  'נתנאל פרץ',
  'סיראג׳',
  'צבי אופיר',
  'שחר עובדיה',
];

function validateHoursClient(date, startTime, endTime) {
  if (!date || !startTime || !endTime) return null;
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();

  if (day === 6) return 'אין הזמנות בשבת';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (end <= start) return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';

  const open = 8 * 60;
  const close = day === 5 ? 14 * 60 : 20 * 60;

  if (start < open || end > close) {
    return day === 5
      ? 'ביום שישי שעות הפעילות הן 08:00-14:00'
      : 'שעות הפעילות הן 08:00-20:00 (ראשון-חמישי)';
  }
  return null;
}

export default function NewBooking() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    room_id: '',
    booker_name: '',
    purpose: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLongConfirm, setShowLongConfirm] = useState(false);
  const [showTooLong, setShowTooLong] = useState(false);

  useEffect(() => {
    getRooms().then(setRooms).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const durationMinutes = () => {
    if (!form.start_time || !form.end_time) return 0;
    const [sh, sm] = form.start_time.split(':').map(Number);
    const [eh, em] = form.end_time.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hoursError = validateHoursClient(form.date, form.start_time, form.end_time);
    if (hoursError) { setError(hoursError); return; }

    const duration = durationMinutes();
    // Hard limit: no reservation longer than 2 hours
    if (duration > 120) {
      setShowTooLong(true);
      return;
    }
    // Warn when reserving the room for more than 90 minutes
    if (duration > 90) {
      setShowLongConfirm(true);
      return;
    }

    await submitBooking();
  };

  const submitBooking = async () => {
    setShowLongConfirm(false);
    setLoading(true);
    try {
      await createBooking({
        room_id: Number(form.room_id),
        booker_name: form.booker_name,
        purpose: form.purpose || '—',
        participants: 1,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      setSuccess(true);
      setForm({
        room_id: '',
        booker_name: '',
        purpose: '',
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
          <h2>ההזמנה נרשמה בהצלחה!</h2>
          <p>ההזמנה אושרה אוטומטית. ההנהלה שומרת לעצמה את הזכות לערוך שינויים.</p>
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
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {selectedRoom && <p className="field-hint">{selectedRoom.description}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="booker_name">מזמין/ה *</label>
              <select
                id="booker_name"
                name="booker_name"
                value={form.booker_name}
                onChange={handleChange}
                required
              >
                <option value="">בחר/י מזמין/ה...</option>
                {BOOKER_OPTIONS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="purpose">מטרת הפגישה</label>
              <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange}>
                <option value="">ללא ציון מטרה</option>
                {PURPOSE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
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
              <p className="field-hint">ראשון-חמישי 08:00-20:00 | שישי 08:00-14:00 | שבת סגור</p>
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
              {loading ? 'שולח...' : 'שריין חדר'}
            </button>
            <Link to="/dashboard" className="btn btn-outline">ביטול</Link>
          </div>
        </form>
      </div>

      {showLongConfirm && (
        <div className="modal-overlay" onClick={() => setShowLongConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>שריון ארוך</h3>
            <p>את עומדת לסגור את החדר ליותר משעה, האם את בטוחה?</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={submitBooking} disabled={loading}>
                {loading ? 'שולח...' : 'כן, שריין בכל זאת'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowLongConfirm(false)}>
                לא, חזרה לקביעת שעה
              </button>
            </div>
          </div>
        </div>
      )}

      {showTooLong && (
        <div className="modal-overlay" onClick={() => setShowTooLong(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>שריון ארוך מדי</h3>
            <p>לא ניתן לשריין חדר ליותר משעתיים. לפרטים נוספים נא לפנות למנהלת הקליקה.</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowTooLong(false)}>
                חזרה לקביעת שעה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
