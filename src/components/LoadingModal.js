import React from 'react';
import { View, Modal, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingModal = ({ visible }) => {
    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
        >
            <View style={styles.modalBackground}>
                <View style={styles.activityIndicatorWrapper}>
                    <ActivityIndicator size="large" color="#3a86f4" />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    activityIndicatorWrapper: {
        backgroundColor: '#FFFFFF',
        height: 100,
        width: 100,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LoadingModal;