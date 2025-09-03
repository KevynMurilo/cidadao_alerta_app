import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getOcorrencias } from '../api/ocorrencias';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const MapaScreen = ({ navigation, route }) => {
    const { initialRegion, focoId } = route.params || {};
    const mapRef = useRef(null);

    const [ocorrencias, setOcorrencias] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [ocorrenciasSelecionadas, setOcorrenciasSelecionadas] = useState([]);

    const getDistance = (p1, p2) => {
        const rad = (x) => (x * Math.PI) / 180;
        const R = 6378137;
        const dLat = rad(p2.latitude - p1.latitude);
        const dLong = rad(p2.longitude - p1.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.latitude)) * Math.cos(rad(p2.latitude)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const criarClusters = (pontos, raio) => {
        const clustersResult = [];
        const visitados = new Array(pontos.length).fill(false);

        for (let i = 0; i < pontos.length; i++) {
            if (!visitados[i]) {
                visitados[i] = true;
                const novoCluster = {
                    ...pontos[i],
                    items: [pontos[i]],
                    count: 1,
                    clusterId: `cluster-${i}`
                };

                for (let j = i + 1; j < pontos.length; j++) {
                    if (!visitados[j]) {
                        const distancia = getDistance(
                            { latitude: pontos[i].lat, longitude: pontos[i].lon },
                            { latitude: pontos[j].lat, longitude: pontos[j].lon }
                        );

                        if (distancia < raio) {
                            visitados[j] = true;
                            novoCluster.items.push(pontos[j]);
                            novoCluster.count++;
                        }
                    }
                }
                clustersResult.push(novoCluster);
            }
        }
        return clustersResult;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permissão negada', 'Não foi possível acessar a localização.');
                    return;
                }

                const response = await getOcorrencias();
                const lista = response.data?.data?.content || [];
                setOcorrencias(lista);
                const clustersCalculados = criarClusters(lista, 200);
                setClusters(clustersCalculados);

                if (focoId) {
                    const ocorrenciaFoco = lista.find(o => o.id === focoId);
                    if (ocorrenciaFoco) {
                        setOcorrenciasSelecionadas([ocorrenciaFoco]);
                        setModalVisible(true);

                        if (mapRef.current) {
                            setTimeout(() => {
                                mapRef.current.animateToRegion({
                                    latitude: ocorrenciaFoco.lat,
                                    longitude: ocorrenciaFoco.lon,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }, 1000);
                            }, 500);
                        }
                    }
                }
            } catch (error) {
                Alert.alert('Erro ao carregar mapa', error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [focoId]);

    const abrirLista = (items) => {
        setOcorrenciasSelecionadas(items);
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.photoUrl && item.photoUrl !== 'string' ? (
                <Image source={{ uri: item.photoUrl }} style={styles.image} />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera-off" size={40} color="#999" />
                </View>
            )}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.categoryName}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardStatus}>Status: {item.status}</Text>
                <Text style={styles.cardAuthor}>Por: {item.createdByName}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loading} size="large" color="#3a86f4" />
            ) : (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={initialRegion || {
                        latitude: -15.7942,
                        longitude: -47.8825,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {clusters.map((cluster) => {
                        if (cluster.count > 1) {
                            return (
                                <Marker
                                    key={cluster.clusterId}
                                    coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
                                    onPress={() => abrirLista(cluster.items)}
                                >
                                    <View style={styles.clusterMarker}>
                                        <Text style={styles.clusterText}>{cluster.count}</Text>
                                    </View>
                                </Marker>
                            );
                        }
                        return (
                            <Marker
                                key={cluster.items[0].id}
                                coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
                                pinColor={cluster.items[0].id === focoId ? '#f39c12' : '#e74c3c'}
                                onPress={() => abrirLista(cluster.items)}
                            />
                        );
                    })}
                </MapView>
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {ocorrenciasSelecionadas.length > 1
                                    ? `${ocorrenciasSelecionadas.length} Ocorrências no Local`
                                    : 'Detalhes da Ocorrência'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#e74c3c" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={ocorrenciasSelecionadas}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ padding: 10 }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#34495e',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    clusterMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    clusterText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        height: '60%',
        backgroundColor: '#f0f4f7',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    imagePlaceholder: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 15,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 5,
        color: '#34495e'
    },
    cardDesc: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    cardStatus: {
        marginTop: 4,
        color: '#3a86f4',
        fontSize: 14,
        fontWeight: '500',
    },
    cardAuthor: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
    },
});

export default MapaScreen;