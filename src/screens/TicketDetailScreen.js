import React from 'react';
import {
  View,
  Text,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTicketMessages, createTicketMessage } from '../api/ticketMessages';
import { getTicket } from '../api/ticket';

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
  const { ticketId } = route.params;

  const [ticket, setTicket] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  
  const flatListRef = React.useRef(null);
  const listLayoutHeight = React.useRef(0);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

  const fetchTicketDetail = React.useCallback(async () => {
    try {
      const ticketResponse = await getTicket(ticketId);
      setTicket(ticketResponse.data.data);

      const messagesResponse = await getTicketMessages(ticketId, {
        page: 0,
        size: 50,
        sort: 'sentAt,asc',
      });
      setMessages(messagesResponse.data.data.content || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do ticket.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => {
    fetchTicketDetail();
  }, [ticketId, fetchTicketDetail]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const tempId = Math.random().toString();
    const sentBy = ticket?.createdBy;

    const optimisticMessage = {
        id: tempId,
        content: newMessage,
        sentAt: new Date().toISOString(),
        sentBy: { id: sentBy.id, name: sentBy.name }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await createTicketMessage(ticketId, { content: optimisticMessage.content });
      const confirmedMessage = response.data.data;
      setMessages(prev => prev.map(msg => msg.id === tempId ? confirmedMessage : msg));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };
  
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isFarFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y > 200;
    
    if (isFarFromBottom) {
      if (!showScrollToBottom) setShowScrollToBottom(true);
    } else {
      if (showScrollToBottom) setShowScrollToBottom(false);
    }
  };

  const statusColor =
    ticket?.status === 'ABERTO'
      ? COLORS.aberto
      : ticket?.status === 'EM_ANDAMENTO'
        ? COLORS.emAndamento
        : COLORS.fechado;

  const renderMessage = React.useCallback(({ item }) => {
    if (!ticket) return null;
    const isUser = item.sentBy?.id === ticket.createdBy?.id;
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.supportMessage,
          { alignSelf: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!isUser && <Text style={styles.messageAuthor}>{item.sentBy?.name || 'Suporte'}</Text>}
        <Text style={[styles.messageContent, { color: isUser ? '#fff' : COLORS.textPrimary }]}>
          {item.content}
        </Text>
        <Text style={[styles.messageDate, { color: isUser ? '#e0e0e0' : COLORS.textSecondary }]}>
          {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [ticket]);
  
  const renderHeader = React.useCallback(() => {
    if (!ticket) return null;

    return (
      <View style={styles.card}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]} />
        <Text style={styles.label}>Título</Text>
        <Text style={styles.value}>{ticket.subject}</Text>
        <Text style={styles.label}>Descrição</Text>
        <Text style={styles.value}>{ticket.description}</Text>
        <Text style={styles.label}>Status</Text>
        <Text style={[styles.value, { color: statusColor, fontWeight: 'bold' }]}>{ticket.status.replace('_', ' ')}</Text>
        <Text style={styles.label}>Prioridade</Text>
        <Text style={styles.value}>{ticket.priority}</Text>
        {ticket.createdAt && (
          <>
            <Text style={styles.label}>Criado em</Text>
            <Text style={styles.value}>{new Date(ticket.createdAt).toLocaleString('pt-BR')}</Text>
          </>
        )}
        <Text style={styles.sectionTitle}>Mensagens</Text>
      </View>
    );
  }, [ticket, statusColor]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Ticket</Text>
                <View style={styles.headerButton} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flexContainer}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 35}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMessage}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={(e) => {
                      listLayoutHeight.current = e.nativeEvent.layout.height;
                    }}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                      const isScrollable = contentHeight > listLayoutHeight.current;
                      if (isScrollable) {
                          setShowScrollToBottom(true);
                      }
                    }}
                />

                {ticket?.status !== 'FECHADO' && (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            placeholderTextColor={'#ccc'}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (sending || !newMessage.trim()) && {opacity: 0.5}]}
                            onPress={handleSendMessage}
                            disabled={sending || !newMessage.trim()}
                        >
                            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {showScrollToBottom && (
              <TouchableOpacity
                style={styles.scrollToBottomButton}
                onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
              >
                <Ionicons name="arrow-down-circle" size={40} color={COLORS.primary} />
              </TouchableOpacity>
            )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    flexContainer: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 },
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
    statusBadge: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
    value: { fontSize: 16, color: COLORS.textPrimary, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', color: COLORS.textPrimary },
    messageBubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: '80%' },
    userMessage: { backgroundColor: COLORS.primary, borderTopRightRadius: 4 },
    supportMessage: { backgroundColor: '#e5e5ea', borderTopLeftRadius: 4 },
    messageAuthor: { fontSize: 13, fontWeight: '600', marginBottom: 4, color: COLORS.primary },
    messageContent: { fontSize: 15, lineHeight: 20 },
    messageDate: { fontSize: 11, marginTop: 5, alignSelf: 'flex-end' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        fontSize: 16,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 22,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    scrollToBottomButton: {
      position: 'absolute',
      bottom: 90,
      right: 20,
      backgroundColor: COLORS.card,
      borderRadius: 25,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
});

export default TicketDetailScreen;