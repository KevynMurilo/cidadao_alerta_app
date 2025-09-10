import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getOcorrencia, getOcorrenciaFoto } from '../api/ocorrencias';

const { width, height } = Dimensions.get('window');

const DetalheOcorrenciaScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id } = route.params;

    const [ocorrencia, setOcorrencia] = useState(null);
    const [imagem, setImagem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchOcorrencia = async () => {
            try {
                const response = await getOcorrencia(id);
                const data = response.data.data;
                setOcorrencia(data);

                try {
                    const base64 = await getOcorrenciaFoto(id);
                    setImagem(base64);
                } catch {
                    console.log('Nenhuma imagem disponível para esta ocorrência.');
                }
            } catch (error) {
                console.error('Erro ao carregar ocorrência:', error);
                Alert.alert('Erro', 'Não foi possível carregar os detalhes da ocorrência.');
            } finally {
                setLoading(false);
            }
        };
        fetchOcorrencia();
    }, [id]);

    const handleVerNoMapa = () => {
        if (!ocorrencia || !ocorrencia.lat || !ocorrencia.lon || ocorrencia.lat === 0 || ocorrencia.lon === 0) {
            Alert.alert(
                'Localização Indisponível',
                'Esta ocorrência não possui dados de localização para ser exibida no mapa.'
            );
            return;
        }

        navigation.navigate('Main', {
            screen: 'Mapa',
            params: {
                initialRegion: {
                    latitude: ocorrencia.lat,
                    longitude: ocorrencia.lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                focoId: ocorrencia.id,
            },
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3a86f4" />
            </SafeAreaView>
        );
    }

    if (!ocorrencia) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Ocorrência não encontrada.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { marginTop: Platform.OS === 'ios' ? 0 : 30 }]}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#34495e" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Detalhes da Ocorrência</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {imagem ? (
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Image
                            source={{ uri: imagem }}
                            style={styles.image}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.noImage}>
                        <Ionicons name="image-outline" size={100} color="#BDC3C7" />
                        <Text style={{ color: '#7F8C8D', marginTop: 10 }}>Sem imagem</Text>
                    </View>
                )}

                {/* Card Informações Principais */}
                <View style={styles.card}>
                    <Text style={styles.title}>{ocorrencia.title || 'Sem título'}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.label}>Descrição:</Text>
                    <Text style={styles.text}>{ocorrencia.description || 'Sem descrição'}</Text>
                </View>

                {/* Card Informações Detalhadas */}
                <View style={styles.card}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.text, { fontWeight: 'bold', color: getStatusColor(ocorrencia.status) }]}>{ocorrencia.status}</Text>

                    <Text style={styles.label}>Categoria:</Text>
                    <Text style={styles.text}>{ocorrencia.categoryName || 'Não definida'}</Text>

                    <Text style={styles.label}>Criado em:</Text>
                    <Text style={styles.text}>
                        {ocorrencia.createdAt
                            ? new Date(ocorrencia.createdAt).toLocaleString('pt-BR')
                            : '-'}
                    </Text>
                </View>

                <TouchableOpacity style={styles.mapButton} onPress={handleVerNoMapa}>
                    <Ionicons name="map-outline" size={22} color="#fff" />
                    <Text style={styles.mapButtonText}>Ver no Mapa</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal de Imagem */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPressOut={() => setModalVisible(false)}
                    >
                        <Image
                            source={{ uri: imagem }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// Função para definir cor do status
const getStatusColor = (status) => {
    switch (status) {
        case 'ABERTO': return '#E74C3C';
        case 'EM_ANDAMENTO': return '#F39C12';
        case 'FINALIZADO': return '#2ECC71';
        default: return '#34495e';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerButton: {
        position: 'absolute',
        left: 10,
        top: 14,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#34495e',
        textAlign: 'center',
    },

    content: { padding: 20, paddingBottom: 40 },

    image: {
        width: '100%',
        height: 240,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    noImage: {
        width: '100%',
        height: 240,
        borderRadius: 15,
        backgroundColor: '#ECF0F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 10,
    },
    title: { fontSize: 22, fontWeight: 'bold', color: '#34495e', marginBottom: 10 },

    label: { fontSize: 15, fontWeight: '600', color: '#34495e', marginTop: 8 },
    text: { fontSize: 15, color: '#2c3e50', marginTop: 3 },

    mapButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3a86f4',
        paddingVertical: 14,
        borderRadius: 14,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    mapButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

    errorText: { fontSize: 18, color: '#e74c3c', textAlign: 'center', marginTop: 50 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: width - 40,
        height: height * 0.75,
        borderRadius: 16,
    },
});

export default DetalheOcorrenciaScreen;
