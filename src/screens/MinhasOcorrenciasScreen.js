import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { getMinhasOcorrencias, getOcorrenciaFoto, createOcorrencia } from '../api/ocorrencias';
import { getPendingOcorrencias, removeOcorrenciaLocal } from '../localDB';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import OcorrenciaCard from '../components/OcorrenciaCard';
import FilterModal from '../components/FilterModal';
import { CATEGORIES } from '../utils/categories';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  danger: '#E74C3C',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const MinhasOcorrenciasScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('ocorrencias');
  const [ocorrencias, setOcorrencias] = useState([]);
  const [offlineOcorrencias, setOfflineOcorrencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagens, setImagens] = useState({});
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState('all');

  const getCategoryNameById = (id) => CATEGORIES.find(cat => cat.id === id)?.name;

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens(prev => ({ ...prev, [id]: base64 }));
    } catch {}
  };

  const fetchData = async () => {
    if (!userInfo) return;
    setLoading(true);
    try {
      if (activeTab === 'ocorrencias') {
        const params = {
          page: 0,
          size: 50,
          category: categoriaFilter || undefined,
          status: statusFilter || undefined,
        };
        const response = await getMinhasOcorrencias(params);
        let lista = response.data?.data?.content || [];
        setOcorrencias(lista);
        lista.forEach(item => { if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id); });
      }
      const offlineList = await getPendingOcorrencias();
      setOfflineOcorrencias(
        offlineList
          .map(o => ({
            ...o,
            categoryName: CATEGORIES.find(c => c.id === o.categoryId)?.name || 'Offline',
            status: o.syncStatus || 'PENDING',
          }))
          .filter(o => !categoriaFilter || o.categoryId === categoriaFilter)
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [activeTab, userInfo, categoriaFilter, statusFilter]));

  const handleApplyFilters = (newFilters) => {
    setCategoriaFilter(newFilters.category || null);
    if (activeTab === 'ocorrencias') setStatusFilter(newFilters.status || null);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setCategoriaFilter(null);
    if (activeTab === 'ocorrencias') setStatusFilter(null);
  };

  const handleCardPress = (item) => navigation.navigate('DetalheOcorrencia', { id: item.id });

  const sendOfflineOcorrencia = async (ocorrencia) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(ocorrencia.photoUri);
      if (!fileInfo.exists) { Alert.alert("Erro", "Imagem não encontrada."); return; }
      const formData = new FormData();
      formData.append("description", ocorrencia.description);
      formData.append("lat", ocorrencia.lat);
      formData.append("lon", ocorrencia.lon);
      const uriParts = ocorrencia.photoUri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("photo", {
        uri: ocorrencia.photoUri,
        name: `photo.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });
      formData.append("category", ocorrencia.categoryId);
      await createOcorrencia(formData);
      await removeOcorrenciaLocal(ocorrencia.id);
      Alert.alert("Sucesso!", "Ocorrência enviada!");
      fetchData();
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao enviar ocorrência offline.");
    }
  };

  const renderItem = ({ item }) => (
    <OcorrenciaCard
      item={item}
      imagem={imagens[item.id] || item.photoUri}
      onPress={activeTab === 'offline' && item.status === 'PENDING' ? () => sendOfflineOcorrencia(item) : () => handleCardPress(item)}
      texto={activeTab === 'offline' ? "Enviar" : "Ver Detalhes"}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'ocorrencias' && styles.activeTab]} onPress={() => setActiveTab('ocorrencias')}>
            <Text style={[styles.tabText, activeTab === 'ocorrencias' && styles.activeTabText]}>Minhas Ocorrências</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'offline' && styles.activeTab]} onPress={() => setActiveTab('offline')}>
            <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>Offline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterPill} onPress={() => { setActiveFilterType('category'); setFilterModalVisible(true); }}>
            <Text style={styles.filterPillText}>
              Categoria: {getCategoryNameById(categoriaFilter) || 'Todas'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {activeTab === 'ocorrencias' && (
            <TouchableOpacity style={styles.filterPill} onPress={() => { setActiveFilterType('status'); setFilterModalVisible(true); }}>
              <Text style={styles.filterPillText}>
                Status: {statusFilter || 'Todos'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          {(categoriaFilter || statusFilter) && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={activeTab === 'ocorrencias' ? ocorrencias : offlineOcorrencias}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'ocorrencias' ? "Você ainda não registrou ocorrências." : "Nenhuma ocorrência offline pendente."}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialValues={{ category: categoriaFilter, status: statusFilter }}
        categoryOptions={CATEGORIES}
        statusOptions={[
          { label: 'Pendente para Aprovação', value: 'PENDENTE_APROVACAO' },
          { label: 'Aberto', value: 'ABERTO' },
          { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
          { label: 'Finalizado', value: 'FINALIZADO' },
        ]}
        activeFilterType={activeFilterType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 3, borderBottomColor: 'transparent', marginHorizontal: 10 },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
  activeTabText: { color: COLORS.primary },
  list: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 16 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  filterPillText: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginRight: 6 },
  clearButton: { padding: 8 },
  clearButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

export default MinhasOcorrenciasScreen;