// Helper function để extract error message từ error object
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  
  // Xử lý AxiosError (có response) - trường hợp này ít xảy ra vì service đã throw error.response?.data
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: any }; message?: string };
    const data = err.response?.data;
    if (data) {
      // Kiểm tra các trường có thể chứa message
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && data !== null) {
        // Ưu tiên message field (backend trả về { isSuccess: false, message: "..." })
        if (data.message && typeof data.message === 'string') return data.message;
        return data.error || data.title || data.detail || err.message || 'Đã xảy ra lỗi';
      }
    }
    return err.message || 'Đã xảy ra lỗi';
  }
  
  // Xử lý Error instance
  if (error instanceof Error) {
    // Kiểm tra normalizedMessage từ axios interceptor
    const normalizedMsg = (error as any).normalizedMessage;
    if (normalizedMsg && typeof normalizedMsg === 'string') return normalizedMsg;
    return error.message || 'Đã xảy ra lỗi';
  }
  
  // Xử lý object được throw từ service (error.response?.data hoặc { message: "..." })
  // Service throw: error.response?.data 
  // Backend trả về: { isSuccess: false, message: "...", oldStatus: "...", newStatus: null, validationErrors: [] }
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    // Ưu tiên message field (backend trả về { isSuccess: false, message: "..." })
    // Kiểm tra kỹ hơn để đảm bảo lấy được message
    if (err.message) {
      if (typeof err.message === 'string' && err.message.trim()) {
        return err.message.trim();
      }
    }
    // Fallback các trường khác
    if (err.error && typeof err.error === 'string') return err.error;
    if (err.title && typeof err.title === 'string') return err.title;
    if (err.detail && typeof err.detail === 'string') return err.detail;
    
    // Nếu không có message, thử stringify toàn bộ object để debug
    console.warn('⚠️ Error object không có message field:', err);
    return 'Đã xảy ra lỗi không xác định';
  }
  
  return 'Đã xảy ra lỗi không xác định';
};

