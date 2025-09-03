import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getMinhasOcorrencias, getOcorrenciaFoto } from '../api/ocorrencias';
import { getHistoricoSincronizacao } from '../api/sincronizacao';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import OcorrenciaCard from '../components/OcorrenciaCard';

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

const MinhasOcorrenciasScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('ocorrencias');
  const [ocorrencias, setOcorrencias] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagens, setImagens] = useState({});

  const fetchImagem = async (id) => {
    try {
      const base64 = await getOcorrenciaFoto(id);
      setImagens((prev) => ({ ...prev, [id]: base64 }));
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

        lista.forEach((item) => {
          if (item.photoUrl && item.photoUrl !== 'string') {
            fetchImagem(item.id);
          }
        });

      } else {
        const response = await getHistoricoSincronizacao(userInfo.id ?? userInfo.userId);
        const lista = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setHistorico(lista);
      }
    } catch (error) {
      // console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(activeTab);
    }, [activeTab, userInfo])
  );

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

  const renderOcorrenciaItem = ({ item }) => (
    <OcorrenciaCard
      item={item}
      imagem={imagens[item.id]}
      onPress={() => handleCardPress(item)}
    />
  );

  const renderHistoricoItem = ({ item }) => (
    <View style={styles.historyCard}>
      <MaterialCommunityIcons
        name={item.success ? 'check-circle' : 'alert-circle'}
        size={30}
        color={item.success ? COLORS.finalizado : COLORS.aberto}
      />
      <View style={styles.historyTextContainer}>
        <Text style={styles.historyText}>
          Sincronização {item.success ? 'bem-sucedida' : 'falhou'}
        </Text>
        <Text style={styles.historyDate}>
          {new Date(item.syncDate).toLocaleString('pt-BR')}
        </Text>
      </View>
    </View>
  );

  const ListEmptyComponent = ({ message }) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="information-outline" size={50} color="#bdc3c7" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          style={[styles.tab, activeTab === 'historico' && styles.activeTab]}
          onPress={() => setActiveTab('historico')}
        >
          <Text style={[styles.tabText, activeTab === 'historico' && styles.activeTabText]}>
            Histórico de Sync
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color={COLORS.primary} />
      ) : activeTab === 'ocorrencias' ? (
        <FlatList
          data={ocorrencias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOcorrenciaItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ListEmptyComponent message="Você ainda não registrou ocorrências." />}
        />
      ) : (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHistoricoItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ListEmptyComponent message="Nenhum histórico de sincronização." />}
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
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyTextContainer: { marginLeft: 15, flex: 1 },
  historyText: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
  historyDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: COLORS.textSecondary },
});

export default MinhasOcorrenciasScreen;
