import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentJobRoleLevelService, type TalentJobRoleLevelCreate } from "../../../services/TalentJobRoleLevel";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from "../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import { Button } from "../../../components/ui/button";
import { 
  Save, 
  X, 
  Target, 
  AlertCircle,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";

export default function TalentJobRoleLevelEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allJobRoleLevels, setAllJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [talentId, setTalentId] = useState<number>(0);
  const [existingJobRoleLevelIds, setExistingJobRoleLevelIds] = useState<number[]>([]);
  const [currentJobRoleLevelId, setCurrentJobRoleLevelId] = useState<number>(0);
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  // State cho dropdown tách riêng: Vị trí (name) và Cấp độ (level)
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<string>("");
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState(false);
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<TalentJobRoleLevelCreate>({
    talentId: 0,
    jobRoleLevelId: 0,
    yearsOfExp: 0,
  });

  const [loading, setLoading] = useState(true);
  
  // Ref để tránh vòng lặp vô hạn giữa các useEffect
  const isSyncingFromJobRoleLevelId = useRef(false);
  const isSyncingFromNameLevel = useRef(false);

  // 🧭 Load dữ liệu Talent Job Role Level
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await talentJobRoleLevelService.getById(Number(id));

        setFormData({
          talentId: data.talentId,
          jobRoleLevelId: data.jobRoleLevelId,
          yearsOfExp: data.yearsOfExp || 0,
        });
        setTalentId(data.talentId);
        setCurrentJobRoleLevelId(data.jobRoleLevelId);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin vị trí công việc!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🧭 Load danh sách Job Role Levels
  useEffect(() => {
    const fetchJobRoleLevels = async () => {
      try {
        const [jobRoleLevels, jobRolesData] = await Promise.all([
          jobRoleLevelService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll()
        ]);
        setAllJobRoleLevels(jobRoleLevels);
        setJobRoles(jobRolesData);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách vị trí công việc:", err);
      }
    };
    fetchJobRoleLevels();
  }, []);

  // Fetch existing job role levels for this talent to disable them in dropdown (except current one)
  useEffect(() => {
    const fetchExistingJobRoleLevels = async () => {
      if (!talentId) return;
      try {
        const existingJobRoleLevels = await talentJobRoleLevelService.getAll({ talentId: talentId, excludeDeleted: true });
        // Exclude current job role level ID from disabled list
        const jobRoleLevelIds = existingJobRoleLevels
          .map((jrl: { jobRoleLevelId: number }) => jrl.jobRoleLevelId)
          .filter((id: number) => id > 0 && id !== currentJobRoleLevelId);
        setExistingJobRoleLevelIds(jobRoleLevelIds);
      } catch (error) {
        console.error("❌ Error loading existing job role levels", error);
      }
    };
    fetchExistingJobRoleLevels();
  }, [talentId, currentJobRoleLevelId]);

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

  const filteredJobRoles = jobRoles.filter(role =>
    !jobRoleFilterSearch || role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
  );

  const filteredJobRoleLevels = allJobRoleLevels.filter(jrl => {
    const matchesJobRole = !selectedJobRoleFilterId || jrl.jobRoleId === selectedJobRoleFilterId;
    return matchesJobRole;
  });

  // Reset jobRoleLevelId khi filter jobRole thay đổi
  useEffect(() => {
    if (formData.jobRoleLevelId && selectedJobRoleFilterId) {
      const selectedLevel = allJobRoleLevels.find(j => j.id === formData.jobRoleLevelId);
      if (selectedLevel && selectedLevel.jobRoleId !== selectedJobRoleFilterId) {
        setFormData(prev => ({ ...prev, jobRoleLevelId: 0 }));
      }
    }
  }, [selectedJobRoleFilterId, formData.jobRoleLevelId, allJobRoleLevels]);

  // Tự động điền vào ô lọc loại vị trí khi chọn vị trí hoặc load dữ liệu
  useEffect(() => {
    if (formData.jobRoleLevelId && allJobRoleLevels.length > 0) {
      const selectedLevel = allJobRoleLevels.find(j => j.id === formData.jobRoleLevelId);
      if (selectedLevel && selectedJobRoleFilterId !== selectedLevel.jobRoleId) {
        setSelectedJobRoleFilterId(selectedLevel.jobRoleId);
      }
    }
  }, [formData.jobRoleLevelId, allJobRoleLevels]);

  // Sync giữa jobRoleLevelId và selectedJobRoleLevelName/selectedLevel
  useEffect(() => {
    if (isSyncingFromNameLevel.current) {
      isSyncingFromNameLevel.current = false;
      return;
    }
    
    if (formData.jobRoleLevelId && formData.jobRoleLevelId > 0 && allJobRoleLevels.length > 0) {
      const jobRoleLevel = allJobRoleLevels.find(j => j.id === formData.jobRoleLevelId);
      if (jobRoleLevel) {
        // Chỉ update nếu giá trị khác với giá trị hiện tại
        if (selectedJobRoleLevelName !== jobRoleLevel.name || selectedLevel !== jobRoleLevel.level) {
          isSyncingFromJobRoleLevelId.current = true;
          setSelectedJobRoleLevelName(jobRoleLevel.name || "");
          setSelectedLevel(jobRoleLevel.level);
        }
      }
    } else if (!formData.jobRoleLevelId || formData.jobRoleLevelId === 0) {
      if (selectedJobRoleLevelName !== "" || selectedLevel !== undefined) {
        isSyncingFromJobRoleLevelId.current = true;
        setSelectedJobRoleLevelName("");
        setSelectedLevel(undefined);
      }
    }
  }, [formData.jobRoleLevelId, allJobRoleLevels]);

  // Khi chọn name hoặc level, tự động tìm jobRoleLevelId
  useEffect(() => {
    if (isSyncingFromJobRoleLevelId.current) {
      isSyncingFromJobRoleLevelId.current = false;
      return;
    }
    
    if (selectedJobRoleLevelName && selectedLevel !== undefined && allJobRoleLevels.length > 0) {
      const matchingJobRoleLevel = allJobRoleLevels.find(j => {
        return j.name === selectedJobRoleLevelName && j.level === selectedLevel;
      });
      if (matchingJobRoleLevel && matchingJobRoleLevel.id !== formData.jobRoleLevelId) {
        isSyncingFromNameLevel.current = true;
        setFormData(prev => ({ ...prev, jobRoleLevelId: matchingJobRoleLevel.id }));
        // Tự động điền vào ô lọc loại vị trí
        setSelectedJobRoleFilterId(matchingJobRoleLevel.jobRoleId);
      }
    } else if (!selectedJobRoleLevelName || selectedLevel === undefined) {
      if (formData.jobRoleLevelId && formData.jobRoleLevelId > 0) {
        isSyncingFromNameLevel.current = true;
        setFormData(prev => ({ ...prev, jobRoleLevelId: 0 }));
      }
    }
  }, [selectedJobRoleLevelName, selectedLevel, allJobRoleLevels]);

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    if (!selectedJobRoleLevelName || selectedLevel === undefined) {
      alert("⚠️ Vui lòng chọn đầy đủ vị trí và cấp độ trước khi lưu!");
      return;
    }
    // Tìm jobRoleLevelId từ name và level
    const matchingJobRoleLevel = allJobRoleLevels.find(j => {
      return j.name === selectedJobRoleLevelName && j.level === selectedLevel;
    });
    if (!matchingJobRoleLevel) {
      alert("⚠️ Không tìm thấy vị trí phù hợp!");
      return;
    }
    if (!matchingJobRoleLevel.id || matchingJobRoleLevel.id === 0) {
      alert("⚠️ Vui lòng chọn vị trí công việc trước khi lưu!");
      return;
    }

    try {
      const payload = {
        ...formData,
        jobRoleLevelId: matchingJobRoleLevel.id
      };
      console.log("Payload gửi đi:", payload);
      await talentJobRoleLevelService.update(Number(id), payload);

      alert("Cập nhật vị trí công việc thành công!");
      navigate(`/ta/talents/${talentId}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật vị trí công việc!");
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
              { label: "Chỉnh sửa vị trí công việc" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa vị trí công việc</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin vị trí công việc của talent
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa vị trí công việc
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
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin vị trí công việc</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vị trí công việc */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Vị trí công việc <span className="text-red-500">*</span>
                </label>
                
                {/* Filter theo loại vị trí */}
                <div className="mb-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsJobRoleFilterDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border border-neutral-200 rounded-lg bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        <span>
                          {selectedJobRoleFilterId
                            ? jobRoles.find(r => r.id === selectedJobRoleFilterId)?.name || "Loại vị trí"
                            : "Tất cả loại vị trí"}
                        </span>
                      </div>
                    </button>
                    {isJobRoleFilterDropdownOpen && (
                      <div 
                        className="absolute z-30 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsJobRoleFilterDropdownOpen(false);
                          setJobRoleFilterSearch("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={jobRoleFilterSearch}
                              onChange={(e) => setJobRoleFilterSearch(e.target.value)}
                              placeholder="Tìm loại vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobRoleFilterId(undefined);
                              setJobRoleFilterSearch("");
                              setIsJobRoleFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !selectedJobRoleFilterId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả loại vị trí
                          </button>
                          {filteredJobRoles.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại vị trí phù hợp</p>
                          ) : (
                            filteredJobRoles.map(role => (
                              <button
                                type="button"
                                key={role.id}
                                onClick={() => {
                                  setSelectedJobRoleFilterId(role.id);
                                  setJobRoleFilterSearch("");
                                  setIsJobRoleFilterDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleFilterId === role.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {role.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dropdown 1: Chọn Vị trí (Name) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Vị trí <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsJobRoleLevelNameDropdownOpen(!isJobRoleLevelNameDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all border-neutral-300 focus:border-primary-500"
                      >
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                          <Target className="w-4 h-4 text-neutral-400" />
                          <span className={selectedJobRoleLevelName ? "font-medium text-neutral-900" : "text-neutral-500"}>
                            {selectedJobRoleLevelName || "Chọn vị trí"}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isJobRoleLevelNameDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isJobRoleLevelNameDropdownOpen && (
                        <div 
                          className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                          onMouseLeave={() => {
                            setTimeout(() => setIsJobRoleLevelNameDropdownOpen(false), 200);
                            setJobRoleLevelNameSearch("");
                          }}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                              <input
                                type="text"
                                value={jobRoleLevelNameSearch}
                                onChange={(e) => setJobRoleLevelNameSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Tìm vị trí..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {(() => {
                              // Lấy danh sách unique names từ jobRoleLevels, có thể filter theo jobRole
                              const uniqueNames = Array.from(
                                new Set(
                                  filteredJobRoleLevels.map(j => j.name || "")
                                )
                              ).filter(name => name);
                              
                              const filtered = jobRoleLevelNameSearch
                                ? uniqueNames.filter(name => 
                                    name.toLowerCase().includes(jobRoleLevelNameSearch.toLowerCase())
                                  )
                                : uniqueNames;
                              
                              if (filtered.length === 0) {
                                return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                              }
                              
                              return filtered.map((name) => (
                                <button
                                  type="button"
                                  key={name}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedJobRoleLevelName(name);
                                    setIsJobRoleLevelNameDropdownOpen(false);
                                    setJobRoleLevelNameSearch("");
                                    // Reset level và jobRoleLevelId khi chọn name mới
                                    setSelectedLevel(undefined);
                                    setFormData(prev => ({ ...prev, jobRoleLevelId: 0 }));
                                    // Tự động điền vào ô lọc loại vị trí
                                    const firstMatch = filteredJobRoleLevels.find(j => j.name === name);
                                    if (firstMatch) {
                                      setSelectedJobRoleFilterId(firstMatch.jobRoleId);
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    selectedJobRoleLevelName === name
                                      ? "bg-primary-50 text-primary-700"
                                      : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                >
                                  {name}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown 2: Chọn Cấp độ (Level) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Cấp độ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedJobRoleLevelName) {
                            setIsLevelDropdownOpen(!isLevelDropdownOpen);
                          }
                        }}
                        disabled={!selectedJobRoleLevelName}
                        className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                          !selectedJobRoleLevelName ? 'opacity-50 cursor-not-allowed bg-neutral-50' : 'border-neutral-300 focus:border-primary-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-neutral-500" />
                          <span className={(() => {
                            if (!selectedJobRoleLevelName) {
                              return "text-neutral-400";
                            }
                            return selectedLevel !== undefined ? "font-medium text-neutral-900" : "text-neutral-500";
                          })()}>
                            {(() => {
                              if (!selectedJobRoleLevelName) {
                                return "Chọn vị trí trước";
                              }
                              return selectedLevel !== undefined ? getLevelText(selectedLevel) : "Chọn cấp độ";
                            })()}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isLevelDropdownOpen && selectedJobRoleLevelName && (
                        <div 
                          className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                          onMouseLeave={() => {
                            setTimeout(() => setIsLevelDropdownOpen(false), 200);
                          }}
                        >
                          <div className="max-h-56 overflow-y-auto">
                            {(() => {
                              // Lấy các level có sẵn cho name đã chọn
                              const availableLevels = filteredJobRoleLevels
                                .filter(j => j.name === selectedJobRoleLevelName)
                                .map(j => j.level)
                                .filter((level, idx, self) => self.indexOf(level) === idx); // Unique levels
                              
                              if (availableLevels.length === 0) {
                                return <p className="px-4 py-3 text-sm text-neutral-500">Không có cấp độ nào cho vị trí này</p>;
                              }
                              
                              return availableLevels.map((level) => {
                                // Tìm jobRoleLevel tương ứng
                                const matchingJobRoleLevel = filteredJobRoleLevels.find(j => {
                                  return j.name === selectedJobRoleLevelName && j.level === level;
                                });
                                const isDisabled = matchingJobRoleLevel ? existingJobRoleLevelIds.includes(matchingJobRoleLevel.id) : false;
                                
                                return (
                                  <button
                                    type="button"
                                    key={level}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (!isDisabled && matchingJobRoleLevel) {
                                        setSelectedLevel(level);
                                        setIsLevelDropdownOpen(false);
                                        setFormData(prev => ({ ...prev, jobRoleLevelId: matchingJobRoleLevel.id }));
                                      }
                                    }}
                                    disabled={isDisabled}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      selectedLevel === level
                                        ? "bg-primary-50 text-primary-700"
                                        : isDisabled
                                          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {getLevelText(level)}{isDisabled ? ' (đã chọn)' : ''}
                                  </button>
                                );
                              });
                            })()}
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
