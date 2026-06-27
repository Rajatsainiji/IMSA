import api from '../lib/axios';

const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  getStats: () => api.get('/orders/stats')
};

export default orderService;
