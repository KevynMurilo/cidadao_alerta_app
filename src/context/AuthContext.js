import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, verifyCode, resendVerificationCode } from '../api/auth';
import { initDB } from '../localDB';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const [needsVerification, setNeedsVerification] = useState(null);

    const handleApiError = (e, context) => {
        const errorMessage = e.response?.data?.message || e.message || 'Ocorreu um erro. Tente novamente.';
        setError(errorMessage);
        throw new Error(errorMessage);
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await loginUser(email, password);
            if (response.data && response.data.success) {
                const { token, ...userData } = response.data.data;
                setUserToken(token);
                setUserInfo(userData);
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                setNeedsVerification(null);
                await initDB();
            }
        } catch (e) {
            handleApiError(e, 'login');
        }
    };

    const register = async (name, email, password) => {
        setError(null);
        try {
            const response = await registerUser(name, email, password);
            if (response.data && response.data.success) {
                setNeedsVerification(email);
            }
        } catch (e) {
            handleApiError(e, 'register');
        }
    };
    
    const verify = async (email, code) => {
        setError(null);
        try {
            const response = await verifyCode(email, code);
            if (response.data && response.data.success) {
                const { token, ...userData } = response.data.data;
                setUserToken(token);
                setUserInfo(userData);
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                setNeedsVerification(null);
            }
        } catch(e) {
            handleApiError(e, 'verify');
        }
    };

    const resendCode = async (email) => {
        setError(null);
        try {
            await resendVerificationCode(email);
        } catch (e) {
            handleApiError(e, 'resend-code');
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        setNeedsVerification(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
    };

    const isLoggedIn = async () => {
        try {
            let token = await AsyncStorage.getItem('userToken');
            let info = await AsyncStorage.getItem('userInfo');
            if (token && info) {
                setUserToken(token);
                setUserInfo(JSON.parse(info));
                await initDB();
            }
        } catch (e) {
            console.log(`isLoggedIn error: ${e}`);
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
            verify,
            resendCode,
            userToken,
            userInfo,
            error,
            needsVerification
        }}>
            {children}
        </AuthContext.Provider>
    );
};