import axios from 'axios';

const API_BASE_URL = 'http://192.168.18.17:8080/api/auth';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const loginUser = (email, password) => {
    return apiClient.post('/login', { email, password });
};

export const registerUser = (name, email, password) => {
    return apiClient.post('/register', { name, email, password });
};
