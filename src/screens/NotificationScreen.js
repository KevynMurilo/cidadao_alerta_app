import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNotifications, markAsRead } from '../api/notification';

const NotificationItem = ({ item, onPress }) => {
    const timeAgo = formatDistanceToNow(parseISO(item.sentAt), {
        addSuffix: true,
        locale: ptBR,
    });

    return (
        <TouchableOpacity
            style={[styles.itemContainer, !item.read && styles.itemUnread]}
            onPress={onPress}
        >
            {!item.read && <View style={styles.unreadDot} />}
            <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={26} color="#3a86f4" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemTimestamp}>{timeAgo}</Text>
            </View>
        </TouchableOpacity>
    );
};

const NotificationScreen = () => {
    const navigation = useNavigation();

    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async (isRefreshing = false, pageToFetch = 0) => {
        if (pageToFetch >= totalPages && !isRefreshing) return;

        if (isRefreshing) setRefreshing(true);
        else if (pageToFetch > 0) setLoadingMore(true);
        else setLoading(true);

        try {
            const response = await getNotifications({ page: pageToFetch, size: 15, sort: 'sentAt,desc' });
            const { content, totalPages: newTotalPages } = response.data.data;

            if (content) {
                setNotifications(prev => (pageToFetch === 0 ? content : [...prev, ...content]));
                setTotalPages(newTotalPages);
                setPage(pageToFetch + 1);
            }
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            Alert.alert("Erro", "Não foi possível carregar as notificações.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [page, totalPages]);

    useFocusEffect(
        useCallback(() => {
            setNotifications([]);
            setPage(0);
            setTotalPages(1);
            fetchNotifications(false, 0);
        }, [])
    );

    const handleRefresh = () => {
        setPage(0);
        setTotalPages(1);
        fetchNotifications(true, 0);
    };

    const handleLoadMore = () => {
        if (!loadingMore && page < totalPages) fetchNotifications(false, page);
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        try {
            await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            Alert.alert("Sucesso", "Todas as notificações foram marcadas como lidas.");
        } catch (error) {
            console.error("Erro ao marcar todas como lidas:", error);
            Alert.alert("Erro", "Não foi possível marcar todas as notificações como lidas.");
        }
    };

    const handleNotificationPress = async (item, index) => {
        try {
            if (!item.read) {
                await markAsRead(item.id);
                const newNotifications = [...notifications];
                newNotifications[index].read = true;
                setNotifications(newNotifications);
            }

            const type = (item.type || 'OUTRO').toUpperCase();
            const relatedId = item.relatedEntityId;

            switch (type) {
                case 'OCORRENCIA':
                    if (relatedId) {
                        navigation.navigate('DetalheOcorrencia', { id: relatedId });
                    } else {
                        Alert.alert('Erro', 'Ocorrência não encontrada.');
                    }
                    break;
                case 'TICKET':
                    if (relatedId) {
                        navigation.navigate('TicketDetail', { ticketId: relatedId });
                    } else {
                        Alert.alert('Erro', 'Ticket não encontrado.');
                    }
                    break;
                case 'OUTRO':
                default:
                    Alert.alert('Info', item.message || 'Sem mensagem');
                    break;
            }
        } catch (error) {
            console.error("Erro ao tratar notificação:", error);
        }
    };

    const renderFooter = () => loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} size="small" color="#3a86f4" /> : null;

    const renderEmptyComponent = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={60} color="#CBD5E0" />
                <Text style={styles.emptyTitle}>Nenhuma Notificação</Text>
                <Text style={styles.emptySubtitle}>Você está em dia! Novas notificações aparecerão aqui.</Text>
            </View>
        );
    };

    if (loading && notifications.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3a86f4" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#34495e" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notificações</Text>
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
                        <Ionicons name="checkmark-done-outline" size={24} color="#3a86f4" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <NotificationItem
                            item={item}
                            onPress={() => handleNotificationPress(item, index)}
                        />
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
        backgroundColor: '#f0f4f7',
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
        borderColor: '#eee'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#34495e'
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    listContainer: {
        paddingVertical: 8,
        flexGrow: 1
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3
    },
    itemUnread: {
        backgroundColor: '#eaf2ff',
        borderLeftWidth: 4,
        borderLeftColor: '#3a86f4'
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3a86f4',
        position: 'absolute',
        top: 12,
        left: -4
    },
    iconContainer: {
        marginRight: 15
    },
    textContainer: {
        flex: 1
    },
    itemMessage: {
        fontSize: 15,
        color: '#34495e',
        fontWeight: '500',
        lineHeight: 22
    },
    itemTimestamp: {
        fontSize: 13,
        color: '#7f8c8d',
        marginTop: 4
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#34495e',
        marginTop: 20
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 8
    },
});

export default NotificationScreen;