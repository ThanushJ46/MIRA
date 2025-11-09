import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  signup: (name, email, password) => 
    api.post('/auth/signup', { name, email, password }),
  
  getMe: () => 
    api.get('/auth/me'),
};

// Journal API
export const journalAPI = {
  getAll: () => 
    api.get('/journals'),
  
  getById: (id) => 
    api.get(`/journals/${id}`),
  
  create: (data) => 
    api.post('/journals/create', data),
  
  update: (id, data) => 
    api.put(`/journals/${id}`, data),
  
  delete: (id) => 
    api.delete(`/journals/${id}`),
  
  analyze: (id) => 
    api.post(`/journals/${id}/analyze`),
};

// Reminder API
export const reminderAPI = {
  propose: (eventData) => 
    api.post('/reminders/propose', eventData),
  
  confirm: (id) => 
    api.post(`/reminders/${id}/confirm`),
  
  getAll: () => 
    api.get('/reminders'),
  
  delete: (id) =>
    api.delete(`/reminders/${id}`),
  
  syncToCalendar: (id) =>
    api.post(`/reminders/${id}/sync-to-calendar`)
};

// Calendar API
export const calendarAPI = {
  getAuthUrl: () =>
    api.get('/calendar/auth'),
  
  getStatus: () =>
    api.get('/calendar/status'),
  
  disconnect: () =>
    api.post('/calendar/disconnect')
};

export default api;
