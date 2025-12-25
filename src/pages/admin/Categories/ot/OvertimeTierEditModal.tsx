import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { OvertimeTierCoefficient, OvertimeTierCoefficientConfig } from '../../../../types/overtimetiercoefficient.types';

interface OvertimeTierEditModalProps {
  isOpen: boolean;
  overtimeTier: OvertimeTierCoefficient | null;
  onClose: () => void;
  onSave: (config: OvertimeTierCoefficientConfig) => Promise<void>;
  isLoading?: boolean;
}

export function OvertimeTierEditModal({
  isOpen,
  overtimeTier,
  onClose,
  onSave,
  isLoading = false,
}: OvertimeTierEditModalProps) {
  const [formData, setFormData] = useState<OvertimeTierCoefficientConfig>({
    tierName: '',
    name: '',
    description: '',
    coefficient: '1',
  });

  const [errors, setErrors] = useState<Partial<OvertimeTierCoefficientConfig>>({});

  useEffect(() => {
    if (isOpen && overtimeTier) {
      setFormData({
        tierName: overtimeTier.tierName,
        name: overtimeTier.name,
        description: overtimeTier.description,
        coefficient: overtimeTier.coefficient.toString(),
      });
      setErrors({});
    }
  }, [isOpen, overtimeTier]);

  const validateForm = (): boolean => {
    const newErrors: Partial<OvertimeTierCoefficientConfig> = {};

    if (!formData.tierName.trim()) {
      newErrors.tierName = 'Tên tier không được để trống';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên hiển thị không được để trống';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    }

    const coefficientValue = typeof formData.coefficient === 'string'
      ? parseFloat(formData.coefficient) || 0
      : formData.coefficient;

    if (isNaN(coefficientValue) || coefficientValue <= 0) {
      newErrors.coefficient = 'Hệ số phải là số dương lớn hơn 0';
    }

    if (coefficientValue > 10) {
      newErrors.coefficient = 'Hệ số không được vượt quá 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      // Don't close modal here - let parent handle modal states
    } catch (error) {
      // Error handling will be done in the parent component
      console.error('Error updating overtime tier:', error);
    }
  };

  const handleInputChange = (field: keyof OvertimeTierCoefficientConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (!isOpen || !overtimeTier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Chỉnh sửa hệ số tăng ca
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Tier Name */}
            <div>
              <label htmlFor="tierName" className="block text-sm font-medium text-gray-700 mb-2">
                Tên Tier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tierName"
                value={formData.tierName}
                onChange={(e) => handleInputChange('tierName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.tierName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: Standard Overtime"
                disabled={isLoading}
              />
              {errors.tierName && (
                <p className="mt-1 text-sm text-red-600">{errors.tierName}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: Standard Overtime (181-210 hours)"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Coefficient */}
            <div>
              <label htmlFor="coefficient" className="block text-sm font-medium text-gray-700 mb-2">
                Hệ số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="coefficient"
                value={formData.coefficient.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string, numbers, and decimal points
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleInputChange('coefficient', value === '' ? 0 : value);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.coefficient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: 1.25"
                disabled={isLoading}
              />
              {errors.coefficient && (
                <p className="mt-1 text-sm text-red-600">{errors.coefficient}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Hệ số nhân với lương cơ bản (0.01 - 10.00)
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mô tả chi tiết về tier này..."
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Read-only info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Thông tin chỉ đọc</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>ID:</strong> #{overtimeTier.id}</p>
                <p><strong>Khoảng giờ:</strong> {overtimeTier.minHours} - {overtimeTier.maxHours} giờ</p>
                <p><strong>Tier Level:</strong> {overtimeTier.tierLevel}</p>
                <p><strong>Thứ tự hiển thị:</strong> {overtimeTier.displayOrder}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
