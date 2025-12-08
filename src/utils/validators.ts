/**
 * Utility functions để validate dữ liệu (email, password, v.v.)
 */

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (ít nhất 6 ký tự)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validate phone number (Vietnam format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+84|0)[1-9][0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

