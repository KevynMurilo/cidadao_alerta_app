import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL_WS } from './api';

export const createWebSocketClient = async (ticketId, onMessageReceived) => {
  const token = await AsyncStorage.getItem('userToken');

  const client = new Client({
    webSocketFactory: () => new SockJS(API_BASE_URL_WS),
    reconnectDelay: 5000,
    connectHeaders: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  client.onConnect = () => {
    console.log('WebSocket conectado');
    client.subscribe(`/topic/ticket/${ticketId}`, (message) => {
      const newMsg = JSON.parse(message.body);
      if (onMessageReceived) onMessageReceived(newMsg);
    });
  };

  client.onStompError = (frame) => {
    console.error('Erro no STOMP:', frame.headers['message'], frame.body);
  };

  client.activate();
  return client;
};
