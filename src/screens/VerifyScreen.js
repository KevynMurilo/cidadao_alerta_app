import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import CustomButton from '../components/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const VerifyScreen = ({ route }) => {
    const { email } = route.params;
    const [code, setCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(30);
    const [isResending, setIsResending] = useState(false);

    const { verify, resendCode, isLoading } = useContext(AuthContext);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleVerify = async () => {
        if (code.length !== 6) {
            Alert.alert('Erro', 'O código de verificação deve ter 6 dígitos.');
            return;
        }
        try {
            await verify(email, code);
        } catch (e) {
            Alert.alert('Erro na Verificação', e.message);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await resendCode(email);
            Alert.alert('Sucesso', 'Um novo código de verificação foi enviado para o seu e-mail.');
            setResendCooldown(60); 
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setIsResending(false);
        }
    };

    const isBusy = isLoading || isResending;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="email-check-outline" size={60} color="#3a86f4" />
                        <Text style={styles.title}>Verifique o seu E-mail</Text>
                        <Text style={styles.subtitle}>
                            Enviámos um código de 6 dígitos para <Text style={styles.emailText}>{email}</Text>.
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="numeric-6-box-outline" size={24} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Código de Verificação"
                            placeholderTextColor="#a9a9a9"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="numeric"
                            maxLength={6}
                            editable={!isBusy} 
                        />
                    </View>

                    <CustomButton 
                        title="Verificar e Entrar" 
                        onPress={handleVerify} 
                        disabled={isBusy} 
                    />

                    {isLoading && (
                        <ActivityIndicator size="large" color="#3a86f4" style={{ marginTop: 20 }} />
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Não recebeu o código?</Text>
                        <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || isBusy}>
                            <Text style={[styles.linkText, (resendCooldown > 0 || isBusy) && styles.linkDisabled]}>
                                {isResending ? 'A enviar...' : resendCooldown > 0 ? `Aguarde ${resendCooldown}s` : 'Reenviar Código'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#34495e',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    emailText: {
        fontWeight: 'bold',
        color: '#34495e',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
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
    linkDisabled: {
        color: '#a9a9a9',
    },
});

export default VerifyScreen;