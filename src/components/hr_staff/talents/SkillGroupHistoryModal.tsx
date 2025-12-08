import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { type TalentSkillGroupAssessment } from '../../../services/TalentSkillGroupAssessment';

interface SkillGroupHistoryModalProps {
  isOpen: boolean;
  skillGroupName?: string;
  items: TalentSkillGroupAssessment[];
  loading: boolean;
  onClose: () => void;
}

/**
 * Modal để hiển thị lịch sử đánh giá nhóm kỹ năng
 */
export function SkillGroupHistoryModal({
  isOpen,
  skillGroupName,
  items,
  loading,
  onClose,
}: SkillGroupHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Lịch sử đánh giá nhóm kỹ năng
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Nhóm kỹ năng:{' '}
              <span className="font-medium text-secondary-700">
                {skillGroupName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border border-neutral-100 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-neutral-500">
              Đang tải lịch sử đánh giá...
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-neutral-500">
              Chưa có lịch sử đánh giá nào cho nhóm kỹ năng này.
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Thời gian đánh giá
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Expert
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Đang active
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-neutral-800 whitespace-nowrap">
                      {new Date(item.assessmentDate).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2 text-sm text-neutral-800 whitespace-nowrap">
                      {item.expertName || item.verifiedByName || '—'}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          item.isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {item.isVerified ? 'Đã verify' : 'Không hợp lệ / bị hủy'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          item.isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {item.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-neutral-700 max-w-md">
                      {item.note ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {item.note.split('\n').map((line, idx) => {
                            const isInvalidated = line.trim().startsWith('Invalidated:');
                            return (
                              <div
                                key={idx}
                                className={
                                  isInvalidated
                                    ? 'text-red-700 font-medium bg-red-50 px-2 py-1 rounded border border-red-200 break-words'
                                    : 'text-neutral-700 break-words'
                                }
                              >
                                {line.trim() || '\u00A0'}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={onClose} variant="outline">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

