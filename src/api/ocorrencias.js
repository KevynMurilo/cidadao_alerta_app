import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://10.1.59.59:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
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

export const getOcorrencias = (params = {}) => {
    return apiClient.get('/ocorrencias', { params });
};

export const createOcorrencia = (data) => {
    return apiClient.post('/ocorrencias', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const getMinhasOcorrencias = (page = 0, size = 10) => {
    return apiClient.get(`/ocorrencias/me?page=${page}&size=${size}`);
};

export const updateOcorrencia = (id, data) => {
    return apiClient.put(`/ocorrencias/${id}`, data);
};

export const deleteOcorrencia = (id) => {
    return apiClient.delete(`/ocorrencias/${id}`);
};
