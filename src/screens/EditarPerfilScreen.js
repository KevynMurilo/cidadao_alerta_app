import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TextInput,
    TouchableOpacity, ScrollView, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { updateUser } from '../api/user';

const EditarPerfilScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = route.params;

    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Campo Obrigatório', 'O nome não pode ficar em branco.');
            return;
        }

        if (password && password !== confirmPassword) {
            Alert.alert('Senhas não coincidem', 'As senhas digitadas são diferentes.');
            return;
        }

        const updateData = {};
        if (name.trim() !== user.name) {
            updateData.name = name.trim();
        }
        if (password) {
            updateData.password = password;
        }

        if (Object.keys(updateData).length === 0) {
            Alert.alert('Nenhuma Alteração', 'Você não modificou nenhum dado.');
            return;
        }

        setLoading(true);
        try {
            const response = await updateUser(user.id, updateData);
            if (response.data && response.data.data) {
                Alert.alert('Sucesso!', 'Seu perfil foi atualizado.');
                navigation.goBack();
            } else {
                throw new Error(response.data.message || 'Erro ao atualizar perfil.');
            }
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            Alert.alert('Erro', 'Não foi possível atualizar seu perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container ,{ marginTop: Platform.OS === 'ios' ? 0 : 30 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#34495e" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome Completo</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={22} color="#999" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Digite seu nome completo"
                                    placeholderTextColor="#a9a9a9"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (não editável)</Text>
                            <View style={[styles.inputContainer, styles.inputDisabled]}>
                                <Ionicons name="mail-outline" size={22} color="#999" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={user.email}
                                    editable={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nova Senha (opcional)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={22} color="#999" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Deixe em branco para não alterar"
                                    placeholderTextColor="#a9a9a9"
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={24} color="#7f8c8d" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmar Nova Senha</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={22} color="#999" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Repita a nova senha"
                                    placeholderTextColor="#a9a9a9"
                                    secureTextEntry={!isPasswordVisible}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                        )}
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
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
    content: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        color: '#34495e',
        marginBottom: 10,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 15,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#333',
    },
    inputDisabled: {
        backgroundColor: '#f0f4f7',
    },
    saveButton: {
        backgroundColor: '#3a86f4',
        borderRadius: 10,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#3a86f4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditarPerfilScreen;