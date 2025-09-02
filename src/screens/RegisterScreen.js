import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';


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
            const result = await register(name, email, password);
            if (result && result.success) {
                 Alert.alert('Sucesso!', 'Seu cadastro foi realizado. Faça o login para continuar.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (e) {
            Alert.alert('Erro no Cadastro', e.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Crie sua Conta</Text>
                <Text style={styles.subtitle}>É rápido e fácil</Text>

                <CustomInput
                    placeholder="Nome Completo"
                    value={name}
                    onChangeText={setName}
                />
                <CustomInput
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <CustomInput
                    placeholder="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <CustomInput
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                {isLoading ? (
                    <ActivityIndicator size="large" color="#3a86f4" style={{ marginTop: 20 }} />
                ) : (
                    <CustomButton title="Cadastrar" onPress={handleRegister} />
                )}

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    linkText: {
        marginTop: 20,
        color: '#3a86f4',
        textAlign: 'center',
        fontSize: 16,
    }
});

export default RegisterScreen;
