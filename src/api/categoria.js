import axios from 'axios';

const API_BASE_URL = 'http://10.1.59.59:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCategorias = () => {
  return apiClient.get('/categorias');
};
