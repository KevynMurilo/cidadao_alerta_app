import apiClient from "./api";

export const loginUser = (email, password) => {
    return apiClient.post('/auth/login', { email, password });
};

export const registerUser = (name, email, password) => {
    return apiClient.post('/auth/register', { name, email, password });
};

export const verifyCode = (email, code) => {
    return apiClient.post('/auth/verify', { email, code });
};

export const resendVerificationCode = (email) => {
    return apiClient.post('/auth/resend-code', { email });
};
