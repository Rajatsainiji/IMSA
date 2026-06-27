import api from '../lib/axios';

const stockService = {
  getByProduct: (productId) => api.get(`/stock/product/${productId}`),
  getHistory: (productId, params) => api.get(`/stock/product/${productId}/history`, { params }),
  getAllHistory: (params) => api.get('/stock/history', { params }),
  addStock: (productId, data) => api.post(`/stock/product/${productId}/add`, data),
  removeStock: (productId, data) => api.post(`/stock/product/${productId}/remove`, data),
  adjustStock: (productId, data) => api.put(`/stock/product/${productId}/adjust`, data)
};

export default stockService;
