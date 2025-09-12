import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getOcorrencia, getOcorrenciaFoto } from '../api/ocorrencias';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#3a86f4',
    background: '#f0f4f7',
    card: '#ffffff',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    divider: '#EAEBEE',
    aberto: '#E74C3C',
    emAndamento: '#F39C12',
    finalizado: '#2ECC71',
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'ABERTO':
            return { backgroundColor: '#FADBD8', color: '#C0392B' };
        case 'EM_ANDAMENTO':
            return { backgroundColor: '#FDEBD0', color: '#D35400' };
        case 'FINALIZADO':
            return { backgroundColor: '#D5F5E3', color: '#239B56' };
        default:
            return { backgroundColor: '#EAEBEE', color: '#7F8C8D' };
    }
};

const InfoRow = ({ icon, label, text }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={22} color={COLORS.primary} style={styles.infoIcon} />
        <View style={styles.infoTextContainer}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.text}>{text}</Text>
        </View>
    </View>
);

const DetalheOcorrenciaScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id } = route.params;

    const [ocorrencia, setOcorrencia] = useState(null);
    const [imagem, setImagem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchOcorrencia = async () => {
            try {
                const response = await getOcorrencia(id);
                const data = response.data.data;
                setOcorrencia(data);

                try {
                    setImageLoading(true);
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
                setImageLoading(false);
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
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!ocorrencia) {
        return (
            <SafeAreaView style={styles.safeArea}>
                 <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalhes</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loaderContainer}>
                    <Text style={styles.errorText}>Ocorrência não encontrada.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const statusStyle = getStatusStyle(ocorrencia.status);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalhes da Ocorrência</Text>
                    <View style={styles.headerButton} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableOpacity 
                        style={styles.imageContainer} 
                        onPress={() => imagem && setModalVisible(true)}
                        disabled={!imagem}
                    >
                        {imageLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        ) : imagem ? (
                            <Image source={{ uri: imagem }} style={styles.image} />
                        ) : (
                            <View style={styles.noImage}>
                                <Ionicons name="image-outline" size={80} color={COLORS.textSecondary} />
                                <Text style={styles.noImageText}>Sem imagem</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.detailsCard}>
                        <View style={styles.cardHeader}>
                             <Text style={styles.mainTitle}>{ocorrencia.categoryName || 'Ocorrência'}</Text>
                             <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                                <Text style={[styles.statusText, { color: statusStyle.color }]}>{ocorrencia.status.replace('_', ' ')}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        <InfoRow 
                            icon="document-text-outline" 
                            label="Descrição" 
                            text={ocorrencia.description || 'Sem descrição'} 
                        />
                        <InfoRow 
                            icon="calendar-outline" 
                            label="Criado em" 
                            text={ocorrencia.createdAt ? new Date(ocorrencia.createdAt).toLocaleString('pt-BR') : '-'}
                        />
                    </View>

                    <TouchableOpacity style={styles.mapButton} onPress={handleVerNoMapa}>
                        <Ionicons name="map-outline" size={22} color="#fff" />
                        <Text style={styles.mapButtonText}>Ver no Mapa</Text>
                    </TouchableOpacity>
                </ScrollView>

                <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
                        <Image source={{ uri: imagem }} style={styles.modalImage} resizeMode="contain" />
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderColor: COLORS.divider,
    },
    headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    content: { padding: 15, paddingBottom: 40 },
    imageContainer: {
        width: '100%',
        height: 240,
        borderRadius: 16,
        backgroundColor: '#ECF0F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
    noImageText: { color: COLORS.textSecondary, marginTop: 10, fontSize: 16 },
    detailsCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 10, marginBottom: 20 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    infoIcon: { marginRight: 15 },
    infoTextContainer: { flex: 1 },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    text: {
        fontSize: 16,
        color: COLORS.textPrimary,
        lineHeight: 22,
    },
    mapButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 14,
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    mapButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    errorText: { fontSize: 18, color: COLORS.aberto, textAlign: 'center' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: width,
        height: height,
    },
});

export default DetalheOcorrenciaScreen;