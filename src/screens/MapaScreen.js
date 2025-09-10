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
  Platform,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { getOcorrencias, getOcorrenciaFoto } from '../api/ocorrencias';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OcorrenciaCard from '../components/OcorrenciaCard';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const DateSelector = ({ label, date, onChange }) => {
  const [isPickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={{ marginVertical: 4 }}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setPickerVisible(true)}
      >
        <Ionicons name="calendar" size={18} color="#34495e" />
        <Text style={styles.dateText}>
          {date ? date.toLocaleDateString() : label}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="date"
        date={date || new Date()}
        onConfirm={(selectedDate) => {
          onChange(selectedDate);
          setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
};

const MapaScreen = ({ navigation, route }) => {
  const { initialRegion, focoId } = route.params || {};
  const mapRef = useRef(null);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [ocorrenciasSelecionadas, setOcorrenciasSelecionadas] = useState([]);
  const [imagens, setImagens] = useState({});
  const [filterModal, setFilterModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState(null);
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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

          const params = {};
          if (statusFilter) params.status = statusFilter;
          if (categoriaFilter) params.categoria = categoriaFilter;
          if (startDate) params.startDate = startDate.toISOString();
          if (endDate) params.endDate = endDate.toISOString();

          const response = await getOcorrencias(params);
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
    }, [focoId, statusFilter, categoriaFilter, startDate, endDate])
  );

  const abrirLista = (items) => {
    setOcorrenciasSelecionadas(items);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => <OcorrenciaCard item={item} imagem={imagens[item.id]} />;

  const limparFiltros = () => {
    setStatusFilter(null);
    setCategoriaFilter(null);
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          {Platform.OS === 'android' && (
            <UrlTile
              urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png"
              maximumZ={19}
              flipY={false}
              style={{ flex: 1 }}
            />
          )}

          {clusters.map((cluster) =>
            cluster.count > 1 ? (
              <Marker
                key={cluster.clusterId}
                coordinate={{
                  latitude: cluster.lat,
                  longitude: cluster.lon,
                }}
                onPress={() => abrirLista(cluster.items)}
              >
                <View style={styles.clusterMarker}>
                  <Text style={styles.clusterText}>{cluster.count}</Text>
                </View>
              </Marker>
            ) : (
              <Marker
                key={cluster.items[0].id}
                coordinate={{
                  latitude: cluster.items[0].lat,
                  longitude: cluster.items[0].lon,
                }}
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

      {/* Botão flutuante */}
      <View style={[styles.fabContainer, { marginTop: Platform.OS === 'ios' ? 60 : 40 }]}>
        <TouchableOpacity style={styles.fab} onPress={() => setFilterModal(true)}>
          <Ionicons name="filter" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de filtros */}
      <Modal
        visible={filterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setFilterModal(false)}
        >
          <View style={styles.filterContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)}>
                <Ionicons name="close-circle" size={28} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              {['ABERTO', 'EM_ANDAMENTO', 'FINALIZADO'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterOption, statusFilter === s && styles.selectedOption]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.filterOptionText, statusFilter === s && styles.selectedText]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Categoria */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Categoria</Text>
              {['ASSALTO', 'INCÊNDIO', 'ACIDENTE'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterOption, categoriaFilter === c && styles.selectedOption]}
                  onPress={() => setCategoriaFilter(c)}
                >
                  <Text style={[styles.filterOptionText, categoriaFilter === c && styles.selectedText]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Datas */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Período</Text>
              <DateSelector label="Data inicial" date={startDate} onChange={setStartDate} />
              <DateSelector label="Data final" date={endDate} onChange={setEndDate} />
            </View>

            {/* Ações */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearButton} onPress={limparFiltros}>
                <Text style={styles.clearText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setFilterModal(false)}>
                <Text style={styles.applyText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal detalhes ocorrência */}
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

// --- Styles ---
const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a86f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: { color: '#fff', fontWeight: 'bold' },
  fabContainer: { position: 'absolute', right: 20 },
  fab: { backgroundColor: '#3a86f4', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  filterContainer: { backgroundColor: '#fff', borderTopRightRadius: 20, borderTopLeftRadius: 20, padding: 20 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  filterTitle: { fontSize: 20, fontWeight: 'bold' },
  filterGroup: { marginBottom: 15 },
  filterLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  filterOption: { padding: 10, backgroundColor: '#ecf0f1', borderRadius: 8, marginVertical: 4 },
  selectedOption: { backgroundColor: '#3a86f4' },
  filterOptionText: { fontSize: 14, color: '#333' },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  dateButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#ecf0f1', borderRadius: 8 },
  dateText: { marginLeft: 8, color: '#34495e' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  clearButton: { backgroundColor: '#bdc3c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  clearText: { color: '#2c3e50', fontWeight: '600' },
  applyButton: { backgroundColor: '#3a86f4', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  applyText: { color: '#fff', fontWeight: '600' },
  modalContainer: { height: '60%', backgroundColor: '#f0f4f7', borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});

export default MapaScreen;
