import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.1.59.59:8080/api'; 

const apiClient = axios.create({
    baseURL: API_URL,
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


export const sincronizarOcorrenciasOffline = (ocorrenciasOffline) => {
    return apiClient.post('/sincronizacao', { occurrences: ocorrenciasOffline });
};

export const getHistoricoSincronizacao = (userId) => {
    return apiClient.get(`/sincronizacao/usuario/${userId}`);
};

