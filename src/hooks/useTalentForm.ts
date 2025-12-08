import { useState, useCallback } from 'react';
import { type TalentCreate } from '../services/Talent';
import { WorkingMode } from '../constants/WORKING_MODE';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * Hook để quản lý form state và validation cho Talent Create/Edit
 */
export function useTalentForm(initialData?: Partial<TalentCreate>) {
  const [formData, setFormData] = useState<TalentCreate>({
    currentPartnerId: initialData?.currentPartnerId ?? 1,
    userId: initialData?.userId ?? null,
    fullName: initialData?.fullName ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    locationId: initialData?.locationId,
    workingMode: initialData?.workingMode ?? WorkingMode.None,
    githubUrl: initialData?.githubUrl ?? '',
    portfolioUrl: initialData?.portfolioUrl ?? '',
    status: initialData?.status ?? 'Available',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState<string>('');

  // Validation functions
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }, []);

  const validateDateOfBirth = useCallback((date: string): boolean => {
    if (!date) return true; // Optional field
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;
    return calculatedAge >= 18 && calculatedAge <= 100;
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Required fields
    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
    }

    if (!formData.dateOfBirth || !validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
    }

    if (formData.workingMode === undefined || (formData.workingMode as number) === 0) {
      newErrors.workingMode = 'Vui lòng chọn chế độ làm việc';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Vui lòng chọn khu vực làm việc';
    }

    if (!formData.currentPartnerId) {
      newErrors.currentPartnerId = 'Vui lòng chọn đối tác';
    }

    // URL validation (optional)
    if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
      newErrors.githubUrl = 'URL không hợp lệ';
    }

    if (formData.portfolioUrl && !isValidUrl(formData.portfolioUrl)) {
      newErrors.portfolioUrl = 'URL không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, validatePhone, validateDateOfBirth]);

  const updateField = useCallback((field: keyof TalentCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setFormError('');
  }, [errors]);

  const resetForm = useCallback((newData?: Partial<TalentCreate>) => {
    if (newData) {
      setFormData({
        currentPartnerId: newData.currentPartnerId ?? 1,
        userId: newData.userId ?? null,
        fullName: newData.fullName ?? '',
        email: newData.email ?? '',
        phone: newData.phone ?? '',
        dateOfBirth: newData.dateOfBirth ?? '',
        locationId: newData.locationId,
        workingMode: newData.workingMode ?? WorkingMode.None,
        githubUrl: newData.githubUrl ?? '',
        portfolioUrl: newData.portfolioUrl ?? '',
        status: newData.status ?? 'Available',
      });
    } else {
      setFormData({
        currentPartnerId: 1,
        userId: null,
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        locationId: undefined,
        workingMode: WorkingMode.None,
        githubUrl: '',
        portfolioUrl: '',
        status: 'Available',
      });
    }
    setErrors({});
    setFormError('');
  }, []);

  return {
    formData,
    errors,
    formError,
    setFormError,
    updateField,
    validateForm,
    resetForm,
    setFormData, // For bulk updates
  };
}

// Helper function
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

