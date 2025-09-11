import React, { useContext, useState, useCallback } from 'react';
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
import { getOcorrencias, getOcorrenciaFoto } from '../api/ocorrencias';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import OcorrenciaCard from '../components/OcorrenciaCard';
import { CATEGORIES } from '../utils/categories';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  inactive: '#EAEBEE',
  white: '#FFFFFF',
  black: '#000000',
  aberto: '#E74C3C',
  emAndamento: '#F39C12',
  finalizado: '#2ECC71',
};

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [categorias] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [categoriaId, setCategoriaId] = useState(null);
  const [imagens, setImagens] = useState({});

  const statusOptions = [
    { label: 'Todos', value: null, icon: 'check-all' },
    { label: 'Aberto', value: 'ABERTO', icon: 'alert-circle-outline' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO', icon: 'progress-wrench' },
    { label: 'Finalizado', value: 'FINALIZADO', icon: 'check-circle-outline' },
  ];

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

      const lista = Array.isArray(response.data?.data?.content)
        ? response.data.data.content
        : [];
      setOcorrencias(lista);

      lista.forEach((item) => {
        if (item.photoUrl && item.photoUrl !== 'string') {
          fetchImagem(item.id);
        }
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
      fetchOcorrencias({ status, categoryId: categoriaId });
    }, [status, categoriaId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOcorrencias({ status, categoryId: categoriaId });
  };

  const handleCardPress = (item) => {
    navigation.navigate('DetalheOcorrencia', { id: item.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={ocorrencias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OcorrenciaCard
            item={item}
            imagem={imagens[item.id]}
            onPress={() => handleCardPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Bem-vindo(a),</Text>
              <Text style={styles.userName}>{userInfo?.name || 'Cidadão'}</Text>
            </View>
            <View style={styles.filterWrapper}>
              <Text style={styles.filterTitle}>Status da Ocorrência</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {statusOptions.map((option) => (
                  <FilterButton
                    key={option.value || 'todos_status'}
                    label={option.label}
                    value={option.value}
                    icon={option.icon}
                    isActive={status === option.value}
                    onPress={setStatus}
                  />
                ))}
              </ScrollView>
              <Text style={styles.filterTitle}>Categorias</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <FilterButton
                  label="Todas"
                  value={null}
                  isActive={categoriaId === null}
                  onPress={setCategoriaId}
                />
                {categorias.map((cat) => (
                  <FilterButton
                    key={cat.id}
                    label={cat.name}
                    value={cat.id}
                    isActive={categoriaId === cat.id}
                    onPress={setCategoriaId}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify-close" size={60} color="#CBD5E0" />
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
    </SafeAreaView>
  );
};

const FilterButton = ({ label, value, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, isActive && styles.filterButtonActive]}
    onPress={() => onPress(value)}
  >
    {icon && (
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={isActive ? COLORS.white : COLORS.textPrimary}
        style={{ marginRight: 8 }}
      />
    )}
    <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, marginBottom: 100 },
  header: { paddingTop: 10, paddingBottom: 20 },
  title: { fontSize: 18, color: COLORS.textSecondary },
  userName: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary },
  filterWrapper: { paddingBottom: 10 },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 10,
  },
  filterScroll: { paddingVertical: 4 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: { backgroundColor: COLORS.primary, borderWidth: 0 },
  filterButtonText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  filterButtonTextActive: { color: COLORS.white },
  list: { paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 20 },
  emptySubtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 248, 250, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
