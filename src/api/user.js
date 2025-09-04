import apiClient from './api';

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
