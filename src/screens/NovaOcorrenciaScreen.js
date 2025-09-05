import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, Alert, ScrollView,
    TouchableOpacity, Image, TextInput, ActivityIndicator, Linking,
    KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { createOcorrencia } from '../api/ocorrencias';
import { CATEGORIES } from '../utils/categories';

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

const NovaOcorrenciaScreen = ({ navigation }) => {
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);

    useEffect(() => {
        let locationSubscription;

        const init = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setHasLocationPermission(status === 'granted');

                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraStatus !== 'granted') {
                    Alert.alert(
                        'Permissões Necessárias',
                        'O acesso à câmera é essencial. Por favor, habilite nas configurações.',
                        [{ text: 'Abrir Configurações', onPress: () => Linking.openSettings() }]
                    );
                }

                if (status === 'granted') {
                    locationSubscription = await Location.watchPositionAsync(
                        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
                        (currentLocation) => setLocation(currentLocation)
                    );
                }
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível inicializar.');
            } finally {
                setInitialLoading(false);
            }
        };

        init();

        return () => {
            if (locationSubscription) locationSubscription.remove();
        };
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

    const handleLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão Necessária',
                'Você precisa permitir acesso à localização nas configurações.',
                [{ text: 'Abrir Configurações', onPress: () => Linking.openSettings() }]
            );
            setHasLocationPermission(false);
            return;
        }
        setHasLocationPermission(true);
        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(currentLocation);
    };

    const handleSubmit = async () => {
        if (!description || !photo || !location || !selectedCategory) {
            Alert.alert('Campos Incompletos', 'Por favor, descreva o problema, tire uma foto e selecione uma categoria.');
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        formData.append('lat', location.coords.latitude);
        formData.append('lon', location.coords.longitude);
        formData.append('category', selectedCategory.id);

        const uriParts = photo.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('photo', {
            uri: photo.uri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
        });

        try {
            await createOcorrencia(formData);
            Alert.alert('Sucesso!', 'Ocorrência registrada com sucesso!');
            navigation.navigate('Início');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar a ocorrência.');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Carregando...</Text>
            </SafeAreaView>
        );
    }

    const { width } = Dimensions.get('window');

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Reportar Ocorrência</Text>
                        <Text style={styles.headerSubtitle}>Preencha os detalhes abaixo</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Tipo de Ocorrência</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((cat, index) => {
                                const isSelected = selectedCategory?.id === cat.id;
                                const color = index % 2 === 0 ? COLORS.primary : COLORS.secondary;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryItem,
                                            { borderColor: isSelected ? color : COLORS.inactive }
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: isSelected ? color : 'transparent' }
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={cat.icon}
                                                size={32}
                                                color={isSelected ? COLORS.white : color}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                { color: isSelected ? color : COLORS.textPrimary }
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Descreva o Problema</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Buraco grande na rua principal..."
                            placeholderTextColor="#a9a9a9"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <View style={styles.section}>
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
                    </View>

                    {!hasLocationPermission ? (
                        <View style={styles.permissionWarning}>
                            <Text style={styles.permissionText}>Permissão de localização necessária.</Text>
                            <TouchableOpacity style={styles.permissionButton} onPress={handleLocationPermission}>
                                <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.locationContainer}>
                            <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={COLORS.textSecondary} />
                            {location ? (
                                <Text style={styles.location}>
                                    Localização capturada: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
                                </Text>
                            ) : (
                                <Text style={styles.location}>Obtendo localização...</Text>
                            )}
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        {loading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        ) : (
                            <CustomButton title="Enviar Ocorrência" onPress={handleSubmit} />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textPrimary },
    content: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingVertical: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
    headerSubtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 15 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryItem: { width: 100, height: 100, backgroundColor: COLORS.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8, marginBottom: 10, borderWidth: 2 },
    iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    categoryText: { textAlign: 'center', fontSize: 12, fontWeight: '500' },
    input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderColor: COLORS.inactive, borderWidth: 1, color: COLORS.textPrimary },
    imagePicker: { backgroundColor: COLORS.card, borderRadius: 12, height: 200, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.inactive, borderStyle: 'dashed', overflow: 'hidden' },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center' },
    imageText: { color: COLORS.primary, fontSize: 16, marginTop: 10, fontWeight: 'bold' },
    locationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginHorizontal: 20, marginTop: 20, backgroundColor: COLORS.inactive, borderRadius: 12 },
    location: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8, fontWeight: '500' },
    buttonContainer: { marginTop: 30, paddingHorizontal: 20, paddingBottom: 80 },
    permissionWarning: { backgroundColor: '#fff3cd', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20, marginHorizontal: 20 },
    permissionText: { color: '#856404', fontSize: 14, textAlign: 'center', marginBottom: 10 },
    permissionButton: { backgroundColor: '#ffc107', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    permissionButtonText: { color: '#212529', fontWeight: 'bold' },
});

export default NovaOcorrenciaScreen;
