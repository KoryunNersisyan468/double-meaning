import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_REACT_API_URL || "http://localhost:5000",
  headers: {
    "ngrok-skip-browser-warning": "69420", // Чтобы не было окна-предупреждения ngrok
    "Content-Type": "application/json"
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if(token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export default API;