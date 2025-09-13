import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getOcorrencias, getOcorrenciaFoto } from '../api/ocorrencias';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import OcorrenciaCard from '../components/OcorrenciaCard';
import { CATEGORIES } from '../utils/categories';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterModal from '../components/FilterModal';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const ListItemSeparator = () => <View style={styles.separator} />;

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imagens, setImagens] = useState({});

  const [statusFilter, setStatusFilter] = useState(null);
  const [categoriaIdFilter, setCategoriaIdFilter] = useState(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState('all');

  const statusOptions = [
    { label: 'Aberto', value: 'ABERTO' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
  ];

  const getCategoryNameById = (id) => {
    if (!id) return null;
    return CATEGORIES.find((cat) => cat.id === id)?.name;
  };

  const formatStatus = (status) => {
    if (!status) return 'Todos';
    return status.replace('_', ' ');
  };

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens((prev) => ({ ...prev, [id]: base64 }));
    } catch (error) {}
  };

  const fetchOcorrencias = async (filters = {}) => {
    try {
      if (!refreshing) setLoading(true);
      const response = await getOcorrencias({
        status: filters.status || null,
        category: filters.categoryId || null,
        sort: 'createdAt,desc',
      });
      const lista = response.data?.data?.content || [];
      setOcorrencias(lista);
      lista.forEach((item) => {
        if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id);
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOcorrencias({ status: statusFilter, categoryId: categoriaIdFilter });
    }, [statusFilter, categoriaIdFilter])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOcorrencias({ status: statusFilter, categoryId: categoriaIdFilter });
  };

  const handleViewOnMap = (item) => {
    if (item.lat && item.lon) {
      navigation.navigate('Mapa', { singleOcorrencia: item });
    } else {
      Alert.alert('Localização indisponível', 'Esta ocorrência não possui coordenadas para ser exibida no mapa.');
    }
  };

  const openModalWithType = (type) => {
    setActiveFilterType(type);
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters) => {
    setStatusFilter(newFilters.status || null);
    setCategoriaIdFilter(newFilters.category || null);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setStatusFilter(null);
    setCategoriaIdFilter(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Feed de Ocorrências</Text>
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => openModalWithType('status')}
          >
            <Text style={styles.filterPillText}>
              Status: {formatStatus(statusFilter)}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => openModalWithType('category')}
          >
            <Text style={styles.filterPillText}>
              Categoria: {getCategoryNameById(categoriaIdFilter) || 'Todas'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          {(statusFilter || categoriaIdFilter) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          data={ocorrencias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <OcorrenciaCard
              item={item}
              imagem={imagens[item.id]}
              onPress={() => handleViewOnMap(item)}
              texto="Ver no Mapa"
              iconName="map-marker-outline"
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={ListItemSeparator}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="magnify-close"
                  size={60}
                  color="#CBD5E0"
                />
                <Text style={styles.emptyTitle}>Nenhuma Ocorrência</Text>
                <Text style={styles.emptySubtitle}>
                  Não encontramos ocorrências com os filtros selecionados.
                </Text>
              </View>
            )
          }
        />
        {loading && !refreshing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialValues={{ status: statusFilter, category: categoriaIdFilter }}
        statusOptions={statusOptions}
        categoryOptions={CATEGORIES}
        activeFilterType={activeFilterType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingBottom: 10,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
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
    marginBottom: 8,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  clearButton: { padding: 8 },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 },
  separator: { height: 16 },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 248, 250, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;