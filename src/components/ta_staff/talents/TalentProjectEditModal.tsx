import { useEffect, useState } from 'react';
import { Save, X, Briefcase, Target, FileText, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { talentProjectService, type TalentProjectCreate } from '../../../services/TalentProject';
import { talentCVService, type TalentCV } from '../../../services/TalentCV';

interface TalentProjectEditModalProps {
  isOpen: boolean;
  projectId: number | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

/**
 * Modal chỉnh sửa dự án - dùng logic giống trang `/ta/talent-projects/edit/:id`
 */
export function TalentProjectEditModal({
  isOpen,
  projectId,
  canEdit,
  onClose,
  onSaved,
}: TalentProjectEditModalProps) {
  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentProjectCreate>({
    talentId: 0,
    talentCVId: 0,
    projectName: '',
    position: '',
    technologies: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load dữ liệu Project
  useEffect(() => {
    if (!isOpen || !projectId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await talentProjectService.getById(Number(projectId));
        setFormData({
          talentId: data.talentId,
          talentCVId: data.talentCVId,
          projectName: data.projectName,
          position: data.position,
          technologies: data.technologies,
          description: data.description,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu project:', err);
        alert('Không thể tải thông tin dự án nhân sự!');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, projectId, onClose]);

  // Load danh sách Talent CVs theo talentId
  useEffect(() => {
    if (!isOpen) return;
    const fetchCVs = async () => {
      try {
        if (talentId > 0) {
          const cvs = await talentCVService.getAll({
            talentId: talentId,
            excludeDeleted: true,
          });
          let cvsArray: TalentCV[] = [];
          if (Array.isArray(cvs)) {
            cvsArray = cvs;
          } else if (cvs && typeof cvs === 'object') {
            if (Array.isArray((cvs as any).data)) {
              cvsArray = (cvs as any).data;
            } else if (Array.isArray((cvs as any).items)) {
              cvsArray = (cvs as any).items;
            } else if (Array.isArray((cvs as any).Data)) {
              cvsArray = (cvs as any).Data;
            } else if (Array.isArray((cvs as any).Items)) {
              cvsArray = (cvs as any).Items;
            }
          }
          setTalentCVs(cvsArray);
        } else {
          setTalentCVs([]);
        }
      } catch (err) {
        console.error('❌ Lỗi tải danh sách CV:', err);
        setTalentCVs([]);
      }
    };
    fetchCVs();
  }, [isOpen, talentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'talentCVId' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!canEdit) {
      alert('Bạn không có quyền chỉnh sửa dự án này.');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
    if (!confirmed) return;

    if (!formData.talentCVId || formData.talentCVId === 0) {
      alert('⚠️ Vui lòng chọn CV của nhân sự trước khi lưu!');
      return;
    }
    if (!formData.projectName.trim()) {
      alert('⚠️ Vui lòng nhập tên dự án!');
      return;
    }
    if (!formData.position.trim()) {
      alert('⚠️ Vui lòng nhập vị trí trong dự án!');
      return;
    }

    try {
      setSaving(true);
      await talentProjectService.update(Number(projectId), formData);
      alert('✅ Cập nhật dự án nhân sự thành công!');
      await onSaved?.();
      onClose();
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật project:', err);
      alert('Không thể cập nhật dự án nhân sự!');
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
              <Briefcase className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa dự án</h3>
              <p className="text-sm text-neutral-600">Cập nhật thông tin dự án của nhân sự</p>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CV của nhân sự <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="talentCVId"
                    value={formData.talentCVId}
                    onChange={handleChange}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    required
                    disabled={!canEdit}
                  >
                    <option value="0">-- Chọn CV --</option>
                    {Array.isArray(talentCVs) && talentCVs.length > 0 ? (
                      talentCVs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          v{cv.version}
                        </option>
                      ))
                    ) : (
                      <option disabled>Không có CV nào</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <Input
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Vị trí trong dự án <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Công nghệ sử dụng
                  </label>
                  <Input
                    name="technologies"
                    value={formData.technologies}
                    onChange={handleChange}
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả dự án
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl resize-none"
                  disabled={!canEdit}
                />
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


