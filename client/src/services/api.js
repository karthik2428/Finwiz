import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000', // Adjust if backend port differs
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
