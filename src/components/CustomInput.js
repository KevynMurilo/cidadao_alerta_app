import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const CustomInput = ({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) => {
    return (
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={autoCapitalize || 'sentences'}
            placeholderTextColor="#999"
        />
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
});

export default CustomInput;
