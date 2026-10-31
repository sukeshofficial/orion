import axios from "axios";

const TOKEN_STORAGE_KEY = "auth_token";

const api = axios.create({
    // In dev: Vite proxy forwards /api/* → http://localhost:5000
    // In prod: VITE_API_URL points to the deployed backend
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically inject Bearer token from localStorage for protected requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
