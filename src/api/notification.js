import apiClient from './api';

export const getNotifications = (params = {}) => {
    return apiClient.get('/notificacoes', { params });
};

export const markAsRead = (id) => {
    return apiClient.put(`/notificacoes/${id}/ler`);
};