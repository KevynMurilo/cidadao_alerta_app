import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const statusColor =
    ticket.status === 'ABERTO'
      ? COLORS.aberto
      : ticket.status === 'EM_ANDAMENTO'
      ? COLORS.emAndamento
      : COLORS.fechado;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Ticket</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadge: { width: '100%', height: 6, borderRadius: 3, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginTop: 10 },
  value: { fontSize: 16, color: COLORS.textPrimary, marginTop: 4 },
});

export default TicketDetailScreen;
