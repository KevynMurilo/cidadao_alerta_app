import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTicketMessages, createTicketMessage } from '../api/ticketMessages';
import { createWebSocketClient } from '../api/websocket';

const COLORS = {
  primary: '#3a86f4',
  background: '#f0f4f7',
  card: '#ffffff',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  aberto: '#E74C3C',
  emAndamento: '#F39C12',
  fechado: '#2ECC71',
};

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticket } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  const statusColor =
    ticket.status === 'ABERTO'
      ? COLORS.aberto
      : ticket.status === 'EM_ANDAMENTO'
      ? COLORS.emAndamento
      : COLORS.fechado;

  const fetchMessages = async () => {
    try {
      const response = await getTicketMessages(ticket.id, {
        page: 0,
        size: 50,
        sort: 'sentAt,asc',
      });
      setMessages(response.data.data.content || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await createTicketMessage(ticket.id, { content: newMessage });
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    (async () => {
      const client = await createWebSocketClient(ticket.id, (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      });
      setStompClient(client);
    })();

    return () => {
      if (stompClient && stompClient.active) stompClient.deactivate();
    };
  }, []);

  const renderMessage = ({ item }) => {
    const isUser = item.sentBy?.id === ticket.createdBy?.id;
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.supportMessage,
          { alignSelf: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!isUser && <Text style={styles.messageAuthor}>{item.sentBy?.name}</Text>}
        <Text style={[styles.messageContent, { color: isUser ? '#fff' : COLORS.textPrimary }]}>
          {item.content}
        </Text>
        <Text style={styles.messageDate}>
          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderHeader = useCallback(() => (
    <View style={styles.card}>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]} />
      <Text style={styles.label}>Título</Text>
      <Text style={styles.value}>{ticket.subject}</Text>
      <Text style={styles.label}>Descrição</Text>
      <Text style={styles.value}>{ticket.description}</Text>
      <Text style={styles.label}>Status</Text>
      <Text style={[styles.value, { color: statusColor }]}>{ticket.status}</Text>
      <Text style={styles.label}>Prioridade</Text>
      <Text style={styles.value}>{ticket.priority}</Text>
      {ticket.createdAt && (
        <>
          <Text style={styles.label}>Criado em</Text>
          <Text style={styles.value}>{new Date(ticket.createdAt).toLocaleString()}</Text>
        </>
      )}
      <Text style={styles.sectionTitle}>Mensagens</Text>
    </View>
  ), [ticket]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Ticket</Text>
          <View style={styles.headerButton} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ padding: 20 }}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={sending}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  statusBadge: { width: '100%', height: 6, borderRadius: 3, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 10 },
  value: { fontSize: 16, color: COLORS.textPrimary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: COLORS.textPrimary },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 0,
  },
  supportMessage: {
    backgroundColor: '#e5e5ea',
    borderTopLeftRadius: 0,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: COLORS.textSecondary,
  },
  messageContent: { fontSize: 14 },
  messageDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    margin: 10,
  },
  input: { flex: 1, fontSize: 16, padding: 8 },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
});

export default TicketDetailScreen;
