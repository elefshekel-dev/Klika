import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

export const getRooms = () =>
  api.get('/rooms').then(r => r.data);

export const getBookings = (params = {}) =>
  api.get('/bookings', { params }).then(r => r.data);

export const createBooking = (data) =>
  api.post('/bookings', data).then(r => r.data);

export const updateBookingStatus = (id, status, notes) =>
  api.patch(`/bookings/${id}/status`, { status, notes }).then(r => r.data);

export const deleteBooking = (id) =>
  api.delete(`/bookings/${id}`).then(r => r.data);

export default api;
