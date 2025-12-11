import React from 'react';

interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Component để hiển thị thông tin dạng label-value với icon
 */
export function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <div className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300 break-words max-w-full overflow-hidden">
        {value || '—'}
      </div>
    </div>
  );
}

