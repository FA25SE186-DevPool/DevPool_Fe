/**
 * Utility functions để validate dữ liệu (email, password, v.v.)
 */

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export const validatePasswordStrength = (password: string): PasswordRequirements => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

// Validate password (ít nhất 8 ký tự với đầy đủ requirements)
export const isValidPassword = (password: string): boolean => {
  const requirements = validatePasswordStrength(password);
  return requirements.length && requirements.uppercase && requirements.lowercase && requirements.number && requirements.special;
};

// Get password validation error message
export const getPasswordValidationError = (password: string): string => {
  if (!password || password.trim() === '') {
    return 'Vui lòng nhập mật khẩu';
  }
  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự';
  }
  if (password.length > 100) {
    return 'Mật khẩu không được vượt quá 100 ký tự';
  }

  const requirements = validatePasswordStrength(password);

  if (!requirements.uppercase) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)';
  }
  if (!requirements.lowercase) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ cái thường (a-z)';
  }
  if (!requirements.number) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9)';
  }
  if (!requirements.special) {
    return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)';
  }

  // Check if password is all the same character
  if (password.split('').every(char => char === password[0])) {
    return 'Mật khẩu không được chứa toàn bộ ký tự giống nhau';
  }

  return '';
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

