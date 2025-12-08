/**
 * Utility functions để format dữ liệu (số tiền, ngày tháng, v.v.)
 */

// Helper function để format số tiền theo VND (1.000.000)
export const formatVND = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "-";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper function để format số cho input fields (30.000.000)
export const formatNumberInput = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return "";
  // value luôn là number ở đây, không cần check string
  const numValue = typeof value === "number" ? value : 0;
  if (isNaN(numValue)) return "";
  // Format với dấu chấm ngăn cách hàng nghìn
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper function để parse số từ input đã format (30.000.000 -> 30000000)
export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  // Loại bỏ tất cả dấu chấm và khoảng trắng
  const cleaned = value.replace(/\./g, "").replace(/\s/g, "");
  return parseFloat(cleaned) || 0;
};

// Format date (có thể mở rộng thêm)
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "-";
  return dateObj.toLocaleDateString('vi-VN');
};

// Format datetime
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "-";
  return dateObj.toLocaleString('vi-VN');
};

