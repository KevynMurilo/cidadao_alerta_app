import apiClient from './api';

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

export const getMinhasOcorrencias = (params = {}) => {
    return apiClient.get('/ocorrencias/me', { params });
};

export const updateOcorrencia = (id, data) => {
    return apiClient.put(`/ocorrencias/${id}`, data);
};

export const deleteOcorrencia = (id) => {
    return apiClient.delete(`/ocorrencias/${id}`);
};

export const getOcorrenciaFoto = async (id) => {
    const response = await apiClient.get(`/ocorrencias/${id}/foto`, {
        responseType: 'blob',
    });

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
    });
};
