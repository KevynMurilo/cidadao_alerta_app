import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { getCategorias } from '../api/categoria';
import { createOcorrencia } from '../api/ocorrencias';
import { AuthContext } from '../context/AuthContext';

const NovaOcorrenciaScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await getCategorias();
        const lista = response.data?.data?.content || [];
        setCategorias(lista);
        if (lista.length > 0) setCategoriaId(lista[0].id);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error.message);
      }
    };

    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar a localização.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLat(location.coords.latitude);
      setLon(location.coords.longitude);
    };

    fetchCategorias();
    fetchLocation();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Você precisa permitir acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.IMAGE,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!description || !photo || !lat || !lon || !categoriaId) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione uma imagem.');
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('lat', lat);
    formData.append('lon', lon);
    formData.append('categoryId', categoriaId);
    formData.append('photo', {
      uri: photo.uri,
      name: 'foto.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await createOcorrencia(formData);
      Alert.alert('Sucesso', 'Ocorrência registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error.message);
      Alert.alert('Erro', 'Não foi possível registrar a ocorrência.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#3a86f4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Ocorrência</Text>
        </View>

        <CustomInput
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imageText}>Tirar Foto</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoryList}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                categoriaId === cat.id && styles.categoryItemSelected,
              ]}
              onPress={() => setCategoriaId(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  categoriaId === cat.id && styles.categoryTextSelected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.location}>
          Localização: {lat?.toFixed(5)}, {lon?.toFixed(5)}
        </Text>

        <CustomButton title="Registrar Ocorrência" onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  label: { fontSize: 16, marginBottom: 10, marginTop: 10 },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    marginBottom: 10,
  },
  categoryItemSelected: {
    backgroundColor: '#3a86f4',
    borderColor: '#3a86f4',
  },
  categoryText: { fontSize: 14, color: '#333' },
  categoryTextSelected: { color: '#fff', fontWeight: 'bold' },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageText: {
    color: '#3a86f4',
    fontSize: 16,
  },
});

export default NovaOcorrenciaScreen;
