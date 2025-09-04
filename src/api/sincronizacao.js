import apiClient from './api';

export const sincronizarOcorrenciasOffline = (ocorrenciasOffline) => {
    return apiClient.post('/sincronizacao', { occurrences: ocorrenciasOffline });
};

export const getHistoricoSincronizacao = (userId) => {
    return apiClient.get(`/sincronizacao/usuario/${userId}`);
};
