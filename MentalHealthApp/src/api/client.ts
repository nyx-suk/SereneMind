import axios from 'axios';
import { store } from '../store';

// Uses 10.0.2.2 for Android emulator pointing to localhost, or update dynamically for iOS/device
const BASE_URL = 'http://10.0.2.2:8000'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to retrieve JWT from Redux authSlice
apiClient.interceptors.request.use(
  (config) => {
    // Redux store is synchronous so we don't need to await Keychain here
    const token = store.getState().auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
