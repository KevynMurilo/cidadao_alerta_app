import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMyTickets } from '../api/ticket';
import { getUnreadMessageCounts } from '../api/ticketMessages';

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

const MAX_CHAR = 80;

const TicketScreen = () => {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(
    async (isRefreshing = false, pageToFetch = 0) => {
      if (pageToFetch >= totalPages && !isRefreshing) return;
      if (isRefreshing) setRefreshing(true);
      else if (pageToFetch > 0) setLoadingMore(true);
      else setLoading(true);

      try {
        const response = await getMyTickets({
          page: pageToFetch,
          size: 10,
          sort: 'createdAt,desc',
        });
        const { content, totalPages: newTotalPages } = response.data.data;
        if (content) {
          setTickets((prev) =>
            pageToFetch === 0 ? content : [...prev, ...content]
          );
          setTotalPages(newTotalPages);
          setPage(pageToFetch + 1);
        }

        const unreadResponse = await getUnreadMessageCounts();
        setUnreadCounts(unreadResponse.data.data);
      } catch (error) {
        console.log(error)
        Alert.alert('Erro', 'Não foi possível carregar os tickets.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [page, totalPages]
  );

  useFocusEffect(
    useCallback(() => {
      setTickets([]);
      setPage(0);
      setTotalPages(1);
      fetchTickets(false, 0);
    }, [])
  );

  const handleRefresh = () => {
    setPage(0);
    setTotalPages(1);
    fetchTickets(true, 0);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchTickets(false, page);
    }
  };

  const handlePressDetail = (ticket) => {
    navigation.navigate('TicketDetail', { ticketId: ticket.id });
  };

  const TicketItem = ({ item, onPress }) => {
    const timeAgo = formatDistanceToNow(parseISO(item.createdAt), {
      addSuffix: true,
      locale: ptBR,
    });

    const statusColor =
      item.status === 'ABERTO'
        ? COLORS.aberto
        : item.status === 'EM_ANDAMENTO'
        ? COLORS.emAndamento
        : COLORS.fechado;

    const unreadCount = unreadCounts[item.id] || 0;

    return (
      <View style={styles.itemContainer}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]} />
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>
            {item.subject}{' '}
            {unreadCount > 0 && (
              <View style={styles.unreadBadgeContainer}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Text>
          <Text style={styles.itemDescription}>
            {item.description.length > MAX_CHAR
              ? item.description.substring(0, MAX_CHAR) + '...'
              : item.description}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.itemTimestamp}>{timeAgo}</Text>
            <TouchableOpacity onPress={() => onPress(item)}>
              <Text style={styles.detailButton}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () =>
    loadingMore ? (
      <ActivityIndicator
        style={{ marginVertical: 20 }}
        size="small"
        color={COLORS.primary}
      />
    ) : null;

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="ticket-confirmation-outline"
          size={60}
          color="#CBD5E0"
        />
        <Text style={styles.emptyTitle}>Nenhum Ticket</Text>
        <Text style={styles.emptySubtitle}>
          Você ainda não possui tickets de suporte.
        </Text>
      </View>
    );
  };

  if (loading && tickets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CriarTicket')}
                    style={styles.headerButton}
                >
                    <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TicketItem item={item} onPress={handlePressDetail} />
                )}
                contentContainerStyle={styles.listContainer}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyComponent}
            />
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { paddingVertical: 8, flexGrow: 1 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: 15,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadge: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  unreadBadgeContainer: {
    backgroundColor: COLORS.aberto,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: '30%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TicketScreen;