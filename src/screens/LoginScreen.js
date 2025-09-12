import React, { useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import CustomButton from "../components/CustomButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getPendingOcorrencias, initDB } from "../localDB";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erro", "Por favor, preencha todos os campos.");
            return;
        }

        try {
            await initDB();

            const success = await login(email, password);
            if (success) {
                const offline = await getPendingOcorrencias();
                if (offline.length > 0) {
                    Alert.alert(
                        'Ocorrências Offline',
                        `Você tem ${offline.length} ocorrência(s) offline pendente(s).`,
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (e) {
            Alert.alert("Erro", "Ocorreu um problema ao logar.");
            console.error(e);
        }
    };

    const handleOffline = async () => {
        try {
            await initDB();
            navigation.navigate("NovaOcorrenciaOffline");
        } catch (e) {
            Alert.alert("Erro", "Não foi possível iniciar o banco offline.");
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidingContainer}
                >
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons
                                name="shield-alert-outline"
                                size={60}
                                color="#3a86f4"
                            />
                            <Text style={styles.title}>Cidade em Foco</Text>
                            <Text style={styles.subtitle}>
                                A sua voz para uma cidade melhor.
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="email-outline"
                                size={24}
                                color="#999"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="E-mail"
                                placeholderTextColor="#a9a9a9"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons
                                name="lock-outline"
                                size={24}
                                color="#999"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Senha"
                                placeholderTextColor="#a9a9a9"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        {isLoading ? (
                            <ActivityIndicator
                                size="large"
                                color="#3a86f4"
                                style={{ marginTop: 20, marginBottom: 20 }}
                            />
                        ) : (
                            <CustomButton title="Entrar" onPress={handleLogin} />
                        )}

                        <TouchableOpacity style={styles.offlineButton} onPress={handleOffline}>
                            <MaterialCommunityIcons name="wifi-off" size={18} color="#7f8c8d" />
                            <Text style={styles.offlineButtonText}>Registrar Ocorrência Offline</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Não tem uma conta?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                <Text style={styles.linkText}>Cadastre-se</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f0f4f7",
    },
    container: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 30,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#34495e",
        marginTop: 15,
    },
    subtitle: {
        fontSize: 16,
        color: "#7f8c8d",
        marginTop: 5,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        borderColor: "#e0e0e0",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        paddingLeft: 15,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 10,
        fontSize: 16,
        color: "#333",
    },
    errorText: {
        color: "#e74c3c",
        textAlign: "center",
        marginBottom: 10,
        fontSize: 14,
    },
    offlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 10,
    },
    offlineButtonText: {
        color: "#7f8c8d",
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 20,
    },
    footerText: {
        color: "#7f8c8d",
        fontSize: 16,
    },
    linkText: {
        color: "#3a86f4",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 5,
    },
});

export default LoginScreen;