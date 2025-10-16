import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://cnx-app-cadu-gev.azurewebsites.net/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// se token faltar/expirar, manda pro login
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
