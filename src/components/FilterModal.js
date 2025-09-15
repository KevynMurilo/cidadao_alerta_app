import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#4A90E2',
  background: '#F7F8FA',
  textPrimary: '#2C3E50',
  danger: '#e74c3c',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const FilterModal = ({
  visible,
  onClose,
  onApply,
  initialValues,
  statusOptions,
  categoryOptions,
  activeFilterType = 'all', 
}) => {
  const [tempFilters, setTempFilters] = useState({});
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTempFilters(initialValues || {});
    }
  }, [visible, initialValues]);

  const handleApply = () => {
    onApply(tempFilters);
  };

  const handleSelect = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };
  
  const getModalTitle = () => {
    if (activeFilterType === 'status') return 'Selecionar Status';
    if (activeFilterType === 'category') return 'Selecionar Categoria';
    return 'Filtros';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={28} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            {(activeFilterType === 'all' || activeFilterType === 'status') && statusOptions && (
              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Status</Text>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.modalOption, tempFilters.status === option.value && styles.selectedOption]}
                    onPress={() => handleSelect('status', option.value)}
                  >
                    <Text style={[styles.modalOptionText, tempFilters.status === option.value && styles.selectedText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(activeFilterType === 'all' || activeFilterType === 'category') && categoryOptions && (
              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Categoria</Text>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.modalOption, tempFilters.category === cat.id && styles.selectedOption]}
                    onPress={() => handleSelect('category', cat.id)}
                  >
                    <Text style={[styles.modalOptionText, tempFilters.category === cat.id && styles.selectedText]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalActions, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  modalGroup: { marginBottom: 15, paddingHorizontal: 5 },
  modalLabel: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOption: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modalOptionText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  selectedText: { color: COLORS.white, fontWeight: 'bold' },
  modalActions: { marginTop: 20, paddingHorizontal: 5 },
  applyButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  applyText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});

export default FilterModal;
