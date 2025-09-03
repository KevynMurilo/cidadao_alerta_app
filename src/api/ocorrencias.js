import axios from 'axios';

const API_BASE_URL = 'http://192.168.18.17:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getOcorrencias = () => {
    return apiClient.get('/ocorrencias');
};

export const createOcorrencia = (data) => {
    return apiClient.post('/ocorrencias', data);
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
