import React, { useState, useContext } from 'react';
import { View, Modal, ActivityIndicator, StyleSheet, Text, Platform, TouchableOpacity, KeyboardAvoidingView, ScrollView, TextInput, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={isVisible}
        >
            <View style={styles.modalContainer}>
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Aguarde...</Text>
                </View>
            </View>
        </Modal>
    );
};

const RegisterScreen = ({ navigation }) => {
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
            // O sucesso é tratado dentro do seu AuthContext, que irá navegar o usuário
        } catch (e) {
            // O erro já deve ser tratado no AuthContext, mas um fallback aqui é bom
            Alert.alert('Erro no Cadastro', e.message || 'Ocorreu um erro desconhecido.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LoadingOverlay isVisible={isLoading} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Crie a sua Conta</Text>
                            <Text style={styles.subtitle}>É rápido e fácil.</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="account-outline" size={24} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nome Completo"
                                placeholderTextColor="#a9a9a9"
                                value={name}
                                onChangeText={setName}
                                // 2. Adicione 'editable' para desabilitar durante o loading
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={24} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="E-mail"
                                placeholderTextColor="#a9a9a9"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                // 2. Adicione 'editable'
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-outline" size={24} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Senha"
                                placeholderTextColor="#a9a9a9"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                // 2. Adicione 'editable'
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-check-outline" size={24} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar Senha"
                                placeholderTextColor="#a9a9a9"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                // 2. Adicione 'editable'
                                editable={!isLoading}
                            />
                        </View>

                        {/* O botão já está corretamente desabilitado com 'disabled' */}
                        <CustomButton title="Cadastrar" onPress={handleRegister} disabled={isLoading} />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Já tem uma conta?</Text>
                            {/* O link de navegação também já está desabilitado */}
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                                <Text style={styles.linkText}>Faça login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
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