import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMinhasOcorrencias, getOcorrenciaFoto, createOcorrencia } from '../api/ocorrencias';
import { getPendingOcorrencias, removeOcorrenciaLocal } from '../localDB';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES } from '../utils/categories';
import * as FileSystem from 'expo-file-system';
import OcorrenciaCard from '../components/OcorrenciaCard';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  danger: '#E74C3C',
  success: '#27AE60',
  white: '#FFFFFF',
};

const MinhasOcorrenciasScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('ocorrencias');
  const [ocorrencias, setOcorrencias] = useState([]);
  const [offlineOcorrencias, setOfflineOcorrencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState(null);
  const [imagens, setImagens] = useState({});

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens(prev => ({ ...prev, [id]: base64 }));
    } catch {}
  };

  const fetchData = async (tab) => {
    if (!userInfo) return;
    setLoading(true);
    try {
      if (tab === 'ocorrencias') {
        const params = { page: 0, size: 50, category: categoriaFilter || undefined };
        const response = await getMinhasOcorrencias(params);
        let lista = Array.isArray(response.data?.data?.content) ? response.data.data.content : [];
        setOcorrencias(lista);
        lista.forEach(item => { if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id); });
        const offlineList = await getPendingOcorrencias();
        setOfflineOcorrencias(
          offlineList.map(o => ({
            ...o,
            categoryName: CATEGORIES.find(c => c.id === o.categoryId)?.name || 'Offline',
            status: o.syncStatus || 'PENDING',
          }))
        );
      } else if (tab === 'offline') {
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
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(activeTab); }, [activeTab, userInfo, categoriaFilter]));

  const handleCardPress = (item) => {
    navigation.navigate('DetalheOcorrencia', { id: item.id });
  };

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
      fetchData('offline');
      fetchData('ocorrencias');
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao enviar ocorrência offline.");
    }
  };

  const renderItem = ({ item }) => (
    <OcorrenciaCard
      item={item}
      imagem={imagens[item.id] || item.photoUri}
      onPress={activeTab === 'offline' && item.status === 'PENDING'
        ? () => sendOfflineOcorrencia(item)
        : () => handleCardPress(item)
      }
      texto={activeTab === 'offline' ? "Enviar" : "Ver Detalhes"}
    />
  );

  const FilterButton = ({ label, value, icon, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => onPress(value)}
    >
      {icon && <MaterialCommunityIcons name={icon} size={18} color={isActive ? COLORS.white : COLORS.textPrimary} style={{ marginRight: 8 }} />}
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { marginTop: Platform.OS === 'ios' ? 0 : 40 }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ocorrencias' && styles.activeTab]} onPress={() => setActiveTab('ocorrencias')}>
          <Text style={[styles.tabText, activeTab === 'ocorrencias' && styles.activeTabText]}>Minhas Ocorrências</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'offline' && styles.activeTab]} onPress={() => setActiveTab('offline')}>
          <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>Offline</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrapper}>
        <Text style={styles.filterTitle}>Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterButton label="Todas" value={null} isActive={categoriaFilter === null} onPress={setCategoriaFilter} />
          {CATEGORIES.map(cat => (
            <FilterButton
              key={cat.id}
              label={cat.name}
              value={cat.id}
              icon={cat.icon}
              isActive={categoriaFilter === cat.id}
              onPress={setCategoriaFilter}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={activeTab === 'ocorrencias' ? ocorrencias : offlineOcorrencias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ textAlign: 'center', color: COLORS.textSecondary, fontSize: 16 }}>
                {activeTab === 'ocorrencias' ? "Você ainda não registrou ocorrências." : "Nenhuma ocorrência offline pendente."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10 },
  tab: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 3, borderBottomColor: 'transparent', marginHorizontal: 10 },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
  activeTabText: { color: COLORS.primary },
  list: { padding: 20, flexGrow: 1 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  filterWrapper: { paddingBottom: 10, paddingHorizontal: 20 },
  filterTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12, marginTop: 15 },
  filterScroll: { paddingVertical: 4 },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  filterButtonActive: { backgroundColor: COLORS.primary, borderWidth: 0 },
  filterButtonText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  filterButtonTextActive: { color: COLORS.white },
});

export default MinhasOcorrenciasScreen;
