import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login, isLoading, error } = useContext(AuthContext);

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }
        login(email, password);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Cidadão Alerta</Text>
                <Text style={styles.subtitle}>Faça login para continuar</Text>

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

                {error && <Text style={styles.errorText}>{error}</Text>}

                {isLoading ? (
                    <ActivityIndicator size="large" color="#3a86f4" style={{ marginTop: 20 }} />
                ) : (
                    <CustomButton title="Entrar" onPress={handleLogin} />
                )}

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
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
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    }
});

export default LoginScreen;
