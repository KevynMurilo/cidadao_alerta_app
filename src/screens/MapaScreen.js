import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useFocusEffect } from '@react-navigation/native';

import { getOcorrenciaClusters, getOcorrenciaFoto } from '../api/ocorrencias';
import OcorrenciaCard from '../components/OcorrenciaCard';
import { CATEGORIES } from '../utils/categories'; 

const DateSelector = ({ label, date, onChange }) => {
  const [isPickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={{ marginVertical: 2 }}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setPickerVisible(true)}
      >
        <Ionicons name="calendar" size={18} color="#34495e" />
        <Text style={styles.dateText}>{date ? date.toLocaleDateString() : label}</Text>
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

const MapaScreen = ({ navigation }) => {
  const webViewRef = useRef(null);

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [ocorrenciasSelecionadas, setOcorrenciasSelecionadas] = useState([]);
  const [imagens, setImagens] = useState({});

  const [statusFilter, setStatusFilter] = useState(null);
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [tempStatusFilter, setTempStatusFilter] = useState(null);
  const [tempCategoriaFilter, setTempCategoriaFilter] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const [filterModal, setFilterModal] = useState(false);
  const [isWebviewReady, setWebviewReady] = useState(false);

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      if (base64?.length < 500000) {
        setImagens((prev) => ({ ...prev, [id]: base64 }));
      }
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          await Location.requestForegroundPermissionsAsync();

          const params = { radiusMeters: 200 };
          if (statusFilter) params.status = statusFilter;
          if (categoriaFilter) params.category = categoriaFilter;
          if (startDate) params.startDate = startDate.toISOString();
          if (endDate) params.endDate = endDate.toISOString();

          const response = await getOcorrenciaClusters(params);
          const lista = response.data?.data || [];

          lista.forEach((cluster) => {
            cluster.items.forEach((item) => {
              if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id);
            });
          });

          setClusters(lista);
        } catch (error) {
          Alert.alert('Erro ao carregar mapa', error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [statusFilter, categoriaFilter, startDate, endDate])
  );

  useEffect(() => {
    if (isWebviewReady && webViewRef.current && clusters) {
      const script = `
        if (window.addMarkers) {
          window.addMarkers(${JSON.stringify(clusters)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [clusters, isWebviewReady]);

  const abrirLista = (items) => {
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    if (parsedItems && parsedItems.length > 0) {
      setOcorrenciasSelecionadas(parsedItems);
      setModalVisible(true);
    }
  };

  const renderItem = ({ item }) => <OcorrenciaCard item={item} imagem={imagens[item.id]} />;

  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setCategoriaFilter(tempCategoriaFilter);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setFilterModal(false);
  };

  const limparFiltros = () => {
    setTempStatusFilter(null);
    setTempCategoriaFilter(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setStatusFilter(null);
    setCategoriaFilter(null);
    setStartDate(null);
    setEndDate(null);
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <style>
        body, #map { margin:0; padding:0; width:100vw; height:100vh; background-color:#f0f4f7; }
        .custom-cluster-icon { background-color:#3a86f4; border-radius:50%; width:40px!important; height:40px!important; display:flex; justify-content:center; align-items:center; border:2px solid white; }
        .custom-cluster-icon span { color:white; font-weight:bold; font-size:16px; font-family:sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([-15.5369, -47.3316], 14);
        L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png?api_key=742a8424-247b-47d7-afb6-1e523dc5777a', { maxZoom:19 }).addTo(map);
        let markers = [];
        window.addMarkers = function(clusters){
          markers.forEach(m => map.removeLayer(m));
          markers = [];
          clusters.forEach(c=>{
            const latLng=[c.lat,c.lon];
            let marker;
            if(c.count>1){
              const icon=L.divIcon({ className:'custom-cluster-icon', html:'<div><span>'+c.count+'</span></div>', iconSize:[40,40] });
              marker=L.marker(latLng,{icon});
            }else{
              marker=L.marker(latLng);
            }
            marker.on('click',()=>{ window.ReactNativeWebView.postMessage(JSON.stringify(c.items)) });
            marker.addTo(map);
            markers.push(marker);
          });
        };
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.map}
          originWhitelist={['*']}
          onMessage={(event) => abrirLista(event.nativeEvent.data)}
          onLoadEnd={() => setWebviewReady(true)}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3a86f4" />
          </View>
        )}

        {/* Botão azul superior direito */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={() => setFilterModal(true)}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Modal de filtros */}
        <Modal
          visible={filterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterContainer}>
              <ScrollView>
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
                      style={[styles.filterOption, tempStatusFilter === s && styles.selectedOption]}
                      onPress={() => setTempStatusFilter(s)}
                    >
                      <Text style={[styles.filterOptionText, tempStatusFilter === s && styles.selectedText]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Categoria</Text>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.filterOption, tempCategoriaFilter === c.id && styles.selectedOption]}
                      onPress={() => setTempCategoriaFilter(c.id)}
                    >
                      <Text style={[styles.filterOptionText, tempCategoriaFilter === c.id && styles.selectedText]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Período */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Período</Text>
                  <DateSelector label="Data inicial" date={tempStartDate} onChange={setTempStartDate} />
                  <DateSelector label="Data final" date={tempEndDate} onChange={setTempEndDate} />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.clearButton} onPress={limparFiltros}>
                    <Text style={styles.clearText}>Limpar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                    <Text style={styles.applyText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de ocorrências */}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
  },
  fab: {
    backgroundColor: '#3a86f4',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  filterContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 15,
  },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  filterTitle: { fontSize: 20, fontWeight: 'bold' },
  filterGroup: { marginBottom: 12 },
  filterLabel: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  filterOption: { padding: 10, backgroundColor: '#ecf0f1', borderRadius: 8, marginVertical: 3 },
  selectedOption: { backgroundColor: '#3a86f4' },
  filterOptionText: { fontSize: 14, color: '#333' },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  dateButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#ecf0f1', borderRadius: 8, marginVertical: 3 },
  dateText: { marginLeft: 6, color: '#34495e' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  clearButton: { backgroundColor: '#bdc3c7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  applyButton: { backgroundColor: '#3a86f4', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  clearText: { color: '#2c3e50', fontWeight: '600' },
  applyText: { color: '#fff', fontWeight: 'bold' },
  modalContainer: { height: '60%', backgroundColor: '#f0f4f7', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});

export default MapaScreen;
