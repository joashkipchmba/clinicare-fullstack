import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { fetchData } from '../utils/api';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for API calls
API.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;

      // Check if token is expired
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const response = await axios.post(`${config.baseURL}/auth/token/refresh/`, {
            refresh: refreshToken
          });

          localStorage.setItem('accessToken', response.data.access);
          config.headers['Authorization'] = `Bearer ${response.data.access}`;
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${originalRequest.baseURL}/auth/token/refresh/`, {
          refresh: refreshToken
        });

        localStorage.setItem('accessToken', response.data.access);
        API.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

        return API(originalRequest);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Realtime WebSocket setup
export const setupRealtimeConnection = (eventTypes, onUpdate) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected');
    // Subscribe to specific event types
    socket.send(JSON.stringify({
      type: 'subscribe',
      events: Array.isArray(eventTypes) ? eventTypes : [eventTypes]
    }));
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => setupRealtimeConnection(eventTypes, onUpdate), 5000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  return () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
};

// Auth Service
export const AuthService = {
  login: (credentials) => API.post('/auth/login/', credentials),
  register: (userData) => API.post('/auth/register/', userData),
  refreshToken: (refresh) => API.post('/auth/token/refresh/', { refresh }),
  logout: () => API.post('/auth/logout/'),
  me: () => API.get('/auth/me/'),
};

// Patient Service
export const PatientService = {
  getAll: (params) => API.get('/patients/', { params }),
  get: (id) => API.get(`/patients/${id}/`),
  create: (data) => API.post('/patients/', data),
  update: (id, data) => API.put(`/patients/${id}/`, data),
  delete: (id) => API.delete(`/patients/${id}/`),
  search: (query) => API.get('/patients/search/', { params: { q: query } }),
  stats: () => API.get('/patients/stats/'),
};

// Appointment Service
export const AppointmentService = {
  getAll: (params) => API.get('/appointments/', { params }),
  get: (id) => API.get(`/appointments/${id}/`),
  create: (data) => API.post('/appointments/', data),
  update: (id, data) => API.put(`/appointments/${id}/`, data),
  delete: (id) => API.delete(`/appointments/${id}/`),
  calendar: (params) => API.get('/appointments/calendar/', { params }),
  cancel: (id) => API.post(`/appointments/${id}/cancel/`),
  complete: (id) => API.post(`/appointments/${id}/complete/`),
  stats: () => API.get('/appointments/stats/'),
};

// User Service
export const UserService = {
  getAll: (params) => API.get('/users/', { params }),
  get: (id) => API.get(`/users/${id}/`),
  create: (data) => API.post('/users/', data),
  update: (id, data) => API.put(`/users/${id}/`, data),
  delete: (id) => API.delete(`/users/${id}/`),
  doctors: () => API.get('/users/doctors/'),
  staff: () => API.get('/users/staff/'),
};

// Inventory Service
export const InventoryService = {
  getAll: (params) => API.get('/inventory/', { params }),
  get: (id) => API.get(`/inventory/${id}/`),
  create: (data) => API.post('/inventory/', data),
  update: (id, data) => API.put(`/inventory/${id}/`, data),
  delete: (id) => API.delete(`/inventory/${id}/`),
  categories: () => API.get('/inventory/categories/'),
  lowStock: () => API.get('/inventory/low-stock/'),
  expired: () => API.get('/inventory/expired/'),
  stats: () => API.get('/inventory/stats/'),
};

// Report Service
export const ReportService = {
  get: (params) => API.get('/reports/', { params }),
  types: () => API.get('/reports/types/'),
  generate: (data) => API.post('/reports/generate/', data),
  export: (params) => API.get('/reports/export/', {
    params,
    responseType: 'blob'
  }),
};

export const uploadFile = (file, endpoint, fieldName = 'file') => {
  const formData = new FormData();
  formData.append(fieldName, file);

  return API.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default API;