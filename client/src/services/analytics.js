import api from './api';

export const getBasicAnalytics = async () => {
    const response = await api.get('/analytics/basic');
    return response.data;
};

export const getPremiumAnalytics = async () => {
    const response = await api.get('/analytics/premium');
    return response.data;
};
