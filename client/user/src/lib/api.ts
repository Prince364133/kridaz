import axios from 'axios';
import { tokenStorage } from '@/lib/utils/tokenStorage';

import { config } from '@/lib/config';

const api = axios.create({
  baseURL: config.api.baseUrl,
});

api.interceptors.request.use(
  (requestConfig) => {
    const token = tokenStorage.getToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
      if (config.isDev) {
        console.log('Sending token with request:', token);
      }
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
