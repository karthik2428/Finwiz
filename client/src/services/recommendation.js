import api from './api';

export const getMutualFundRecommendations = async (goalId) => {
    const response = await api.get('/recommendations/mutual-funds', {
        params: { goalId }
    });
    return response.data;
};
