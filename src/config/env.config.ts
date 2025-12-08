// API Configuration - Single source of truth
// Đọc từ biến môi trường .env, fallback về localhost nếu không có
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 'https://api-devpool.innosphere.io.vn/api';
// 'https://api-devpool.innosphere.io.vn/api'
// 'https://localhost:7298/api'

