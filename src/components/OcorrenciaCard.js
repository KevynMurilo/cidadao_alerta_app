import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#4A90E2',
    card: '#FFFFFF',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    inactive: '#EAEBEE',
    aberto: '#E74C3C',
    emAndamento: '#F39C12',
    finalizado: '#2ECC71',
};

const statusConfig = {
    ABERTO: { color: COLORS.aberto, text: 'Aberto', bg: '#fadbd8' },
    EM_ANDAMENTO: { color: COLORS.emAndamento, text: 'Em Andamento', bg: '#fdebd0' },
    FINALIZADO: { color: COLORS.finalizado, text: 'Finalizado', bg: '#d4efdf' },
};

const OcorrenciaCard = ({ item, imagem, onPress }) => {
    const config =
        statusConfig[item.status] || {
            color: COLORS.textSecondary,
            text: item.status,
            bg: COLORS.inactive,
        };

    const dataFormatada = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('pt-BR')
        : '';

    return (
        <View style={styles.card}>
            {imagem ? (
                <Image source={{ uri: imagem }} style={styles.cardImage} />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <MaterialCommunityIcons name="image-off-outline" size={50} color="#CBD5E0" />
                </View>
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                        {item.categoryName}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: config.color }]}>
                            {config.text}
                        </Text>
                    </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.cardFooter}>
                    <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={16}
                        color={COLORS.textSecondary}
                    />
                    <Text style={styles.cardDate}>{dataFormatada}</Text>
                </View>
                {/* Botão de abrir detalhes */}
                {onPress && (
                    <TouchableOpacity style={styles.detailButton} onPress={onPress}>
                        <Text style={styles.detailButtonText}>Ver Detalhes</Text>
                        <MaterialCommunityIcons
                            name="arrow-right-circle-outline"
                            size={18}
                            color={'#FFF'}
                            style={{ marginLeft: 8 }}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: COLORS.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardImage: { height: 180, width: '100%' },
    cardImagePlaceholder: {
        height: 180,
        width: '100%',
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: { padding: 16 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardCategory: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 },
    cardDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardDate: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
    detailButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default OcorrenciaCard;
