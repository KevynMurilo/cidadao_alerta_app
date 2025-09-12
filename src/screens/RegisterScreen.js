import React, { useState, useContext } from 'react';
import { View, Modal, ActivityIndicator, StyleSheet, Text, Platform, TouchableOpacity, KeyboardAvoidingView, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;
    return (
        <Modal transparent={true} animationType="fade" visible={isVisible}>
            <View style={styles.modalContainer}>
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Aguarde...</Text>
                </View>
            </View>
        </Modal>
    );
};

const RegisterScreen = () => {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { register, isLoading } = useContext(AuthContext);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        try {
            await register(name, email, password);
        } catch (e) {
            Alert.alert('Erro no Cadastro', e.message || 'Ocorreu um erro desconhecido.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <LoadingOverlay isVisible={isLoading} />
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#34495e" />
                </TouchableOpacity>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Crie a sua Conta</Text>
                                <Text style={styles.subtitle}>É rápido e fácil.</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={24} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#a9a9a9" value={name} onChangeText={setName} editable={!isLoading} />
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="email-outline" size={24} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#a9a9a9" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="lock-outline" size={24} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#a9a9a9" value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} />
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="lock-check-outline" size={24} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="Confirmar Senha" placeholderTextColor="#a9a9a9" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry editable={!isLoading} />
                            </View>

                            <CustomButton title="Cadastrar" onPress={handleRegister} disabled={isLoading} />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Já tem uma conta?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                                    <Text style={styles.linkText}>Faça login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 10,
        padding: 5,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#34495e',
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    inputIcon: {
        paddingLeft: 15,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#333',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#7f8c8d',
        fontSize: 16,
    },
    linkText: {
        color: '#3a86f4',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    loaderBox: {
        backgroundColor: '#2c3e50',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loadingText: {
        color: '#FFFFFF',
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '500',
    },
});

export default RegisterScreen;