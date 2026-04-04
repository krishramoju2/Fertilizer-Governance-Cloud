import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://fertilizer-backend-jj59.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
