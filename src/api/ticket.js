import apiClient from './api';

export const createTicket = (data) => {
    return apiClient.post('/tickets', data);
};

export const getTicket = (ticketId) => {
  return apiClient.get(`/tickets/${ticketId}`);
};

export const getMyTickets = (params = {}) => {
    return apiClient.get('/tickets/me', { params });
};

export const getAllTickets = (params = {}) => {
    return apiClient.get('/tickets', { params });
};

export const updateTicket = (id, data) => {
    return apiClient.put(`/tickets/${id}`, data);
};
