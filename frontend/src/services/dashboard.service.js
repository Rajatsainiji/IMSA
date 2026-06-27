import api from '../lib/axios';

const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getTopProducts: (limit = 10) => api.get('/dashboard/top-products', { params: { limit } })
};

export default dashboardService;
