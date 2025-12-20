"use client";

import { Search } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function EmptyState({ onClearFilters, hasActiveFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-12 h-12 text-neutral-500" />
      </div>
      <h3 className="text-2xl font-bold text-neutral-700 mb-4">Không tìm thấy nhân sự DevPool phù hợp</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Hiện tại chưa có chuyên gia DevPool nào khả dụng. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
        >
          Xóa tất cả bộ lọc
        </button>
      )}
    </div>
  );
}