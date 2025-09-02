import React, { useContext, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { getOcorrencias } from '../api/ocorrencias';

const HomeScreen = ({ navigation }) => {
    const { userInfo, logout } = useContext(AuthContext);
    const [ocorrencias, setOcorrencias] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOcorrencias = async () => {
        try {
            const response = await getOcorrencias();
            const lista = response.data?.data?.content || [];
            setOcorrencias(lista);
        } catch (error) {
            console.error('Erro ao buscar ocorrências:', error.message);
        }
    };

    useEffect(() => {
        fetchOcorrencias();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOcorrencias();
        setRefreshing(false);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.categoryName}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardStatus}>Status: {item.status}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Bem-vindo(a), {userInfo?.name}</Text>
                <Text style={styles.email}>{userInfo?.email}</Text>
            </View>

            <FlatList
                data={ocorrencias}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Nenhuma ocorrência registrada ainda.</Text>}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            <View style={styles.buttonGroup}>
                <CustomButton title="Nova Ocorrência" onPress={() => navigation.navigate('NovaOcorrencia')} />
                <CustomButton title="Ver Mapa" onPress={() => navigation.navigate('Mapa')} />
                <CustomButton title="Sair" onPress={logout} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    email: {
        fontSize: 14,
        color: '#666',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDesc: {
        fontSize: 14,
        marginTop: 5,
        color: '#333',
    },
    cardStatus: {
        fontSize: 12,
        marginTop: 10,
        color: '#3a86f4',
    },
    empty: {
        textAlign: 'center',
        color: '#999',
        marginTop: 50,
        fontSize: 16,
    },
    buttonGroup: {
        padding: 20,
    },
});

export default HomeScreen;
