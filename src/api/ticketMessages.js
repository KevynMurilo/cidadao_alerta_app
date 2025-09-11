import apiClient from './api';

export const createTicketMessage = (ticketId, data) => {
  return apiClient.post(`/tickets/${ticketId}/messages`, data);
};

export const getTicketMessages = (ticketId, params = {}) => {
  return apiClient.get(`/tickets/${ticketId}/messages`, { params });
};

export const getUnreadMessageCounts = () => {
  return apiClient.get(`/tickets/unread-count`);
};
