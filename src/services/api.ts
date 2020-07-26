import axis from 'axios';

const api = axis.create({
  baseURL: 'http://localhost:3001',
});

export default api;
