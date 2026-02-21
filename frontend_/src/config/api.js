import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Change this to your backend URL
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000/api' // Replace with your local IP during development
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Navigation to login handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// API HELPER FUNCTIONS
// ============================================

// Auth
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp, full_name) => api.post('/auth/verify-otp', { phone, otp, full_name }),
  completeRegistration: (data) => api.post('/auth/complete-registration', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  applyManager: (data) => api.post('/auth/apply-manager', data),
};

// Pitches
export const pitchesAPI = {
  getAll: (params) => api.get('/pitches', { params }),
  getOne: (id, params) => api.get(`/pitches/${id}`, { params }),
  getSlots: (id, params) => api.get(`/pitches/${id}/slots`, { params }),
  getCities: () => api.get('/pitches/meta/cities'),
  addReview: (id, data) => api.post(`/pitches/${id}/review`, data),
};

// Bookings
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  joinOpenGame: (id) => api.post(`/bookings/${id}/join-open-game`),
};

// Manager
export const managerAPI = {
  getDashboard: () => api.get('/manager/dashboard'),
  getPitches: () => api.get('/manager/pitches'),
  createPitch: (data) => api.post('/manager/pitches', data),
  updatePitch: (id, data) => api.put(`/manager/pitches/${id}`, data),
  addSlots: (pitchId, slots) => api.post(`/manager/pitches/${pitchId}/slots`, { slots }),
  generateSlots: (pitchId, data) => api.post(`/manager/pitches/${pitchId}/generate-slots`, data),
  deleteSlot: (slotId) => api.delete(`/manager/slots/${slotId}`),
  blockSlot: (slotId) => api.patch(`/manager/slots/${slotId}/block`),
  getBookings: (params) => api.get('/manager/bookings', { params }),
  confirmBooking: (id) => api.patch(`/manager/bookings/${id}/confirm`),
};
