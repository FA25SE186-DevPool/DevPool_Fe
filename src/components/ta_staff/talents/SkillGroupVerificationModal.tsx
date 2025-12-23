import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { type TalentSkill } from '../../../services/TalentSkill';

interface SkillGroupVerificationModalProps {
  isOpen: boolean;
  skillGroupId?: number;
  skillGroupName?: string;
  talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[];
  verifyResult: boolean;
  setVerifyResult: (result: boolean) => void;
  verifyNote: string;
  setVerifyNote: (note: string) => void;
  expertsForSkillGroup: Array<{ id: number; name: string; specialization?: string | null }>;
  expertsForSkillGroupLoading: boolean;
  selectedExpertId: number | '';
  setSelectedExpertId: (id: number | '') => void;
  verifyExpertName: string;
  setVerifyExpertName: (name: string) => void;
  skillSnapshotEnabled: boolean;
  setSkillSnapshotEnabled: (enabled: boolean) => void;
  showAllSkillsInVerifyModal: boolean;
  setShowAllSkillsInVerifyModal: (show: boolean) => void;
  isVerifyingSkillGroup: boolean;
  getLevelLabel: (level: string) => string;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * Modal để verify nhóm kỹ năng
 */
export function SkillGroupVerificationModal({
  isOpen,
  skillGroupId,
  skillGroupName,
  talentSkills,
  verifyResult,
  setVerifyResult,
  verifyNote,
  setVerifyNote,
  expertsForSkillGroup,
  expertsForSkillGroupLoading,
  selectedExpertId,
  setSelectedExpertId,
  verifyExpertName: _verifyExpertName,
  setVerifyExpertName,
  skillSnapshotEnabled,
  setSkillSnapshotEnabled,
  showAllSkillsInVerifyModal,
  setShowAllSkillsInVerifyModal,
  isVerifyingSkillGroup,
  getLevelLabel,
  onClose,
  onSubmit,
}: SkillGroupVerificationModalProps) {
  if (!isOpen) return null;

  // Lấy tất cả skills trong group
  const groupSkills = talentSkills.filter(
    (s) => s.skillGroupId === skillGroupId
  );

  // Nếu có nhiều skill thì mới cần pagination
  const MAX_VISIBLE = 8;
  const needsPagination = groupSkills.length > MAX_VISIBLE;
  const visibleSkills = needsPagination && !showAllSkillsInVerifyModal
    ? groupSkills.slice(0, MAX_VISIBLE)
    : groupSkills;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Verify nhóm kỹ năng
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

        <div className="space-y-4">
          {/* Kết quả verify */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Kết quả verify <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verifyResult"
                  checked={verifyResult === true}
                  onChange={() => setVerifyResult(true)}
                  className="w-4 h-4 text-emerald-600 border-neutral-300 focus:ring-emerald-500"
                />
                <span className={`text-sm font-medium ${verifyResult === true ? 'text-emerald-700' : 'text-neutral-600'}`}>
                  Verify Pass (Hợp lệ)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verifyResult"
                  checked={verifyResult === false}
                  onChange={() => setVerifyResult(false)}
                  className="w-4 h-4 text-red-600 border-neutral-300 focus:ring-red-500"
                />
                <span className={`text-sm font-medium ${verifyResult === false ? 'text-red-700' : 'text-neutral-600'}`}>
                  ❌ Verify Fail (Không hợp lệ)
                </span>
              </label>
            </div>
            {verifyResult === false && (
              <p className="text-xs text-amber-600 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                ⚠️ Khi chọn Fail, bạn cần nhập ghi chú lý do để giải thích tại sao không hợp lệ.
              </p>
            )}
          </div>

          {/* Chuyên gia */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Chuyên gia (Expert) verify <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {expertsForSkillGroupLoading ? (
                <p className="text-xs text-neutral-500">
                  Đang tải danh sách chuyên gia cho nhóm kỹ năng này...
                </p>
              ) : expertsForSkillGroup.length > 0 ? (
                <select
                  value={selectedExpertId === '' ? '' : selectedExpertId}
                  onChange={(e) => {
                    const v = e.target.value;
                    const idNum = v ? Number(v) : '';
                    setSelectedExpertId(idNum);
                    const found =
                      typeof idNum === 'number'
                        ? expertsForSkillGroup.find((ex) => ex.id === idNum)
                        : undefined;
                    if (found) {
                      setVerifyExpertName(found.name);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 bg-white"
                  required
                >
                  <option value="">
                    Chọn chuyên gia đã được gán cho nhóm kỹ năng này
                  </option>
                  {expertsForSkillGroup.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                      {ex.specialization ? ` · ${ex.specialization}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                    ⚠️ Không có chuyên gia nào được gán cho nhóm kỹ năng này.{' '}
                    Vui lòng liên hệ Admin để gán chuyên gia trước khi verify.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Ghi chú {verifyResult === false && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              rows={3}
              placeholder={
                verifyResult === false
                  ? 'Nhập lý do tại sao không hợp lệ (bắt buộc khi verify fail)...'
                  : 'Ghi chú thêm (ví dụ: phạm vi đánh giá, tiêu chí, ... )'
              }
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500/20 resize-none ${
                verifyResult === false && !verifyNote.trim()
                  ? 'border-amber-300 focus:border-amber-500'
                  : 'border-neutral-300 focus:border-secondary-500'
              }`}
            />
            {verifyResult === false && !verifyNote.trim() && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Vui lòng nhập ghi chú lý do khi verify fail.
              </p>
            )}
          </div>

          {/* Danh sách kỹ năng sẽ được verify */}
          {skillGroupId && verifyResult && (
            <div className="bg-secondary-50 border border-secondary-100 rounded-lg p-3 text-xs text-secondary-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  Các kỹ năng trong nhóm sẽ được verify:
                </p>
                <label className="flex items-center gap-1 text-[11px] text-secondary-900">
                  <input
                    type="checkbox"
                    checked={skillSnapshotEnabled}
                    onChange={(e) => setSkillSnapshotEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 text-secondary-600 border-secondary-300 rounded focus:ring-secondary-500"
                  />
                  <span>Lưu snapshot kỹ năng (skillSnapshot)</span>
                </label>
              </div>

              <ul className="list-disc list-inside space-y-0.5 max-h-40 overflow-y-auto pr-1">
                {visibleSkills.map((s) => (
                  <li key={s.id}>
                    {s.skillName} – {getLevelLabel(s.level)} ({s.yearsExp} năm)
                  </li>
                ))}
              </ul>
              {needsPagination && (
                <button
                  type="button"
                  onClick={() => setShowAllSkillsInVerifyModal(!showAllSkillsInVerifyModal)}
                  className="mt-1 text-[11px] font-medium text-secondary-700 hover:text-secondary-900 underline"
                >
                  {showAllSkillsInVerifyModal
                    ? 'Thu gọn danh sách kỹ năng'
                    : `Xem đầy đủ ${groupSkills.length} kỹ năng`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isVerifyingSkillGroup}
            variant="outline"
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              isVerifyingSkillGroup ||
              (verifyResult === false && !verifyNote.trim()) ||
              expertsForSkillGroup.length === 0 ||
              !selectedExpertId
            }
            className={`${
              isVerifyingSkillGroup ||
              (verifyResult === false && !verifyNote.trim()) ||
              expertsForSkillGroup.length === 0 ||
              !selectedExpertId
                ? 'bg-neutral-300 cursor-not-allowed'
                : verifyResult === false
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-secondary-600 hover:bg-secondary-700'
            } text-white`}
          >
            {isVerifyingSkillGroup && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            )}
            {isVerifyingSkillGroup
              ? 'Đang xử lý...'
              : verifyResult === false
                ? 'Xác nhận Fail'
                : 'Xác nhận Verify'}
          </Button>
        </div>
      </div>
    </div>
  );
}

