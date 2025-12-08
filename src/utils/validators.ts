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

// Validate issued date (must be in the past or today)
export const validateIssuedDate = (date: string | undefined): boolean => {
  if (!date) return true;
  const issuedDate = new Date(date);
  const now = new Date();
  return issuedDate <= now;
};

// Validate start time for available times (must be in the future)
export const validateStartTime = (dateTime: string): boolean => {
  if (!dateTime) return false;
  const startDateTime = new Date(dateTime);
  const now = new Date();
  return startDateTime > now;
};

// Validate end time for available times (must be after start time)
export const validateEndTime = (startDateTime: string, endDateTime: string | undefined): boolean => {
  if (!endDateTime) return true;
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  return end > start;
};

