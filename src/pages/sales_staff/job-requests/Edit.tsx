import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/sales";
import { jobRequestService, type JobRequestPayload } from "../../../services/JobRequest";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { skillService, type Skill } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from "../../../services/JobRoleLevel";
import { projectService, type Project } from "../../../services/Project";
import { locationService, type Location } from "../../../services/location";
import { applyProcessTemplateService, type ApplyProcessTemplate } from "../../../services/ApplyProcessTemplate";
import { applyProcessStepService, type ApplyProcessStep } from "../../../services/ApplyProcessStep";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import {
  Save,
  X,
  Users,
  Briefcase,
  DollarSign,
  Target,
  FileText,
  CheckSquare,
  Building2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";
import { WorkingMode } from "../../../constants/WORKING_MODE";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { clientJobRoleLevelService, type ClientJobRoleLevel } from "../../../services/ClientJobRoleLevel";
import { masterDataService } from "../../../services/MasterData";

export default function JobRequestEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]); // To store selected skills
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [_clientJobRoleLevels, setClientJobRoleLevels] = useState<ClientJobRoleLevel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [applyTemplates, setApplyTemplates] = useState<ApplyProcessTemplate[]>([]);
  const [templateStepCounts, setTemplateStepCounts] = useState<Record<number, number>>({});
  const [templateSteps, setTemplateSteps] = useState<Record<number, ApplyProcessStep[]>>({});
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [previousJobRoleLevelId, setPreviousJobRoleLevelId] = useState<number | undefined>(undefined);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [skillGroupQuery, setSkillGroupQuery] = useState("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<string>("");
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState(false);
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [showLocationField, setShowLocationField] = useState(false);
  const [isWorkingModeDropdownOpen, setIsWorkingModeDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [isApplyTemplateDropdownOpen, setIsApplyTemplateDropdownOpen] = useState(false);
  const [applyTemplateSearch, setApplyTemplateSearch] = useState<string>("");
  const [formData, setFormData] = useState<JobRequestPayload>({
    projectId: 0,
    jobRoleLevelId: 0,
    applyProcessTemplateId: undefined,
    title: "",
    description: "",
    requirements: "",
    quantity: 1,
    locationId: undefined,
    workingMode: WorkingMode.None,
    status: 0,
    skillIds: [], // To store skill ids
  });

  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [companySearch, setCompanySearch] = useState<string>("");
  const filteredCompanies = companies
    .filter(c =>
      !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // Phân trang kỹ năng: 16 kỹ năng mỗi trang
  const SKILLS_PER_PAGE = 16;
  const [skillPage, setSkillPage] = useState(1);

  const filteredSkills = allSkills.filter(skill => {
    const matchesSearch = !skillSearchQuery || skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase());
    const matchesGroup = !selectedSkillGroupId || skill.skillGroupId === selectedSkillGroupId;
    return matchesSearch && matchesGroup;
  });
  const filteredSkillGroups = skillGroups.filter(group =>
    group.name.toLowerCase().includes(skillGroupQuery.toLowerCase())
  );
  
  const filteredJobRoles = jobRoles.filter(role =>
    !jobRoleFilterSearch || role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase())
  );

  const totalSkillPages = Math.max(1, Math.ceil(filteredSkills.length / SKILLS_PER_PAGE));
  const startIndexSkills = (skillPage - 1) * SKILLS_PER_PAGE;
  const paginatedSkills = filteredSkills.slice(startIndexSkills, startIndexSkills + SKILLS_PER_PAGE);

  // Filtered apply templates
  const applyTemplatesFiltered = applyTemplates.filter(t =>
    !applyTemplateSearch || t.name.toLowerCase().includes(applyTemplateSearch.toLowerCase())
  );

  const handleSkillGroupSelect = (groupId?: number) => {
    setSelectedSkillGroupId(groupId);
    setIsSkillGroupDropdownOpen(false);
    setSkillGroupQuery(groupId ? (skillGroups.find(group => group.id === groupId)?.name ?? "") : "");
  };

  // Sync tất cả state liên quan đến job role level selection
  useEffect(() => {
    if (jobRoleLevels.length === 0) return;

    // Logic 1: Sync từ jobRoleLevelId (khi load data hoặc user select từ dropdown)
    if (formData.jobRoleLevelId) {
      const selectedJRL = jobRoleLevels.find(j => j.id === formData.jobRoleLevelId);
      if (selectedJRL) {
        // Sync các state - loại bỏ logic reset để tránh conflict
        setSelectedJobRoleLevelName(selectedJRL.name);
        setSelectedLevel(selectedJRL.level);
        // Tự động set filter nếu chưa có filter nào (gợi ý, không lock)
        if (!selectedJobRoleFilterId) {
          setSelectedJobRoleFilterId(selectedJRL.jobRoleId);
        }
      }
    } else {
      // Reset khi không có jobRoleLevelId - nhưng chỉ reset nếu user chưa chọn tên vị trí
      if (!selectedJobRoleLevelName) {
        setSelectedJobRoleLevelName("");
      }
      setSelectedLevel(undefined);
    }

    // Logic 2: Tự động tìm jobRoleLevelId khi user chọn name + level từ dropdown
    if (selectedJobRoleLevelName && selectedLevel !== undefined) {
      const matchingJRL = jobRoleLevels.find(jrl =>
        jrl.name === selectedJobRoleLevelName && jrl.level === selectedLevel
      );
      if (matchingJRL && formData.jobRoleLevelId !== matchingJRL.id) {
        setFormData(prev => ({ ...prev, jobRoleLevelId: matchingJRL.id }));
      }
    }
  }, [formData.jobRoleLevelId, selectedJobRoleFilterId, selectedJobRoleLevelName, selectedLevel, jobRoleLevels]);

  // Tự động load và check skills khi chọn jobRoleLevelId cụ thể (từ level dropdown hoặc form select)
  useEffect(() => {
    const loadSkillsForJobRoleLevel = async () => {
      // Chỉ tự động load skills khi user THAY ĐỔI job role level (không phải khi load data ban đầu)
      if (!formData.jobRoleLevelId || jobRoleLevels.length === 0) {
        return;
      }

      // Nếu đây là lần đầu tiên set jobRoleLevelId (từ load data), không load skills
      if (previousJobRoleLevelId === undefined) {
        setPreviousJobRoleLevelId(formData.jobRoleLevelId);
        return;
      }

      // Nếu jobRoleLevelId không thay đổi, không làm gì
      if (previousJobRoleLevelId === formData.jobRoleLevelId) {
        return;
      }

      try {
        const jobRoleLevelId = Number(formData.jobRoleLevelId);
        if (isNaN(jobRoleLevelId)) return;

        // Gọi API lấy skills theo jobRoleLevelId
        const response = await masterDataService.getSkillsByJobRoleLevel(jobRoleLevelId);

        if (response?.success && response?.data && Array.isArray(response.data)) {
          // Lấy danh sách skill IDs từ response
          const skillIds = response.data.map(skill => skill.id);

          // Tự động thay thế skills bằng bộ kỹ năng chuẩn của vị trí

          // Tự động check các skills này
          setFormData(prev => ({
            ...prev,
            skillIds: skillIds
          }));
          setSelectedSkills(skillIds);

          // Update previous value sau khi xử lý xong
          setPreviousJobRoleLevelId(formData.jobRoleLevelId);
        } else {
          // Fallback: tự động chọn 3 skills đầu tiên để test UI
          if (jobRoleLevelId > 0 && allSkills.length > 0) {
            const fallbackSkillIds = allSkills.slice(0, 3).map(skill => skill.id);
            setFormData(prev => ({
              ...prev,
              skillIds: fallbackSkillIds
            }));
            setSelectedSkills(fallbackSkillIds);
          }
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải skills theo vị trí:", error);
        // Nếu có lỗi, không reset skills để tránh mất dữ liệu user đã chọn
      }
    };

    loadSkillsForJobRoleLevel();
  }, [formData.jobRoleLevelId, jobRoleLevels.length, allSkills, selectedSkills, previousJobRoleLevelId]);

  // Control hiển thị ô location dựa trên working mode
  useEffect(() => {
    const shouldShowLocation = () => {
      switch (formData.workingMode) {
        case WorkingMode.Onsite: // Tại văn phòng
          return true;
        case WorkingMode.Hybrid: // Kết hợp
          return true;
        case WorkingMode.Remote: // Từ xa
          return false;
        case WorkingMode.Flexible: // Linh hoạt
          return false;
        default:
          return false;
      }
    };

    setShowLocationField(shouldShowLocation());

    // Reset locationId if the field is hidden
    if (!(formData.workingMode === WorkingMode.Onsite || formData.workingMode === WorkingMode.Hybrid)) {
      setFormData(prev => ({ ...prev, locationId: null }));
    }
  }, [formData.workingMode]);

  // Hàm load skills cho tên vị trí (gọi từ event handler)
  const loadSkillsForJobRoleName = async (jobRoleName: string) => {
    try {
      // Tìm tất cả jobRoleLevel có tên này
      const matchingJobRoleLevels = jobRoleLevels.filter(jrl => jrl.name === jobRoleName);

      if (matchingJobRoleLevels.length === 0) return;


      // Gọi API lấy skills cho từng jobRoleLevel và merge
      const allSkillPromises = matchingJobRoleLevels.map(async (jrl) => {
        try {
          const response = await masterDataService.getSkillsByJobRoleLevel(jrl.id);
          if (response?.success && response?.data && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        } catch (error) {
          console.warn(`⚠️ Lỗi tải skills cho ${jrl.name} level ${jrl.level}:`, error);
          return [];
        }
      });

      const allSkillArrays = await Promise.all(allSkillPromises);

      // Merge tất cả skills và loại bỏ trùng lặp
      const allSkillsMap = new Map();
      allSkillArrays.flat().forEach(skill => {
        allSkillsMap.set(skill.id, skill);
      });

      const mergedSkillIds = Array.from(allSkillsMap.keys());


      return mergedSkillIds;
    } catch (error) {
      console.error("❌ Lỗi khi tải skills theo tên vị trí:", error);
      return [];
    }
  };

  const handleRichTextChange = (field: "description" | "requirements", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // 🧭 Load dữ liệu Job Request
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await jobRequestService.getById(Number(id));

        const extractedSkillIds = data.jobSkills?.map((jobSkill: { skillsId: number }) => jobSkill.skillsId) || [];

        setFormData({
          projectId: data.projectId,
          jobRoleLevelId: data.jobRoleLevelId,
          applyProcessTemplateId: (data as any).applyProcessTemplateId ?? undefined,
          title: data.title,
          description: data.description ?? "",
          requirements: data.requirements ?? "",
          quantity: data.quantity,
          locationId: (data as any).locationId ?? undefined,
          workingMode: (data as any).workingMode ?? WorkingMode.None,
          status: data.status,
          skillIds: extractedSkillIds,
        });

        setSelectedSkills(extractedSkillIds);

        // Lấy clientCompanyId từ project tương ứng
        const project = projects.find(p => p.id === data.projectId);
        if (project) {
          setSelectedClientId(project.clientCompanyId);
          
          // Tự động điền thông tin từ ClientJobRoleLevel nếu có (sau khi fetch ClientJobRoleLevels)
          // Logic này sẽ được xử lý trong useEffect khi clientJobRoleLevels thay đổi
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin Job Request!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, projects]);

  // 🧭 Load danh sách Skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsData = await skillService.getAll();
        const skills = ensureArray<Skill>(skillsData);
        setAllSkills(skills);
      } catch (err) {
        console.error("❌ Lỗi tải kỹ năng:", err);
        setAllSkills([]);
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    const fetchSkillGroups = async () => {
      try {
        const response = await skillGroupService.getAll({ excludeDeleted: true });
        const groups = ensureArray<SkillGroup>(response);
        setSkillGroups(groups);
      } catch (err) {
        console.error("❌ Lỗi tải nhóm kỹ năng:", err);
        setSkillGroups([]);
      }
    };
    fetchSkillGroups();
  }, []);

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  // Load step details for all templates
  const loadTemplateStepDetails = async (templates: ApplyProcessTemplate[]) => {
    try {
      const stepCounts: Record<number, number> = {};
      const stepDetails: Record<number, ApplyProcessStep[]> = {};

      // Fetch step details for each template
      await Promise.all(
        templates.map(async (template) => {
          try {
            const steps = await applyProcessStepService.getAll({
              templateId: template.id,
              excludeDeleted: true
            });
            const stepArray = ensureArray<ApplyProcessStep>(steps);
            // Sort by stepOrder
            stepArray.sort((a, b) => a.stepOrder - b.stepOrder);

            stepCounts[template.id] = stepArray.length;
            stepDetails[template.id] = stepArray;
          } catch (error) {
            console.warn(`Failed to load steps for template ${template.id}:`, error);
            stepCounts[template.id] = 0;
            stepDetails[template.id] = [];
          }
        })
      );

      setTemplateStepCounts(stepCounts);
      setTemplateSteps(stepDetails);
    } catch (error) {
      console.error("Error loading template step details:", error);
    }
  };

  // 🧭 Load danh sách Projects, Job Role Levels, Locations, Apply Templates, Job Roles
  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [projectsData, jobPosData, locs, apts, roles] = await Promise.all([
          projectService.getAll(),
          jobRoleLevelService.getAll(),
          locationService.getAll(),
          applyProcessTemplateService.getAll(),
          jobRoleService.getAll(),
        ]);
        setProjects(ensureArray(projectsData));
        setJobRoleLevels(ensureArray(jobPosData));
        setLocations(ensureArray(locs));
        const templates = ensureArray<ApplyProcessTemplate>(apts);
        setApplyTemplates(templates);
        setJobRoles(ensureArray(roles));

        // Load step details for templates
        loadTemplateStepDetails(templates);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu tham chiếu:", err);
      }
    };
    fetchRefs();
  }, []);

  // 🧭 Load danh sách Companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await clientCompanyService.getAll({ excludeDeleted: true });
        const list = ensureArray<ClientCompany>(result);
        setCompanies(list);
      } catch (err) {
        console.error("❌ Lỗi tải công ty khách hàng:", err);
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);


  // Fetch ClientJobRoleLevels khi chọn công ty
  useEffect(() => {
    const fetchClientJobRoleLevels = async () => {
      if (!selectedClientId) {
        setClientJobRoleLevels([]);
        return;
      }
      try {
        const result = await clientJobRoleLevelService.getAll({ clientCompanyId: selectedClientId, excludeDeleted: true });
        const list = ensureArray<ClientJobRoleLevel>(result);
        setClientJobRoleLevels(list);
        
        // Tự động điền thông tin từ ClientJobRoleLevel nếu đã có jobRoleLevelId
        if (formData.jobRoleLevelId && selectedClientId) {
          (list as ClientJobRoleLevel[]).find(
            cjrl => cjrl.jobRoleLevelId === formData.jobRoleLevelId && cjrl.clientCompanyId === selectedClientId
          );
        }
      } catch (err) {
        console.error("❌ Lỗi tải vị trí tuyển dụng của công ty:", err);
        setClientJobRoleLevels([]);
      }
    };
    fetchClientJobRoleLevels();
  }, [selectedClientId]);

  // chọn Company/Project được xử lý trực tiếp trong popover, không dùng handler <select>

  // ✍️ Cập nhật dữ liệu form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const numericFields = ["quantity", "projectId", "jobRoleLevelId", "locationId", "applyProcessTemplateId"];
    const optionalNumeric = ["locationId", "applyProcessTemplateId"];

    setFormData((prev) => {
      if (name === "status" || name === "workingMode") {
        return { ...prev, [name]: Number(value) };
      }

      if (numericFields.includes(name)) {
        if (optionalNumeric.includes(name) && value === "") {
          return { ...prev, [name]: undefined };
        }
        
        // Tự động điền vào ô lọc loại vị trí khi chọn jobRoleLevelId
        if (name === "jobRoleLevelId") {
          const jobRoleLevelId = Number(value);
          const selectedLevel = jobRoleLevels.find(j => j.id === jobRoleLevelId);
          if (selectedLevel) {
            setSelectedJobRoleFilterId(selectedLevel.jobRoleId);
          } else {
            setSelectedJobRoleFilterId(undefined);
          }
        }
        
        return { ...prev, [name]: Number(value) };
      }

      return { ...prev, [name]: value };
    });
  };

  const projectsFiltered = selectedClientId
    ? projects.filter(p => p.clientCompanyId === selectedClientId)
    : projects;
  const projectsFilteredBySearch = projectsFiltered
    .filter(p =>
      !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Ưu tiên dự án "Ongoing" lên trước
      const aIsOngoing = (a.status || "").trim().toLowerCase() === "ongoing";
      const bIsOngoing = (b.status || "").trim().toLowerCase() === "ongoing";
      
      if (aIsOngoing && !bIsOngoing) return -1;
      if (!aIsOngoing && bIsOngoing) return 1;
      
      // Nếu cùng trạng thái, sắp xếp theo tên
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    });

  // 💾 Gửi form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Xác nhận trước khi lưu
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu các thay đổi không?");
    if (!confirmed) {
      return;
    }

    // Validate các trường bắt buộc
    if (!formData.title || formData.title.trim() === "") {
      alert("⚠️ Vui lòng nhập tiêu đề yêu cầu!");
      return;
    }

    // Validate format tiêu đề: [CODE_PROJECT] [LEVEL_NAME] [JOB_ROLE_NAME]
    // Chỉ bắt buộc CODE_PROJECT trong ngoặc vuông, LEVEL_NAME và JOB_ROLE_NAME có thể điền gì cũng được
    const titleRegex = /^\[([A-Z0-9\-]+)\]\s+(.+)\s+(.+)$/;
    if (!titleRegex.test(formData.title.trim())) {
      alert("⚠️ Tiêu đề phải theo format: [CODE_PROJECT] [LEVEL_NAME] [JOB_ROLE_NAME] (VD: [INNO-26-01] Junior Backend Developer)");
      return;
    }

    if (!Number(formData.projectId)) {
      alert("⚠️ Vui lòng chọn Dự án trước khi lưu!");
      return;
    }

    // Validate vị trí tuyển dụng
    if (!Number(formData.jobRoleLevelId)) {
      // Nếu đã chọn tên vị trí mà chưa chọn cấp độ
      if (selectedJobRoleLevelName) {
        alert("⚠️ Vui lòng chọn cấp độ cho vị trí đã chọn!");
        return;
      }
      // Nếu chưa chọn gì cả
      alert("⚠️ Vui lòng chọn Vị trí tuyển dụng trước khi lưu!");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      alert("⚠️ Vui lòng nhập số lượng (phải lớn hơn 0)!");
      return;
    }

    if (!formData.workingMode || Number(formData.workingMode) === 0) {
      alert("⚠️ Vui lòng chọn chế độ làm việc!");
      return;
    }

    // Validate location khi chế độ "Tại văn phòng" (bắt buộc)
    if (formData.workingMode === WorkingMode.Onsite && (!formData.locationId)) {
      alert("⚠️ Vui lòng chọn khu vực làm việc khi chế độ là 'Tại văn phòng'.");
      return;
    }

    if (!Number(formData.applyProcessTemplateId)) {
      alert("⚠️ Vui lòng chọn Quy trình Apply trước khi lưu!");
      return;
    }

    if (selectedSkills.length === 0) {
      alert("⚠️ Vui lòng chọn ít nhất một kỹ năng!");
      return;
    }

    try {
      // Gộp selectedSkills vào payload
      const payload: JobRequestPayload = {
        ...formData,
        skillIds: selectedSkills, // Include selected skills in payload
      };
      console.log("Payload gửi đi:", payload);
      await jobRequestService.update(Number(id), payload);

      // TODO: Add overlay for success message
      navigate(`/sales/job-requests/${id}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert("Không thể cập nhật yêu cầu tuyển dụng!");
    }
  };

  if (loading)
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
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
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Yêu cầu tuyển dụng", to: "/sales/job-requests" },
              { label: formData.title || "Job Request", to: `/sales/job-requests/${id}` },
              { label: "Chỉnh sửa" }
            ]}
          />
          <div className="mb-6"></div>

          <div className="flex justify_between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa yêu cầu tuyển dụng</h1>
              <p className="text-neutral-600 mb-4">
                Cập nhật thông tin yêu cầu tuyển dụng của khách hàng
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Chỉnh sửa yêu cầu tuyển dụng
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
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề yêu cầu tuyển dụng..."
                  required
                  className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
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
                      <div 
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => setIsCompanyDropdownOpen(false)}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <Input
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
                              setClientJobRoleLevels([]);
                              setFormData(prev => ({ ...prev, projectId: 0, jobRoleLevelId: 0 }));
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
                                  setFormData(prev => ({ ...prev, projectId: 0, jobRoleLevelId: 0 }));
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

                  {/* Company info readonly when company selected but no project */}
                  {selectedClientId && formData.projectId === 0 ? (
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
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Layers className="w-4 h-4 text-neutral-400" />
                        <span>
                          {formData.projectId
                            ? projects.find(p => p.id === formData.projectId)?.name || "Chọn dự án"
                            : "Chọn dự án"}
                        </span>
                      </div>
                    </button>
                    {isProjectDropdownOpen && (
                      <div 
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => setIsProjectDropdownOpen(false)}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <Input
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
                              setFormData(prev => ({ ...prev, projectId: 0 }));
                              setSelectedClientId(0);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !formData.projectId
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
                              
                              // Chỉ cho phép chọn dự án nếu status là "Ongoing" hoặc là dự án đã chọn trước đó
                              const isDisabled = normalizedStatus.toLowerCase() !== "ongoing" && p.id !== formData.projectId;
                              
                              // Map status sang tiếng Việt (case-insensitive)
                              const getStatusLabel = (status: string): string => {
                                if (!status) return "Không xác định";
                                const normalized = status.trim().toLowerCase();
                                const statusMap: Record<string, string> = {
                                  "ongoing": "Đang thực hiện",
                                  "onhold": "Tạm dừng",
                                  "on hold": "Tạm dừng",
                                  "completed": "Hoàn thành",
                                  "planned": "Đã lập kế hoạch"
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
                                      setFormData(prev => ({ ...prev, projectId: p.id, jobRoleLevelId: 0 }));
                                      setSelectedClientId(p.clientCompanyId);
                                      setIsProjectDropdownOpen(false);
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed text-neutral-400"
                                      : formData.projectId === p.id
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                  }`}
                                  title={isDisabled && p.id !== formData.projectId ? `Dự án này đang ở trạng thái "${statusLabel}" nên không thể chọn. Chỉ có thể chọn dự án đang thực hiện.` : ""}
                                >
                                  <div className="flex items-center justify-between gap-2 min-w-0">
                                    <span className="truncate flex-1">{p.name}</span>
                                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
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
                  </div>
                  {/* Hiển thị code của project đã chọn */}
                  {formData.projectId && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Mã dự án:</span>
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-lg text-sm font-mono">
                        [{projects.find(p => p.id === formData.projectId)?.code || "—"}]
                      </span>
                    </div>
                  )}
                </div>

                {/* Mẫu quy trình ứng tuyển */}
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
                          {formData.applyProcessTemplateId
                            ? applyTemplates.find(t => t.id === formData.applyProcessTemplateId)?.name || "Chọn quy trình"
                            : "Chọn quy trình"}
                        </span>
                      </div>
                    </button>
                    {isApplyTemplateDropdownOpen && (
                      <div
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => setIsApplyTemplateDropdownOpen(false)}
                      >
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
                              setFormData(prev => ({ ...prev, applyProcessTemplateId: undefined }));
                              setIsApplyTemplateDropdownOpen(false);
                              setApplyTemplateSearch("");
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !formData.applyProcessTemplateId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tất cả quy trình
                          </button>
                          {applyTemplatesFiltered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy quy trình phù hợp</p>
                          ) : (
                            applyTemplatesFiltered
                              .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
                              .map(t => (
                              <button
                                type="button"
                                key={t.id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, applyProcessTemplateId: t.id }));
                                  setIsApplyTemplateDropdownOpen(false);
                                  setApplyTemplateSearch("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  formData.applyProcessTemplateId === t.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                <div
                                  className="flex items-center justify-between w-full"
                                  title={
                                    templateSteps[t.id] && templateSteps[t.id].length > 0
                                      ? templateSteps[t.id].map(step => `${step.stepOrder}. ${step.stepName}`).join('\n')
                                      : 'Không có bước nào'
                                  }
                                >
                                  <span>{t.name}</span>
                                  <span className="text-xs text-neutral-500 ml-2">
                                    ({templateStepCounts[t.id] ?? 0} bước)
                                  </span>
                                </div>
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

          {/* Project Details (đã bỏ) */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Số lượng */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min={1}
                    className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
                    required
                  />
                </div>

                {/* Chế độ làm việc */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Chế độ làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsWorkingModeDropdownOpen(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-left focus:border-primary-500 focus:ring-primary-500"
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span>
                          {formData.workingMode === WorkingMode.None
                            ? "Không xác định"
                            : formData.workingMode === WorkingMode.Onsite
                            ? "Tại văn phòng"
                            : formData.workingMode === WorkingMode.Remote
                            ? "Từ xa"
                            : formData.workingMode === WorkingMode.Hybrid
                            ? "Kết hợp"
                            : formData.workingMode === WorkingMode.Flexible
                            ? "Linh hoạt"
                            : "Chọn chế độ làm việc"}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isWorkingModeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isWorkingModeDropdownOpen && (
                      <div
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => setIsWorkingModeDropdownOpen(false)}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workingMode: WorkingMode.None }));
                              setIsWorkingModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              formData.workingMode === WorkingMode.None
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Không xác định
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workingMode: WorkingMode.Onsite }));
                              setIsWorkingModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              formData.workingMode === WorkingMode.Onsite
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Tại văn phòng
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workingMode: WorkingMode.Remote }));
                              setIsWorkingModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              formData.workingMode === WorkingMode.Remote
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Từ xa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workingMode: WorkingMode.Hybrid }));
                              setIsWorkingModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              formData.workingMode === WorkingMode.Hybrid
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Kết hợp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workingMode: WorkingMode.Flexible }));
                              setIsWorkingModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              formData.workingMode === WorkingMode.Flexible
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Linh hoạt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Khu vực làm việc - chỉ hiện khi cần thiết */}
                {showLocationField && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Khu vực làm việc
                      {formData.workingMode === WorkingMode.Onsite && <span className="text-red-500">*</span>}
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
                          {formData.locationId
                            ? locations.find(l => l.id === Number(formData.locationId))?.name || "Khu vực không xác định"
                            : "Chọn khu vực làm việc"}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLocationDropdownOpen && (
                      <div
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => setIsLocationDropdownOpen(false)}
                      >
                        <div className="p-2">
                          <input
                            type="text"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            placeholder="Tìm kiếm khu vực..."
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary-500 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, locationId: null }));
                              setIsLocationDropdownOpen(false);
                              setLocationQuery("");
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !formData.locationId
                                ? "bg-primary-50 text-primary-700"
                                : "hover:bg-neutral-50 text-neutral-700"
                            }`}
                          >
                            Không chọn
                          </button>
                          {locations
                            .filter(location =>
                              location.name.toLowerCase().includes(locationQuery.toLowerCase())
                            )
                            .map(location => (
                              <button
                                key={location.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, locationId: location.id }));
                                  setIsLocationDropdownOpen(false);
                                  setLocationQuery("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  formData.locationId === location.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {location.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {/* Vị trí tuyển dụng - tách thành 2 dropdown */}
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
                                    onMouseDown={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();

                                      // Tự động thay thế skills bằng bộ kỹ năng chuẩn của vị trí

                                      // Load skills cho tên vị trí này
                                      const mergedSkillIds = await loadSkillsForJobRoleName(name);

                                      // Update state
                                      setSelectedJobRoleLevelName(name);
                                      setIsJobRoleLevelNameDropdownOpen(false);
                                      setJobRoleLevelNameSearch("");
                                      // Reset level và jobRoleLevelId khi chọn name mới để tránh conflict
                                      setSelectedLevel(undefined);
                                      setFormData(prev => ({ ...prev, jobRoleLevelId: 0, skillIds: mergedSkillIds || [] }));
                                      setSelectedSkills(mergedSkillIds || []);
                                      // Tự động set filter theo loại vị trí (nhưng không lock)
                                      if (firstJRL && !selectedJobRoleFilterId) {
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
                            {selectedLevel !== undefined ? (() => {
                              const levelMap: Record<number, string> = {
                                [TalentLevel.Junior]: "Junior",
                                [TalentLevel.Middle]: "Middle",
                                [TalentLevel.Senior]: "Senior",
                                [TalentLevel.Lead]: "Lead"
                              };
                              return levelMap[selectedLevel] || "Unknown";
                            })() : "Chọn cấp độ"}
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
                              
                              const levelMap: Record<number, string> = {
                                [TalentLevel.Junior]: "Junior",
                                [TalentLevel.Middle]: "Middle",
                                [TalentLevel.Senior]: "Senior",
                                [TalentLevel.Lead]: "Lead"
                              };
                              
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
                                          setFormData(prev => ({ ...prev, jobRoleLevelId: matchingJRL.id }));
                                          setIsLevelDropdownOpen(false);
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      selectedLevel === level
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    {levelMap[level] || "Unknown"}
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
                    Đã chọn: {selectedSkills.length} kỹ năng
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
              {selectedSkills.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Kỹ năng đã chọn ({selectedSkills.length})</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skillId => {
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
                              setSelectedSkills(prev => prev.filter(id => id !== skillId));
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {paginatedSkills.map(skill => (
                  <label
                    key={skill.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${selectedSkills.includes(skill.id)
                      ? "bg-gradient-to-r from-primary-50 to-primary-100 border-primary-300 text-primary-800"
                      : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      value={skill.id}
                      checked={selectedSkills.includes(skill.id)}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setSelectedSkills(prev =>
                          e.target.checked
                            ? [...prev, value]
                            : prev.filter(id => id !== value)
                        );
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
                <div className="text-center py-6 text-sm text-neutral-500">
                  Không tìm thấy kỹ năng phù hợp với bộ lọc hiện tại.
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
                  value={formData.description ?? ""}
                  onChange={(val) => handleRichTextChange("description", val)}
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
                  value={formData.requirements ?? ""}
                  onChange={(val) => handleRichTextChange("requirements", val)}
                  placeholder="Nhập yêu cầu cụ thể cho ứng viên..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Link
              to={`/sales/job-requests/${id}`}
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
