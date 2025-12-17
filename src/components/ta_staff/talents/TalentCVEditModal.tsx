import { useEffect, useMemo, useState } from 'react';
import { X, FileText, Briefcase, Upload, ExternalLink, Save, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { talentCVService, type TalentCVCreate, type TalentCVFieldsUpdateModel } from '../../../services/TalentCV';
import { jobRoleLevelService, type JobRoleLevel } from '../../../services/JobRoleLevel';

interface TalentCVEditModalProps {
  isOpen: boolean;
  cvId: number | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

/**
 * Modal chỉnh sửa CV - dùng cùng logic với trang `/ta/talent-cvs/edit/:id`
 */
export function TalentCVEditModal({ isOpen, cvId, canEdit, onClose, onSaved }: TalentCVEditModalProps) {
  const [allJobRoleLevels, setAllJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentCVCreate>({
    talentId: 0,
    jobRoleLevelId: 0,
    version: 1,
    cvFileUrl: '',
    isActive: true,
    summary: '',
    isGeneratedFromTemplate: false,
    sourceTemplateId: undefined,
    generatedForJobRequestId: undefined,
  });
  const [editableFields, setEditableFields] = useState<TalentCVFieldsUpdateModel>({
    talentId: 0,
    summary: '',
    isActive: true,
    isGeneratedFromTemplate: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canDeactivate, setCanDeactivate] = useState(true);

  const jobRoleLevelName = useMemo(() => {
    if (!formData.jobRoleLevelId) return '—';
    return allJobRoleLevels.find((jrl) => jrl.id === formData.jobRoleLevelId)?.name || '—';
  }, [allJobRoleLevels, formData.jobRoleLevelId]);

  useEffect(() => {
    if (!isOpen) return;
    // Load danh sách Job Role Levels
    const fetchJobRoleLevels = async () => {
      try {
        const jobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        setAllJobRoleLevels(Array.isArray(jobRoleLevels) ? jobRoleLevels : []);
      } catch (err) {
        console.error('❌ Lỗi tải danh sách vị trí công việc:', err);
        setAllJobRoleLevels([]);
      }
    };
    fetchJobRoleLevels();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !cvId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await talentCVService.getById(Number(cvId));

        setFormData({
          talentId: data.talentId,
          jobRoleLevelId: data.jobRoleLevelId,
          version: data.version,
          cvFileUrl: data.cvFileUrl,
          isActive: data.isActive,
          summary: data.summary,
          isGeneratedFromTemplate: data.isGeneratedFromTemplate,
          sourceTemplateId: data.sourceTemplateId,
          generatedForJobRequestId: data.generatedForJobRequestId,
        });
        setEditableFields({
          talentId: data.talentId,
          summary: data.summary,
          isActive: data.isActive,
          isGeneratedFromTemplate: data.isGeneratedFromTemplate,
        });
        setTalentId(data.talentId);

        // Kiểm tra xem có bao nhiêu CV đang hoạt động
        if (data.isActive) {
          try {
            const allActiveCVs = await talentCVService.getAll({
              talentId: data.talentId,
              isActive: true,
              excludeDeleted: true,
            });
            if (allActiveCVs && allActiveCVs.length === 1) {
              setCanDeactivate(false);
            } else {
              setCanDeactivate(true);
            }
          } catch (err) {
            console.error('❌ Lỗi kiểm tra CV đang hoạt động:', err);
            setCanDeactivate(true);
          }
        } else {
          setCanDeactivate(true);
        }
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu CV:', err);
        alert('Không thể tải thông tin CV!');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, cvId, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : (e.target as HTMLInputElement).value;

    if (name === 'summary' || name === 'isActive' || name === 'isGeneratedFromTemplate') {
      setEditableFields((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? Boolean(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvId) return;

    if (!canEdit) {
      alert('Bạn không có quyền chỉnh sửa CV này.');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
    if (!confirmed) return;

    try {
      setSaving(true);

      if (formData.isActive && !editableFields.isActive && !canDeactivate) {
        alert(
          '⚠️ Không thể tắt trạng thái hoạt động!\n\nĐây là CV duy nhất đang hoạt động. Phải có ít nhất một CV đang hoạt động cho nhân sự này.'
        );
        return;
      }

      const payload: TalentCVFieldsUpdateModel = {
        talentId,
        summary: editableFields.summary,
        isActive: editableFields.isActive ?? false,
        // Không cho chỉnh trong popup; giữ nguyên giá trị hiện tại để tránh thay đổi ngoài ý muốn
        isGeneratedFromTemplate: formData.isGeneratedFromTemplate ?? false,
      };

      // Nếu set active, hạ cấp các CV active khác cùng vị trí
      if (payload.isActive) {
        try {
          const existingActiveCVs = await talentCVService.getAll({
            talentId,
            jobRoleLevelId: formData.jobRoleLevelId,
            isActive: true,
            excludeDeleted: true,
          });
          const otherActiveCVs = (existingActiveCVs || []).filter((cv: any) => cv.id !== Number(cvId));
          await Promise.all(
            otherActiveCVs.map((cv: any) =>
              talentCVService.updateFields(cv.id, {
                talentId: cv.talentId,
                isActive: false,
              })
            )
          );
        } catch (deactivateError) {
          console.warn('Không thể hạ cấp CV đang active khác:', deactivateError);
        }
      }

      await talentCVService.updateFields(Number(cvId), payload);
      alert('✅ Cập nhật CV thành công!');
      await onSaved?.();
      onClose();
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật CV:', err);
      alert('Không thể cập nhật CV!');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (match modal style Skills/JobRoleLevels) */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa CV</h3>
              <p className="text-sm text-neutral-600">Cập nhật thông tin CV của talent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Vị trí công việc
                  </label>
                  <div className="w-full border border-neutral-200 bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-700">
                    {jobRoleLevelName}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Version CV
                  </label>
                  <Input
                    type="number"
                    value={formData.version}
                    disabled
                    className="w-full border-neutral-200 bg-neutral-50 rounded-xl cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  URL file CV
                </label>
                <Input
                  value={formData.cvFileUrl}
                  disabled
                  className="w-full border-neutral-200 bg-neutral-50 rounded-xl cursor-not-allowed opacity-75"
                />
                {formData.cvFileUrl && (
                  <div className="mt-2">
                    <a
                      href={formData.cvFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Xem trước file CV
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tóm tắt CV
                </label>
                <textarea
                  name="summary"
                  value={editableFields.summary ?? ''}
                  onChange={handleChange}
                  rows={4}
                  disabled={!canEdit}
                  className={`w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none ${
                    !canEdit ? 'opacity-75 cursor-not-allowed bg-neutral-50' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Trạng thái hoạt động
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editableFields.isActive ?? false}
                    onChange={handleChange}
                    disabled={!canEdit || (!canDeactivate && formData.isActive)}
                    className={`w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 ${
                      !canEdit || (!canDeactivate && formData.isActive) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-sm text-gray-700">
                    {editableFields.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                  {!canDeactivate && formData.isActive && (
                    <span className="text-xs text-red-600 ml-2">(Không thể tắt - CV duy nhất đang hoạt động)</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform bg-white font-medium"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Hủy
                </button>
                <Button
                  type="submit"
                  disabled={saving || !canEdit}
                  className={`group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                    saving || !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


