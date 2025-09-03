import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMinhasOcorrencias } from '../api/ocorrencias';
import { getHistoricoSincronizacao } from '../api/sincronizacao';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const MinhasOcorrenciasScreen = ({ navigation }) => {
    const { userInfo } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('ocorrencias');
    const [ocorrencias, setOcorrencias] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async (tab) => {
        if (!userInfo?.id) return;
        setLoading(true);
        try {
            if (tab === 'ocorrencias') {
                const response = await getMinhasOcorrencias();
                setOcorrencias(response.data?.data?.content || []);
            } else {
                const response = await getHistoricoSincronizacao(userInfo.id);
                setHistorico(response.data?.data || []);
            }
        } catch (error) {
            Alert.alert('Erro', `Não foi possível carregar os dados.`);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData(activeTab);
        }, [activeTab, userInfo])
    );

    const statusConfig = {
        ABERTO: { color: '#e74c3c', icon: 'alert-circle-outline', text: 'Aberto' },
        EM_ANDAMENTO: { color: '#f39c12', icon: 'progress-wrench', text: 'Em Andamento' },
        FINALIZADO: { color: '#2ecc71', icon: 'check-circle-outline', text: 'Finalizado' },
    };

    const renderOcorrenciaItem = ({ item }) => {
        const config = statusConfig[item.status] || {};
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-BR');
        return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OcorrenciaDetalhe', { ocorrenciaId: item.id })}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardCategory}>{item.categoryName}</Text>
                    <View style={styles.statusContainer}>
                        <MaterialCommunityIcons name={config.icon} size={16} color={config.color} />
                        <Text style={[styles.cardStatus, { color: config.color }]}>{config.text}</Text>
                    </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardDate}>{dataFormatada}</Text>
            </TouchableOpacity>
        );
    };

    const renderHistoricoItem = ({ item }) => (
        <View style={styles.historyCard}>
            <MaterialCommunityIcons
                name={item.success ? "check-circle" : "alert-circle"}
                size={30}
                color={item.success ? "#2ecc71" : "#e74c3c"}
            />
            <View style={styles.historyTextContainer}>
                <Text style={styles.historyText}>
                    Sincronização {item.success ? 'bem-sucedida' : 'falhou'}
                </Text>
                <Text style={styles.historyDate}>
                    {new Date(item.syncDate).toLocaleString('pt-BR')}
                </Text>
            </View>
        </View>
    );
    
    const ListEmptyComponent = ({ message }) => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="information-outline" size={50} color="#bdc3c7" />
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'ocorrencias' && styles.activeTab]}
                    onPress={() => setActiveTab('ocorrencias')}
                >
                    <Text style={[styles.tabText, activeTab === 'ocorrencias' && styles.activeTabText]}>Ocorrências</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'historico' && styles.activeTab]}
                    onPress={() => setActiveTab('historico')}
                >
                    <Text style={[styles.tabText, activeTab === 'historico' && styles.activeTabText]}>Histórico de Sync</Text>
                </TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator style={{ marginTop: 50}} size="large" color="#3a86f4" /> : (
                activeTab === 'ocorrencias' ? (
                    <FlatList
                        data={ocorrencias}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderOcorrenciaItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<ListEmptyComponent message="Você ainda não registou ocorrências." />}
                    />
                ) : (
                    <FlatList
                        data={historico}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderHistoricoItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<ListEmptyComponent message="Nenhum histórico de sincronização." />}
                    />
                )
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#34495e', marginLeft: 15 },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        marginHorizontal: 10,
    },
    activeTab: {
        borderBottomColor: '#3a86f4',
    },
    tabText: {
        color: '#7f8c8d',
        fontWeight: '600',
        fontSize: 16,
    },
    activeTabText: {
        color: '#3a86f4',
    },
    list: { padding: 20, flexGrow: 1 },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardCategory: { fontSize: 18, fontWeight: 'bold', color: '#34495e' },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    cardStatus: { fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
    cardDesc: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 10 },
    cardDate: { fontSize: 13, color: '#7f8c8d', alignSelf: 'flex-end', marginTop: 5 },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
    },
    historyTextContainer: { marginLeft: 15, flex: 1 },
    historyText: { fontSize: 16, fontWeight: '500', color: '#34495e' },
    historyDate: { fontSize: 12, color: '#7f8c8d', marginTop: 3 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#95a5a6' },
});

export default MinhasOcorrenciasScreen;

