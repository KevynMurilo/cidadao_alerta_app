import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, Alert, ScrollView,
    TouchableOpacity, Image, TextInput, ActivityIndicator, Linking,
    Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { getCategorias } from '../api/categoria';
import { createOcorrencia } from '../api/ocorrencias';

const NovaOcorrenciaScreen = ({ navigation }) => {
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const requestPermissionsAndFetchData = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setHasLocationPermission(true);
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        } else {
            setHasLocationPermission(false);
        }

        try {
            const response = await getCategorias();
            const lista = response.data?.data?.content ?? response.data?.data ?? [];
            setCategorias(lista);
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            Alert.alert('Erro de Rede', 'Não foi possível carregar as categorias.');
        }
    };

    useEffect(() => {
        requestPermissionsAndFetchData();
    }, []);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert(
                'Permissão Necessária',
                'Você precisa de permitir o acesso à câmera nas configurações do seu dispositivo.',
                [{ text: 'OK' }, { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }]
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setPhoto(result.assets[0]);
        }
    };
    
    const handleLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setHasLocationPermission(true);
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        } else {
            Alert.alert(
                'Permissão Necessária',
                'Você precisa de permitir o acesso à localização nas configurações do seu dispositivo.',
                [{ text: 'OK' }, { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }]
            );
        }
    };

    const handleSubmit = async () => {
        if (!description || !photo || !location || !selectedCategory) {
            Alert.alert('Campos em falta', 'Por favor, preencha todos os campos, selecione uma categoria e tire uma foto.');
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        formData.append('lat', location.coords.latitude);
        formData.append('lon', location.coords.longitude);
        formData.append('categoryId', selectedCategory.id);

        const uriParts = photo.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('photo', {
            uri: photo.uri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
        });

        try {
            await createOcorrencia(formData);
            Alert.alert('Sucesso!', 'Ocorrência registada com sucesso!');
            // Ao submeter, volta para a tela inicial
            navigation.navigate('Início');
        } catch (error) {
            console.error('Erro ao registar ocorrência:', error);
            Alert.alert('Erro', 'Não foi possível registar a sua ocorrência.');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = useMemo(() => {
        if (!categorySearch) {
            return categorias;
        }
        return categorias.filter(cat => 
            cat.name.toLowerCase().includes(categorySearch.toLowerCase())
        );
    }, [categorySearch, categorias]);


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Descreva o Problema</Text>
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
                        <Text style={styles.sectionTitle}>2. Adicione uma Evidência</Text>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {photo ? (
                                <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera" size={40} color="#3a86f4" />
                                    <Text style={styles.imageText}>Tirar Foto</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Selecione a Categoria</Text>
                        <TouchableOpacity style={styles.categorySelector} onPress={() => setCategoryModalVisible(true)}>
                            <Text style={selectedCategory ? styles.categorySelectedText : styles.categoryPlaceholder}>
                                {selectedCategory ? selectedCategory.name : 'Clique para selecionar...'}
                            </Text>
                            <Ionicons name="chevron-down" size={24} color="#34495e" />
                        </TouchableOpacity>
                    </View>

                    {!hasLocationPermission ? (
                        <View style={styles.permissionWarning}>
                            <Text style={styles.permissionText}>A permissão de localização é necessária.</Text>
                            <TouchableOpacity style={styles.permissionButton} onPress={handleLocationPermission}>
                                <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.locationContainer}>
                            <MaterialCommunityIcons name="map-marker-radius" size={16} color="#7f8c8d" />
                            {location ? (
                                <Text style={styles.location}>
                                    Localização capturada: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                                </Text>
                            ) : (
                                <Text style={styles.location}>A obter localização...</Text>
                            )}
                        </View>
                    )}
                    
                    <View style={{marginTop: 20, paddingBottom: 80}}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#3a86f4" />
                        ) : (
                            <CustomButton title="Enviar Ocorrência" onPress={handleSubmit} />
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={isCategoryModalVisible}
                animationType="slide"
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Selecione uma Categoria</Text>
                        <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                            <Ionicons name="close-circle" size={30} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Pesquisar categoria..."
                            placeholderTextColor="#a9a9a9"
                            value={categorySearch}
                            onChangeText={setCategorySearch}
                        />
                    </View>
                    <FlatList
                        data={filteredCategories}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedCategory(item);
                                    setCategoryModalVisible(false);
                                    setCategorySearch('');
                                }}
                            >
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#3a86f4" />
                                <Text style={styles.modalItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

// ... (seus styles continuam os mesmos)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#34495e',
    },
    content: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 },
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        color: '#333',
    },
    imagePicker: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imageText: {
        color: '#3a86f4',
        fontSize: 16,
        marginTop: 10,
        fontWeight: 'bold'
    },
    categorySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    categoryPlaceholder: {
        fontSize: 16,
        color: '#a9a9a9',
    },
    categorySelectedText: {
        fontSize: 16,
        color: '#34495e',
        fontWeight: '500',
    },
    locationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#e9ecef',
        borderRadius: 10,
    },
    location: {
        fontSize: 14,
        color: '#495057',
        marginLeft: 8,
    },
    permissionWarning: {
        backgroundColor: '#fff3cd',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    permissionText: {
        color: '#856404',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    permissionButton: {
        backgroundColor: '#ffc107',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#212529',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#34495e',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 15,
        borderRadius: 10,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    searchIcon: {
        paddingLeft: 15,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#333',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    modalItemText: {
        fontSize: 18,
        color: '#34495e',
        marginLeft: 15,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f4f7',
    },
});


export default NovaOcorrenciaScreen;