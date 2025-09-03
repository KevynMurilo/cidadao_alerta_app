import React, { useContext, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getOcorrencias } from '../api/ocorrencias';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    const { userInfo } = useContext(AuthContext);
    const [ocorrencias, setOcorrencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOcorrencias = async () => {
        try {
            !refreshing && setLoading(true);
            const response = await getOcorrencias();
            const lista = response.data?.data?.content || [];
            setOcorrencias(lista);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar as ocorrências.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOcorrencias();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOcorrencias();
    };

    const handleCardPress = (item) => {
        if (item.lat && item.lon && item.lat !== 0 && item.lon !== 0) {
            navigation.navigate('Mapa', {
                initialRegion: {
                    latitude: item.lat,
                    longitude: item.lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                focoId: item.id,
            });
        } else {
            Alert.alert("Localização Indisponível", "Esta ocorrência não possui dados de localização para ser exibida no mapa.");
        }
    };

    const statusConfig = {
        ABERTO: { color: '#e74c3c', icon: 'alert-circle-outline', text: 'Aberto' },
        EM_ANDAMENTO: { color: '#f39c12', icon: 'progress-wrench', text: 'Em Andamento' },
        FINALIZADO: { color: '#2ecc71', icon: 'check-circle-outline', text: 'Finalizado' },
    };

    const renderItem = ({ item }) => {
        const config = statusConfig[item.status] || { color: '#95a5a6', icon: 'help-circle-outline', text: item.status };
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-BR');

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
                {item.photoUrl && item.photoUrl !== 'string' ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <MaterialCommunityIcons name="image-off-outline" size={40} color="#bdc3c7" />
                    </View>
                )}
                <View style={styles.cardContent}>
                    <Text style={styles.cardCategory}>{item.categoryName}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.cardFooter}>
                        <View style={styles.statusContainer}>
                            <MaterialCommunityIcons name={config.icon} size={16} color={config.color} />
                            <Text style={[styles.cardStatus, { color: config.color }]}>{config.text}</Text>
                        </View>
                        <Text style={styles.cardDate}>{dataFormatada}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Bem-vindo(a),</Text>
                    <Text style={styles.userName}>{userInfo?.name || 'Cidadão'}</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#3a86f4" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={ocorrencias}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="information-outline" size={50} color="#bdc3c7" />
                            <Text style={styles.empty}>Nenhuma ocorrência foi registada ainda.</Text>
                        </View>
                    }
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e8e8'
    },
    title: { fontSize: 18, color: '#666' },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#34495e' },
    list: { paddingVertical: 10, paddingHorizontal: 20, flexGrow: 1 },
    card: {
        backgroundColor: '#fff', borderRadius: 15, marginVertical: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
    },
    cardImage: {
        height: 150, width: '100%',
        borderTopLeftRadius: 15, borderTopRightRadius: 15,
    },
    cardImagePlaceholder: {
        height: 150, width: '100%',
        borderTopLeftRadius: 15, borderTopRightRadius: 15,
        backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center'
    },
    cardContent: { padding: 15 },
    cardCategory: { fontSize: 18, fontWeight: 'bold', color: '#34495e', marginBottom: 5 },
    cardDesc: { fontSize: 15, color: '#555', lineHeight: 22, minHeight: 44 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 15, paddingTop: 10,
        borderTopWidth: 1, borderColor: '#f0f4f7'
    },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    cardStatus: { fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
    cardDate: { fontSize: 14, color: '#7f8c8d' },
    emptyContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingTop: 50,
    },
    empty: {
        textAlign: 'center', color: '#999',
        marginTop: 20, fontSize: 16,
    },
});

export default HomeScreen;