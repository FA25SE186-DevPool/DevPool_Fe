import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentWorkExperienceService, type TalentWorkExperienceCreate } from "../../../services/TalentWorkExperience";
import { talentCVService, type TalentCV } from "../../../services/TalentCV";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { 
  Save, 
  X, 
  Workflow, 
  Building2, 
  Calendar,
  FileText,
  AlertCircle,
  Search,
  Target
} from "lucide-react";

export default function TalentWorkExperienceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [talentCVs, setTalentCVs] = useState<TalentCV[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [formData, setFormData] = useState<TalentWorkExperienceCreate>({
    talentId: 0,
    talentCVId: 0,
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);

  // Danh sách vị trí công việc
  const workExperiencePositions = [
    "Backend",
    "Frontend",
    "BA",
    "Fullstack Developer",
    "Mobile Developer (iOS/Android/Flutter/React Native)",
    "AI/ML Engineer",
    "Data Engineer",
    "Data Scientist",
    "DevOps Engineer",
    "Cloud Engineer",
    "QA/QC Engineer (Manual / Automation)",
    "Test Lead",
    "Solution Architect",
    "Technical Lead (Tech Lead)",
    "Software Architect"
  ];

  // State cho position dropdown
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");

  // 🧭 Load dữ liệu Talent Work Experience
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentWorkExperienceService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          talentCVId: data.talentCVId,
          company: data.company,
          position: data.position,
          startDate: data.startDate.split('T')[0], // Convert to date format
          endDate: data.endDate ? data.endDate.split('T')[0] : "",
          description: data.description,
        });
        setTalentId(data.talentId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin kinh nghiệm làm việc!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách CVs của Talent
  useEffect(() => {
    const fetchCVs = async () => {
      try {
        if (talentId > 0) {
          const cvs = await talentCVService.getAll({ talentId, excludeDeleted: true });
          // Đảm bảo cvs luôn là array - xử lý nhiều format response
          let cvsArray: TalentCV[] = [];
          if (Array.isArray(cvs)) {
            cvsArray = cvs;
          } else if (cvs && typeof cvs === 'object') {
            // Xử lý trường hợp response có dạng { data: [...] } hoặc { items: [...] }
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
        console.error("❌ Lỗi tải danh sách CV:", err);
        setTalentCVs([]);
      }
    };
    fetchCVs();
  }, [talentId]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isPositionDropdownOpen && !target.closest('.position-dropdown-container')) {
        setIsPositionDropdownOpen(false);
      }
    };

    if (isPositionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isPositionDropdownOpen]);

  // Validate start date similar to talents/Create.tsx
  const validateStartDate = (date: string): boolean => {
    if (!date) return false;
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (startDate > today) return false;
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
    return startDate >= hundredYearsAgo;
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // realtime validation for dates
    if (name === 'startDate') {
      const newErrors = { ...fieldErrors };
      if (value && !validateStartDate(value)) {
        newErrors.startDate = 'Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước)';
      } else {
        delete newErrors.startDate;
        if (formData.endDate) {
          if (new Date(formData.endDate) <= new Date(value)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
          } else {
            delete newErrors.endDate;
          }
        }
      }
      setFieldErrors(newErrors);
    }

    if (name === 'endDate') {
      const newErrors = { ...fieldErrors };
      if (value && formData.startDate) {
        if (new Date(value) <= new Date(formData.startDate)) {
          newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        } else {
          delete newErrors.endDate;
        }
      } else {
        delete newErrors.endDate;
      }
      setFieldErrors(newErrors);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "talentCVId" ? Number(value) : value,
    }));
  };

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!formData.talentCVId || formData.talentCVId === 0) {
      alert("⚠️ Vui lòng chọn CV trước khi lưu!");
      return;
    }

    if (!formData.company.trim()) {
      alert("⚠️ Vui lòng nhập tên công ty!");
      return;
    }

    if (!formData.position.trim()) {
      alert("⚠️ Vui lòng nhập vị trí làm việc!");
      return;
    }

    if (!formData.startDate) {
      alert("⚠️ Vui lòng chọn ngày bắt đầu!");
      return;
    }
    if (!validateStartDate(formData.startDate)) {
      alert("⚠️ Ngày bắt đầu không hợp lệ (không sau hiện tại, không quá 100 năm trước)!");
      return;
    }

    // Validate date logic
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("⚠️ Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    try {
      // Convert date strings to UTC ISO strings for PostgreSQL
      const updateData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };
      
      console.log("Payload gửi đi:", updateData);
      await talentWorkExperienceService.update(Number(id), updateData);

      alert("Cập nhật kinh nghiệm làm việc thành công!");
      navigate(`/ta/talents/${talentId}`, { state: { tab: 'experiences' } });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật kinh nghiệm làm việc!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: "/ta/talents" },
              { label: talentId ? `Chi tiết nhân sự` : "Chi tiết", to: `/ta/talents/${talentId}` },
              { label: "Chỉnh sửa kinh nghiệm" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa kinh nghiệm làm việc</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin kinh nghiệm làm việc của nhân sự
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa kinh nghiệm làm việc
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Workflow className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin kinh nghiệm làm việc</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
                {/* CV của nhân sự */}
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
                  >
                    <option value="0">-- Chọn CV --</option>
                    {Array.isArray(talentCVs) && talentCVs.length > 0 ? (
                      talentCVs.map(cv => (
                        <option key={cv.id} value={cv.id}>v{cv.version}</option>
                      ))
                    ) : (
                      <option disabled>Không có CV nào</option>
                    )}
                  </select>
                </div>
                {formData.talentCVId > 0 && Array.isArray(talentCVs) && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Tóm tắt: <span className="font-medium text-neutral-700">
                      {talentCVs.find(cv => cv.id === formData.talentCVId)?.summary || "Không có tóm tắt"}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Công ty */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="VD: Google, Microsoft, Facebook..."
                    required
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                  />
                </div>

                {/* Vị trí */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    Vị trí <span className="text-red-500">*</span>
                  </label>
                  <div className="relative position-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsPositionDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className={formData.position ? "text-neutral-800" : "text-neutral-500"}>
                          {formData.position || "Chọn vị trí"}
                        </span>
                      </div>
                      <span className="text-neutral-400 text-xs uppercase">Chọn</span>
                    </button>
                    {isPositionDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={positionSearch}
                              onChange={(e) => setPositionSearch(e.target.value)}
                              placeholder="Tìm vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filtered = positionSearch
                              ? workExperiencePositions.filter(p => p.toLowerCase().includes(positionSearch.toLowerCase()))
                              : workExperiencePositions;
                            if (filtered.length === 0) {
                              return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                            }
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, position: "" }));
                                    setPositionSearch("");
                                    setIsPositionDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    !formData.position
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  Chọn vị trí
                                </button>
                                {filtered.map((position) => (
                                  <button
                                    type="button"
                                    key={position}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, position }));
                                      setPositionSearch("");
                                      setIsPositionDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      formData.position === position
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {position}
                                  </button>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    const maxDate = today.toISOString().split('T')[0];
                    
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 100);
                    const minDate = hundredYearsAgo.toISOString().split('T')[0];
                    
                    return (
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={minDate}
                        max={maxDate}
                        required
                        className="w-full focus:ring-primary-500 focus:border-primary-500 rounded-xl border-neutral-200"
                      />
                    );
                  })()}
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày kết thúc (tùy chọn)
                  </label>
                  {(() => {
                    // Tính ngày tối thiểu là ngày sau ngày bắt đầu
                    let minEndDate = '';
                    if (formData.startDate) {
                      const startDate = new Date(formData.startDate);
                      startDate.setDate(startDate.getDate() + 1); // Ngày sau ngày bắt đầu
                      minEndDate = startDate.toISOString().split('T')[0];
                    }
                    
                    return (
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={minEndDate || undefined}
                        className="w-full focus:ring-primary-500 focus:border-primary-500 rounded-xl border-neutral-200"
                      />
                    );
                  })()}
                  <p className="text-xs text-neutral-500 mt-1">
                    Để trống nếu vẫn đang làm việc
                  </p>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mô tả công việc (tùy chọn)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm và thành tựu..."
                  rows={4}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/ta/talents/${talentId}`}
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <Button
              type="submit"
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
