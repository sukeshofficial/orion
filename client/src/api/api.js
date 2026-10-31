import axios from "axios";

const api = axios.create({
    // In dev: Vite proxy forwards /api/* → http://localhost:5000
    // In prod: VITE_API_URL points to the deployed backend
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
