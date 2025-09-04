import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../api/auth';
import { initDB } from '../localDB';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleApiError = (e, context) => {
        const errorMessage = e.response?.data?.message || e.message || 'Ocorreu um erro. Tente novamente.';
        setError(errorMessage);
        console.error(`Erro em ${context}:`, e.response?.data || e);
        return errorMessage;
    };

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await loginUser(email, password);
            if (response.data && response.data.success) {
                const { token, ...userData } = response.data.data;
                setUserToken(token);
                setUserInfo(userData);
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(userData));

                await initDB();

                return true;
            } else {
                throw new Error(response.data.message || 'Erro ao fazer login');
            }
        } catch (e) {
            handleApiError(e, 'login');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await registerUser(name, email, password);
            if (response.data && response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.message || 'Erro ao registrar');
            }
        } catch (e) {
            const errorMessage = handleApiError(e, 'register');
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let info = await AsyncStorage.getItem('userInfo');
            if (token && info) {
                setUserToken(token);
                setUserInfo(JSON.parse(info));

                await initDB();
            }
        } catch (e) {
            console.log(`isLoggedIn error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{
            login,
            logout,
            register,
            isLoading,
            userToken,
            userInfo,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
};

