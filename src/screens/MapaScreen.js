import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getOcorrencias } from '../api/ocorrencias';
import { Ionicons } from '@expo/vector-icons';

const MapaScreen = ({ navigation }) => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [agrupadas, setAgrupadas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [ocorrenciasSelecionadas, setOcorrenciasSelecionadas] = useState([]);

  useEffect(() => {
    const fetchOcorrencias = async () => {
      try {
        const response = await getOcorrencias();
        const lista = response.data?.data?.content || [];
        setOcorrencias(lista);
        agruparOcorrencias(lista);
      } catch (error) {
        console.error('Erro ao carregar mapa:', error.message);
      }
    };
    fetchOcorrencias();
  }, []);

  const agruparOcorrencias = (lista) => {
    const grupos = [];

    lista.forEach((item) => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);

      const grupoExistente = grupos.find(
        (g) =>
          Math.abs(g.lat - lat) < 0.0001 &&
          Math.abs(g.lon - lon) < 0.0001
      );

      if (grupoExistente) {
        grupoExistente.items.push(item);
      } else {
        grupos.push({
          lat,
          lon,
          items: [item],
        });
      }
    });

    setAgrupadas(grupos);
  };

  const abrirLista = (grupo) => {
    setOcorrenciasSelecionadas(grupo.items);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.photoUrl && item.photoUrl !== 'string' ? (
        <Image source={{ uri: item.photoUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>Sem imagem</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{item.categoryName}</Text>
      <Text>{item.description}</Text>
      <Text style={styles.cardStatus}>Status: {item.status}</Text>
      <Text style={styles.cardAuthor}>Por: {item.createdBy}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3a86f4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Ocorrências</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -15.5412,
          longitude: -47.3372,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {agrupadas.map((grupo, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: grupo.lat, longitude: grupo.lon }}
            pinColor={grupo.items.length > 1 ? '#ff5c5c' : '#3a86f4'}
            onPress={() => abrirLista(grupo)}
          />
        ))}
      </MapView>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#3a86f4" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ocorrências na área</Text>
          </View>

          <FlatList
            data={ocorrenciasSelecionadas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20 }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageText: {
    color: '#999',
    fontSize: 14,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardStatus: {
    marginTop: 4,
    color: '#3a86f4',
    fontSize: 12,
  },
  cardAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default MapaScreen;
