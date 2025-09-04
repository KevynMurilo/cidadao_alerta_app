import React, { useState, useContext } from "react";
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
} from "react-native";
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="shield-alert"
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
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              <CustomButton title="Entrar" onPress={handleLogin} />
              <CustomButton
                title="Registrar Offline"
                onPress={handleOffline}
                style={{ marginTop: 10, backgroundColor: "#f39c12" }}
              />
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Cadastre-se</Text>
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
    backgroundColor: "#f0f4f7",
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
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    borderColor: "#e0e0e0",
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
    color: "#333",
  },
  errorText: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
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
