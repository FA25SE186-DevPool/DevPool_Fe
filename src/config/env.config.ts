// API Configuration - Single source of truth
// Đọc từ biến môi trường .env, fallback về localhost nếu không có
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api-devpool.innosphere.io.vn/api';

// 'https://api-devpool.innosphere.io.vn/api'
// 'https://localhost:7298/api'

// Google Vision API Key (KHÔNG CÒN SỬ DỤNG - chỉ để lưu trữ)
export const GOOGLE_VISION_API_KEY =
  import.meta.env.VITE_GOOGLE_VISION_API_KEY || 'AIzaSyBIx866qiL5uh4ZgFPqn7tsP66us5UVAMg';
