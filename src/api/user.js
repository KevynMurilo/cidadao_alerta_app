import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.1.59.59:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getMe = () => {
    return apiClient.get('/usuarios/me');
};

export const findUserById = (id) => {
    return apiClient.get(`/usuarios/${id}`);
};

export const updateUser = (id, data) => {
    return apiClient.put(`/usuarios/${id}`, data);
};

export const deleteUser = (id) => {
    return apiClient.delete(`/usuarios/${id}`);
};