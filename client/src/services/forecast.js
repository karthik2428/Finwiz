import api from './api';

export const getForecastSavings = async (monthsBack = 6, weights = null) => {
    const params = { monthsBack };
    if (weights) params.weights = weights;
    const response = await api.get('/forecast/savings', { params });
    return response.data;
};

export const compareForecast = async (monthsBack = 6, weights = null) => {
    const params = { monthsBack };
    if (weights) params.weights = weights;
    const response = await api.get('/forecast/compare', { params });
    return response.data;
};
