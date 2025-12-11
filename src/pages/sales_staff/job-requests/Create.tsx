import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import { jobRequestService, JobRequestStatus } from "../../../services/JobRequest";
import { skillService, type Skill } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { projectService, type Project } from "../../../services/Project";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from "../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import { locationService, type Location } from "../../../services/location";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import {
  ArrowLeft,
  Plus,
  Save,
  Briefcase,
  Users,
  DollarSign,
  Target,
  FileText,
  CheckSquare,
  Building2,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";
import { WorkingMode } from "../../../constants/WORKING_MODE";
import { notificationService, NotificationPriority, NotificationType } from "../../../services/Notification";
import { userService } from "../../../services/User";
import { decodeJWT } from "../../../services/Auth";
import { useAuth } from "../../../context/AuthContext";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";

export default function JobRequestCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    jobRoleLevelId: "",
    applyProcessTemplateId: "",
    title: "",
    description: "",
    requirements: "",
    quantity: 1,
    status: JobRequestStatus.Pending as number,
    workingMode: WorkingMode.None as number,
    locationId: "",
    skillIds: [] as number[],
  });

  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [applyTemplates, setApplyTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [skillGroupQuery, setSkillGroupQuery] = useState<string>("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);

  // Phân trang kỹ năng: 16 kỹ năng mỗi trang
  const SKILLS_PER_PAGE = 16;
  const [skillPage, setSkillPage] = useState(1);

  const filteredSkills = allSkills.filter(skill => {
    const matchesName = skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
    const matchesGroup = !selectedSkillGroupId || skill.skillGroupId === selectedSkillGroupId;
    return matchesName && matchesGroup;
  });

  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [companySearch, setCompanySearch] = useState<string>("");
  const filteredCompanies = companies.filter(c =>
    !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase())
  );
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [applyTemplateSearch, setApplyTemplateSearch] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isApplyTemplateDropdownOpen, setIsApplyTemplateDropdownOpen] = useState(false);
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<string>("");
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState(false);
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);

  const filteredSkillGroups = skillGroups.filter(group =>
    group.name.toLowerCase().includes(skillGroupQuery.toLowerCase())
  );

  const totalSkillPages = Math.max(1, Math.ceil(filteredSkills.length / SKILLS_PER_PAGE));
  const startIndexSkills = (skillPage - 1) * SKILLS_PER_PAGE;
  const paginatedSkills = filteredSkills.slice(startIndexSkills, startIndexSkills + SKILLS_PER_PAGE);

  const handleSkillGroupSelect = (groupId?: number) => {
    setSelectedSkillGroupId(groupId);
    setIsSkillGroupDropdownOpen(false);
    setSkillGroupQuery(groupId ? (skillGroups.find(group => group.id === groupId)?.name ?? "") : "");
  };
  const updateField = (field: "description" | "requirements", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // Gửi thông báo đến TA (HR) - FE hiển thị "TA" nhưng backend vẫn dùng role "HR"
  const sendNotificationToHR = useCallback(async (jobRequestId: number | null, jobTitle: string) => {
    try {
      // Backend đã đổi role từ "HR" sang "TA"
      const taUsersResponse = await userService.getAll({ role: "TA", excludeDeleted: true, pageNumber: 1, pageSize: 100 });
      const taUserIds = (taUsersResponse.items || [])
        .filter((u) => (u.roles || []).some((role) => role === "TA")) // Filter theo role "TA" (backend đã đổi)
        .map((u) => String(u.id)) // Đảm bảo là string
        .filter(Boolean);

      if (!taUserIds.length) {
        console.warn("⚠️ Không tìm thấy TA staff để gửi thông báo");
        return;
      }

      const token = localStorage.getItem("accessToken");
      const decoded = token ? decodeJWT(token) : null;
      const creatorName = user?.name || decoded?.unique_name || decoded?.email || "Nhân viên Sales";

      const notification = await notificationService.create({
        title: "Yêu cầu tuyển dụng mới",
        message: `${creatorName} vừa tạo yêu cầu tuyển dụng "${jobTitle}". Vui lòng kiểm tra và duyệt yêu cầu này.`,
        type: NotificationType.JobStatusChanged,
        priority: NotificationPriority.Medium,
        userIds: taUserIds,
        entityType: "JobRequest",
        entityId: jobRequestId ?? undefined,
        actionUrl: jobRequestId ? `/ta/job-requests/${jobRequestId}` : undefined,
        metaData: {
          jobTitle,
          createdBy: creatorName?.toString() ?? "Sales",
        },
      });
      console.log("✅ Notification created for TA staff:", notification);
    } catch (notifyError) {
      console.error("❌ Không thể gửi thông báo tới TA:", notifyError);
    }
  }, [user]);

  // Pre-fill form from query params (from Contact Inquiry)
  useEffect(() => {
    const contactInquiryId = searchParams.get('contactInquiryId');
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const requirements = searchParams.get('requirements');
    const company = searchParams.get('company');

    if (contactInquiryId) {
      // Pre-fill form with data from contact inquiry
      setForm(prev => ({
        ...prev,
        title: title ? decodeURIComponent(title) : prev.title,
        description: description ? decodeURIComponent(description) : prev.description,
        requirements: requirements ? decodeURIComponent(requirements) : prev.requirements,
      }));

      // If company name is provided, try to find and select it
      if (company && companies.length > 0) {
        const companyName = decodeURIComponent(company);
        const foundCompany = companies.find(c => 
          c.name.toLowerCase() === companyName.toLowerCase()
        );
        if (foundCompany) {
          setSelectedClientId(foundCompany.id);
          setCompanySearch(foundCompany.name);
        }
      }
    }
  }, [searchParams, companies]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skills, projectsData, jobRoleLevelsData, jobRolesData, locs, apts, skillGroupsData] = await Promise.all([
          skillService.getAll(),
          projectService.getAll(),
          jobRoleLevelService.getAll(),
          jobRoleService.getAll(),
          locationService.getAll(),
          applyProcessTemplateService.getAll(),
          skillGroupService.getAll({ excludeDeleted: true }),
        ]);
        setAllSkills(skills);
        setProjects(projectsData);
        setJobRoleLevels(jobRoleLevelsData);
        setJobRoles(jobRolesData);
        setLocations(locs);
        setApplyTemplates(apts);
        const groups = Array.isArray(skillGroupsData)
          ? skillGroupsData
          : Array.isArray((skillGroupsData as any)?.items)
            ? (skillGroupsData as any).items
            : Array.isArray((skillGroupsData as any)?.data)
              ? (skillGroupsData as any).data
              : [];
        setSkillGroups(groups);
      } catch (error) {
        console.error("❌ Error loading data", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await clientCompanyService.getAll({ excludeDeleted: true });
        const list = Array.isArray(result)
          ? result
          : Array.isArray((result as any)?.items)
            ? (result as any).items
            : Array.isArray((result as any)?.data)
              ? (result as any).data
              : [];
        setCompanies(list as ClientCompany[]);
      } catch (err) {
        console.error("❌ Lỗi tải công ty khách hàng:", err);
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);



  // Reset jobRoleLevelId khi filter jobRole thay đổi và jobRoleLevelId hiện tại không thuộc jobRole đã filter
  useEffect(() => {
    if (form.jobRoleLevelId && selectedJobRoleFilterId) {
      const selectedJRL = jobRoleLevels.find(j => j.id.toString() === form.jobRoleLevelId);
      if (selectedJRL && selectedJRL.jobRoleId !== selectedJobRoleFilterId) {
        setForm(prev => ({ ...prev, jobRoleLevelId: "" }));
        setSelectedJobRoleFilterId(undefined);
        setSelectedJobRoleLevelName("");
        setSelectedLevel(undefined);
      }
    }
  }, [selectedJobRoleFilterId, form.jobRoleLevelId, jobRoleLevels]);

  // Sync selectedJobRoleLevelName và selectedLevel khi jobRoleLevelId thay đổi
  useEffect(() => {
    if (form.jobRoleLevelId && jobRoleLevels.length > 0) {
      const selectedJRL = jobRoleLevels.find(j => j.id.toString() === form.jobRoleLevelId);
      if (selectedJRL) {
        setSelectedJobRoleLevelName(selectedJRL.name);
        setSelectedLevel(selectedJRL.level);
        setSelectedJobRoleFilterId(selectedJRL.jobRoleId);
      }
    } else if (!form.jobRoleLevelId) {
      setSelectedJobRoleLevelName("");
      setSelectedLevel(undefined);
    }
  }, [form.jobRoleLevelId, jobRoleLevels]);

  // Tự động tìm jobRoleLevelId khi chọn cả name và level
  useEffect(() => {
    if (selectedJobRoleLevelName && selectedLevel !== undefined) {
      const matchingJRL = jobRoleLevels.find(jrl => 
        jrl.name === selectedJobRoleLevelName && jrl.level === selectedLevel
      );
      if (matchingJRL && form.jobRoleLevelId !== matchingJRL.id.toString()) {
        setForm(prev => ({ ...prev, jobRoleLevelId: matchingJRL.id.toString() }));
        setSelectedJobRoleFilterId(matchingJRL.jobRoleId);
      }
    } else if (!selectedJobRoleLevelName || selectedLevel === undefined) {
      if (form.jobRoleLevelId) {
        setForm(prev => ({ ...prev, jobRoleLevelId: "" }));
      }
    }
  }, [selectedJobRoleLevelName, selectedLevel, jobRoleLevels]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "jobRoleLevelId") {
      const lvl = jobRoleLevels.find(j => j.id.toString() === value);
      if (lvl) {
        // Tự động điền vào ô lọc loại vị trí
        setSelectedJobRoleFilterId(lvl.jobRoleId);
      } else {
        setSelectedJobRoleFilterId(undefined);
      }
    }
  };

  // Company/Project selection được xử lý trực tiếp trong popover, nên không cần handler riêng cho <select>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo yêu cầu tuyển dụng mới không?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate các trường bắt buộc
    if (!form.title || form.title.trim() === "") {
      setError("⚠️ Vui lòng nhập tiêu đề yêu cầu.");
      setLoading(false);
      return;
    }

    if (!form.projectId || Number(form.projectId) <= 0) {
      setError("⚠️ Vui lòng chọn dự án.");
      setLoading(false);
      return;
    }

    if (!form.jobRoleLevelId || Number(form.jobRoleLevelId) <= 0) {
      setError("⚠️ Vui lòng chọn vị trí tuyển dụng.");
      setLoading(false);
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError("⚠️ Vui lòng nhập số lượng (phải lớn hơn 0).");
      setLoading(false);
      return;
    }

    if (!form.workingMode || Number(form.workingMode) === 0) {
      setError("⚠️ Vui lòng chọn chế độ làm việc.");
      setLoading(false);
      return;
    }

    if (!form.applyProcessTemplateId || Number(form.applyProcessTemplateId) <= 0) {
      setError("⚠️ Vui lòng chọn mẫu quy trình ứng tuyển.");
      setLoading(false);
      return;
    }

    if (!form.skillIds || form.skillIds.length === 0) {
      setError("⚠️ Vui lòng chọn ít nhất một kỹ năng yêu cầu.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        projectId: Number(form.projectId),
        jobRoleLevelId: Number(form.jobRoleLevelId),
        applyProcessTemplateId: form.applyProcessTemplateId ? Number(form.applyProcessTemplateId) : undefined,
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        quantity: Number(form.quantity),
        locationId: form.locationId ? Number(form.locationId) : undefined,
        workingMode: Number(form.workingMode) as WorkingMode,
        status: Number(form.status) as JobRequestStatus,
        skillIds: form.skillIds,
      };

      const createdJobRequest = await jobRequestService.create(payload);

      if (createdJobRequest?.id) {
        await sendNotificationToHR(createdJobRequest.id, payload.title);
      } else {
        await sendNotificationToHR(null, payload.title);
      }
      setSuccess(true);
      setTimeout(() => navigate("/sales/job-requests"), 1500);
    } catch (err) {
      console.error("❌ Error creating Job Request:", err);
      setError("Không thể tạo yêu cầu tuyển dụng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const projectsFiltered = selectedClientId
    ? projects.filter(p => p.clientCompanyId === selectedClientId)
    : projects;
  const projectsFilteredBySearch = projectsFiltered.filter(p =>
    !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const locationsFiltered = locations.filter(l =>
    !locationSearch || l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );
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
  const applyTemplatesFiltered = applyTemplates.filter(t =>
    !applyTemplateSearch || t.name.toLowerCase().includes(applyTemplateSearch.toLowerCase())
  );

  const contactInquiryId = searchParams.get('contactInquiryId');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/sales/job-requests"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo yêu cầu tuyển dụng mới</h1>
              <p className="text-neutral-600 mb-4">
                Nhập thông tin chi tiết để tạo yêu cầu tuyển dụng cho khách hàng
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">
                  Tạo yêu cầu tuyển dụng mới
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner when pre-filled from Contact Inquiry */}
        {contactInquiryId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-900 font-medium mb-1">Thông tin đã được điền sẵn từ Yêu Cầu Liên Hệ</p>
              <p className="text-blue-700 text-sm">
                Mô tả công việc và Yêu cầu ứng viên đã được tự động điền từ nội dung yêu cầu liên hệ. 
                Bạn có thể chỉnh sửa các trường này nếu cần.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Tiêu đề */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tiêu đề yêu cầu <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="VD: Senior Backend Developer cho dự án Fintech"
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Công ty khách hàng (popover) */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Công ty khách hàng
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCompanyDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <span>
                          {selectedClientId
                            ? companies.find(c => c.id === selectedClientId)?.name || "Chọn công ty"
                            : "Chọn công ty"}
                        </span>
                      </div>
                    </button>
                    {isCompanyDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                              placeholder="Tìm công ty..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId(0);
                              setCompanySearch("");
                              setForm(prev => ({ ...prev, projectId: "", jobRoleLevelId: "" }));
                              setIsCompanyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              selectedClientId === 0
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả công ty
                          </button>
                          {filteredCompanies.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy công ty phù hợp</p>
                          ) : (
                            filteredCompanies.map(c => (
                              <button
                                type="button"
                                key={c.id}
                                onClick={() => {
                                  setSelectedClientId(c.id);
                                  setForm(prev => ({ ...prev, projectId: "", jobRoleLevelId: "" }));
                                  setIsCompanyDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedClientId === c.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {c.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Dự án (popover) */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Dự án <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProjectDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left المقالة focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Layers className="w-4 h-4 text-neutral-400" />
                        <span>
                          {form.projectId
                            ? projects.find(p => p.id.toString() === form.projectId)?.name || "Chọn dự án"
                            : "Chọn dự án"}
                        </span>
                      </div>
                    </button>
                    {isProjectDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={projectSearch}
                              onChange={(e) => setProjectSearch(e.target.value)}
                              placeholder="Tìm dự án..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, projectId: "" }));
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !form.projectId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả dự án
                          </button>
                          {projectsFilteredBySearch.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy dự án phù hợp</p>
                          ) : (
                            projectsFilteredBySearch.map(p => {
                              // Normalize status để so sánh chính xác (case-insensitive)
                              const normalizedStatus = (p.status || "").trim();
                              
                              // Chỉ cho phép chọn dự án nếu status là "Ongoing"
                              const isDisabled = normalizedStatus.toLowerCase() !== "ongoing";
                              
                              // Map status sang tiếng Việt (case-insensitive)
                              const getStatusLabel = (status: string): string => {
                                if (!status) return "Không xác định";
                                const normalized = status.trim().toLowerCase();
                                const statusMap: Record<string, string> = {
                                  "ongoing": "Đang thực hiện",
                                  "onhold": "Tạm dừng",
                                  "on hold": "Tạm dừng",
                                  "completed": "Hoàn thành",
                                  "planned": "Đã lên kế hoạch"
                                };
                                return statusMap[normalized] || status.trim() || "Không xác định";
                              };
                              const statusLabel = getStatusLabel(p.status);
                              
                              return (
                                <button
                                  type="button"
                                  key={p.id}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setForm(prev => ({ ...prev, projectId: p.id.toString() }));
                                      setSelectedClientId(p.clientCompanyId);
                                      // Reset job role level khi chọn project mới
                                      setForm(prev => ({ ...prev, jobRoleLevelId: "" }));
                                      setIsProjectDropdownOpen(false);
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed text-neutral-400"
                                      : form.projectId === p.id.toString()
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                  title={isDisabled ? `Dự án này đang ở trạng thái "${statusLabel}" nên không thể chọn. Chỉ có thể chọn dự án đang thực hiện.` : ""}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{p.name}</span>
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                      normalizedStatus.toLowerCase() === "ongoing" 
                                        ? "bg-green-100 text-green-700"
                                        : normalizedStatus.toLowerCase() === "onhold"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : normalizedStatus.toLowerCase() === "completed"
                                        ? "bg-blue-100 text-blue-700"
                                        : normalizedStatus.toLowerCase() === "planned"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-neutral-100 text-neutral-700"
                                    }`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                    {/* Company info readonly when project selected */}
                    {selectedClientId ? (
                      <div className="mt-2 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                        <p className="text-xs font-semibold text-neutral-600 mb-1">Công ty liên kết</p>
                        {(() => {
                          const company = companies.find(c => c.id === selectedClientId);
                          return company ? (
                            <div className="text-sm text-neutral-800 space-y-0.5">
                              <div><span className="font-medium">Tên:</span> {company.name}</div>
                              {company.contactPerson && (
                                <div><span className="font-medium">Người đại diện:</span> {company.contactPerson}</div>
                              )}
                              {company.email && (
                                <div><span className="font-medium">Email:</span> {company.email}</div>
                              )}
                              {company.phone && (
                                <div><span className="font-medium">Điện thoại:</span> {company.phone}</div>
                              )}
                              {company.address && (
                                <div><span className="font-medium">Địa chỉ:</span> {company.address}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-neutral-500">Không tìm thấy thông tin công ty.</div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Mẫu quy trình ứng tuyển - popover */}
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mẫu quy trình ứng tuyển <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsApplyTemplateDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <span>
                          {form.applyProcessTemplateId
                            ? applyTemplates.find(t => t.id.toString() === form.applyProcessTemplateId)?.name || "Chọn quy trình"
                            : "Chọn quy trình"}
                        </span>
                      </div>
                    </button>
                    {isApplyTemplateDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={applyTemplateSearch}
                              onChange={(e) => setApplyTemplateSearch(e.target.value)}
                              placeholder="Tìm quy trình..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, applyProcessTemplateId: "" }));
                              setIsApplyTemplateDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !form.applyProcessTemplateId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả quy trình
                          </button>
                          {applyTemplatesFiltered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy quy trình phù hợp</p>
                          ) : (
                            applyTemplatesFiltered.map(t => (
                              <button
                                type="button"
                                key={t.id}
                                onClick={() => {
                                  setForm(prev => ({ ...prev, applyProcessTemplateId: t.id.toString() }));
                                  setIsApplyTemplateDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  form.applyProcessTemplateId === t.id.toString()
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {t.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          {/* (đã bỏ Chi tiết dự án; Mẫu CV được đưa vào Thông tin cơ bản) */}

          {/* Job Details */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-accent-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Chi tiết yêu cầu</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Số lượng */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min={1}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    required
                  />
                </div>

                {/* Chế độ làm việc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Chế độ làm việc <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="workingMode"
                    value={form.workingMode}
                    onChange={handleChange}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white"
                    required
                  >
                    <option value={WorkingMode.None}>Không xác định</option>
                    <option value={WorkingMode.Onsite}>Tại văn phòng</option>
                    <option value={WorkingMode.Remote}>Từ xa</option>
                    <option value={WorkingMode.Hybrid}>Kết hợp</option>
                    <option value={WorkingMode.Flexible}>Linh hoạt</option>
                  </select>
                </div>

                {/* Khu vực làm việc (popover) */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Khu vực làm việc
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsLocationDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <span>
                          {form.locationId
                            ? locations.find(l => l.id.toString() === form.locationId)?.name || "Chọn khu vực làm việc"
                            : "Chọn khu vực làm việc"}
                        </span>
                      </div>
                    </button>
                    {isLocationDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl">
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              placeholder="Tìm khu vực..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, locationId: "" }));
                              setIsLocationDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !form.locationId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả khu vực
                          </button>
                          {locationsFiltered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy khu vực phù hợp</p>
                          ) : (
                            locationsFiltered.map(l => (
                              <button
                                type="button"
                                key={l.id}
                                onClick={() => {
                                  setForm(prev => ({ ...prev, locationId: l.id.toString() }));
                                  setIsLocationDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  form.locationId === l.id.toString()
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {l.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vị trí tuyển dụng (Job Role Level) - tách thành 2 dropdown */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Vị trí tuyển dụng <span className="text-red-500">*</span>
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
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isJobRoleFilterDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isJobRoleFilterDropdownOpen && (
                        <div 
                          className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
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
                    {/* Dropdown 1: Vị trí (Name) */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Vị trí <span className="text-red-500">*</span>
                      </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsJobRoleLevelNameDropdownOpen(prev => !prev)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                      >
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                          <Users className="w-4 h-4 text-neutral-400" />
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
                            setIsJobRoleLevelNameDropdownOpen(false);
                            setJobRoleLevelNameSearch("");
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-3 border-b border-neutral-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                              <input
                                type="text"
                                value={jobRoleLevelNameSearch}
                                onChange={(e) => setJobRoleLevelNameSearch(e.target.value)}
                                placeholder="Tìm vị trí..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {(() => {
                              // Lấy danh sách unique names từ jobRoleLevels, có thể filter theo jobRole
                              let uniqueNames = Array.from(new Set(jobRoleLevels.map(jrl => jrl.name)));
                              // Filter theo loại vị trí nếu có
                              if (selectedJobRoleFilterId) {
                                const filteredByJobRole = jobRoleLevels.filter(l => l.jobRoleId === selectedJobRoleFilterId);
                                uniqueNames = Array.from(new Set(filteredByJobRole.map(jrl => jrl.name)));
                              }
                              const filtered = (jobRoleLevelNameSearch || "")
                                ? uniqueNames.filter(name => name.toLowerCase().includes(jobRoleLevelNameSearch.toLowerCase()))
                                : uniqueNames;
                              if (filtered.length === 0) {
                                return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                              }
                              return filtered.map((name) => {
                                // Tìm jobRoleLevel đầu tiên có name này để lấy jobRoleId
                                const firstJRL = jobRoleLevels.find(jrl => jrl.name === name);
                                return (
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
                                      setForm(prev => ({ ...prev, jobRoleLevelId: "" }));
                                      // Tự động điền vào ô lọc loại vị trí
                                      if (firstJRL) {
                                        setSelectedJobRoleFilterId(firstJRL.jobRoleId);
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
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown 2: Cấp độ (Level) */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Cấp độ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedJobRoleLevelName) {
                            setIsLevelDropdownOpen(prev => !prev);
                          }
                        }}
                        disabled={!selectedJobRoleLevelName}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                          !selectedJobRoleLevelName ? 'opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200' : 'border-neutral-200 focus:border-primary-500 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-neutral-500" />
                          <span className={selectedLevel !== undefined ? "font-medium text-neutral-900" : "text-neutral-500"}>
                            {selectedLevel !== undefined ? getLevelText(selectedLevel) : "Chọn cấp độ"}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isLevelDropdownOpen && selectedJobRoleLevelName && (
                        <div 
                          className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                          onMouseLeave={() => {
                            setIsLevelDropdownOpen(false);
                          }}
                        >
                          <div className="max-h-56 overflow-y-auto">
                            {(() => {
                              // Lấy các level có sẵn cho name đã chọn
                              const availableLevels = jobRoleLevels
                                .filter(jrl => jrl.name === selectedJobRoleLevelName)
                                .map(jrl => jrl.level)
                                .filter((level, idx, self) => self.indexOf(level) === idx); // Unique levels
                              
                              if (availableLevels.length === 0) {
                                return <p className="px-4 py-3 text-sm text-neutral-500">Không có cấp độ nào cho vị trí này</p>;
                              }
                              
                              return availableLevels.map((level) => {
                                // Tìm JobRoleLevel có name và level tương ứng
                                const matchingJRL = jobRoleLevels.find(jrl => 
                                  jrl.name === selectedJobRoleLevelName && jrl.level === level
                                );
                                
                                return (
                                  <button
                                    type="button"
                                    key={level}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (matchingJRL) {
                                        setSelectedLevel(level);
                                        setForm(prev => ({ ...prev, jobRoleLevelId: matchingJRL.id.toString() }));
                                        setSelectedJobRoleFilterId(matchingJRL.jobRoleId);
                                        setIsLevelDropdownOpen(false);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      selectedLevel === level
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {getLevelText(level)}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    {!selectedJobRoleLevelName && (
                      <p className="text-xs text-neutral-400 mt-1">Vui lòng chọn vị trí trước</p>
                    )}
                  </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mô tả công việc */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <FileText className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Mô tả công việc</h3>
                </div>
              </div>
              <div className="p-6">
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => updateField("description", val)}
                  placeholder="Nhập mô tả chi tiết về công việc..."
                />
              </div>
            </div>

            {/* Yêu cầu ứng viên */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-accent-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Yêu cầu ứng viên</h3>
                </div>
              </div>
              <div className="p-6">
                <RichTextEditor
                  value={form.requirements}
                  onChange={(val) => updateField("requirements", val)}
                  placeholder="Nhập yêu cầu cụ thể cho ứng viên..."
                />
              </div>
            </div>
          </div>

          {/* Skills Selection */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-warning-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Kỹ năng yêu cầu <span className="text-red-500">*</span></h3>
                <div className="ml-auto">
                  <span className="text-sm text-neutral-500">
                    Đã chọn: {form.skillIds.length} kỹ năng
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="text"
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm kỹ năng..."
                    className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-primary-500 bg-white"
                  />
                  {skillSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSkillSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label="Xoá tìm kiếm kỹ năng"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="relative w-full lg:w-72">
                  <button
                    type="button"
                    onClick={() => setIsSkillGroupDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Filter className="w-4 h-4 text-neutral-400" />
                      <span>
                        {selectedSkillGroupId
                          ? skillGroups.find(group => group.id === selectedSkillGroupId)?.name || "Nhóm kỹ năng"
                          : "Tất cả nhóm kỹ năng"}
                      </span>
                    </div>
                  </button>
                  {isSkillGroupDropdownOpen && (
                    <div 
                      className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                      onMouseLeave={() => {
                        setIsSkillGroupDropdownOpen(false);
                        setSkillGroupQuery("");
                      }}
                    >
                      <div className="p-3 border-b border-neutral-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={skillGroupQuery}
                            onChange={(e) => setSkillGroupQuery(e.target.value)}
                            placeholder="Tìm nhóm kỹ năng..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => handleSkillGroupSelect(undefined)}
                          className={`w-full text-left px-4 py-2.5 text-sm ${selectedSkillGroupId === undefined
                            ? "bg-primary-50 text-primary-700"
                            : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                        >
                          Tất cả nhóm kỹ năng
                        </button>
                        {skillGroups.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Đang tải nhóm kỹ năng...</p>
                        ) : filteredSkillGroups.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-500">Không có nhóm phù hợp</p>
                        ) : (
                          filteredSkillGroups.map(group => (
                            <button
                              type="button"
                              key={group.id}
                              onClick={() => handleSkillGroupSelect(group.id)}
                              className={`w-full text-left px-4 py-2.5 text-sm ${selectedSkillGroupId === group.id
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                            >
                              {group.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hiển thị các kỹ năng đã chọn */}
              {form.skillIds.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Kỹ năng đã chọn ({form.skillIds.length})</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skillIds.map(skillId => {
                      const skill = allSkills.find(s => s.id === skillId);
                      if (!skill) return null;
                      return (
                        <div
                          key={skillId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-300 rounded-lg text-primary-800"
                        >
                          <span className="text-sm font-medium">{skill.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                skillIds: prev.skillIds.filter(id => id !== skillId),
                              }));
                            }}
                            className="text-primary-600 hover:text-primary-800 transition-colors"
                            aria-label={`Xóa kỹ năng ${skill.name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtered Skills Grid với phân trang */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {paginatedSkills.map(skill => (
                  <label
                    key={skill.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${form.skillIds.includes(skill.id)
                      ? "bg-gradient-to-r from-primary-50 to-primary-100 border-primary-300 text-primary-800"
                      : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      value={skill.id}
                      checked={form.skillIds.includes(skill.id)}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setForm(prev => ({
                          ...prev,
                          skillIds: e.target.checked
                            ? [...prev.skillIds, value]
                            : prev.skillIds.filter(id => id !== value),
                        }));
                      }}
                      className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium group-hover:scale-105 transition-transform duration-300">
                      {skill.name}
                    </span>
                  </label>
                ))}
              </div>

              {allSkills.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Không có kỹ năng nào</p>
                  <p className="text-neutral-400 text-sm mt-1">Liên hệ admin để thêm kỹ năng mới</p>
                </div>
              )}

              {allSkills.length > 0 && filteredSkills.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Không tìm thấy kỹ năng nào</p>
                  <p className="text-neutral-400 text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}

              {/* Skill pagination controls */}
              {filteredSkills.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-600">
                  <span>
                    Trang {skillPage} / {totalSkillPages} (Hiển thị {paginatedSkills.length} / {filteredSkills.length} kỹ năng)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSkillPage(prev => Math.max(1, prev - 1))}
                      disabled={skillPage === 1}
                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        skillPage === 1
                          ? "border-neutral-200 text-neutral-300 cursor-not-allowed"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkillPage(prev => Math.min(totalSkillPages, prev + 1))}
                      disabled={skillPage === totalSkillPages}
                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        skillPage === totalSkillPages
                          ? "border-neutral-200 text-neutral-300 cursor-not-allowed"
                          : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          {(error || success) && (
            <div className="animate-fade-in">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    ✅ Tạo yêu cầu thành công! Đang chuyển hướng...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to="/sales/job-requests"
              className="group flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 hover:scale-105 transform"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Tạo yêu cầu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

