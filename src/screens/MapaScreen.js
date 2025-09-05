import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getOcorrencias, getOcorrenciaFoto } from '../api/ocorrencias';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OcorrenciaCard from '../components/OcorrenciaCard';
import { useFocusEffect } from '@react-navigation/native';

const MapaScreen = ({ navigation, route }) => {
  const { initialRegion, focoId } = route.params || {};
  const mapRef = useRef(null);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [ocorrenciasSelecionadas, setOcorrenciasSelecionadas] = useState([]);
  const [imagens, setImagens] = useState({});

  const getDistance = (p1, p2) => {
    const rad = (x) => (x * Math.PI) / 180;
    const R = 6378137;
    const dLat = rad(p2.latitude - p1.latitude);
    const dLong = rad(p2.longitude - p1.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(p1.latitude)) *
        Math.cos(rad(p2.latitude)) *
        Math.sin(dLong / 2) ** 2;
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
          lat: pontos[i].lat,
          lon: pontos[i].lon,
          items: [pontos[i]],
          count: 1,
          statusSet: new Set([pontos[i].status]),
          clusterId: `cluster-${i}`,
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
              novoCluster.statusSet.add(pontos[j].status);
            }
          }
        }
        clustersResult.push(novoCluster);
      }
    }
    return clustersResult;
  };

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens((prev) => ({ ...prev, [id]: base64 }));
    } catch (error) {}
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Não foi possível acessar a localização.');
            return;
          }

          const response = await getOcorrencias();
          const lista = response.data?.data?.content || [];
          setOcorrencias(lista);

          lista.forEach((item) => {
            if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id);
          });

          const clustersCalculados = criarClusters(lista, 200);
          setClusters(clustersCalculados);

          if (focoId) {
            const ocorrenciaFoco = lista.find((o) => o.id === focoId);
            if (ocorrenciaFoco) {
              setOcorrenciasSelecionadas([ocorrenciaFoco]);
              setModalVisible(true);
              if (mapRef.current) {
                setTimeout(() => {
                  mapRef.current.animateToRegion(
                    {
                      latitude: ocorrenciaFoco.lat,
                      longitude: ocorrenciaFoco.lon,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                    1000
                  );
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
    }, [focoId])
  );

  const abrirLista = (items) => {
    setOcorrenciasSelecionadas(items);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <OcorrenciaCard item={item} imagem={imagens[item.id]} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#3a86f4" />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={
            initialRegion || {
              latitude: -15.5286,
              longitude: -47.3383,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }
          }
        >
          {clusters.map((cluster) =>
            cluster.count > 1 ? (
              <Marker
                key={cluster.clusterId}
                coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
                onPress={() => abrirLista(cluster.items)}
              >
                <View
                  style={[
                    styles.clusterMarker,
                    cluster.statusSet.has('ABERTO') && { backgroundColor: 'rgba(231, 76, 60, 0.8)' },
                    cluster.statusSet.has('EM_ANDAMENTO') && { borderColor: '#f1c40f', borderWidth: 3 },
                    cluster.statusSet.has('FINALIZADO') && { borderColor: '#2ecc71', borderWidth: 3 },
                  ]}
                >
                  <Text style={styles.clusterText}>{cluster.count}</Text>
                </View>
              </Marker>
            ) : (
              <Marker
                key={cluster.items[0].id}
                coordinate={{ latitude: cluster.lat, longitude: cluster.lon }}
                pinColor={
                  cluster.items[0].status === 'ABERTO'
                    ? '#e74c3c'
                    : cluster.items[0].status === 'EM_ANDAMENTO'
                    ? '#f1c40f'
                    : '#2ecc71'
                }
                onPress={() => abrirLista(cluster.items)}
              />
            )
          )}
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
              keyExtractor={(item) => item.id.toString()}
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
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
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
  clusterText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { height: '60%', backgroundColor: '#f0f4f7', borderTopRightRadius: 20, borderTopLeftRadius: 20 },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});

export default MapaScreen;
