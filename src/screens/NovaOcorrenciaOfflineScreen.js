import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Alert, ScrollView,
  TouchableOpacity, Image, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import { insertOcorrenciaLocal } from "../localDB";
import * as Crypto from "expo-crypto";
import { CATEGORIES } from "../utils/categories";

const COLORS = {
  primary: '#0052A4',
  secondary: '#F58220',
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  inactive: '#EAEBEE',
  white: '#FFFFFF',
  danger: '#E74C3C',
};

const NovaOcorrenciaOfflineScreen = ({ navigation }) => {
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc);
      }
      await ImagePicker.requestCameraPermissionsAsync();
    };
    init();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!description || !photo || !location) {
      Alert.alert(
        "Campos Incompletos",
        "Preencha todos os dados e tire uma foto."
      );
      return;
    }
    setLoading(true);
    try {
      const ocorrencia = {
        id: Crypto.randomUUID(),
        description,
        photoUri: photo.uri,
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        categoryId: selectedCategory.id,
        createdAt: new Date().toISOString(),
      };

      await insertOcorrenciaLocal(ocorrencia);
      Alert.alert("Sucesso!", "Ocorrência salva offline!");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar ocorrência offline.");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.headerTitle}>Reportar Ocorrência (Offline)</Text>

          <Text style={styles.sectionTitle}>1. Selecione a Categoria</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat, index) => {
              const isSelected = selectedCategory?.id === cat.id;
              const color = index % 2 === 0 ? COLORS.primary : COLORS.secondary;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, { borderColor: isSelected ? color : COLORS.inactive }]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isSelected ? color : 'transparent' }]}>
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={32}
                      color={isSelected ? COLORS.white : color}
                    />
                  </View>
                  <Text
                    style={[styles.categoryText, { color: isSelected ? color : COLORS.textPrimary }]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>2. Descreva o Problema</Text>
          <TextInput
            style={styles.input}
            placeholder="Descreva o problema..."
            value={description}
            placeholderTextColor="#a9a9a9"
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.sectionTitle}>3. Adicione uma Evidência</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={COLORS.primary} />
                <Text style={styles.imageText}>Tirar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {location ? (
            <Text style={styles.location}>
              Localização capturada: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.location}>Obtendo localização...</Text>
          )}

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <CustomButton title="Salvar Offline" onPress={handleSubmit} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  imagePicker: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.inactive,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 20,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center" },
  imageText: { color: COLORS.primary, fontSize: 16, marginTop: 10, fontWeight: "bold" },
  location: { fontSize: 14, marginTop: 10, color: COLORS.textSecondary },
  buttonContainer: { marginTop: 20 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  categoryItem: {
    flexGrow: 1,
    flexBasis: '30%',
    height: 100,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginBottom: 10,
    marginRight: 10,
    borderWidth: 2
  },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  categoryText: { textAlign: "center", fontSize: 12, fontWeight: "500" },
});

export default NovaOcorrenciaOfflineScreen;
