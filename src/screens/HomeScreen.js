import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getOcorrencias } from '../api/ocorrencias';
import { getCategorias } from '../api/categoria';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [categoriaId, setCategoriaId] = useState(null);

  const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Aberto', value: 'ABERTO' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
  ];

  const fetchOcorrencias = async (filters = {}) => {
    try {
      if (!refreshing) setLoading(true);

      const response = await getOcorrencias({
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        sort: 'createdAt,desc',
      });

      const lista = Array.isArray(response.data?.data?.content)
        ? response.data.data.content
        : [];
      setOcorrencias(lista);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências.');
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await getCategorias();
      const lista = response.data?.data?.content;
      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.log('Erro ao buscar categorias:', error);
      setCategorias([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategorias();
      fetchOcorrencias({ status, categoryId: categoriaId });
    }, [status, categoriaId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOcorrencias({ status, categoryId: categoriaId });
  };

  const handleCardPress = (item) => {
    if (item.lat && item.lon && item.lat !== 0 && item.lon !== 0) {
      navigation.navigate('Mapa', {
        initialRegion: {
          latitude: item.lat,
          longitude: item.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        focoId: item.id,
      });
    } else {
      Alert.alert(
        'Localização Indisponível',
        'Esta ocorrência não possui dados de localização para ser exibida no mapa.'
      );
    }
  };

  const statusConfig = {
    ABERTO: { color: '#e74c3c', icon: 'alert-circle-outline', text: 'Aberto' },
    EM_ANDAMENTO: {
      color: '#f39c12',
      icon: 'progress-wrench',
      text: 'Em Andamento',
    },
    FINALIZADO: {
      color: '#2ecc71',
      icon: 'check-circle-outline',
      text: 'Finalizado',
    },
  };

  const renderItem = ({ item }) => {
    const config =
      statusConfig[item.status] || {
        color: '#95a5a6',
        icon: 'help-circle-outline',
        text: item.status,
      };
    const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-BR');

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
        {item.photoUrl && item.photoUrl !== 'string' ? (
          <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <MaterialCommunityIcons
              name="image-off-outline"
              size={40}
              color="#bdc3c7"
            />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardCategory}>{item.categoryName}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons
                name={config.icon}
                size={16}
                color={config.color}
              />
              <Text style={[styles.cardStatus, { color: config.color }]}>
                {config.text}
              </Text>
            </View>
            <Text style={styles.cardDate}>{dataFormatada}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo(a),</Text>
        <Text style={styles.userName}>{userInfo?.name || 'Cidadão'}</Text>
      </View>

      <View style={styles.filterWrapper}>
        <Text style={styles.filterTitle}>Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value || 'todos'}
              style={[
                styles.filterButton,
                status === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setStatus(option.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  status === option.value && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>Categorias</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              categoriaId === null && styles.filterButtonActive,
            ]}
            onPress={() => setCategoriaId(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                categoriaId === null && styles.filterButtonTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterButton,
                categoriaId === cat.id && styles.filterButtonActive,
              ]}
              onPress={() => setCategoriaId(cat.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  categoriaId === cat.id && styles.filterButtonTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listWrapper}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3a86f4" style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={ocorrencias}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={50}
                  color="#bdc3c7"
                />
                <Text style={styles.empty}>Nenhuma ocorrência encontrada.</Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  title: { fontSize: 18, color: '#666' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#34495e' },
  filterWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3a86f4',
  },
  filterButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listWrapper: { flex: 1 },
  list: { paddingVertical: 10, paddingHorizontal: 20, flexGrow: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    height: 150,
    width: '100%',
  },
  cardImagePlaceholder: {
    height: 150,
    width: '100%',
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { padding: 15 },
  cardCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 5,
  },
  cardDesc: { fontSize: 15, color: '#555', lineHeight: 22, minHeight: 44 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#f0f4f7',
  },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  cardStatus: { fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  cardDate: { fontSize: 14, color: '#7f8c8d' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
});

export default HomeScreen;
