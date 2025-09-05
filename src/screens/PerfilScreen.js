import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getMe } from '../api/user';
import { getNotifications } from '../api/notification';

const ProfileMenuItem = ({ icon, text, onPress, badgeCount = 0, isLogout = false }) => (
    <TouchableOpacity style={[styles.menuItem, isLogout && styles.logoutButton]} onPress={onPress}>
        <View style={[styles.menuItemIcon, isLogout && { backgroundColor: '#ffebee' }]}>
            <Ionicons name={icon} size={24} color={isLogout ? '#e74c3c' : '#3a86f4'} />
        </View>
        <Text style={[styles.menuItemText, isLogout && { color: '#e74c3c' }]}>{text}</Text>
        {badgeCount > 0 && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
        )}
        {!isLogout && <Ionicons name="chevron-forward-outline" size={22} color="#c7c7c7" />}
    </TouchableOpacity>
);

const PerfilScreen = () => {
    const { logout } = useContext(AuthContext);
    const [profileInfo, setProfileInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigation = useNavigation();

    useFocusEffect(
        React.useCallback(() => {
            const fetchUserData = async () => {
                try {
                    setLoading(true);
                    const response = await getMe();
                    if (response.data && response.data.data) {
                        setProfileInfo(response.data.data);
                    } else {
                        throw new Error('Formato de resposta inesperado');
                    }

                    // Buscar notificações não lidas
                    const notifResponse = await getNotifications({ page: 0, size: 100, sort: 'sentAt,desc' });
                    const notifications = notifResponse.data.data.content || [];
                    const unread = notifications.filter(n => !n.read).length;
                    setUnreadCount(unread);
                } catch (error) {
                    console.error("Falha ao buscar dados do perfil:", error);
                    Alert.alert("Erro", "Não foi possível carregar os dados do perfil. Tente novamente.");
                } finally {
                    setLoading(false);
                }
            };

            fetchUserData();
            return () => {};
        }, [])
    );

    const handleEditProfile = () => {
        if (profileInfo) navigation.navigate('EditarPerfil', { user: profileInfo });
        else Alert.alert('Erro', 'Não foi possível carregar os dados para edição. Tente novamente.');
    };

    const handleLogout = () => {
        Alert.alert(
            'Confirmar Logout',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => logout() },
            ],
            { cancelable: true }
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3a86f4" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="person-outline" size={50} color="#3a86f4" />
                    </View>
                    <Text style={styles.userName}>{profileInfo?.name ?? 'Usuário'}</Text>
                    <Text style={styles.userEmail}>{profileInfo?.email ?? 'Não foi possível carregar o email'}</Text>
                </View>

                <View style={styles.menuContainer}>
                    <ProfileMenuItem
                        icon="person-circle-outline"
                        text="Editar Perfil"
                        onPress={handleEditProfile}
                    />
                    <ProfileMenuItem
                        icon="notifications-outline"
                        text="Notificações"
                        badgeCount={unreadCount}
                        onPress={() => navigation.navigate('Notifications')}
                    />
                    <ProfileMenuItem
                        icon="help-buoy-outline"
                        text="Ajuda e Suporte"
                        onPress={() => navigation.navigate('Tickets')}
                    />
                </View>

                <ProfileMenuItem
                    icon="exit-outline"
                    text="Terminar Sessão"
                    onPress={handleLogout}
                    isLogout={true}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f7' },
    header: { paddingVertical: 15, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#34495e' },
    content: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 40 },
    profileCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eaf2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#34495e', textAlign: 'center' },
    userEmail: { fontSize: 16, color: '#7f8c8d', marginTop: 4, textAlign: 'center' },
    menuContainer: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 30, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0f4f7' },
    menuItemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eaf2ff', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    menuItemText: { flex: 1, fontSize: 16, color: '#34495e', fontWeight: '500' },
    badge: { minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    logoutButton: { borderRadius: 15, borderBottomWidth: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
});

export default PerfilScreen;
