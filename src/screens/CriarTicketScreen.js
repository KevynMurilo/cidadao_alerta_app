import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createTicket } from '../api/ticket';

const COLORS = {
    primary: '#3a86f4',
    background: '#f0f4f7',
    card: '#ffffff',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
};

const CriarTicketScreen = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('BAIXA');
    const [loading, setLoading] = useState(false);

    const handleCreateTicket = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Atenção', 'Preencha título e descrição.');
            return;
        }

        try {
            setLoading(true);
            await createTicket({
                subject: title,
                description,
                priority: selectedPriority,
            });
            Alert.alert('Sucesso', 'Ticket criado com sucesso!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível criar o ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Ticket</Text>
                <View style={styles.headerButton} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.form}>
                    <Text style={styles.label}>Título</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite um título"
                        placeholderTextColor="#a9a9a9"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Descreva seu problema..."
                        placeholderTextColor="#a9a9a9"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                    />

                    <Text style={styles.label}>Prioridade</Text>
                    <View style={styles.priorityContainer}>
                        {['BAIXA', 'MEDIA', 'ALTA'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityButton,
                                    selectedPriority === p && styles.priorityButtonSelected,
                                ]}
                                onPress={() => setSelectedPriority(p)}
                            >
                                <Text
                                    style={[
                                        styles.priorityText,
                                        selectedPriority === p && styles.priorityTextSelected,
                                    ]}
                                >
                                    {p}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.7 }]}
                        onPress={handleCreateTicket}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Enviar Ticket</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    priorityContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
    },
    priorityButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    priorityText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    priorityTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CriarTicketScreen;
