import { useEffect, useState } from "react";
import { talentJobRoleLevelService, type TalentJobRoleLevelCreate } from "../../../services/TalentJobRoleLevel";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from "../../../services/JobRoleLevel";
import { Button } from "../../ui/button";
import { 
  Save, 
  X, 
  Target,
  ChevronDown
} from "lucide-react";

interface TalentJobRoleLevelEditModalProps {
  isOpen: boolean;
  talentJobRoleLevelId: number | null;
  onClose: () => void;
  onSuccess: () => void; // Callback để reload danh sách sau khi update thành công
}

/**
 * Modal để chỉnh sửa vị trí công việc của talent
 */
export function TalentJobRoleLevelEditModal({
  isOpen,
  talentJobRoleLevelId,
  onClose,
  onSuccess,
}: TalentJobRoleLevelEditModalProps) {
  const [allJobRoleLevels, setAllJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [formData, setFormData] = useState<TalentJobRoleLevelCreate>({
    talentId: 0,
    jobRoleLevelId: 0,
    yearsOfExp: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const currentJobRoleLevel = allJobRoleLevels.find((jrl) => jrl.id === formData.jobRoleLevelId);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);

  // Helper function để format level
  const getLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
      [TalentLevel.Junior]: "Junior",
      [TalentLevel.Middle]: "Middle",
      [TalentLevel.Senior]: "Senior",
      [TalentLevel.Lead]: "Lead"
    };
    return levelMap[level] || "Unknown";
  };

  // 🧭 Load dữ liệu Talent Job Role Level
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!talentJobRoleLevelId) return;
        setLoading(true);
        const data = await talentJobRoleLevelService.getById(Number(talentJobRoleLevelId));

        setFormData({
          talentId: data.talentId,
          jobRoleLevelId: data.jobRoleLevelId,
          yearsOfExp: data.yearsOfExp || 0,
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin vị trí công việc!");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (isOpen && talentJobRoleLevelId) {
      fetchData();
    }
  }, [isOpen, talentJobRoleLevelId, onClose]);

  // 🧭 Load danh sách Job Role Levels
  useEffect(() => {
    const fetchJobRoleLevels = async () => {
      try {
        const jobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        setAllJobRoleLevels(jobRoleLevels);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách vị trí công việc:", err);
      }
    };
    if (isOpen) {
      fetchJobRoleLevels();
    }
  }, [isOpen]);

  // Sync level từ jobRoleLevelId (khi load modal / khi đổi jobRoleLevelId)
  useEffect(() => {
    if (!formData.jobRoleLevelId || allJobRoleLevels.length === 0) return;
    const lvl = allJobRoleLevels.find((j) => j.id === formData.jobRoleLevelId)?.level;
    if (typeof lvl === "number") setSelectedLevel(lvl);
  }, [formData.jobRoleLevelId, allJobRoleLevels]);

  const availableLevels = (() => {
    const name = currentJobRoleLevel?.name;
    if (!name) return [];
    return allJobRoleLevels
      .filter((j) => j.name === name)
      .map((j) => j.level)
      .filter((lvl, idx, self) => self.indexOf(lvl) === idx)
      .sort((a, b) => a - b);
  })();

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talentJobRoleLevelId) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    // Popup edit: khóa Vị trí (name), nhưng cho đổi Cấp độ => đổi jobRoleLevelId theo name + level
    if (!formData.jobRoleLevelId || formData.jobRoleLevelId === 0) {
      alert("⚠️ Không xác định được vị trí công việc hiện tại!");
      return;
    }
    if (selectedLevel === undefined || !currentJobRoleLevel?.name) {
      alert("⚠️ Vui lòng chọn cấp độ!");
      return;
    }

    const matchingJobRoleLevel = allJobRoleLevels.find(
      (j) => j.name === currentJobRoleLevel.name && j.level === selectedLevel
    );
    if (!matchingJobRoleLevel?.id) {
      alert("⚠️ Không tìm thấy cấp độ phù hợp cho vị trí này!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        jobRoleLevelId: matchingJobRoleLevel.id,
      };
      await talentJobRoleLevelService.update(Number(talentJobRoleLevelId), payload);

      setShowSuccessOverlay(true);

      // Hiển thị loading overlay trong 2 giây rồi đóng modal
      setTimeout(() => {
        setShowSuccessOverlay(false);
        onSuccess(); // Gọi callback để reload danh sách
        onClose(); // Đóng modal
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật vị trí công việc!");
    } finally {
      setSaving(false);
    }
  };

  // Reset state khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        talentId: 0,
        jobRoleLevelId: 0,
        yearsOfExp: 0,
      });
      setSelectedLevel(undefined);
      setIsLevelDropdownOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa vị trí công việc</h3>
              <p className="text-sm text-neutral-600">Cập nhật thông tin vị trí công việc của talent</p>
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
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-6">
                  {/* Vị trí công việc */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Vị trí công việc
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Readonly: Vị trí */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          Vị trí
                        </label>
                        <div className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-800">
                          {currentJobRoleLevel?.name || "—"}
                        </div>
                      </div>

                      {/* Readonly: Cấp độ */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          Cấp độ
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (availableLevels.length > 0) setIsLevelDropdownOpen((prev) => !prev);
                            }}
                            disabled={availableLevels.length === 0}
                            className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                              availableLevels.length === 0
                                ? "opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200"
                                : "border-neutral-300 focus:border-primary-500"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-neutral-500" />
                              <span className={selectedLevel !== undefined ? "font-medium text-neutral-900" : "text-neutral-500"}>
                                {selectedLevel !== undefined ? getLevelText(selectedLevel) : "Chọn cấp độ"}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-neutral-400 transition-transform ${
                                isLevelDropdownOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isLevelDropdownOpen && availableLevels.length > 0 && (
                            <div
                              className="absolute z-[60] bottom-full mb-2 left-0 right-0 rounded-xl border border-neutral-200 bg-white shadow-2xl"
                              onMouseLeave={() => setTimeout(() => setIsLevelDropdownOpen(false), 200)}
                            >
                              <div className="max-h-56 overflow-y-auto">
                                {availableLevels.map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedLevel(lvl);
                                      setIsLevelDropdownOpen(false);
                                      // Optimistic: cập nhật ngay jobRoleLevelId theo name+level để mô tả đổi theo
                                      if (currentJobRoleLevel?.name) {
                                        const match = allJobRoleLevels.find(
                                          (j) => j.name === currentJobRoleLevel.name && j.level === lvl
                                        );
                                        if (match?.id) {
                                          setFormData((prev) => ({ ...prev, jobRoleLevelId: match.id }));
                                        }
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      selectedLevel === lvl
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {getLevelText(lvl)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {formData.jobRoleLevelId > 0 && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Mô tả: <span className="font-medium text-neutral-700">
                          {allJobRoleLevels.find(jrl => jrl.id === formData.jobRoleLevelId)?.description || "Không có mô tả"}
                        </span>
                      </p>
                    )}
                  </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={saving}
                  className={`group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${
                    saving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Success Loading Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-neutral-200 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật vị trí công việc thành công!</h3>
              <p className="text-sm text-neutral-600">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

