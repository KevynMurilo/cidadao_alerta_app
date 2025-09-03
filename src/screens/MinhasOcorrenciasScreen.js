import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMinhasOcorrencias, getOcorrenciaFoto, createOcorrencia } from '../api/ocorrencias';
import { getPendingOcorrencias, removeOcorrenciaLocal } from '../localDB';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  danger: '#E74C3C',
  success: '#27AE60',
};

const categoriasFixas = [
  { id: "uuid-1", name: "Acidente" },
  { id: "uuid-2", name: "Interferência" },
  { id: "uuid-3", name: "Semáforo" },
  { id: "uuid-4", name: "Óleo" },
  { id: "uuid-5", name: "Veículo Quebrado" },
  { id: "uuid-6", name: "Estacionamento" },
  { id: "uuid-7", name: "Sinalização" },
  { id: "uuid-8", name: "Iluminação" },
];

const MinhasOcorrenciasScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('ocorrencias');
  const [ocorrencias, setOcorrencias] = useState([]);
  const [offlineOcorrencias, setOfflineOcorrencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagens, setImagens] = useState({});

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens(prev => ({ ...prev, [id]: base64 }));
    } catch (error) {
    }
  };

  const fetchData = async (tab) => {
    if (!userInfo) return;
    setLoading(true);
    try {
      if (tab === 'ocorrencias') {
        const response = await getMinhasOcorrencias();
        const lista = Array.isArray(response.data?.data?.content)
          ? response.data.data.content
          : [];
        setOcorrencias(lista);

        const offlineList = await getPendingOcorrencias();
        setOfflineOcorrencias(
          offlineList.map(o => ({
            ...o,
            categoryName: categoriasFixas.find(c => c.id === o.categoryId)?.name || 'Offline',
            status: o.syncStatus || 'PENDING',
          }))
        );

        lista.forEach(item => {
          if (item.photoUrl && item.photoUrl !== 'string') fetchImagem(item.id);
        });

      } else if (tab === 'offline') {
        const offlineList = await getPendingOcorrencias();
        setOfflineOcorrencias(
          offlineList.map(o => ({
            ...o,
            categoryName: categoriasFixas.find(c => c.id === o.categoryId)?.name || 'Offline',
            status: o.syncStatus || 'PENDING',
          }))
        );
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData(activeTab);
  }, [activeTab, userInfo]));

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

  const sendOfflineOcorrencia = async (ocorrencia) => {
    try {
      const formData = new FormData();
      formData.append("description", ocorrencia.description || '');
      formData.append("lat", ocorrencia.lat);
      formData.append("lon", ocorrencia.lon);

      const uriParts = ocorrencia.photoUri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("photo", {
        uri: ocorrencia.photoUri.replace("file://", ""),
        name: `photo.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const isValidUUID = (str) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);

      if (ocorrencia.categoryId && isValidUUID(ocorrencia.categoryId)) {
        formData.append("categoryId", ocorrencia.categoryId);
      } 

      await createOcorrencia(formData);

      await removeOcorrenciaLocal(ocorrencia.id);
      Alert.alert("Sucesso!", "Ocorrência enviada!");
      fetchData('offline');
      fetchData('ocorrencias');
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar ocorrência offline. Veja logs no console.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
      <Image
        source={{ uri: imagens[item.id] || item.photoUri }}
        style={styles.image}
      />
      <View style={styles.cardContent}>
        <Text style={styles.category}>{item.categoryName}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={[styles.status, item.status === 'PENDING' ? { color: COLORS.danger } : { color: COLORS.success }]}>
          {item.status === 'PENDING' ? 'Pendente' : 'Enviado'}
        </Text>

        {activeTab === 'offline' && item.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => sendOfflineOcorrencia(item)}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const ListEmptyComponent = ({ message }) => (
    <View style={styles.emptyContainer}>
      <Text style={{ textAlign: 'center', color: COLORS.textSecondary, fontSize: 16 }}>
        {message}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ocorrencias' && styles.activeTab]}
          onPress={() => setActiveTab('ocorrencias')}
        >
          <Text style={[styles.tabText, activeTab === 'ocorrencias' && styles.activeTabText]}>
            Ocorrências
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'offline' && styles.activeTab]}
          onPress={() => setActiveTab('offline')}
        >
          <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>
            Offline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={activeTab === 'ocorrencias' ? ocorrencias : offlineOcorrencias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ListEmptyComponent
              message={
                activeTab === 'ocorrencias'
                  ? "Você ainda não registrou ocorrências."
                  : "Nenhuma ocorrência offline pendente."
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 10,
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
  activeTabText: { color: COLORS.primary },
  list: { padding: 20, flexGrow: 1 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 15,
  },
  category: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: COLORS.textPrimary,
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.card,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MinhasOcorrenciasScreen;
