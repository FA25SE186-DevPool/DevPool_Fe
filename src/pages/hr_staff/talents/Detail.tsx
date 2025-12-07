import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/hr_staff/SidebarItems";
import { talentService, type Talent, type TalentProjectCreateModel, type TalentSkillCreateModel, type TalentWorkExperienceCreateModel, type TalentCertificateCreateModel, type TalentJobRoleLevelCreateModel } from "../../../services/Talent";
import { locationService } from "../../../services/location";
import { partnerService, type Partner } from "../../../services/Partner";
import { talentCVService, type TalentCV, type TalentCVCreate, type CVAnalysisComparisonResponse } from "../../../services/TalentCV";
import { talentProjectService, type TalentProject } from "../../../services/TalentProject";
import { talentSkillService, type TalentSkill } from "../../../services/TalentSkill";
import {
  talentSkillGroupAssessmentService,
  type TalentSkillGroupAssessment,
  type SkillGroupVerificationStatus,
} from "../../../services/TalentSkillGroupAssessment";
import { expertService, type Expert } from "../../../services/Expert";
import { skillService, type Skill } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { talentWorkExperienceService, type TalentWorkExperience } from "../../../services/TalentWorkExperience";
import { talentJobRoleLevelService, type TalentJobRoleLevel } from "../../../services/TalentJobRoleLevel";
import { jobRoleLevelService, type JobRoleLevel, TalentLevel as TalentLevelEnum, TalentLevel } from "../../../services/JobRoleLevel";
import { jobRoleService, type JobRole } from "../../../services/JobRole";
import { talentCertificateService, type TalentCertificate } from "../../../services/TalentCertificate";
import { certificateTypeService, type CertificateType } from "../../../services/CertificateType";
import { talentAvailableTimeService, type TalentAvailableTime } from "../../../services/TalentAvailableTime";
import { clientTalentBlacklistService, type ClientTalentBlacklist } from "../../../services/ClientTalentBlacklist";
import { notificationService, NotificationPriority, NotificationType } from "../../../services/Notification";
import { userService } from "../../../services/User";
import { decodeJWT } from "../../../services/Auth";
import { WorkingMode } from "../../../types/WorkingMode";
import { uploadFile, uploadTalentCV, downloadFileFromFirebase } from "../../../utils/firebaseStorage";
import { saveFileToIndexedDB, getFileFromIndexedDB, deleteFileFromIndexedDB } from "../../../utils/indexedDBStorage";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../../../configs/firebase";
import { Button } from "../../../components/ui/button";
import {
  Edit,
  Trash2,
  Briefcase,
  FileText,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MapPin,
  Globe,
  Mail,
  Phone,
  User,
  Building2,
  Calendar,
  Award,
  ExternalLink,
  Star,
  Workflow,
  Plus,
  Filter,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Save,
  Search,
  Layers,
  Ban,
} from "lucide-react";

// Mapping WorkingMode values to Vietnamese names
const workingModeLabels: Record<number, string> = {
  [WorkingMode.None]: "Không xác định",
  [WorkingMode.Onsite]: "Tại văn phòng",
  [WorkingMode.Remote]: "Từ xa",
  [WorkingMode.Hybrid]: "Kết hợp",
  [WorkingMode.Flexible]: "Linh hoạt",
};

export default function TalentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const locationState = location.state as { tab?: "projects" | "cvs" | "jobRoleLevels" | "skills" | "availableTimes" | "certificates" | "experiences"; defaultTab?: "projects" | "cvs" | "jobRoleLevels" | "skills" | "availableTimes" | "certificates" | "experiences" } | null;
  const initialTab = locationState?.tab || locationState?.defaultTab;
  const [talent, setTalent] = useState<Talent | null>(null);
  const [locationName, setLocationName] = useState<string>("—");
  const [partnerName, setPartnerName] = useState<string>("—");
  const [talentCVs, setTalentCVs] = useState<(TalentCV & { jobRoleLevelName?: string })[]>([]);
  const [talentProjects, setTalentProjects] = useState<TalentProject[]>([]);
  const [talentSkills, setTalentSkills] = useState<
    (TalentSkill & { skillName: string; skillGroupId?: number })[]
  >([]);
  const [workExperiences, setWorkExperiences] = useState<TalentWorkExperience[]>([]);
  const [jobRoleLevels, setJobRoleLevels] = useState<(TalentJobRoleLevel & { jobRoleLevelName: string })[]>([]);
  const [certificates, setCertificates] = useState<(TalentCertificate & { certificateTypeName: string })[]>([]);
  const [availableTimes, setAvailableTimes] = useState<TalentAvailableTime[]>([]);
  const [lookupSkills, setLookupSkills] = useState<Skill[]>([]);
  const [lookupSkillGroups, setLookupSkillGroups] = useState<SkillGroup[]>([]);

  // 🔍 Trạng thái verify theo SkillGroup
  const [skillGroupVerificationStatuses, setSkillGroupVerificationStatuses] = useState<
    Record<number, SkillGroupVerificationStatus>
  >({});
  const [skillGroupVerifyModal, setSkillGroupVerifyModal] = useState<{
    isOpen: boolean;
    skillGroupId?: number;
    skillGroupName?: string;
  }>({ isOpen: false });
  const [verifyExpertName, setVerifyExpertName] = useState<string>("");
  const [verifyNote, setVerifyNote] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<boolean>(true); // true = pass, false = fail
  const [expertsForSkillGroup, setExpertsForSkillGroup] = useState<Expert[]>([]);
  const [expertsForSkillGroupLoading, setExpertsForSkillGroupLoading] =
    useState<boolean>(false);
  const [selectedExpertId, setSelectedExpertId] = useState<number | "">("");
  const [skillSnapshotEnabled, setSkillSnapshotEnabled] = useState<boolean>(true);
  const [showAllSkillsInVerifyModal, setShowAllSkillsInVerifyModal] =
    useState<boolean>(false);
  const [isVerifyingSkillGroup, setIsVerifyingSkillGroup] = useState<boolean>(false);
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    skillGroupId?: number;
    skillGroupName?: string;
    items: TalentSkillGroupAssessment[];
    loading: boolean;
  }>({ isOpen: false, items: [], loading: false });
  const [showOnlyUnverifiedSkills, setShowOnlyUnverifiedSkills] = useState<boolean>(false);
  const [lookupJobRoleLevels, setLookupJobRoleLevels] = useState<JobRoleLevel[]>([]); // Cho CV
  const [lookupJobRoleLevelsForTalent, setLookupJobRoleLevelsForTalent] = useState<JobRoleLevel[]>([]); // Cho vị trí của talent
  const [lookupCertificateTypes, setLookupCertificateTypes] = useState<CertificateType[]>([]);
  const [analysisResult, setAnalysisResult] = useState<CVAnalysisComparisonResponse | null>(null);
  const [analysisResultCVId, setAnalysisResultCVId] = useState<number | null>(null);
  type SuggestionCategory = "skill" | "jobRoleLevel" | "certificate";
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [sentSuggestionKeys, setSentSuggestionKeys] = useState<Set<string>>(new Set());
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLoadingId, setAnalysisLoadingId] = useState<number | null>(null);
  const [expandedAnalysisDetail, setExpandedAnalysisDetail] = useState<"skills" | "jobRoleLevels" | "certificates" | "projects" | "experiences" | null>(null);
  const [expandedBasicInfo, setExpandedBasicInfo] = useState(true); // Mặc định mở
  type PrefillType = "projects" | "jobRoleLevels" | "skills" | "certificates" | "experiences";
  const ANALYSIS_STORAGE_PREFIX = "talent-analysis-prefill";
  const prefillTypes: PrefillType[] = ["projects", "jobRoleLevels", "skills", "certificates", "experiences"];
  const getPrefillStorageKey = (type: PrefillType) => `${ANALYSIS_STORAGE_PREFIX}-${type}-${id}`;
  const ANALYSIS_RESULT_STORAGE_KEY = id ? `talent-analysis-result-${id}` : null;
  const clearPrefillStorage = () => {
    prefillTypes.forEach((type) => {
      try {
        sessionStorage.removeItem(getPrefillStorageKey(type));
      } catch (storageError) {
        console.warn("Không thể xóa dữ liệu gợi ý", storageError);
      }
    });
  };
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "cvs" | "jobRoleLevels" | "skills" | "availableTimes" | "certificates" | "experiences">(initialTab || "cvs");
  const [basicInfoTab, setBasicInfoTab] = useState<"info" | "blacklist">("info"); // Tab cho phần Thông tin cơ bản
  const [myManagedTalents, setMyManagedTalents] = useState<Talent[]>([]);

  // Inline form states
  const [showInlineForm, setShowInlineForm] = useState<"project" | "skill" | "certificate" | "experience" | "jobRoleLevel" | "availableTime" | "cv" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineProjectForm, setInlineProjectForm] = useState<Partial<TalentProjectCreateModel>>({
    projectName: "",
    position: "",
    technologies: "",
    description: "",
  });
  const [inlineSkillForm, setInlineSkillForm] = useState<Partial<TalentSkillCreateModel>>({
    skillId: 0,
    level: "Beginner",
    yearsExp: 1,
  });
  const [inlineCertificateForm, setInlineCertificateForm] = useState<Partial<TalentCertificateCreateModel>>({
    certificateTypeId: 0,
    certificateName: "",
    certificateDescription: "",
    issuedDate: undefined,
    isVerified: false,
    imageUrl: "",
  });
  const [inlineExperienceForm, setInlineExperienceForm] = useState<Partial<TalentWorkExperienceCreateModel>>({
    company: "",
    position: "",
    startDate: "",
    endDate: undefined,
    description: "",
  });
  const [inlineJobRoleLevelForm, setInlineJobRoleLevelForm] = useState<Partial<TalentJobRoleLevelCreateModel>>({
    jobRoleLevelId: 0,
    yearsOfExp: 1,
    ratePerMonth: undefined,
  });
  const [inlineAvailableTimeForm, setInlineAvailableTimeForm] = useState<Partial<TalentAvailableTime>>({
    startTime: "",
    endTime: undefined,
    notes: "",
  });
  const [availableTimeFormErrors, setAvailableTimeFormErrors] = useState<Record<string, string>>({});
  // CV inline form states
  const [inlineCVForm, setInlineCVForm] = useState<Partial<TalentCVCreate>>({
    jobRoleLevelId: 0,
    version: 1,
    cvFileUrl: "",
    isActive: true,
    summary: "",
    isGeneratedFromTemplate: false,
  });
  const [cvFormErrors, setCvFormErrors] = useState<Record<string, string>>({});
  const [cvVersionError, setCvVersionError] = useState<string>("");
  const [existingCVsForValidation, setExistingCVsForValidation] = useState<TalentCV[]>([]);
  const [selectedCVFile, setSelectedCVFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState<number>(0);
  const [isCVUploadedFromFirebase, setIsCVUploadedFromFirebase] = useState(false);
  const [uploadedCVUrl, setUploadedCVUrl] = useState<string | null>(null);
  const [extractingCV, setExtractingCV] = useState(false);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  interface ExtractedCVData {
    fullName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    skills?: string[];
    workExperiences?: Array<{
      position: string;
      company: string;
      startDate: string;
      endDate: string;
      description?: string;
    }>;
    locationName?: string;
  }
  const [, setExtractedCVData] = useState<ExtractedCVData | null>(null);
  const [inlineCVAnalysisResult, setInlineCVAnalysisResult] = useState<CVAnalysisComparisonResponse | null>(null);
  const [showInlineCVAnalysisModal, setShowInlineCVAnalysisModal] = useState(false);
  const [showCVFullForm, setShowCVFullForm] = useState(false); // Hiện form đầy đủ sau khi xác nhận phân tích
  
  // Storage key cho form CV
  const CV_FORM_STORAGE_KEY = id ? `talent-detail-cv-form-${id}` : null;
  const CV_FILE_STORAGE_KEY = id ? `talent-detail-cv-file-${id}` : null;
  // Certificate image upload states
  const [certificateImageFile, setCertificateImageFile] = useState<File | null>(null);
  const [uploadingCertificateImage, setUploadingCertificateImage] = useState(false);
  const [certificateUploadProgress, setCertificateUploadProgress] = useState<number>(0);
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState<string | null>(null);
  const [certificateFormErrors, setCertificateFormErrors] = useState<Record<string, string>>({});
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState<string>("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  // Tìm kiếm và lọc cho danh sách kỹ năng hiện có
  const [skillListSearchQuery, setSkillListSearchQuery] = useState<string>("");
  const [skillGroupListSearchQuery, setSkillGroupListSearchQuery] = useState<string>("");
  const [isSkillGroupListDropdownOpen, setIsSkillGroupListDropdownOpen] = useState(false);
  const [selectedSkillGroupIdForList, setSelectedSkillGroupIdForList] = useState<number | undefined>(undefined);
  const [certificateTypeSearch, setCertificateTypeSearch] = useState<string>("");
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState(false);
  const [jobRoleLevelSearch, setJobRoleLevelSearch] = useState<string>("");
  const [isJobRoleLevelDropdownOpen, setIsJobRoleLevelDropdownOpen] = useState(false);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>("");
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);
  const [workExperiencePositionSearch, setWorkExperiencePositionSearch] = useState<string>("");
  const [isWorkExperiencePositionDropdownOpen, setIsWorkExperiencePositionDropdownOpen] = useState(false);
  
  // Danh sách vị trí công việc cho Kinh Nghiệm
  const workExperiencePositions = [
    "Frontend Developer (React, Angular, Vue)",
    "Backend Developer (Node.js, .NET, Java, Go)",
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

  // Tự động đóng form khi chuyển tab (nếu form không thuộc tab hiện tại)
  // Lưu ý: Form CV không bị đóng khi chuyển tab để người dùng có thể xem các gợi ý phân tích ở các tab khác
  useEffect(() => {
    if (isSubmitting) return; // Không đóng form khi đang submit
    
    const formTabMap: Record<string, string> = {
      "project": "projects",
      "skill": "skills",
      "certificate": "certificates",
      "experience": "experiences",
      "jobRoleLevel": "jobRoleLevels",
      "availableTime": "availableTimes",
      "cv": "cvs"
    };
    
    if (showInlineForm) {
      // Không đóng form CV khi chuyển tab
      if (showInlineForm === "cv") {
        return;
      }
      
      const formTab = formTabMap[showInlineForm];
      if (formTab && formTab !== activeTab) {
        // Form không thuộc tab hiện tại, đóng form (trừ form CV)
        setShowInlineForm(null);
      }
    }
  }, [activeTab, showInlineForm, isSubmitting]);

  // Khôi phục kết quả phân tích CV từ sessionStorage
  useEffect(() => {
    if (!ANALYSIS_RESULT_STORAGE_KEY) return;
    try {
      const stored = sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        cvId: number | null;
        result: CVAnalysisComparisonResponse | null;
      };
      // Khôi phục nếu có kết quả phân tích
      if (parsed?.result) {
        // Nếu có CV ID, kiểm tra CV có tồn tại không
        if (parsed.cvId !== null) {
          // Chờ danh sách CVs được load trước khi kiểm tra
          if (talentCVs.length > 0) {
            const cvExists = talentCVs.some(cv => cv.id === parsed.cvId);
            if (cvExists) {
              setAnalysisResult(parsed.result);
              setAnalysisResultCVId(parsed.cvId);
            } else {
              // CV không tồn tại, xóa dữ liệu phân tích cũ
              sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
            }
          }
        } else {
          // cvId là null (phân tích từ file mới), khôi phục luôn
          setAnalysisResult(parsed.result);
          setAnalysisResultCVId(null);
        }
      }
    } catch (error) {
      console.warn("Không thể khôi phục kết quả phân tích CV:", error);
    }
  }, [ANALYSIS_RESULT_STORAGE_KEY, talentCVs]);

  // Lưu trạng thái form CV vào storage khi thay đổi
  useEffect(() => {
    if (!CV_FORM_STORAGE_KEY || showInlineForm !== "cv") return;
    
    try {
      const rememberMe = localStorage.getItem('remember_me') === 'true';
      const storage = rememberMe ? localStorage : sessionStorage;
      
      const formData = {
        inlineCVForm,
        showCVFullForm,
        inlineCVAnalysisResult,
        showInlineCVAnalysisModal,
        // Không lưu cvPreviewUrl vì là URL object, không thể serialize
        uploadedCVUrl,
        isCVUploadedFromFirebase,
        // Lưu metadata của file (không thể lưu File object)
        selectedCVFileInfo: selectedCVFile ? {
          name: selectedCVFile.name,
          size: selectedCVFile.size,
          type: selectedCVFile.type
        } : null
      };
      
      storage.setItem(CV_FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.warn("Không thể lưu trạng thái form CV:", error);
    }
  }, [CV_FORM_STORAGE_KEY, showInlineForm, inlineCVForm, showCVFullForm, inlineCVAnalysisResult, showInlineCVAnalysisModal, uploadedCVUrl, isCVUploadedFromFirebase, selectedCVFile]);

  // Khôi phục trạng thái form CV từ storage khi component mount
  useEffect(() => {
    if (!CV_FORM_STORAGE_KEY || !id || !CV_FILE_STORAGE_KEY) return;
    
    const restoreFormData = async () => {
      try {
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        const storage = rememberMe ? localStorage : sessionStorage;
        
        const stored = storage.getItem(CV_FORM_STORAGE_KEY);
        if (!stored) return;
        
        const parsed = JSON.parse(stored) as {
          inlineCVForm: Partial<TalentCVCreate>;
          showCVFullForm: boolean;
          inlineCVAnalysisResult: CVAnalysisComparisonResponse | null;
          showInlineCVAnalysisModal: boolean;
          uploadedCVUrl: string | null;
          isCVUploadedFromFirebase: boolean;
          selectedCVFileInfo: { name: string; size: number; type: string } | null;
        };
        
        // Khôi phục form data
        if (parsed.inlineCVForm) {
          setInlineCVForm(parsed.inlineCVForm);
        }
        if (parsed.showCVFullForm !== undefined) {
          setShowCVFullForm(parsed.showCVFullForm);
        }
        if (parsed.inlineCVAnalysisResult) {
          setInlineCVAnalysisResult(parsed.inlineCVAnalysisResult);
        }
        if (parsed.showInlineCVAnalysisModal !== undefined) {
          setShowInlineCVAnalysisModal(parsed.showInlineCVAnalysisModal);
        }
        if (parsed.uploadedCVUrl) {
          setUploadedCVUrl(parsed.uploadedCVUrl);
          // Nếu đã có uploadedCVUrl, tự động set vào form và đánh dấu đã upload
          if (parsed.inlineCVForm && !parsed.inlineCVForm.cvFileUrl) {
            setInlineCVForm(prev => ({ ...prev, cvFileUrl: parsed.uploadedCVUrl || undefined }));
          }
        }
        if (parsed.isCVUploadedFromFirebase !== undefined) {
          setIsCVUploadedFromFirebase(parsed.isCVUploadedFromFirebase);
        }
        
        // Khôi phục File object từ IndexedDB nếu chưa upload lên Firebase
        if (!parsed.isCVUploadedFromFirebase) {
          const file = await getFileFromIndexedDB(CV_FILE_STORAGE_KEY);
          if (file) {
            setSelectedCVFile(file);
            // Tạo lại preview URL
            const url = URL.createObjectURL(file);
            setCvPreviewUrl(url);
          }
        }
        
        // Mở form nếu đã có dữ liệu
        if (parsed.inlineCVForm || parsed.showCVFullForm || parsed.inlineCVAnalysisResult) {
          setShowInlineForm("cv");
        }
      } catch (error) {
        console.warn("Không thể khôi phục trạng thái form CV:", error);
      }
    };
    
    restoreFormData();
  }, [CV_FORM_STORAGE_KEY, CV_FILE_STORAGE_KEY, id]);

  // Multi-select states
  const [selectedCVs, setSelectedCVs] = useState<number[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([]);
  const [selectedJobRoleLevels, setSelectedJobRoleLevels] = useState<number[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<number[]>([]);
  const [selectedAvailableTimes, setSelectedAvailableTimes] = useState<number[]>([]);

  // Pagination states for each section
  const [pageCVs, setPageCVs] = useState(1);
  const [pageProjects, setPageProjects] = useState(1);
  const [pageExperiences, setPageExperiences] = useState(1);
  const [pageJobRoleLevels, setPageJobRoleLevels] = useState(1);
  const [pageCertificates, setPageCertificates] = useState(1);
  const [pageAvailableTimes, setPageAvailableTimes] = useState(1);
  const [pageSkills, setPageSkills] = useState(1);
  const itemsPerPage = 9;
  const skillGroupsPerPage = 3; // Phân trang cho nhóm kỹ năng: 3 nhóm mỗi trang

  // Collapse/Expand states for each section
  const [isCVsExpanded, setIsCVsExpanded] = useState(true);
  // State để quản lý việc collapse/expand CV không hoạt động theo từng jobRoleLevelName
  const [collapsedInactiveCVGroups, setCollapsedInactiveCVGroups] = useState<Set<string>>(new Set());

  // Blacklist state
  const [blacklists, setBlacklists] = useState<ClientTalentBlacklist[]>([]);

  const talentName = talent?.fullName ?? "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch talent data, my managed talents, và các lookup services song song
        const [
          talentData,
          myManagedData,
          allJobRoleLevelsForCV,
          allJobRoleLevelsForTalent,
          allJobRoles,
          allSkills,
          skillGroupsData,
          allCertificateTypes,
          partners,
          blacklistData
        ] = await Promise.all([
          talentService.getById(Number(id)),
          talentService.getMyManagedTalents().catch(() => []), // Lấy danh sách talents mà user đang quản lý
          jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true }), // Cho CV
          jobRoleLevelService.getAll({ excludeDeleted: true }), // Cho vị trí của talent
          jobRoleService.getAll(),
          skillService.getAll(),
          skillGroupService.getAll({ excludeDeleted: true }).catch(() => null),
          certificateTypeService.getAll(),
          partnerService.getAll().catch(() => []),
          clientTalentBlacklistService.getByTalentId(Number(id), true).catch(() => null)
        ]);
        
        // Lưu danh sách talents đang quản lý
        setMyManagedTalents(myManagedData);
        
        // Set jobRoles
        setJobRoles(allJobRoles);
        
        // Set lookupJobRoleLevels cho CV (giữ distinctByName)
        setLookupJobRoleLevels(allJobRoleLevelsForCV);
        
        // Set lookupJobRoleLevels cho vị trí của talent (không distinctByName)
        setLookupJobRoleLevelsForTalent(allJobRoleLevelsForTalent);

        // Set talent data ngay để UI có thể hiển thị
        setTalent(talentData);

        // Resolve location name (song song với các calls khác nếu có thể)
        const locationPromise = talentData.locationId
          ? locationService.getById(talentData.locationId).catch(() => null)
          : Promise.resolve(null);

        // Resolve partner name
        const talentPartner = partners.find((p: Partner) => p.id === talentData.currentPartnerId);
        setPartnerName(talentPartner?.companyName ?? "—");

        // Fetch all related talent data song song
        const [
          cvs,
          projects,
          skills,
          experiences,
          jobRoleLevelsData,
          certificatesData,
          availableTimesData,
          location
        ] = await Promise.all([
          talentCVService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentJobRoleLevelService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentCertificateService.getAll({ talentId: Number(id), excludeDeleted: true }),
          talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true }),
          locationPromise
        ]);

        // Set location name
        if (location) {
          setLocationName(location.name ?? "—");
        }

        // Set lookup data
        const jobRoleLevelsArray = Array.isArray(allJobRoleLevelsForCV) ? allJobRoleLevelsForCV : [];
        setLookupJobRoleLevels(jobRoleLevelsArray);
        setLookupSkills(allSkills);
        
        // Set skill groups
        try {
          const skillGroupsArray = Array.isArray(skillGroupsData)
            ? skillGroupsData
            : (Array.isArray((skillGroupsData as any)?.items)
              ? (skillGroupsData as any).items
              : (Array.isArray((skillGroupsData as any)?.data)
                ? (skillGroupsData as any).data
                : []));
          setLookupSkillGroups(skillGroupsArray);
        } catch (skillGroupsError) {
          console.error("❌ Lỗi khi tải nhóm kỹ năng:", skillGroupsError);
          setLookupSkillGroups([]);
        }

        setLookupCertificateTypes(allCertificateTypes);

        // Set blacklist
        if (blacklistData) {
          setBlacklists(Array.isArray(blacklistData) ? blacklistData : blacklistData?.data || []);
        }

        // Set projects, experiences, available times
        setTalentProjects(projects);
        setWorkExperiences(experiences);
        setAvailableTimes(availableTimesData);
        
        // Map CVs with job role level names
        const cvsWithJobRoleLevelNames = cvs.map((cv: TalentCV) => {
          const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
          return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? "Chưa xác định" };
        });
        // Sắp xếp CV: nhóm theo jobRoleLevelName, active trước, sau đó theo version giảm dần
        const sortedCVs = cvsWithJobRoleLevelNames.sort((a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
          // Ưu tiên 1: Sắp xếp theo jobRoleLevelName
          const nameA = a.jobRoleLevelName || "";
          const nameB = b.jobRoleLevelName || "";
          if (nameA !== nameB) {
            return nameA.localeCompare(nameB);
          }
          // Ưu tiên 2: Active trước, inactive sau
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }
          // Ưu tiên 3: Version giảm dần (mới nhất trước)
          return (b.version || 0) - (a.version || 0);
        });
        setTalentCVs(sortedCVs);
        
        // Thu gọn tất cả các nhóm CV không hoạt động mặc định
        const inactiveGroups = new Set<string>();
        sortedCVs.forEach((cv: TalentCV & { jobRoleLevelName?: string }) => {
          if (!cv.isActive && cv.jobRoleLevelName) {
            inactiveGroups.add(cv.jobRoleLevelName);
          }
        });

        // Map skills with names
        const skillsWithNames = skills.map((skill: TalentSkill) => {
          const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
          return {
            ...skill,
            skillName: skillInfo?.name ?? "Unknown Skill",
            skillGroupId: skillInfo?.skillGroupId,
          };
        });
        setTalentSkills(skillsWithNames);

        // Sau khi có danh sách kỹ năng, tải trạng thái verify theo SkillGroup
        const distinctSkillGroupIds = Array.from(
          new Set(
            skillsWithNames
              .map((s: any) => s.skillGroupId)
              .filter((gid: number | undefined) => typeof gid === "number")
          )
        ) as number[];

        if (distinctSkillGroupIds.length > 0 && id) {
          try {
            const statuses =
              await talentSkillGroupAssessmentService.getVerificationStatuses(
                Number(id),
                distinctSkillGroupIds
              );
            const statusMap: Record<number, SkillGroupVerificationStatus> = {};
            statuses.forEach((st) => {
              statusMap[st.skillGroupId] = st;
            });

            setSkillGroupVerificationStatuses(statusMap);
          } catch (err) {
            console.error("❌ Lỗi khi tải trạng thái verify skill group:", err);
          }
        }

        // Map job role levels with names (use allJobRoleLevelsForTalent for talent positions)
        const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
          const jobRoleLevelInfo = allJobRoleLevelsForTalent.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
          if (!jobRoleLevelInfo) {
            return { ...jrl, jobRoleLevelName: "Unknown Level" };
          }
          // Sử dụng allJobRoles trực tiếp thay vì jobRoles từ state
          const jobRole = allJobRoles.find(r => r.id === jobRoleLevelInfo.jobRoleId);
          const roleName = jobRole?.name || "—";
          const levelText = getLevelText(jobRoleLevelInfo.level);
          const displayName = `${roleName} - ${levelText}`;
          return { ...jrl, jobRoleLevelName: displayName };
        });
        setJobRoleLevels(jobRoleLevelsWithNames);

        // Map certificates with names
        const certificatesWithNames = certificatesData.map((cert: TalentCertificate) => {
          const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
          return { ...cert, certificateTypeName: certTypeInfo?.name ?? "Unknown Certificate" };
        });
        setCertificates(certificatesWithNames);
      } catch (err) {
        console.error("❌ Lỗi tải chi tiết nhân sự:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await userService.getAll({
          role: "Admin",
          excludeDeleted: true,
          pageNumber: 1,
          pageSize: 100,
        });
        const admins = (response.items ?? []).filter((user) =>
          (user.roles ?? []).some((role) => role.toLowerCase().includes("admin"))
        );
        setAdminUserIds(admins.map((user) => user.id));
      } catch (error) {
        console.error("Không thể tải danh sách Admin để gửi đề xuất:", error);
      }
    };

    fetchAdminUsers();
  }, []);

  // Reset pagination when data changes
  useEffect(() => {
    setPageCVs(1);
  }, [talentCVs.length]);

  useEffect(() => {
    setPageProjects(1);
  }, [talentProjects.length]);

  // Reset pagination for skills when filters change or tab changes
  useEffect(() => {
    setPageSkills(1);
  }, [skillListSearchQuery, selectedSkillGroupIdForList, showOnlyUnverifiedSkills, talentSkills.length, activeTab]);

  useEffect(() => {
    setPageExperiences(1);
  }, [workExperiences.length]);

  useEffect(() => {
    setPageJobRoleLevels(1);
  }, [jobRoleLevels.length]);

  useEffect(() => {
    setPageCertificates(1);
  }, [certificates.length]);

  useEffect(() => {
    setPageAvailableTimes(1);
  }, [availableTimes.length]);

  useEffect(() => {
    setIsCVsExpanded(talentCVs.length > 0);
  }, [talentCVs.length]);

  // Kiểm tra quyền chỉnh sửa: chỉ TA đang quản lý talent này mới được chỉnh sửa
  const canEdit = useMemo(() => {
    if (!talent || !id) return false;
    // Kiểm tra xem talent này có trong danh sách talents mà user đang quản lý không
    return myManagedTalents.some((t) => t.id === Number(id));
  }, [myManagedTalents, talent, id]);

  // 🗑️ Xóa nhân sự
  const handleDelete = async () => {
    if (!id) return;
    const confirm = window.confirm("⚠️ Bạn có chắc muốn xóa nhân sự này?");
    if (!confirm) return;

    try {
      await talentService.deleteById(Number(id));
      alert("✅ Đã xóa nhân sự thành công!");
      navigate("/ta/developers");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      alert("Không thể xóa nhân sự!");
    }
  };

  // ✏️ Chuyển sang trang sửa
  const handleEdit = () => {
    navigate(`/ta/developers/edit/${id}`);
  };

  // 🗑️ Delete handlers for each section
  const handleDeleteCVs = async () => {
    if (selectedCVs.length === 0) {
      alert("⚠️ Vui lòng chọn CV để xóa!");
      return;
    }

    const activeCVs = talentCVs.filter((cv) => selectedCVs.includes(cv.id) && cv.isActive);
    if (activeCVs.length > 0) {
      alert("⚠️ Không thể xóa các CV đang hoạt động. Vui lòng bỏ chọn hoặc hủy kích hoạt trước khi xóa.");
      setSelectedCVs((prev) => prev.filter((id) => !activeCVs.some((cv) => cv.id === id)));
      return;
    }

    const deletableCVIds = selectedCVs.filter((id) => {
      const cv = talentCVs.find((item) => item.id === id);
      return cv && !cv.isActive;
    });

    if (deletableCVIds.length === 0) {
      alert("⚠️ Không có CV nào hợp lệ để xóa.");
      return;
    }

    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedCVs.length} CV đã chọn?\n\nFile CV trên Firebase Storage cũng sẽ bị xóa vĩnh viễn.`);
    if (!confirm) return;

    try {
      // Xóa file từ Firebase trước khi xóa CV từ database
      const cvsToDelete = talentCVs.filter(cv => deletableCVIds.includes(cv.id));
      const deleteFilePromises = cvsToDelete
        .filter(cv => cv.cvFileUrl)
        .map(async (cv) => {
          try {
            const firebasePath = extractCVFirebasePath(cv.cvFileUrl);
            if (firebasePath) {
              const fileRef = ref(storage, firebasePath);
              await deleteObject(fileRef);
            }
          } catch (err) {
            console.error(`❌ Error deleting CV file from Firebase for CV ${cv.id}:`, err);
            // Tiếp tục xóa CV dù không xóa được file
          }
        });
      
      await Promise.all(deleteFilePromises);
      
      // Sau đó xóa CV từ database
      await Promise.all(deletableCVIds.map(id => talentCVService.deleteById(id)));
      alert("✅ Đã xóa CV và file trên Firebase thành công!");
      setSelectedCVs((prev) => prev.filter((id) => !deletableCVIds.includes(id)));
      // Refresh data
      const cvs = await talentCVService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true });
      const jobRoleLevelsArray = Array.isArray(allJobRoleLevels) ? allJobRoleLevels : [];
      const cvsWithJobRoleLevelNames = cvs.map((cv: TalentCV) => {
        const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
        return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? "Chưa xác định" };
      });
      // Sắp xếp CV: nhóm theo jobRoleLevelName, active trước, sau đó theo version giảm dần
      const sortedCVs = cvsWithJobRoleLevelNames.sort((a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
        // Ưu tiên 1: Sắp xếp theo jobRoleLevelName
        const nameA = a.jobRoleLevelName || "";
        const nameB = b.jobRoleLevelName || "";
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }
        // Ưu tiên 2: Active trước, inactive sau
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        // Ưu tiên 3: Version giảm dần (mới nhất trước)
        return (b.version || 0) - (a.version || 0);
      });
      setTalentCVs(sortedCVs);
      
      // Thu gọn tất cả các nhóm CV không hoạt động mặc định
      const inactiveGroups = new Set<string>();
      sortedCVs.forEach((cv: TalentCV & { jobRoleLevelName?: string }) => {
        if (!cv.isActive && cv.jobRoleLevelName) {
          inactiveGroups.add(cv.jobRoleLevelName);
        }
      });
    } catch (err) {
      console.error("❌ Lỗi khi xóa CV:", err);
      alert("Không thể xóa CV!");
    }
  };

  const normalizeFirebaseUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.endsWith(".firebasestorage.app")) {
        parsed.hostname = parsed.hostname.replace(".firebasestorage.app", ".appspot.com");
      }
      return parsed.toString();
    } catch {
      return url;
    }
  };

  const handleOpenCVPreviewFromAnalysis = () => {
    let url: string | null = null;

    if (analysisResultCVId && talentCVs.length) {
      const cv = talentCVs.find(c => c.id === analysisResultCVId && !!c.cvFileUrl);
      if (cv && cv.cvFileUrl) {
        url = normalizeFirebaseUrl(cv.cvFileUrl);
      }
    }

    if (!url) {
      url = uploadedCVUrl || cvPreviewUrl;
    }

    if (!url) {
      alert("Không tìm thấy file CV để xem.");
      return;
    }

    window.open(url, "_blank");
  };

  const handleAnalyzeCVFromUrl = async (cv: TalentCV & { jobRoleLevelName?: string }) => {
    if (!id) return;
    if (!cv.cvFileUrl) {
      alert("⚠️ Không tìm thấy đường dẫn CV để phân tích.");
      return;
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.");
      return;
    }

    // Kiểm tra nếu form tạo CV đang mở
    const isFormOpen = showInlineForm === "cv";
    const hasFirebaseFileInForm = isFormOpen && isCVUploadedFromFirebase && uploadedCVUrl && inlineCVForm.cvFileUrl && uploadedCVUrl === inlineCVForm.cvFileUrl;
    const hasSelectedFile = isFormOpen && selectedCVFile; // Chỉ chọn file, chưa upload
    
    // Kiểm tra nếu đã có kết quả phân tích CV hiện tại
    const hasAnalysisResult = !!analysisResult;
    
    // Nếu có form đang mở hoặc có kết quả phân tích, cần cảnh báo
    if (isFormOpen || hasAnalysisResult) {
      let warningMessage = "⚠️ CẢNH BÁO\n\n";
      
      if (hasFirebaseFileInForm && hasAnalysisResult) {
        warningMessage += "Bạn đang có:\n";
        warningMessage += "- Form tạo CV đang mở với file đã upload lên Firebase.\n";
        warningMessage += "- Kết quả phân tích CV hiện tại.\n\n";
        warningMessage += "Để phân tích CV \"v" + cv.version + "\", hệ thống sẽ:\n";
        warningMessage += "- Xóa file CV đã upload lên Firebase.\n";
        warningMessage += "- Hủy kết quả phân tích CV hiện tại.\n";
        warningMessage += "- Đóng form tạo CV.\n\n";
      } else if (hasFirebaseFileInForm) {
        warningMessage += "Bạn đang có form tạo CV đang mở với file đã upload lên Firebase.\n\n";
        warningMessage += "Để phân tích CV \"v" + cv.version + "\", hệ thống sẽ:\n";
        warningMessage += "- Xóa file CV đã upload lên Firebase.\n";
        warningMessage += "- Đóng form tạo CV.\n\n";
      } else if (hasSelectedFile && hasAnalysisResult) {
        warningMessage += "Bạn đang có:\n";
        warningMessage += "- Form tạo CV đang mở với file đã chọn.\n";
        warningMessage += "- Kết quả phân tích CV hiện tại.\n\n";
        warningMessage += "Để phân tích CV \"v" + cv.version + "\", hệ thống sẽ:\n";
        warningMessage += "- Đóng form tạo CV.\n";
        warningMessage += "- Hủy kết quả phân tích CV hiện tại.\n\n";
      } else if (hasSelectedFile) {
        warningMessage += "Bạn đang có form tạo CV đang mở với file đã chọn.\n\n";
        warningMessage += "Để phân tích CV \"v" + cv.version + "\", hệ thống sẽ đóng form tạo CV.\n\n";
      } else if (hasAnalysisResult) {
        warningMessage += "Bạn đang có kết quả phân tích CV hiện tại.\n\n";
        warningMessage += "Để phân tích CV \"v" + cv.version + "\", bạn cần hủy kết quả phân tích hiện tại.\n\n";
      }
      
      warningMessage += "Bạn có muốn tiếp tục không?";
      
      const confirmedCancel = window.confirm(warningMessage);
      if (!confirmedCancel) {
        return;
      }
      
      // Xóa file Firebase nếu có
      if (hasFirebaseFileInForm) {
        try {
          const firebasePath = extractCVFirebasePath(uploadedCVUrl!);
          if (firebasePath) {
            const fileRef = ref(storage, firebasePath);
            await deleteObject(fileRef);
          }
        } catch (err) {
          console.error("❌ Error deleting CV file from Firebase:", err);
        }
      }
      
      // Đóng form tạo CV nếu đang mở
      if (isFormOpen) {
        setShowInlineForm(null);
        setAvailableTimeFormErrors({});
        setCertificateImageFile(null);
        setUploadedCertificateUrl(null);
        setCertificateFormErrors({});
        if (cvPreviewUrl) {
          URL.revokeObjectURL(cvPreviewUrl);
        }
        setCvFormErrors({});
        setCvVersionError("");
        setSelectedCVFile(null);
        setUploadingCV(false);
        setCvUploadProgress(0);
        setIsCVUploadedFromFirebase(false);
        setUploadedCVUrl(null);
        setExtractingCV(false);
        setCvPreviewUrl(null);
        setExtractedCVData(null);
        setExistingCVsForValidation([]);
        setShowCVFullForm(false);
        setInlineCVAnalysisResult(null);
        setShowInlineCVAnalysisModal(false);
      }
      
      // Hủy kết quả phân tích hiện tại nếu có
      if (hasAnalysisResult) {
        await clearAnalysisResult();
      }
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn phân tích CV "v${cv.version}"?\n` +
      "Hệ thống sẽ tải file CV hiện tại và tiến hành phân tích."
    );
    if (!confirmed) {
      return;
    }

    setAnalysisLoadingId(cv.id);
    setAnalysisError(null);

    try {
      // Sử dụng Firebase SDK để download file (tránh lỗi CORS)
      const blob = await downloadFileFromFirebase(cv.cvFileUrl);
      const sanitizedVersionName = `v${cv.version}`.replace(/[^a-zA-Z0-9-_]/g, "_");
      const file = new File([blob], `${sanitizedVersionName || "cv"}_${cv.id}.pdf`, { type: blob.type || "application/pdf" });

      const result = await talentCVService.analyzeCVForUpdate(Number(id), file);
      setAnalysisResult(result);
      setAnalysisResultCVId(cv.id);
      if (ANALYSIS_RESULT_STORAGE_KEY) {
        try {
          sessionStorage.setItem(
            ANALYSIS_RESULT_STORAGE_KEY,
            JSON.stringify({ cvId: cv.id, result })
          );
        } catch (storageError) {
          console.warn("Không thể lưu kết quả phân tích CV:", storageError);
        }
      }
    } catch (error) {
      console.error("❌ Lỗi phân tích CV:", error);
      const message = (error as { message?: string }).message ?? "Không thể phân tích CV";
      setAnalysisError(message);
      alert(`❌ ${message}`);
    } finally {
      setAnalysisLoadingId(null);
    }
  };

  // Hủy kết quả phân tích mà không đóng form (dùng khi phân tích file mới)
  const clearAnalysisResult = async () => {
    clearPrefillStorage();
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisLoadingId(null);
    setAnalysisResultCVId(null);
    if (ANALYSIS_RESULT_STORAGE_KEY) {
      try {
        sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
      } catch (storageError) {
        console.warn("Không thể xóa kết quả phân tích CV đã lưu:", storageError);
      }
    }
  };

  const handleCancelAnalysis = async () => {
    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền hủy phân tích CV. Chỉ TA đang quản lý nhân sự này mới được hủy phân tích.");
      return;
    }
    
    // Kiểm tra nếu có file đã upload lên Firebase trong form
    const hasFirebaseFile = showInlineForm === "cv" && isCVUploadedFromFirebase && uploadedCVUrl && inlineCVForm.cvFileUrl && uploadedCVUrl === inlineCVForm.cvFileUrl;
    
    // Tạo thông báo cảnh báo
    let warningMessage = "⚠️ CẢNH BÁO\n\n";
    warningMessage += "Bạn có chắc chắn muốn hủy kết quả phân tích CV không?\n\n";
    
    if (hasFirebaseFile) {
      warningMessage += "⚠️ LƯU Ý:\n";
      warningMessage += "- Kết quả phân tích CV sẽ bị xóa.\n";
      warningMessage += "- File CV đã upload lên Firebase sẽ bị xóa vĩnh viễn.\n";
      warningMessage += "- Form tạo CV sẽ bị đóng.\n\n";
    } else {
      warningMessage += "Kết quả phân tích CV sẽ bị xóa và không thể khôi phục.\n\n";
    }
    
    warningMessage += "Bạn có muốn tiếp tục không?";
    
    const confirmed = window.confirm(warningMessage);
    
    // Nếu người dùng không xác nhận, dừng ngay - không làm gì cả
    if (!confirmed) {
      return;
    }
    
    // Người dùng đã xác nhận, tiếp tục hủy phân tích
    await clearAnalysisResult();
    
    // Xóa file CV đã upload lên Firebase nếu có
    if (hasFirebaseFile) {
      try {
        const firebasePath = extractCVFirebasePath(uploadedCVUrl!);
        if (firebasePath) {
          const fileRef = ref(storage, firebasePath);
          await deleteObject(fileRef);
        }
      } catch (err) {
        console.error("❌ Error deleting CV file from Firebase:", err);
        // Vẫn tiếp tục xóa các state dù không xóa được file
      }
    }
    
    // Đóng form tạo CV nếu đang mở
    if (showInlineForm === "cv") {
      // Không cần cảnh báo lại vì đã cảnh báo ở trên
      setShowInlineForm(null);
      setAvailableTimeFormErrors({});
      setCertificateImageFile(null);
      setUploadedCertificateUrl(null);
      setCertificateFormErrors({});
      // Clean up CV form
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
      setCvFormErrors({});
      setCvVersionError("");
      setSelectedCVFile(null);
      setUploadingCV(false);
      setCvUploadProgress(0);
      setIsCVUploadedFromFirebase(false);
      setUploadedCVUrl(null);
      setExtractingCV(false);
      setCvPreviewUrl(null);
      setExtractedCVData(null);
      setExistingCVsForValidation([]);
      setShowCVFullForm(false);
      setInlineCVAnalysisResult(null);
      setShowInlineCVAnalysisModal(false);
      
      // Xóa dữ liệu đã lưu trong storage
      if (CV_FORM_STORAGE_KEY) {
        try {
          const rememberMe = localStorage.getItem('remember_me') === 'true';
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.removeItem(CV_FORM_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa dữ liệu form CV từ storage:", error);
        }
      }
      
      // Xóa file từ IndexedDB
      if (CV_FILE_STORAGE_KEY) {
        try {
          await deleteFileFromIndexedDB(CV_FILE_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa file từ IndexedDB:", error);
        }
      }
      
      // Xóa file từ IndexedDB
      if (CV_FILE_STORAGE_KEY) {
        try {
          await deleteFileFromIndexedDB(CV_FILE_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa file từ IndexedDB:", error);
        }
      }
    }
    // Reset form CV full
    setShowCVFullForm(false);
    setInlineCVAnalysisResult(null);
    setShowInlineCVAnalysisModal(false);
  };

  const isSuggestionPending = useCallback(
    (key: string) => {
      if (!key) return false;
      return sentSuggestionKeys.has(key);
    },
    [sentSuggestionKeys]
  );

  const handleSuggestionRequest = useCallback(
    async (
      category: SuggestionCategory,
      suggestionKey: string,
      displayItems: string[],
      detailItems: Array<Record<string, string>>,
      actionUrl?: string
    ) => {
      if (!suggestionKey || !displayItems.length) {
        alert("Không có dữ liệu đề xuất hợp lệ.");
        return;
      }
      if (!adminUserIds.length) {
        alert("Không tìm thấy người dùng Admin để gửi đề xuất.");
        return;
      }
      if (!id) {
        alert("Thiếu thông tin nhân sự để gửi đề xuất.");
        return;
      }
      if (isSuggestionPending(suggestionKey)) {
        alert("Đã gửi đề xuất này trước đó và đang chờ Admin xử lý.");
        return;
      }

      const categoryConfig: Record<SuggestionCategory, { label: string; title: string; actionUrl: string }> = {
        skill: {
          label: "kỹ năng mới",
          title: "[Đề xuất] Thêm kỹ năng mới",
          actionUrl: "/admin/categories/skill",
        },
        jobRoleLevel: {
          label: "vị trí/level mới",
          title: "[Đề xuất] Thêm vị trí/level mới",
          actionUrl: "/admin/categories/job-role-levels",
        },
        certificate: {
          label: "loại chứng chỉ mới",
          title: "[Đề xuất] Thêm loại chứng chỉ mới",
          actionUrl: "/admin/categories/certificate-types",
        },
      };

      const config = categoryConfig[category];
      const confirmMessage = `Bạn có chắc muốn gửi đề xuất tới Admin để bổ sung ${config.label}?\n${displayItems
        .map((item, idx) => ` ${idx + 1}. ${item}`)
        .join("\n")}`;

      if (!window.confirm(confirmMessage)) return;

      try {
        const token = localStorage.getItem("accessToken");
        const decoded = token ? decodeJWT(token) : null;
        const requesterName = decoded?.unique_name || decoded?.email || decoded?.name || "TA Staff";
        const messageLines = displayItems.map((item, idx) => `${idx + 1}. ${item}`).join("\n");

        await notificationService.create({
          title: config.title,
          message: `${requesterName} đề xuất thêm ${config.label} cho nhân sự ${talentName}:\n${messageLines}`,
          type: NotificationType.DocumentUploaded,
          priority: NotificationPriority.Medium,
          userIds: adminUserIds,
          entityType: "Talent",
          entityId: Number(id),
          actionUrl: actionUrl ?? config.actionUrl,
          metaData: {
            category,
            talentId: id ?? "",
            talentName,
            suggestions: JSON.stringify(detailItems),
          },
        });

        // Đánh dấu đã gửi đề xuất này
        setSentSuggestionKeys((prev) => new Set(prev).add(suggestionKey));

        alert("Đã gửi đề xuất tới Admin thành công!");
      } catch (error) {
        console.error("Không thể gửi đề xuất tới Admin:", error);
        alert("Không thể gửi đề xuất tới Admin.");
      }
    },
    [adminUserIds, id, isSuggestionPending, talentName]
  );



  const systemSkillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    lookupSkills.forEach((skill) => {
      const key = skill.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, skill);
    });
    return map;
  }, [lookupSkills]);

  const talentSkillLookup = useMemo(() => {
    const byId = new Map<number, (TalentSkill & { skillName: string })>();
    const byName = new Map<string, (TalentSkill & { skillName: string })>();
    const normalizedNames = new Set<string>();

    talentSkills.forEach((skill) => {
      byId.set(skill.skillId, skill);
      const normalized = skill.skillName?.trim().toLowerCase();
      if (normalized) {
        byName.set(normalized, skill);
        normalizedNames.add(normalized);
      }
    });

    return { byId, byName, normalizedNames };
  }, [talentSkills]);


  const unmatchedSkillSuggestions = useMemo(() => {
    if (!analysisResult) return [];
    // Chỉ lấy những skill chưa có trong hệ thống
    return analysisResult.skills.newFromCV.filter((suggestion) => {
      const name = suggestion.skillName?.trim().toLowerCase() ?? "";
      if (!name) return false;
      // Chưa có trong hệ thống
      return !systemSkillMap.has(name);
    });
  }, [analysisResult, systemSkillMap]);

  const matchedSkillsDetails = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.skills.matched
      .filter((match) => {
        const normalized = match.skillName.trim().toLowerCase();
        return (
          (match.skillId !== undefined && talentSkillLookup.byId.has(match.skillId)) ||
          talentSkillLookup.byName.has(normalized)
        );
      })
      .map((match) => {
        const normalized = match.skillName.trim().toLowerCase();
        const existing =
          (match.skillId !== undefined && talentSkillLookup.byId.get(match.skillId)) ||
          talentSkillLookup.byName.get(normalized);
        return {
          skillName: match.skillName,
          cvLevel: match.cvLevel ?? "—",
          cvYearsExp: match.cvYearsExp ?? "—",
          matchConfidence: Math.round(match.matchConfidence * 100),
          systemLevel: existing?.level ?? "—",
          systemYearsExp: existing?.yearsExp ?? "—",
        };
      });
  }, [analysisResult, talentSkillLookup]);

  // Matched skills có trong hệ thống nhưng chưa có trong hồ sơ (chưa có trong talent)
  const matchedSkillsNotInProfile = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.skills.matched
      .filter((match) => {
        if (!match.skillId) return false; // Phải có skillId để biết có trong hệ thống
        const normalized = match.skillName.trim().toLowerCase();
        // Có trong hệ thống (có skillId) nhưng chưa có trong talent
        return !talentSkillLookup.byId.has(match.skillId) && !talentSkillLookup.byName.has(normalized);
      })
      .map((match) => {
        return {
          skillId: match.skillId!,
          skillName: match.skillName,
          cvLevel: match.cvLevel ?? undefined,
          cvYearsExp: match.cvYearsExp ?? undefined,
          matchConfidence: Math.round(match.matchConfidence * 100),
        };
      });
  }, [analysisResult, talentSkillLookup, lookupSkills]);

  // Hàm tạo nhanh skill từ matched item
  const handleQuickCreateSkill = (matchedSkill: { skillId: number; skillName: string; cvLevel?: string; cvYearsExp?: number }) => {
    // Chuyển sang tab skills
    setActiveTab("skills");
    
    // Mở form inline trước (sẽ reset form)
    handleOpenInlineForm("skill");
    
    // Chuẩn bị và điền dữ liệu vào form sau khi form đã mở và reset
    setTimeout(() => {
      const levelMap: Record<string, string> = {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced",
        "expert": "Expert",
      };
      const level = matchedSkill.cvLevel ? (levelMap[matchedSkill.cvLevel.toLowerCase()] || "Beginner") : "Beginner";
      const yearsExp = matchedSkill.cvYearsExp ? Number(matchedSkill.cvYearsExp) : 1;
      
      // Tìm skill để lấy skillGroupId
      const skill = lookupSkills.find(s => s.id === matchedSkill.skillId);
      
      setInlineSkillForm({
        skillId: matchedSkill.skillId,
        level: level as "Beginner" | "Intermediate" | "Advanced" | "Expert",
        yearsExp: yearsExp,
      });
      
      // Lọc theo nhóm kỹ năng nếu có
      if (skill?.skillGroupId) {
        setSelectedSkillGroupId(skill.skillGroupId);
      }
      
      // Tự động lọc để hiển thị kỹ năng đã chọn
      setSkillSearchQuery(matchedSkill.skillName);
      setIsSkillDropdownOpen(false);
    }, 100);
  };


  const getTalentLevelName = (levelValue: number | undefined) => {
    if (levelValue === undefined) return "";
    const match = Object.entries(TalentLevelEnum).find(([, value]) => value === levelValue);
    return match?.[0]?.toLowerCase() ?? "";
  };

  const normalizeJobRoleKey = (position?: string | null, level?: string | null) => {
    const normalizedPosition = (position ?? "").trim().toLowerCase();
    const normalizedLevel = (level ?? "").trim().toLowerCase();
    return `${normalizedPosition}|${normalizedLevel}`;
  };

  const jobRoleLevelSystemMap = useMemo(() => {
    const map = new Map<string, JobRoleLevel>();
    lookupJobRoleLevels.forEach((jobRoleLevel) => {
      const key = normalizeJobRoleKey(jobRoleLevel.name, getTalentLevelName(jobRoleLevel.level));
      if (key !== "|") {
        map.set(key, jobRoleLevel);
      }
    });
    return map;
  }, [lookupJobRoleLevels]);

  const talentJobRoleLevelMap = useMemo(() => {
    const map = new Map<
      string,
      {
        existing: TalentJobRoleLevel & { jobRoleLevelName: string };
        system?: JobRoleLevel;
      }
    >();
    jobRoleLevels.forEach((record) => {
      const system = lookupJobRoleLevels.find((jobRoleLevel) => jobRoleLevel.id === record.jobRoleLevelId);
      const key = normalizeJobRoleKey(system?.name ?? record.jobRoleLevelName, system ? getTalentLevelName(system.level) : undefined);
      if (key !== "|") {
        map.set(key, { existing: record, system });
      }
    });
    return map;
  }, [jobRoleLevels, lookupJobRoleLevels]);

  type JobRoleLevelSuggestion = CVAnalysisComparisonResponse["jobRoleLevels"]["newFromCV"][number];

  const jobRoleLevelComparisons = useMemo(() => {
    const result = {
      recognized: [] as Array<{ suggestion: JobRoleLevelSuggestion; system: JobRoleLevel }>,
      matched: [] as Array<{ suggestion: JobRoleLevelSuggestion; existing: TalentJobRoleLevel & { jobRoleLevelName: string }; system?: JobRoleLevel }>,
      unmatched: [] as JobRoleLevelSuggestion[],
      onlyInTalent: [] as Array<{ existing: TalentJobRoleLevel & { jobRoleLevelName: string }; system?: JobRoleLevel }>,
    };

    if (!analysisResult) return result;

    const cvKeys = new Set<string>();

    analysisResult.jobRoleLevels.newFromCV.forEach((suggestion) => {
      const key = normalizeJobRoleKey(suggestion.position, suggestion.level);
      if (key === "|") return;
      cvKeys.add(key);

      const system = jobRoleLevelSystemMap.get(key);
      const existingInfo = talentJobRoleLevelMap.get(key);

      if (existingInfo) {
        result.matched.push({ suggestion, existing: existingInfo.existing, system: existingInfo.system });
      } else if (system) {
        result.recognized.push({ suggestion, system });
      } else {
        result.unmatched.push(suggestion);
      }
    });

    talentJobRoleLevelMap.forEach((value, key) => {
      if (!cvKeys.has(key)) {
        result.onlyInTalent.push(value);
      }
    });

    return result;
  }, [analysisResult, jobRoleLevelSystemMap, talentJobRoleLevelMap]);

  // Cần tạo mới - JobRoleLevels có trong hệ thống nhưng chưa có trong hồ sơ (từ recognized) - có nút "Tạo nhanh"
  const matchedJobRoleLevelsNotInProfile = useMemo(() => {
    if (!analysisResult) return [];
    const result: Array<{ jobRoleLevelId: number; position: string; level?: string; yearsOfExp?: number; ratePerMonth?: number }> = [];
    
    // Lấy từ recognized (có trong hệ thống, chưa có trong hồ sơ) để tránh trùng với "Đề xuất thêm"
    // Chỉ lấy một phần để làm "Cần tạo mới" (có nút), phần còn lại sẽ là "Đề xuất thêm" (không có nút)
    // Tạm thời lấy tất cả từ recognized để có nút "Tạo nhanh"
    jobRoleLevelComparisons.recognized.forEach(({ suggestion, system }) => {
      if (system) {
        result.push({
          jobRoleLevelId: system.id,
          position: suggestion.position ?? system.name ?? "",
          level: suggestion.level ?? undefined,
          yearsOfExp: suggestion.yearsOfExp ?? undefined,
          ratePerMonth: suggestion.ratePerMonth ?? undefined,
        });
      }
    });
    
    return result;
  }, [jobRoleLevelComparisons]);

  const normalizeCertificateName = (name?: string | null) => (name ?? "").trim().toLowerCase();

  const certificateSystemMap = useMemo(() => {
    const map = new Map<string, CertificateType>();
    lookupCertificateTypes.forEach((type) => {
      const key = normalizeCertificateName(type.name);
      if (key) map.set(key, type);
    });
    return map;
  }, [lookupCertificateTypes]);

  const talentCertificateMap = useMemo(() => {
    const map = new Map<string, (TalentCertificate & { certificateTypeName: string })>();
    certificates.forEach((certificate) => {
      const key = normalizeCertificateName(certificate.certificateTypeName);
      if (key) map.set(key, certificate);
    });
    return map;
  }, [certificates]);

  type CertificateSuggestion = CVAnalysisComparisonResponse["certificates"]["newFromCV"][number];

  const certificateComparisons = useMemo(() => {
    const result = {
      recognized: [] as Array<{ suggestion: CertificateSuggestion; system: CertificateType }>,
      matched: [] as Array<{ suggestion: CertificateSuggestion; existing: TalentCertificate & { certificateTypeName: string }; system?: CertificateType }>,
      unmatched: [] as CertificateSuggestion[],
      onlyInTalent: [] as Array<TalentCertificate & { certificateTypeName: string }>,
    };

    if (!analysisResult) return result;

    const cvKeys = new Set<string>();

    analysisResult.certificates.newFromCV.forEach((suggestion) => {
      const key = normalizeCertificateName(suggestion.certificateName);
      if (!key) return;
      cvKeys.add(key);

      const system = certificateSystemMap.get(key);
      const existing = talentCertificateMap.get(key);

      if (existing) {
        result.matched.push({ suggestion, existing, system });
      } else if (system) {
        result.recognized.push({ suggestion, system });
      } else {
        result.unmatched.push(suggestion);
      }
    });

    talentCertificateMap.forEach((existing, key) => {
      if (!cvKeys.has(key)) {
        result.onlyInTalent.push(existing);
      }
    });

    return result;
  }, [analysisResult, certificateSystemMap, talentCertificateMap]);

  const {
    matched: jobRoleLevelsMatched,
    unmatched: jobRoleLevelsUnmatched,
    onlyInTalent: jobRoleLevelsOnlyInTalent,
  } = jobRoleLevelComparisons;

  const {
    recognized: certificatesRecognized,
    matched: certificatesMatched,
    unmatched: certificatesUnmatched,
    onlyInTalent: certificatesOnlyInTalent,
  } = certificateComparisons;

  const skillSuggestionRequestKey = useMemo(() => {
    if (!unmatchedSkillSuggestions.length) return "";
    return `skill:${unmatchedSkillSuggestions
      .map((suggestion, index) => {
        const normalized = (suggestion.skillName ?? "").trim().toLowerCase();
        return normalized.length > 0 ? normalized : `__unknown-skill-${index}`;
      })
      .sort()
      .join("|")}`;
  }, [unmatchedSkillSuggestions]);

  const skillSuggestionDisplayItems = useMemo(
    () =>
      unmatchedSkillSuggestions.map((suggestion, index) => {
        const name = suggestion.skillName?.trim();
        return name && name.length > 0 ? name : `Kỹ năng chưa rõ #${index + 1}`;
      }),
    [unmatchedSkillSuggestions]
  );

  const skillSuggestionDetailItems = useMemo(
    () =>
      unmatchedSkillSuggestions.map((suggestion) => ({
        skillName: suggestion.skillName ?? "",
        level: suggestion.level ?? "",
        yearsExp: suggestion.yearsExp != null ? String(suggestion.yearsExp) : "",
      })),
    [unmatchedSkillSuggestions]
  );

  const handleDeleteProjects = async () => {
    if (selectedProjects.length === 0) {
      alert("⚠️ Vui lòng chọn dự án để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedProjects.length} dự án đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedProjects.map(id => talentProjectService.deleteById(id)));
      alert("✅ Đã xóa dự án thành công!");
      setSelectedProjects([]);
      // Refresh data
      const projects = await talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true });
      setTalentProjects(projects);
    } catch (err) {
      console.error("❌ Lỗi khi xóa dự án:", err);
      alert("Không thể xóa dự án!");
    }
  };

  const handleDeleteSkills = async () => {
    if (selectedSkills.length === 0) {
      alert("⚠️ Vui lòng chọn kỹ năng để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedSkills.length} kỹ năng đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedSkills.map(id => talentSkillService.deleteById(id)));
      alert("✅ Đã xóa kỹ năng thành công!");
      setSelectedSkills([]);
      // Refresh data
      const skills = await talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allSkills = await skillService.getAll();
      setLookupSkills(allSkills);
      const skillsWithNames = skills.map((skill: TalentSkill) => {
        const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
        return { ...skill, skillName: skillInfo?.name ?? "Unknown Skill" };
      });
      setTalentSkills(skillsWithNames);

      // Refresh status để check needsReverification (khi xóa skill từ group đã verify)
      const distinctSkillGroupIds = Array.from(
        new Set(
          skillsWithNames
            .map((s: any) => s.skillGroupId)
            .filter((gid: number | undefined) => typeof gid === "number")
        )
      ) as number[];

      if (distinctSkillGroupIds.length > 0) {
        try {
          const statuses =
            await talentSkillGroupAssessmentService.getVerificationStatuses(
              Number(id),
              distinctSkillGroupIds
            );
          if (Array.isArray(statuses)) {
            const statusMap: Record<number, SkillGroupVerificationStatus> = {};
            statuses.forEach((st) => {
              statusMap[st.skillGroupId] = st;
            });
            setSkillGroupVerificationStatuses(statusMap);
          }
        } catch (statusError) {
          console.error("❌ Lỗi khi refresh trạng thái verify sau khi xóa skill:", statusError);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa kỹ năng:", err);
      alert("Không thể xóa kỹ năng!");
    }
  };

  const handleDeleteExperiences = async () => {
    if (selectedExperiences.length === 0) {
      alert("⚠️ Vui lòng chọn kinh nghiệm để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedExperiences.length} kinh nghiệm đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedExperiences.map(id => talentWorkExperienceService.deleteById(id)));
      alert("✅ Đã xóa kinh nghiệm thành công!");
      setSelectedExperiences([]);
      // Refresh data
      const experiences = await talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true });
      setWorkExperiences(experiences);
    } catch (err) {
      console.error("❌ Lỗi khi xóa kinh nghiệm:", err);
      alert("Không thể xóa kinh nghiệm!");
    }
  };

  const handleDeleteJobRoleLevels = async () => {
    if (selectedJobRoleLevels.length === 0) {
      alert("⚠️ Vui lòng chọn vị trí để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedJobRoleLevels.length} vị trí đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedJobRoleLevels.map(id => talentJobRoleLevelService.deleteById(id)));
      alert("✅ Đã xóa vị trí thành công!");
      setSelectedJobRoleLevels([]);
      // Refresh data
      const jobRoleLevelsData = await talentJobRoleLevelService.getAll({ talentId: Number(id), excludeDeleted: true });
      const [allJobRoleLevels, allJobRolesData] = await Promise.all([
        jobRoleLevelService.getAll({ excludeDeleted: true }),
        jobRoleService.getAll()
      ]);
      setLookupJobRoleLevelsForTalent(allJobRoleLevels);
      const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
        const jobRoleLevelInfo = allJobRoleLevels.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
        if (!jobRoleLevelInfo) {
          return { ...jrl, jobRoleLevelName: "Unknown Level" };
        }
        const jobRole = allJobRolesData.find(r => r.id === jobRoleLevelInfo.jobRoleId);
        const roleName = jobRole?.name || "—";
        const levelText = getLevelText(jobRoleLevelInfo.level);
        const displayName = `${roleName} - ${levelText}`;
        return { ...jrl, jobRoleLevelName: displayName };
      });
      setJobRoleLevels(jobRoleLevelsWithNames);
    } catch (err) {
      console.error("❌ Lỗi khi xóa vị trí:", err);
      alert("Không thể xóa vị trí!");
    }
  };

  const handleDeleteCertificates = async () => {
    if (selectedCertificates.length === 0) {
      alert("⚠️ Vui lòng chọn chứng chỉ để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedCertificates.length} chứng chỉ đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedCertificates.map(id => talentCertificateService.deleteById(id)));
      alert("✅ Đã xóa chứng chỉ thành công!");
      setSelectedCertificates([]);
      // Refresh data
      const certificatesData = await talentCertificateService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allCertificateTypes = await certificateTypeService.getAll();
      setLookupCertificateTypes(allCertificateTypes);
      const certificatesWithNames = certificatesData.map((cert: TalentCertificate) => {
        const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
        return { ...cert, certificateTypeName: certTypeInfo?.name ?? "Unknown Certificate" };
      });
      setCertificates(certificatesWithNames);
    } catch (err) {
      console.error("❌ Lỗi khi xóa chứng chỉ:", err);
      alert("Không thể xóa chứng chỉ!");
    }
  };

  // ✅ Helper function để đóng modal verify và reset state
  const handleCloseVerifySkillGroupModal = () => {
    setSkillGroupVerifyModal({ isOpen: false });
    setVerifyExpertName("");
    setVerifyNote("");
    setVerifyResult(true);
    setSelectedExpertId("");
    setIsVerifyingSkillGroup(false);
  };

  // ✅ Xử lý verify kỹ năng theo SkillGroup cho nhân sự (verify cả nhóm)
  const handleOpenVerifySkillGroup = (skillGroupId: number | undefined) => {
    if (!skillGroupId) {
      alert("⚠️ Kỹ năng này chưa được gắn nhóm kỹ năng, không thể verify theo group.");
      return;
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền verify nhóm kỹ năng. Chỉ TA đang quản lý nhân sự này mới được verify.");
      return;
    }
    
    const group = lookupSkillGroups.find((g) => g.id === skillGroupId);
    setSkillGroupVerifyModal({
      isOpen: true,
      skillGroupId,
      skillGroupName: group?.name ?? "Nhóm kỹ năng",
    });
    setVerifyExpertName("");
    setVerifyNote("");
    setVerifyResult(true); // Mặc định là verify pass
    setSelectedExpertId("");
    setExpertsForSkillGroup([]);
    setSkillSnapshotEnabled(true);
    setShowAllSkillsInVerifyModal(false);
    setIsVerifyingSkillGroup(false);
    // Tải danh sách expert đã được gán nhóm kỹ năng này (nếu có)
    const fetchExperts = async () => {
      try {
        setExpertsForSkillGroupLoading(true);
        const data = await expertService.getAll({ excludeDeleted: true });
        const arr: Expert[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        const result: Expert[] = [];
        // Duyệt qua từng expert để xem có gán group này không
        for (const ex of arr) {
          try {
            const groups = await expertService.getSkillGroups(ex.id);
            if (groups.some((g) => g.skillGroupId === skillGroupId)) {
              result.push(ex);
            }
          } catch (err) {
            console.warn("Không thể tải nhóm kỹ năng của expert", ex.id, err);
          }
        }
        setExpertsForSkillGroup(result);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách chuyên gia cho skill group:", err);
        setExpertsForSkillGroup([]);
      } finally {
        setExpertsForSkillGroupLoading(false);
      }
    };
    fetchExperts();
  };

  // ✅ Xử lý vô hiệu hóa (invalidate) đánh giá nhóm kỹ năng
  const handleInvalidateSkillGroup = async (skillGroupId: number | undefined) => {
    if (!id || !skillGroupId) {
      alert("⚠️ Không thể vô hiệu hóa đánh giá cho nhóm kỹ năng này.");
      return;
    }

    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền hủy đánh giá nhóm kỹ năng. Chỉ TA đang quản lý nhân sự này mới được hủy đánh giá.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do vô hiệu hóa đánh giá nhóm kỹ năng này (reason):",
      ""
    );
    if (reason === null) return; // Người dùng bấm Cancel

    try {
      await talentSkillGroupAssessmentService.invalidateAssessment(
        Number(id),
        skillGroupId,
        reason || undefined
      );

      // Đợi một chút để BE xử lý xong
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh lại trạng thái để cập nhật UI cho tất cả nhóm kỹ năng
      const distinctSkillGroupIds = Array.from(
        new Set(
          talentSkills
            .map((s: any) => s.skillGroupId)
            .filter((gid: number | undefined) => typeof gid === "number")
        )
      ) as number[];

      if (distinctSkillGroupIds.length > 0) {
        const statuses =
          await talentSkillGroupAssessmentService.getVerificationStatuses(
            Number(id),
            distinctSkillGroupIds
          );

        if (Array.isArray(statuses)) {
          const statusMap: Record<number, SkillGroupVerificationStatus> = {};
          statuses.forEach((st) => {
            statusMap[st.skillGroupId] = st;
          });
          setSkillGroupVerificationStatuses(statusMap);
        }
      }

      alert("✅ Đã vô hiệu hóa đánh giá nhóm kỹ năng thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi invalidate assessment:", err);
      alert("Không thể vô hiệu hóa đánh giá, vui lòng thử lại.");
    }
  };

  const handleConfirmVerifySkillGroup = async () => {
    if (!id || !skillGroupVerifyModal.skillGroupId) return;

    // Validation: Bắt buộc phải có chuyên gia để verify
    if (expertsForSkillGroup.length === 0) {
      alert("⚠️ Không có chuyên gia nào được gán cho nhóm kỹ năng này. Vui lòng liên hệ Admin để gán chuyên gia trước khi verify.");
      return;
    }

    // Validation: Phải chọn một chuyên gia từ danh sách
    if (!selectedExpertId) {
      alert("⚠️ Vui lòng chọn chuyên gia từ danh sách.");
      return;
    }

    // Validation: Ghi chú là bắt buộc khi verify fail
    if (verifyResult === false && !verifyNote.trim()) {
      alert("⚠️ Vui lòng nhập ghi chú lý do khi verify fail.");
      return;
    }

    // Hiển thị loading ngay lập tức
    setIsVerifyingSkillGroup(true);

    try {
      const groupId = skillGroupVerifyModal.skillGroupId;

      // Lấy danh sách kỹ năng thuộc skillGroup hiện tại
      const skillsInGroup = talentSkills.filter(
        (s: any) => s.skillGroupId === groupId
      );
      if (skillsInGroup.length === 0) {
        alert("⚠️ Không tìm thấy kỹ năng nào trong nhóm để verify.");
        setIsVerifyingSkillGroup(false);
        return;
      }

      const skillsSnapshotArray = skillsInGroup.map((s: any) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        level: s.level,
        yearsExp: s.yearsExp,
      }));

      const payload = {
        talentId: Number(id),
        skillGroupId: groupId,
        assessmentDate: new Date().toISOString(),
        isVerified: verifyResult, // Sử dụng giá trị từ state (có thể là true hoặc false)
        expertId: typeof selectedExpertId === "number" ? selectedExpertId : undefined,
        verifiedByName: verifyExpertName || undefined,
        note: verifyNote || undefined,
        skillSnapshot: verifyResult ? skillSnapshotEnabled ? JSON.stringify(skillsSnapshotArray) : undefined : undefined,
        verifiedSkills: verifyResult ? skillsInGroup.map((s: any) => ({
          skillId: s.skillId,
          level: s.level,
          yearsExp: s.yearsExp,
        })) : undefined, // Chỉ gửi verifiedSkills khi verify pass
      };

      await talentSkillGroupAssessmentService.verifySkillGroup(payload);

      // Đóng modal và hiển thị thông báo ngay lập tức
      handleCloseVerifySkillGroupModal();

      alert(verifyResult 
        ? "✅ Đã verify nhóm kỹ năng thành công (Pass)!" 
        : "⚠️ Đã đánh dấu nhóm kỹ năng không hợp lệ (Fail)!");

      // Refresh status ở background (không block UI) - chỉ đợi một chút để backend xử lý xong
      setTimeout(async () => {
        try {
          // Lấy tất cả skillGroupIds từ talentSkills hiện tại
          const distinctSkillGroupIds = Array.from(
            new Set(
              talentSkills
                .map((s: any) => s.skillGroupId)
                .filter((gid: number | undefined) => typeof gid === "number")
            )
          ) as number[];

          if (distinctSkillGroupIds.length > 0) {
            // Chỉ retry 1 lần với delay ngắn để tối ưu tốc độ
            await new Promise((resolve) => setTimeout(resolve, 300));
            
            try {
              const statuses =
                await talentSkillGroupAssessmentService.getVerificationStatuses(
                  Number(id),
                  distinctSkillGroupIds
                );
              
              if (Array.isArray(statuses)) {
                const statusMap: Record<number, SkillGroupVerificationStatus> = {};
                statuses.forEach((st) => {
                  statusMap[st.skillGroupId] = st;
                });
                
                // Kiểm tra và cập nhật status cho group vừa verify
                const verifiedStatus = statusMap[groupId];
                if (!verifiedStatus || verifiedStatus.isVerified !== verifyResult) {
                  // Thử lấy từ getLatest nếu status chưa đúng
                  try {
                    const latest = await talentSkillGroupAssessmentService.getLatest(
                      Number(id),
                      groupId
                    );
                    if (latest && latest.isVerified === verifyResult && latest.isActive !== false) {
                      statusMap[groupId] = {
                        talentId: Number(id),
                        skillGroupId: groupId,
                        skillGroupName: skillGroupVerifyModal.skillGroupName || "",
                        isVerified: latest.isVerified,
                        lastVerifiedDate: latest.assessmentDate,
                        lastVerifiedByExpertId: latest.expertId ?? undefined,
                        lastVerifiedByExpertName: latest.verifiedByName ?? latest.expertName ?? undefined,
                        needsReverification: false,
                      };
                    }
                  } catch (latestError) {
                    console.warn("Không thể lấy latest assessment:", latestError);
                  }
                }
                
                setSkillGroupVerificationStatuses(statusMap);
              }
            } catch (statusError) {
              console.error("❌ Lỗi khi refresh trạng thái verify:", statusError);
            }
          }
        } catch (error) {
          console.error("❌ Lỗi khi refresh trạng thái verify:", error);
        }
      }, 100);
    } catch (err: any) {
      setIsVerifyingSkillGroup(false);
      console.error("❌ Lỗi khi verify nhóm kỹ năng:", err);
      
      // Xử lý lỗi thiếu mandatory skills (400 error)
      const errorMessage = err?.message || err?.response?.data?.message || "Không thể verify nhóm kỹ năng, vui lòng thử lại.";
      
      if (errorMessage.includes("Missing mandatory skills") || errorMessage.includes("mandatory")) {
        // Parse danh sách skills thiếu từ error message
        const missingSkillsMatch = errorMessage.match(/Missing mandatory skills:\s*(.+)/i);
        const missingSkillsList = missingSkillsMatch 
          ? missingSkillsMatch[1].split(',').map((s: string) => s.trim())
          : [];

        // Lấy thông tin về skill group và mandatory skills
        const groupId = skillGroupVerifyModal.skillGroupId;
        const group = lookupSkillGroups.find((g) => g.id === groupId);
        const groupName = group?.name || skillGroupVerifyModal.skillGroupName || `Nhóm kỹ năng #${groupId}`;
        
        // Lấy tất cả mandatory skills trong group
        const allMandatorySkillsInGroup = lookupSkills.filter(
          (s: Skill) => s.skillGroupId === groupId && s.isMandatory === true
        );
        
        // Lấy skills mandatory mà talent đang có
        const talentMandatorySkills = talentSkills
          .filter((ts: any) => ts.skillGroupId === groupId)
          .map((ts: any) => {
            const skillInfo = lookupSkills.find((s: Skill) => s.id === ts.skillId);
            return skillInfo && skillInfo.isMandatory ? skillInfo : null;
          })
          .filter(Boolean) as Skill[];

        // Tạo message chi tiết
        let detailMessage = `⚠️ Không thể verify nhóm kỹ năng "${groupName}"!\n\n`;
        detailMessage += `📋 Nhóm này có ${allMandatorySkillsInGroup.length} kỹ năng bắt buộc (mandatory):\n`;
        allMandatorySkillsInGroup.forEach((skill: Skill) => {
          const hasSkill = talentMandatorySkills.some((ts: Skill) => ts.id === skill.id);
          detailMessage += `  ${hasSkill ? '✅' : '❌'} ${skill.name}\n`;
        });
        
        if (missingSkillsList.length > 0) {
          detailMessage += `\n❌ Còn thiếu ${missingSkillsList.length} kỹ năng bắt buộc:\n`;
          missingSkillsList.forEach((skillName: string) => {
            detailMessage += `  • ${skillName}\n`;
          });
        }
        
        detailMessage += `\n💡 Vui lòng thêm tất cả kỹ năng bắt buộc vào nhóm kỹ năng này trước khi verify.`;
        
        alert(detailMessage);
      } else {
        alert(`❌ ${errorMessage}`);
      }
    }
  };

  const handleOpenHistorySkillGroup = async (skillGroupId?: number) => {
    if (!id || !skillGroupId) return;
    const group = lookupSkillGroups.find((g) => g.id === skillGroupId);
    setHistoryModal({
      isOpen: true,
      skillGroupId,
      skillGroupName: group?.name ?? "Nhóm kỹ năng",
      items: [],
      loading: true,
    });
    try {
      const items = await talentSkillGroupAssessmentService.getAssessmentHistory(
        Number(id),
        skillGroupId
      );
      setHistoryModal((prev) => ({
        ...prev,
        items,
        loading: false,
      }));
    } catch (err) {
      console.error("❌ Lỗi khi tải lịch sử đánh giá skill group:", err);
      alert("Không thể tải lịch sử đánh giá, vui lòng thử lại.");
      setHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteAvailableTimes = async () => {
    if (selectedAvailableTimes.length === 0) {
      alert("⚠️ Vui lòng chọn thời gian để xóa!");
      return;
    }
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedAvailableTimes.length} thời gian đã chọn?`);
    if (!confirm) return;

    try {
      await Promise.all(selectedAvailableTimes.map(id => talentAvailableTimeService.deleteById(id)));
      alert("✅ Đã xóa thời gian thành công!");
      setSelectedAvailableTimes([]);
      // Refresh data
      const availableTimesData = await talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true });
      setAvailableTimes(availableTimesData);
    } catch (err) {
      console.error("❌ Lỗi khi xóa thời gian:", err);
      alert("Không thể xóa thời gian!");
    }
  };

  // Inline form handlers
  const handleOpenInlineForm = (type: "project" | "skill" | "certificate" | "experience" | "jobRoleLevel" | "availableTime" | "cv") => {
    if (isSubmitting) {
      return; // Chỉ chặn khi đang submit
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền chỉnh sửa nhân sự này. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa.");
      return;
    }
    
    // Cho phép mở form của tab khác (sẽ tự động đóng form cũ)
    setShowInlineForm(type);
    // Reset form based on type
    if (type === "project") {
      setInlineProjectForm({ projectName: "", position: "", technologies: "", description: "" });
    } else if (type === "skill") {
      setInlineSkillForm({ skillId: 0, level: "Beginner", yearsExp: 1 });
    } else if (type === "certificate") {
      setInlineCertificateForm({ certificateTypeId: 0, certificateName: "", certificateDescription: "", issuedDate: undefined, isVerified: false, imageUrl: "" });
      setCertificateImageFile(null);
      setUploadedCertificateUrl(null);
      setCertificateFormErrors({});
    } else if (type === "experience") {
      setInlineExperienceForm({ company: "", position: "", startDate: "", endDate: undefined, description: "" });
    } else if (type === "jobRoleLevel") {
      setInlineJobRoleLevelForm({ jobRoleLevelId: 0, yearsOfExp: 1, ratePerMonth: undefined });
    } else if (type === "availableTime") {
      setInlineAvailableTimeForm({ startTime: "", endTime: undefined, notes: "" });
      setAvailableTimeFormErrors({});
    } else if (type === "cv") {
      setInlineCVForm({
        jobRoleLevelId: 0,
        version: 1,
        cvFileUrl: "",
        isActive: true,
        summary: "",
        isGeneratedFromTemplate: false,
      });
      setCvFormErrors({});
      setCvVersionError("");
      setSelectedCVFile(null);
      setUploadingCV(false);
      setCvUploadProgress(0);
      setIsCVUploadedFromFirebase(false);
      setUploadedCVUrl(null);
      setExtractingCV(false);
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
      setCvPreviewUrl(null);
      setExtractedCVData(null);
      setExistingCVsForValidation([]);
      setInlineCVAnalysisResult(null);
      setShowInlineCVAnalysisModal(false);
    }
  };

  // Handle confirm and apply analysis result
  const handleConfirmInlineCVAnalysis = () => {
    if (!inlineCVAnalysisResult) return;
    
    // Tạo danh sách các trường khác nhau
    const differences: string[] = [];
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName)) {
      differences.push(`• Họ tên: "${inlineCVAnalysisResult.basicInfo.current.fullName ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.fullName ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email)) {
      differences.push(`• Email: "${inlineCVAnalysisResult.basicInfo.current.email ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.email ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone)) {
      differences.push(`• Điện thoại: "${inlineCVAnalysisResult.basicInfo.current.phone ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.phone ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName)) {
      differences.push(`• Nơi ở: "${inlineCVAnalysisResult.basicInfo.current.locationName ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.locationName ?? "—"}"`);
    }
    
    let confirmMessage = "⚠️ PHÁT HIỆN THÔNG TIN KHÁC NHAU:\n\n";
    
    if (differences.length > 0) {
      confirmMessage += differences.join("\n") + "\n\n";
    }
    
    confirmMessage += "Bạn có chắc chắn muốn xem các gợi ý phân tích ở các tab khác không?\n\n";
    confirmMessage += "Hệ thống sẽ hiển thị các gợi ý ở các tab:\n";
    confirmMessage += "• Kỹ năng\n";
    confirmMessage += "• Vị trí\n";
    confirmMessage += "• Chứng chỉ\n";
    confirmMessage += "• Dự án\n";
    confirmMessage += "• Kinh nghiệm\n\n";
    confirmMessage += "Form tạo CV sẽ được tự động điền với dữ liệu từ phân tích.\n\n";
    confirmMessage += "Bạn có muốn tiếp tục không?";
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;
    
    // Tự động điền form CV từ dữ liệu phân tích
    // 1. Tự động chọn jobRoleLevel từ gợi ý phân tích (nếu có)
    let autoSelectedJobRoleLevelId: number | undefined = undefined;
    if (inlineCVAnalysisResult.jobRoleLevels?.newFromCV && inlineCVAnalysisResult.jobRoleLevels.newFromCV.length > 0) {
      // Tính toán jobRoleLevelComparisons từ inlineCVAnalysisResult
      const cvKeys = new Set<string>();
      const recognized: Array<{ suggestion: any; system: JobRoleLevel }> = [];
      
      inlineCVAnalysisResult.jobRoleLevels.newFromCV.forEach((suggestion) => {
        const key = normalizeJobRoleKey(suggestion.position, suggestion.level);
        if (key === "|") return;
        cvKeys.add(key);
        
        const system = jobRoleLevelSystemMap.get(key);
        if (system) {
          recognized.push({ suggestion, system });
        }
      });
      
      // Lấy jobRoleLevel đầu tiên từ recognized (có trong hệ thống)
      if (recognized.length > 0) {
        autoSelectedJobRoleLevelId = recognized[0].system.id;
      } else {
        // Nếu không tìm thấy trong recognized, thử tìm theo position gần đúng
        const firstSuggestion = inlineCVAnalysisResult.jobRoleLevels.newFromCV[0];
        if (firstSuggestion.position) {
          const normalizedPosition = (firstSuggestion.position ?? "").trim().toLowerCase();
          // Tìm jobRoleLevel có tên gần giống với position
          const matchedJobRoleLevel = lookupJobRoleLevels.find((jrl) => {
            const normalizedName = (jrl.name ?? "").trim().toLowerCase();
            return normalizedName.includes(normalizedPosition) || normalizedPosition.includes(normalizedName);
          });
          if (matchedJobRoleLevel) {
            autoSelectedJobRoleLevelId = matchedJobRoleLevel.id;
          }
        }
      }
    }
    
    // 2. Tự động điền summary từ dữ liệu phân tích
    const summaryParts: string[] = [];
    if (inlineCVAnalysisResult.basicInfo.suggested.fullName) {
      summaryParts.push(`Tên: ${inlineCVAnalysisResult.basicInfo.suggested.fullName}`);
    }
    if (inlineCVAnalysisResult.skills && inlineCVAnalysisResult.skills.newFromCV.length > 0) {
      const skills = inlineCVAnalysisResult.skills.newFromCV.slice(0, 5).map((s: any) => s.skillName).join(', ');
      summaryParts.push(`Kỹ năng: ${skills}`);
    }
    if (inlineCVAnalysisResult.jobRoleLevels && inlineCVAnalysisResult.jobRoleLevels.newFromCV.length > 0) {
      const positions = inlineCVAnalysisResult.jobRoleLevels.newFromCV.slice(0, 3).map((jrl: any) => jrl.position).filter(Boolean).join(', ');
      if (positions) {
        summaryParts.push(`Vị trí: ${positions}`);
      }
    }
    const autoSummary = summaryParts.length > 0 ? summaryParts.join('. ') + '.' : undefined;
    
    // Cập nhật form CV với dữ liệu tự động điền
    setInlineCVForm(prev => {
      // Ưu tiên điền jobRoleLevelId từ phân tích nếu tìm thấy
      const newJobRoleLevelId = autoSelectedJobRoleLevelId 
        ? autoSelectedJobRoleLevelId 
        : (prev.jobRoleLevelId && prev.jobRoleLevelId !== 0 ? prev.jobRoleLevelId : 0);
      
      return {
        ...prev,
        jobRoleLevelId: newJobRoleLevelId,
        // Chỉ điền summary nếu chưa có
        summary: prev.summary || autoSummary || "",
      };
    });
    
    // Set analysis result để hiển thị gợi ý ở các tab khác
    setAnalysisResult(inlineCVAnalysisResult);
    setAnalysisResultCVId(null); // Không có CV ID vì đây là file mới
    
    // Lưu kết quả phân tích vào sessionStorage để giữ nguyên khi reload
    if (ANALYSIS_RESULT_STORAGE_KEY) {
      try {
        sessionStorage.setItem(
          ANALYSIS_RESULT_STORAGE_KEY,
          JSON.stringify({ cvId: null, result: inlineCVAnalysisResult })
        );
      } catch (storageError) {
        console.warn("Không thể lưu kết quả phân tích CV:", storageError);
      }
    }
    
    // Đóng modal và hiện form đầy đủ - KHÔNG đóng form, giữ nguyên để user có thể xem lại
    // Giữ file đã chọn (selectedCVFile và cvPreviewUrl) - không cần upload lên Firebase ngay
    setShowInlineCVAnalysisModal(false);
    setShowCVFullForm(true);
    
    // Giữ nguyên tab CV, không tự động chuyển tab
    alert("✅ Đã áp dụng kết quả phân tích! Form tạo CV đã được tự động điền. Vui lòng xem các gợi ý ở các tab tương ứng.");
  };

  // Helper function to check if values are different
  const isValueDifferent = (current: string | null | undefined, suggested: string | null | undefined): boolean => {
    const currentVal = (current ?? "").trim();
    const suggestedVal = (suggested ?? "").trim();
    return currentVal !== suggestedVal && suggestedVal !== "";
  };

  // Đóng form sau khi tạo CV thành công (không cảnh báo xóa file vì file đã được lưu vào CV)
  const closeInlineFormAfterSuccess = () => {
    setShowInlineForm(null);
    setAvailableTimeFormErrors({});
    setCertificateImageFile(null);
    setUploadedCertificateUrl(null);
    setCertificateFormErrors({});
    // Clean up CV form
    if (cvPreviewUrl) {
      URL.revokeObjectURL(cvPreviewUrl);
    }
    setCvFormErrors({});
    setCvVersionError("");
    setSelectedCVFile(null);
    setUploadingCV(false);
    setCvUploadProgress(0);
    setIsCVUploadedFromFirebase(false);
    setUploadedCVUrl(null);
    setExtractingCV(false);
    setCvPreviewUrl(null);
    setExtractedCVData(null);
    setExistingCVsForValidation([]);
    setShowCVFullForm(false);
    setInlineCVAnalysisResult(null);
    setShowInlineCVAnalysisModal(false);
  };

  const handleCloseInlineForm = async () => {
    // Nếu đang ở form CV và đã upload file lên Firebase, cảnh báo và xóa file
    if (showInlineForm === "cv" && isCVUploadedFromFirebase && uploadedCVUrl) {
      const currentCVUrl = inlineCVForm.cvFileUrl;
      if (currentCVUrl && uploadedCVUrl === currentCVUrl) {
        const confirmed = window.confirm(
          "⚠️ CẢNH BÁO\n\n" +
          "Bạn đã upload file CV lên Firebase.\n\n" +
          "Nếu đóng form, file CV sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
          "Bạn có chắc chắn muốn đóng form và xóa file không?"
        );
        
        if (!confirmed) {
          return; // Không đóng form nếu người dùng không xác nhận
        }
        
        // Xóa file từ Firebase
        try {
          const firebasePath = extractCVFirebasePath(uploadedCVUrl);
          if (firebasePath) {
            const fileRef = ref(storage, firebasePath);
            await deleteObject(fileRef);
          }
        } catch (err) {
          console.error("❌ Error deleting CV file from Firebase:", err);
          // Vẫn tiếp tục đóng form dù không xóa được file
        }
      }
    }
    
    closeInlineFormAfterSuccess();
  };

  const handleSubmitInlineProject = async () => {
    if (!id || isSubmitting) return;
    if (!inlineProjectForm.projectName?.trim()) {
      alert("⚠️ Vui lòng nhập tên dự án!");
      return;
    }
    try {
      setIsSubmitting(true);
      const activeCV = talentCVs.find(cv => cv.isActive) || talentCVs[0];
      if (!activeCV) {
        alert("⚠️ Vui lòng tạo CV trước khi thêm dự án!");
        return;
      }
      await talentProjectService.create({
        talentId: Number(id),
        talentCVId: activeCV.id,
        projectName: inlineProjectForm.projectName!,
        position: inlineProjectForm.position || "",
        technologies: inlineProjectForm.technologies || "",
        description: inlineProjectForm.description || "",
      });
      alert("✅ Đã tạo dự án thành công!");
      handleCloseInlineForm();
      // Refresh data
      const projects = await talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true });
      setTalentProjects(projects);
    } catch (err) {
      console.error("❌ Lỗi khi tạo dự án:", err);
      alert("Không thể tạo dự án!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInlineSkill = async () => {
    if (!id || isSubmitting) return;
    if (!inlineSkillForm.skillId || inlineSkillForm.skillId === 0) {
      alert("⚠️ Vui lòng chọn kỹ năng!");
      return;
    }
    try {
      setIsSubmitting(true);
      await talentSkillService.create({
        talentId: Number(id),
        skillId: inlineSkillForm.skillId!,
        level: inlineSkillForm.level || "Beginner",
        yearsExp: inlineSkillForm.yearsExp || 1,
      });
      alert("✅ Đã thêm kỹ năng thành công!");
      handleCloseInlineForm();
      // Refresh data
      const skills = await talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allSkills = await skillService.getAll();
      setLookupSkills(allSkills);
      const skillsWithNames = skills.map((skill: TalentSkill) => {
        const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
        return { 
          ...skill, 
          skillName: skillInfo?.name ?? "Unknown Skill",
          skillGroupId: skillInfo?.skillGroupId,
        };
      });
      setTalentSkills(skillsWithNames);

      // Chỉ refresh status cho group của skill vừa thêm, không phải tất cả groups
      // Tìm skillGroupId của skill vừa thêm
      const addedSkillInfo = allSkills.find((s: Skill) => s.id === inlineSkillForm.skillId);
      const addedSkillGroupId = addedSkillInfo?.skillGroupId;

      if (addedSkillGroupId && typeof addedSkillGroupId === "number") {
        try {
          // Chỉ refresh status cho group này
          const statuses =
            await talentSkillGroupAssessmentService.getVerificationStatuses(
              Number(id),
              [addedSkillGroupId]
            );
          if (Array.isArray(statuses) && statuses.length > 0) {
            // Chỉ cập nhật status của group này, giữ nguyên các groups khác
            setSkillGroupVerificationStatuses((prev) => {
              const newStatusMap = { ...prev };
              statuses.forEach((st) => {
                newStatusMap[st.skillGroupId] = st;
              });
              return newStatusMap;
            });
          }
        } catch (statusError) {
          console.error("❌ Lỗi khi refresh trạng thái verify sau khi thêm skill:", statusError);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi thêm kỹ năng:", err);
      alert("Không thể thêm kỹ năng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInlineCertificate = async () => {
    if (!id || isSubmitting) return;
    if (!inlineCertificateForm.certificateTypeId || inlineCertificateForm.certificateTypeId === 0) {
      setCertificateFormErrors({ certificateTypeId: "⚠️ Vui lòng chọn loại chứng chỉ!" });
      return;
    }
    if (!inlineCertificateForm.certificateName?.trim()) {
      setCertificateFormErrors({ certificateName: "⚠️ Vui lòng nhập tên chứng chỉ!" });
      return;
    }
    // Validate issued date
    if (inlineCertificateForm.issuedDate && !validateIssuedDate(inlineCertificateForm.issuedDate)) {
      setCertificateFormErrors({ issuedDate: "⚠️ Ngày cấp không được là ngày trong tương lai." });
      return;
    }
    try {
      setIsSubmitting(true);
      await talentCertificateService.create({
        talentId: Number(id),
        certificateTypeId: inlineCertificateForm.certificateTypeId!,
        certificateName: inlineCertificateForm.certificateName!,
        certificateDescription: inlineCertificateForm.certificateDescription,
        issuedDate: inlineCertificateForm.issuedDate,
        isVerified: inlineCertificateForm.isVerified || false,
        imageUrl: inlineCertificateForm.imageUrl || "",
      });
      alert("✅ Đã thêm chứng chỉ thành công!");
      handleCloseInlineForm();
      setCertificateFormErrors({});
      // Refresh data
      const certificatesData = await talentCertificateService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allCertificateTypes = await certificateTypeService.getAll();
      setLookupCertificateTypes(allCertificateTypes);
      const certificatesWithNames = certificatesData.map((cert: TalentCertificate) => {
        const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
        return { ...cert, certificateTypeName: certTypeInfo?.name ?? "Unknown Certificate" };
      });
      setCertificates(certificatesWithNames);
    } catch (err) {
      console.error("❌ Lỗi khi thêm chứng chỉ:", err);
      alert("Không thể thêm chứng chỉ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInlineExperience = async () => {
    if (!id || isSubmitting) return;
    if (!inlineExperienceForm.company?.trim() || !inlineExperienceForm.position?.trim()) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin công ty và vị trí!");
      return;
    }
    if (!inlineExperienceForm.startDate) {
      alert("⚠️ Vui lòng nhập ngày bắt đầu!");
      return;
    }
    try {
      setIsSubmitting(true);
      const activeCV = talentCVs.find(cv => cv.isActive) || talentCVs[0];
      if (!activeCV) {
        alert("⚠️ Vui lòng tạo CV trước khi thêm kinh nghiệm!");
        return;
      }
      await talentWorkExperienceService.create({
        talentId: Number(id),
        talentCVId: activeCV.id,
        company: inlineExperienceForm.company!,
        position: inlineExperienceForm.position!,
        startDate: inlineExperienceForm.startDate!,
        endDate: inlineExperienceForm.endDate,
        description: inlineExperienceForm.description || "",
      });
      alert("✅ Đã thêm kinh nghiệm thành công!");
      handleCloseInlineForm();
      // Refresh data
      const experiences = await talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true });
      setWorkExperiences(experiences);
    } catch (err) {
      console.error("❌ Lỗi khi thêm kinh nghiệm:", err);
      alert("Không thể thêm kinh nghiệm!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInlineJobRoleLevel = async () => {
    if (!id || isSubmitting) return;
    if (!inlineJobRoleLevelForm.jobRoleLevelId || inlineJobRoleLevelForm.jobRoleLevelId === 0) {
      alert("⚠️ Vui lòng chọn vị trí!");
      return;
    }
    try {
      setIsSubmitting(true);
      await talentJobRoleLevelService.create({
        talentId: Number(id),
        jobRoleLevelId: inlineJobRoleLevelForm.jobRoleLevelId!,
        yearsOfExp: inlineJobRoleLevelForm.yearsOfExp || 1,
        ratePerMonth: inlineJobRoleLevelForm.ratePerMonth,
      });
      alert("✅ Đã thêm vị trí thành công!");
      handleCloseInlineForm();
      // Refresh data
      const jobRoleLevelsData = await talentJobRoleLevelService.getAll({ talentId: Number(id), excludeDeleted: true });
      const [allJobRoleLevels, allJobRolesData] = await Promise.all([
        jobRoleLevelService.getAll({ excludeDeleted: true }),
        jobRoleService.getAll()
      ]);
      setLookupJobRoleLevelsForTalent(allJobRoleLevels);
      const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
        const jobRoleLevelInfo = allJobRoleLevels.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
        if (!jobRoleLevelInfo) {
          return { ...jrl, jobRoleLevelName: "Unknown Level" };
        }
        const jobRole = allJobRolesData.find(r => r.id === jobRoleLevelInfo.jobRoleId);
        const roleName = jobRole?.name || "—";
        const levelText = getLevelText(jobRoleLevelInfo.level);
        const displayName = `${roleName} - ${levelText}`;
        return { ...jrl, jobRoleLevelName: displayName };
      });
      setJobRoleLevels(jobRoleLevelsWithNames);
    } catch (err) {
      console.error("❌ Lỗi khi thêm vị trí:", err);
      alert("Không thể thêm vị trí!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation functions for available time
  const validateStartTime = (dateTime: string): boolean => {
    if (!dateTime) return false;
    const startDateTime = new Date(dateTime);
    const now = new Date();
    return startDateTime > now;
  };

  const validateEndTime = (startDateTime: string, endDateTime: string | undefined): boolean => {
    if (!endDateTime) return true; // End time is optional
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    // End time phải sau start time
    if (end <= start) return false;
    
    return true;
  };

  const findOverlappingSlot = (existing: TalentAvailableTime[], newStart: Date, newEnd?: Date) => {
    const effectiveNewEnd = newEnd ?? new Date(8640000000000000); // ~ Infinity

    for (const slot of existing) {
      const slotStart = new Date(slot.startTime);
      const slotEnd = slot.endTime ? new Date(slot.endTime) : new Date(8640000000000000);

      if (newStart < slotEnd && slotStart < effectiveNewEnd) {
        return slot;
      }
    }
    return null;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "Không xác định";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Không xác định";
    return date.toLocaleString("vi-VN", { hour12: false });
  };

  const formatRange = (slot: TalentAvailableTime) => {
    const start = formatDateTime(slot.startTime);
    const end = slot.endTime ? formatDateTime(slot.endTime) : "Không xác định";
    return `${start} - ${end}`;
  };

  const handleSubmitInlineAvailableTime = async () => {
    if (!id || isSubmitting) return;
    
    // Validate startTime
    if (!inlineAvailableTimeForm.startTime) {
      setAvailableTimeFormErrors({ startTime: "⚠️ Vui lòng nhập thời gian bắt đầu!" });
      return;
    }

    // Validate startTime hợp lý
    if (!validateStartTime(inlineAvailableTimeForm.startTime)) {
      setAvailableTimeFormErrors({ startTime: "⚠️ Thời gian bắt đầu phải nằm trong tương lai." });
      return;
    }

    // Validate endTime hợp lý
    if (inlineAvailableTimeForm.endTime && !validateEndTime(inlineAvailableTimeForm.startTime, inlineAvailableTimeForm.endTime)) {
      setAvailableTimeFormErrors({ endTime: "⚠️ Thời gian kết thúc phải sau thời gian bắt đầu." });
      return;
    }
    try {
      setIsSubmitting(true);
      setAvailableTimeFormErrors({});

      const newStart = new Date(inlineAvailableTimeForm.startTime!);
      const newEnd = inlineAvailableTimeForm.endTime ? new Date(inlineAvailableTimeForm.endTime) : undefined;

      // Kiểm tra trùng lặp với các slot đã có
      const existingTimes = await talentAvailableTimeService.getAll({
        talentId: Number(id),
        excludeDeleted: true,
      });

      if (Array.isArray(existingTimes)) {
        const overlappingSlot = findOverlappingSlot(existingTimes, newStart, newEnd);
        if (overlappingSlot) {
          setAvailableTimeFormErrors({
            startTime: `⚠️ Khung giờ này trùng với khoảng đã có: ${formatRange(overlappingSlot)}. Vui lòng chọn khung khác.`
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Convert datetime-local to UTC ISO string for PostgreSQL
      await talentAvailableTimeService.create({
        talentId: Number(id),
        startTime: newStart.toISOString(),
        endTime: newEnd ? newEnd.toISOString() : undefined,
        notes: inlineAvailableTimeForm.notes || "",
      });
      alert("✅ Đã thêm thời gian thành công!");
      handleCloseInlineForm();
      setAvailableTimeFormErrors({});
      // Refresh data
      const availableTimesData = await talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true });
      setAvailableTimes(availableTimesData);
    } catch (err) {
      console.error("❌ Lỗi khi thêm thời gian:", err);
      setAvailableTimeFormErrors({ submit: "Không thể thêm thời gian!" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function để chuyển đổi level từ tiếng Anh sang tiếng Việt
  const getLevelLabel = (level: string | null | undefined): string => {
    const levelMap: { [key: string]: string } = {
      "Beginner": "Mới bắt đầu",
      "Intermediate": "Trung bình",
      "Advanced": "Nâng cao",
      "Expert": "Chuyên gia",
    };
    return levelMap[level || "Beginner"] || "Mới bắt đầu";
  };

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

  // Helper function để format jobRoleLevel display text
  const getJobRoleLevelDisplayText = (jrl: JobRoleLevel): string => {
    const jobRole = jobRoles.find(r => r.id === jrl.jobRoleId);
    const roleName = jobRole?.name || "—";
    const levelText = getLevelText(jrl.level);
    return `${roleName} - ${levelText}`;
  };


  // Handle certificate image file change
  const handleCertificateImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        alert("⚠️ Vui lòng chọn file ảnh (jpg, png, gif, etc.)");
        e.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("⚠️ Kích thước file không được vượt quá 10MB");
        e.target.value = '';
        return;
      }

      setCertificateImageFile(file);
      const newErrors = { ...certificateFormErrors };
      delete newErrors.imageFile;
      setCertificateFormErrors(newErrors);
    }
  };

  // Handle certificate image upload to Firebase
  const handleUploadCertificateImage = async () => {
    if (!certificateImageFile) {
      alert("Vui lòng chọn file ảnh trước!");
      return;
    }

    // Xác nhận trước khi upload
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload ảnh "${certificateImageFile.name}" lên Firebase không?\n\n` +
      `Kích thước file: ${(certificateImageFile.size / 1024).toFixed(2)} KB`
    );

    if (!confirmed) {
      return;
    }

    setUploadingCertificateImage(true);
    setCertificateUploadProgress(0);

    try {
      // Upload to certificates folder
      const timestamp = Date.now();
      const sanitizedFileName = certificateImageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const fileName = `cert_${timestamp}_${sanitizedFileName}`;
      const filePath = `certificates/${fileName}`;

      const downloadURL = await uploadFile(
        certificateImageFile,
        filePath,
        (progress) => setCertificateUploadProgress(progress)
      );

      // Update the certificate form with the download URL
      setInlineCertificateForm({ ...inlineCertificateForm, imageUrl: downloadURL });
      setUploadedCertificateUrl(downloadURL);

      // Clear the file from state after successful upload
      setCertificateImageFile(null);
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert("✅ Upload ảnh chứng chỉ thành công!");
    } catch (err: any) {
      console.error("❌ Error uploading certificate image:", err);
      alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploadingCertificateImage(false);
      setCertificateUploadProgress(0);
    }
  };

  // Handle delete certificate image
  const handleDeleteCertificateImage = async () => {
    const currentUrl = inlineCertificateForm.imageUrl;
    if (!currentUrl) return;

    const uploadedUrl = uploadedCertificateUrl;
    if (!uploadedUrl || uploadedUrl !== currentUrl) {
      // URL không phải từ Firebase upload, chỉ cần xóa URL
      setInlineCertificateForm({ ...inlineCertificateForm, imageUrl: "" });
      return;
    }

    // Xác nhận trước khi xóa
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa ảnh chứng chỉ này không? File sẽ bị xóa khỏi Firebase.");
    if (!confirmed) return;

    try {
      // Extract Firebase path from URL
      const extractFirebasePath = (url: string): string | null => {
        try {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            return decodeURIComponent(pathMatch[1]);
          }
        } catch {
          return null;
        }
        return null;
      };

      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }

      setInlineCertificateForm({ ...inlineCertificateForm, imageUrl: "" });
      setUploadedCertificateUrl(null);
      alert("✅ Đã xóa ảnh chứng chỉ thành công!");
    } catch (err) {
      console.error("❌ Error deleting certificate image:", err);
      alert("Không thể xóa ảnh chứng chỉ!");
    }
  };

  // Validate issued date
  const validateIssuedDate = (date: string | undefined): boolean => {
    if (!date) return true; // Optional field
    const issuedDate = new Date(date);
    const now = new Date();
    // Issued date should not be in the future
    return issuedDate <= now;
  };

  // CV form validation
  const validateCVVersion = (version: number, jobRoleLevelId: number, existingCVsList: TalentCV[]): string => {
    if (version <= 0) {
      return "Version phải lớn hơn 0";
    }
    
    if (jobRoleLevelId === 0) {
      return "";
    }
    
    // Nếu chưa có CV nào cho jobRoleLevelId này, chỉ cho phép version = 1
    if (existingCVsList.length === 0) {
      if (version !== 1) {
        return "Chưa có CV nào cho vị trí công việc này. Vui lòng tạo version 1 trước.";
      }
      return "";
    }
    
    // Tìm version cao nhất trong danh sách CV hiện có
    const maxVersion = Math.max(...existingCVsList.map((cv: TalentCV) => cv.version || 0));
    
    // Kiểm tra trùng với các CV cùng jobRoleLevelId
    const duplicateCV = existingCVsList.find((cv: TalentCV) => cv.version === version);
    
    if (duplicateCV) {
      const suggestedVersion = maxVersion + 1;
      return `Version ${version} đã tồn tại cho vị trí công việc này. Vui lòng chọn version khác (ví dụ: ${suggestedVersion}).`;
    }
    
    // Kiểm tra version phải lớn hơn version cao nhất đã tồn tại
    if (version <= maxVersion) {
      const suggestedVersion = maxVersion + 1;
      return `Version ${version} không hợp lệ. Version phải lớn hơn version cao nhất hiện có (${maxVersion}). Vui lòng chọn version ${suggestedVersion} hoặc cao hơn.`;
    }
    
    return "";
  };

  // Fetch CVs by jobRoleLevelId for validation
  useEffect(() => {
    const fetchCVsForValidation = async () => {
      if (!id || !inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
        setExistingCVsForValidation([]);
        setCvVersionError("");
        return;
      }
      try {
        const cvs = await talentCVService.getAll({ 
          talentId: Number(id), 
          jobRoleLevelId: inlineCVForm.jobRoleLevelId,
          excludeDeleted: true 
        });
        setExistingCVsForValidation(cvs || []);
      } catch (error) {
        console.error("❌ Error loading CVs for validation", error);
        setExistingCVsForValidation([]);
      }
    };
    fetchCVsForValidation();
  }, [id, inlineCVForm.jobRoleLevelId]);

  // Auto-set version and validate when existingCVsForValidation changes
  useEffect(() => {
    const jobRoleLevelId = inlineCVForm.jobRoleLevelId || 0;
    if (jobRoleLevelId > 0 && existingCVsForValidation.length === 0) {
      // Chưa có CV nào cho jobRoleLevelId này - chỉ cho phép version 1
      if (inlineCVForm.version !== 1) {
        setInlineCVForm(prev => ({ ...prev, version: 1 }));
      }
      // Clear error vì chưa có CV nào, version 1 là hợp lệ
      setCvVersionError("");
    } else if (inlineCVForm.version && inlineCVForm.version > 0 && jobRoleLevelId > 0 && existingCVsForValidation.length > 0) {
      // Đã có CV - validate version
      const error = validateCVVersion(inlineCVForm.version, jobRoleLevelId, existingCVsForValidation);
      setCvVersionError(error);
    } else if (jobRoleLevelId === 0) {
      // Chưa chọn jobRoleLevelId - clear error
      setCvVersionError("");
    }
  }, [existingCVsForValidation, inlineCVForm.jobRoleLevelId, inlineCVForm.version]);

  // Extract Firebase path from URL
  const extractCVFirebasePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle CV file select
  const handleCVFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CV_FILE_STORAGE_KEY) {
      setSelectedCVFile(file);
      setCvFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.file;
        return newErrors;
      });
      const url = URL.createObjectURL(file);
      setCvPreviewUrl(url);
      
      // Lưu file vào IndexedDB để khôi phục sau khi reload
      try {
        await saveFileToIndexedDB(CV_FILE_STORAGE_KEY, file);
      } catch (error) {
        console.warn("⚠️ Không thể lưu file vào IndexedDB:", error);
        // Không block UI nếu lưu IndexedDB thất bại
      }
    }
  };

  // Handle CV analysis (thay thế extract)
  const handleAnalyzeCV = async () => {
    if (!selectedCVFile) {
      alert("Vui lòng chọn file CV trước!");
      return;
    }

    if (!id) {
      alert("⚠️ Không tìm thấy ID nhân sự để phân tích CV.");
      return;
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (!canEdit) {
      alert("Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.");
      return;
    }

    // Nếu đã có kết quả phân tích CV, thông báo và hủy phân tích hiện tại trước (không đóng form)
    if (analysisResult) {
      const confirmed = window.confirm(
        "⚠️ ĐANG CÓ KẾT QUẢ PHÂN TÍCH CV HIỆN TẠI\n\n" +
        "Hệ thống sẽ hủy kết quả phân tích CV hiện tại và phân tích file CV mới.\n\n" +
        "Bạn có muốn tiếp tục không?"
      );
      if (!confirmed) {
        return;
      }
      await clearAnalysisResult();
    }

    try {
      setExtractingCV(true);
      setCvFormErrors({});
      
      const result = await talentCVService.analyzeCVForUpdate(Number(id), selectedCVFile);
      
      setInlineCVAnalysisResult(result);
      setShowInlineCVAnalysisModal(true);
      
      // Tự động điền summary từ kết quả phân tích nếu có
      if (result && !inlineCVForm.summary) {
        const summaryParts: string[] = [];
        if (result.basicInfo.suggested.fullName) {
          summaryParts.push(`Tên: ${result.basicInfo.suggested.fullName}`);
        }
        if (result.skills && result.skills.newFromCV.length > 0) {
          const skills = result.skills.newFromCV.slice(0, 5).map((s: any) => s.skillName).join(', ');
          summaryParts.push(`Kỹ năng: ${skills}`);
        }
        if (summaryParts.length > 0) {
          setInlineCVForm(prev => ({ ...prev, summary: summaryParts.join('. ') + '.' }));
        }
      }
      
    } catch (error) {
      console.error("❌ Lỗi phân tích CV:", error);
      const message = (error as { message?: string }).message ?? "Không thể phân tích CV";
      setCvFormErrors({ submit: `❌ ${message}` });
      alert(`❌ ${message}`);
    } finally {
      setExtractingCV(false);
    }
  };

  // Handle delete CV file
  const handleDeleteCVFile = async () => {
    const currentUrl = inlineCVForm.cvFileUrl;
    if (!currentUrl) {
      return;
    }

    if (!uploadedCVUrl || uploadedCVUrl !== currentUrl) {
      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);
      return;
    }

    const confirmed = window.confirm(
      "⚠️ Bạn có chắc chắn muốn xóa file CV này?\n\n" +
      "File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
      "Bạn có muốn tiếp tục không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const firebasePath = extractCVFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }

      // Reset tất cả state liên quan đến file đã upload
      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);
      // KHÔNG reset selectedCVFile và cvPreviewUrl - để người dùng có thể upload lại file đã chọn
      // setSelectedCVFile(null);
      // if (cvPreviewUrl) {
      //   URL.revokeObjectURL(cvPreviewUrl);
      //   setCvPreviewUrl(null);
      // }

      alert("✅ Đã xóa file CV thành công!");
    } catch (err: any) {
      console.error("❌ Error deleting CV file:", err);
      // Reset tất cả state liên quan đến file đã upload
      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);
      // KHÔNG reset selectedCVFile và cvPreviewUrl - để người dùng có thể upload lại file đã chọn
      // setSelectedCVFile(null);
      // if (cvPreviewUrl) {
      //   URL.revokeObjectURL(cvPreviewUrl);
      //   setCvPreviewUrl(null);
      // }
      alert("⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.");
    }
  };

  // Handle CV file upload
  const handleCVFileUpload = async () => {
    if (!selectedCVFile) {
      setCvFormErrors({ file: "⚠️ Vui lòng chọn file trước khi upload." });
      return;
    }

    if (!inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
      setCvFormErrors({ jobRoleLevelId: "⚠️ Vui lòng chọn vị trí công việc trước khi upload lên Firebase." });
      return;
    }

    if (!inlineCVForm.version || inlineCVForm.version <= 0) {
      setCvFormErrors({ version: "⚠️ Vui lòng nhập version CV trước khi upload." });
      return;
    }

    if (existingCVsForValidation.length > 0) {
      const versionErrorMsg = validateCVVersion(inlineCVForm.version, inlineCVForm.jobRoleLevelId, existingCVsForValidation);
      if (versionErrorMsg) {
        setCvVersionError(versionErrorMsg);
        setCvFormErrors({ version: "⚠️ " + versionErrorMsg });
        return;
      }
    }

    if (!id) {
      setCvFormErrors({ submit: "⚠️ Không tìm thấy ID nhân sự." });
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload file "${selectedCVFile.name}" lên Firebase không?\n\n` +
      `Version: ${inlineCVForm.version}\n` +
      `Kích thước file: ${(selectedCVFile.size / 1024).toFixed(2)} KB`
    );
    
    if (!confirmed) {
      return;
    }

    setUploadingCV(true);
    setCvFormErrors({});
    setCvUploadProgress(0);

    try {
      const downloadURL = await uploadTalentCV(
        selectedCVFile,
        Number(id),
        `v${inlineCVForm.version}`,
        (progress) => setCvUploadProgress(progress)
      );

      setInlineCVForm(prev => ({ ...prev, cvFileUrl: downloadURL }));
      setIsCVUploadedFromFirebase(true);
      setUploadedCVUrl(downloadURL);
    } catch (err: any) {
      console.error("❌ Error uploading CV file:", err);
      setCvFormErrors({ submit: err.message || "Không thể upload file. Vui lòng thử lại." });
    } finally {
      setUploadingCV(false);
      setCvUploadProgress(0);
    }
  };

  // Handle submit inline CV
  const handleSubmitInlineCV = async () => {
    if (!id || isSubmitting) return;
    
    setCvFormErrors({});

    if (!inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
      setCvFormErrors({ jobRoleLevelId: "⚠️ Vui lòng chọn vị trí công việc trước khi tạo." });
      return;
    }

    if (!inlineCVForm.version || inlineCVForm.version <= 0) {
      setCvFormErrors({ version: "⚠️ Vui lòng nhập version CV (phải lớn hơn 0)." });
      return;
    }

    const versionErrorMsg = validateCVVersion(inlineCVForm.version, inlineCVForm.jobRoleLevelId, existingCVsForValidation);
    if (versionErrorMsg) {
      setCvVersionError(versionErrorMsg);
      setCvFormErrors({ version: "⚠️ " + versionErrorMsg });
      return;
    }

    if (!isCVUploadedFromFirebase || !inlineCVForm.cvFileUrl?.trim()) {
      setCvFormErrors({ submit: "⚠️ Vui lòng upload file CV lên Firebase trước khi tạo." });
      return;
    }

    try {
      const url = new URL(inlineCVForm.cvFileUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      setCvFormErrors({ submit: "⚠️ URL file CV không hợp lệ. Vui lòng nhập đường dẫn bắt đầu bằng http hoặc https." });
      return;
    }


    // Kiểm tra nếu có kết quả phân tích CV và có gợi ý chưa được xử lý
    if (analysisResult) {
      const hasBasicInfoChanges = analysisResult.basicInfo?.hasChanges || false;
      const hasNewSkills = (analysisResult.skills?.newFromCV?.length || 0) > 0;
      const hasNewJobRoleLevels = (analysisResult.jobRoleLevels?.newFromCV?.length || 0) > 0;
      const hasNewProjects = (analysisResult.projects?.newEntries?.length || 0) > 0;
      const hasNewCertificates = (analysisResult.certificates?.newFromCV?.length || 0) > 0;
      const hasNewExperiences = (analysisResult.workExperiences?.newEntries?.length || 0) > 0;

      if (hasBasicInfoChanges || hasNewSkills || hasNewJobRoleLevels || hasNewProjects || hasNewCertificates || hasNewExperiences) {
        let warningMessage = "⚠️ CẢNH BÁO\n\n";
        warningMessage += "Bạn đang có kết quả phân tích CV với các gợi ý chưa được xử lý:\n\n";

        const pendingItems: string[] = [];
        if (hasBasicInfoChanges) {
          pendingItems.push("• Thông tin cơ bản có thay đổi");
        }
        if (hasNewSkills) {
          pendingItems.push(`• ${analysisResult.skills.newFromCV.length} kỹ năng mới`);
        }
        if (hasNewJobRoleLevels) {
          pendingItems.push(`• ${analysisResult.jobRoleLevels.newFromCV.length} vị trí mới`);
        }
        if (hasNewProjects) {
          pendingItems.push(`• ${analysisResult.projects.newEntries.length} dự án mới`);
        }
        if (hasNewCertificates) {
          pendingItems.push(`• ${analysisResult.certificates.newFromCV.length} chứng chỉ mới`);
        }
        if (hasNewExperiences) {
          pendingItems.push(`• ${analysisResult.workExperiences.newEntries.length} kinh nghiệm làm việc mới`);
        }

        warningMessage += pendingItems.join("\n");
        warningMessage += "\n\n";
        warningMessage += "Nếu bạn tạo CV này mà chưa xử lý các gợi ý trên, bạn có thể bỏ lỡ thông tin quan trọng từ CV.\n\n";
        warningMessage += "Bạn có chắc chắn muốn tiếp tục tạo CV này không?";

        const confirmed = window.confirm(warningMessage);
        if (!confirmed) {
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      let finalForm: TalentCVCreate = {
        talentId: Number(id),
        jobRoleLevelId: inlineCVForm.jobRoleLevelId!,
        version: inlineCVForm.version!,
        cvFileUrl: inlineCVForm.cvFileUrl!,
        isActive: true,
        summary: inlineCVForm.summary || "",
        isGeneratedFromTemplate: inlineCVForm.isGeneratedFromTemplate || false,
        sourceTemplateId: inlineCVForm.sourceTemplateId,
        generatedForJobRequestId: inlineCVForm.generatedForJobRequestId,
      };
      
      const existingCVs = await talentCVService.getAll({ 
        talentId: Number(id), 
        excludeDeleted: true 
      });
      const activeCVWithSameJobRoleLevel = existingCVs.find(
        (cv: TalentCV) => cv.isActive && cv.jobRoleLevelId === finalForm.jobRoleLevelId
      );

      if (activeCVWithSameJobRoleLevel) {
        const jobRoleLevelName = lookupJobRoleLevels.find(jrl => jrl.id === finalForm.jobRoleLevelId)?.name || "vị trí này";
        const confirmed = window.confirm(
          `⚠️ Bạn đang có CV active với vị trí công việc "${jobRoleLevelName}".\n\n` +
          `CV mới sẽ được set active và CV cũ sẽ bị set inactive.\n\n` +
          `Bạn có chắc chắn muốn upload CV này không?`
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
        await talentCVService.deactivate(activeCVWithSameJobRoleLevel.id);
      } else {
        const confirmed = window.confirm("Bạn có chắc chắn muốn tạo CV mới cho nhân sự không?");
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }
      
      await talentCVService.create(finalForm);
      alert("✅ Đã tạo CV thành công!");
      
      // Giữ lại kết quả phân tích để người dùng có thể tiếp tục xử lý các gợi ý
      // Không gọi clearAnalysisResult() ở đây
      
      // Xóa dữ liệu form CV từ storage
      if (CV_FORM_STORAGE_KEY) {
        try {
          const rememberMe = localStorage.getItem('remember_me') === 'true';
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.removeItem(CV_FORM_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa dữ liệu form CV từ storage:", error);
        }
      }
      
      // Xóa file từ IndexedDB
      if (CV_FILE_STORAGE_KEY) {
        try {
          await deleteFileFromIndexedDB(CV_FILE_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa file từ IndexedDB:", error);
        }
      }
      
      closeInlineFormAfterSuccess();
      
      // Refresh data
      const cvs = await talentCVService.getAll({ talentId: Number(id), excludeDeleted: true });
      const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true });
      const jobRoleLevelsArray = Array.isArray(allJobRoleLevels) ? allJobRoleLevels : [];
      const cvsWithJobRoleLevelNames = cvs.map((cv: TalentCV) => {
        const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
        return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? "Chưa xác định" };
      });
      const sortedCVs = cvsWithJobRoleLevelNames.sort((a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
        const nameA = a.jobRoleLevelName || "";
        const nameB = b.jobRoleLevelName || "";
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return (b.version || 0) - (a.version || 0);
      });
      setTalentCVs(sortedCVs);
    } catch (err) {
      console.error("❌ Lỗi khi tạo CV:", err);
      setCvFormErrors({ submit: "Không thể tạo CV!" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu nhân sự...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy nhân sự</p>
            <Link
              to="/ta/developers"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Available":
        return {
          label: "Sẵn sàng",
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: "bg-green-50"
        };
      case "Busy":
        return {
          label: "Đang bận",
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="w-4 h-4" />,
          bgColor: "bg-yellow-50"
        };
      case "Working":
        return {
          label: "Đang làm việc",
          color: "bg-blue-100 text-blue-800",
          icon: <Briefcase className="w-4 h-4" />,
          bgColor: "bg-blue-50"
        };
      case "Applying":
        return {
          label: "Đang ứng tuyển",
          color: "bg-purple-100 text-purple-800",
          icon: <Target className="w-4 h-4" />,
          bgColor: "bg-purple-50"
        };
      case "Unavailable":
        return {
          label: "Không sẵn sàng",
          color: "bg-gray-100 text-gray-800",
          icon: <XCircle className="w-4 h-4" />,
          bgColor: "bg-gray-50"
        };
      default:
        return {
          label: "Không xác định",
          color: "bg-gray-100 text-gray-800",
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: "bg-gray-50"
        };
    }
  };

  const statusConfig = getStatusConfig(talent.status);
  const isDisabled = !canEdit || talent.status === "Applying" || talent.status === "Working";
  
  const formatLinkDisplay = (url?: string) => {
    if (!url) return "—";
    try {
      const parsed = new URL(url);
      let display = parsed.hostname;
      if (parsed.pathname && parsed.pathname !== "/") {
        display += parsed.pathname.length > 20 ? `${parsed.pathname.slice(0, 20)}…` : parsed.pathname;
      }
      return display.length > 30 ? `${display.slice(0, 30)}…` : display;
    } catch {
      return url.length > 30 ? `${url.slice(0, 30)}…` : url;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Nhân sự", to: returnTo || "/ta/developers" },
              { label: talent?.fullName || "Chi tiết nhân sự" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{talent.fullName}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết nhân sự trong hệ thống DevPool
              </p>

              {/* Mã nhân sự và Status Badge */}
              <div className="flex items-center gap-3">
                {/* Mã nhân sự */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">
                    Mã: <span className="font-mono">{talent.code || "—"}</span>
                  </span>
                </div>
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor} border border-neutral-200`}>
                  {statusConfig.icon}
                  <span className={`text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEdit}
                disabled={isDisabled}
                title={
                  !canEdit 
                    ? "Bạn không có quyền chỉnh sửa nhân sự này. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa."
                    : isDisabled 
                    ? "Không thể sửa khi nhân sự đang ứng tuyển hoặc đang làm việc" 
                    : ""
                }
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${isDisabled
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                  }`}
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Sửa
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDisabled}
                title={
                  !canEdit 
                    ? "Bạn không có quyền xóa nhân sự này. Chỉ TA đang quản lý nhân sự này mới được xóa."
                    : isDisabled 
                    ? "Không thể xóa khi nhân sự đang ứng tuyển hoặc đang làm việc" 
                    : ""
                }
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${isDisabled
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  }`}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Thông tin cơ bản với Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setBasicInfoTab("info")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  basicInfoTab === "info"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Thông tin cơ bản
              </button>
              {blacklists.length > 0 && (
                <button
                  onClick={() => setBasicInfoTab("blacklist")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                    basicInfoTab === "blacklist"
                      ? "border-red-600 text-red-600 bg-red-50"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  Cảnh báo Blacklist
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    {blacklists.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {basicInfoTab === "info" && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <InfoItem
                    label="Họ và tên"
                    value={talent.fullName}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Email"
                    value={talent.email || "—"}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Số điện thoại"
                    value={talent.phone || "—"}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Ngày sinh"
                    value={talent.dateOfBirth ? new Date(talent.dateOfBirth).toLocaleDateString('vi-VN') : "Chưa xác định"}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Công ty"
                    value={partnerName}
                    icon={<Building2 className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Khu vực làm việc"
                    value={locationName}
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Chế độ làm việc"
                    value={workingModeLabels[talent.workingMode] || "Không xác định"}
                    icon={<Globe className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="GitHub"
                    value={talent.githubUrl ? (
                      <a
                        href={talent.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={talent.githubUrl}
                        className="text-primary-600 hover:text-primary-800 inline-block max-w-full truncate"
                      >
                        {formatLinkDisplay(talent.githubUrl)}
                      </a>
                    ) : "—"}
                    icon={<ExternalLink className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Portfolio"
                    value={talent.portfolioUrl ? (
                      <a
                        href={talent.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={talent.portfolioUrl}
                        className="text-primary-600 hover:text-primary-800 inline-block max-w-full truncate"
                      >
                        {formatLinkDisplay(talent.portfolioUrl)}
                      </a>
                    ) : "—"}
                    icon={<ExternalLink className="w-4 h-4" />}
                  />
                </div>
              </div>
            )}

            {basicInfoTab === "blacklist" && blacklists.length > 0 && (
              <div className="animate-fade-in">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <Ban className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        ⚠️ Cảnh báo: Ứng viên này đã bị blacklist
                      </h3>
                      <p className="text-sm text-red-800 mb-3">
                        Ứng viên này đã bị thêm vào blacklist bởi {blacklists.length} {blacklists.length === 1 ? "Client" : "Clients"}:
                      </p>
                      <div className="space-y-2">
                        {blacklists.map((blacklist) => (
                          <div
                            key={blacklist.id}
                            className="bg-white border border-red-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-red-900">
                                  {blacklist.clientCompanyName || `Client #${blacklist.clientCompanyId}`}
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                  Lý do: {blacklist.reason || "—"}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  Ngày: {blacklist.blacklistedDate ? new Date(blacklist.blacklistedDate).toLocaleDateString("vi-VN") : "—"}
                                  {blacklist.requestedBy && ` • Yêu cầu bởi: ${blacklist.requestedBy}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-700 mt-3 font-medium">
                        💡 Lưu ý: Vui lòng không giới thiệu ứng viên này cho các Client đã blacklist. Matching tự động sẽ loại bỏ ứng viên này khỏi kết quả tìm kiếm cho các Client tương ứng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm rounded-t-2xl">
            <div className="flex overflow-x-auto scrollbar-hide">
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <button
                type="button"
                onClick={() => setActiveTab("cvs")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "cvs"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                CV
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "projects"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Layers className="w-4 h-4" />
                Dự án
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("jobRoleLevels")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "jobRoleLevels"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Target className="w-4 h-4" />
                Vị trí
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("skills")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "skills"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Star className="w-4 h-4" />
                Kỹ năng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("availableTimes")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "availableTimes"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Lịch sẵn sàng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("certificates")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "certificates"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Award className="w-4 h-4" />
                Chứng chỉ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("experiences")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === "experiences"
                    ? "border-primary-500 text-primary-600 bg-white"
                    : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                }`}
              >
                <Workflow className="w-4 h-4" />
                Kinh nghiệm
              </button>

              {analysisResult && (
                <button
                  type="button"
                  onClick={handleOpenCVPreviewFromAnalysis}
                  className="ml-auto mr-4 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg border border-transparent hover:border-primary-200 transition-all"
                  title="Xem CV đã phân tích"
                >
                  <Eye className="w-4 h-4" />
                  Xem CV
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: Dự án */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                {/* Inline Project Form */}
                {showInlineForm === "project" && (
                  <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Tên dự án <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={inlineProjectForm.projectName || ""}
                          onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, projectName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          placeholder="Nhập tên dự án"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Vị trí</label>
                          <input
                            type="text"
                            value={inlineProjectForm.position || ""}
                            onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, position: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            placeholder="Nhập vị trí"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Công nghệ sử dụng</label>
                          <input
                            type="text"
                            value={inlineProjectForm.technologies || ""}
                            onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, technologies: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            placeholder="Nhập công nghệ sử dụng"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
                        <textarea
                          value={inlineProjectForm.description || ""}
                          onChange={(e) => setInlineProjectForm({ ...inlineProjectForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                          placeholder="Nhập mô tả dự án"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineProject}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {analysisResult && (analysisResult.projects.newEntries.length > 0 || analysisResult.projects.potentialDuplicates.length > 0) && (
                  <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/80 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">Gợi ý từ CV mới</h3>
                      <span className="text-xs text-purple-700">{analysisResult.projects.newEntries.length} dự án mới · {analysisResult.projects.potentialDuplicates.length} dự án có thể trùng</span>
                    </div>
                    {analysisResult.projects.newEntries.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-purple-700 font-medium">Đề xuất thêm dự án:</p>
                        {analysisResult.projects.newEntries.map((project, index) => (
                          <div key={`suggested-project-${index}`} className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-purple-900 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{project.projectName}</span>
                              {project.position && <span className="text-xs text-purple-700">Vai trò: {project.position}</span>}
                            </div>
                            {project.technologies && (
                              <p className="mt-1 text-xs text-purple-600">Công nghệ: {project.technologies}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {analysisResult.projects.potentialDuplicates.length > 0 && (
                      <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                        <p className="font-medium mb-1">Kiểm tra trùng lặp:</p>
                        <ul className="space-y-1">
                          {analysisResult.projects.potentialDuplicates.map((dup, index) => (
                            <li key={`dup-project-${index}`}>
                              - {dup.fromCV.projectName} · Khuyến nghị: <span className="font-semibold">{dup.recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách dự án</h3>
                  <div className="flex gap-2">
                    {showInlineForm !== "project" && (
                      <Button
                        onClick={() => handleOpenInlineForm("project")}
                        disabled={isSubmitting || !canEdit}
                        className={`group flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Tạo dự án"}
                      >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      </Button>
                    )}
                    {selectedProjects.length > 0 && (
                      <Button
                        onClick={handleDeleteProjects}
                        disabled={!canEdit}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        Xóa dự án ({selectedProjects.length})
                      </Button>
                    )}
                  </div>
                </div>
                {talentProjects.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                              <input
                                type="checkbox"
                                checked={selectedProjects.length === talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).length && talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const currentPageItems = talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).map(project => project.id);
                                    setSelectedProjects([...new Set([...selectedProjects, ...currentPageItems])]);
                                  } else {
                                    const currentPageItems = talentProjects.slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage).map(project => project.id);
                                    setSelectedProjects(selectedProjects.filter(id => !currentPageItems.includes(id)));
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tên dự án</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Công nghệ</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {talentProjects
                            .slice((pageProjects - 1) * itemsPerPage, pageProjects * itemsPerPage)
                            .map((project) => (
                              <tr 
                                key={project.id} 
                                className="hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
                                onClick={() => navigate(`/ta/talent-projects/edit/${project.id}`)}
                              >
                                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedProjects.includes(project.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setSelectedProjects([...selectedProjects, project.id]);
                                      } else {
                                        setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-primary-800">{project.projectName}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-primary-700">{project.position}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-primary-600">{project.technologies}</div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <SectionPagination
                      currentPage={pageProjects}
                      totalItems={talentProjects.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPageProjects}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-500 text-lg font-medium">Chưa có dự án nào</p>
                    <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa tham gia dự án</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: CV */}
            {activeTab === "cvs" && (
              <div className="space-y-6">
                {/* Kết quả phân tích CV - Hiển thị trước CV của nhân sự */}
                {analysisError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8">
                    <p className="font-semibold">Lỗi phân tích CV</p>
                    <p className="text-sm mt-1">{analysisError}</p>
                  </div>
                )}
                {analysisResult && (
                  <div className="bg-white rounded-2xl shadow-soft border border-primary-100 mb-8 animate-fade-in">
                    <div className="p-6 border-b border-primary-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Workflow className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Kết quả phân tích CV</h2>
                      </div>
                      <Button
                        onClick={handleCancelAnalysis}
                        disabled={!canEdit}
                        className={`px-4 py-2 rounded-xl bg-neutral-600 text-white hover:bg-neutral-700 transition-all duration-300 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!canEdit ? "Bạn không có quyền hủy phân tích CV. Chỉ TA đang quản lý nhân sự này mới được hủy phân tích." : ""}
                      >
                        Hủy phân tích
                      </Button>
                    </div>
                    <div className="p-6 space-y-5">
                      <p className="text-sm text-neutral-600">
                        Hệ thống đã so sánh CV mới với dữ liệu hiện có của nhân sự. Các gợi ý chi tiết được hiển thị ngay trong từng phần bên dưới để bạn thao tác nhanh chóng.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div 
                          className={`p-4 rounded-xl border border-primary-100 bg-primary-50/70 cursor-pointer transition-all hover:shadow-md hover:border-primary-300 ${expandedBasicInfo ? "ring-2 ring-primary-400" : ""}`}
                          onClick={() => setExpandedBasicInfo(!expandedBasicInfo)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Thông tin cơ bản</p>
                            <ChevronDown className={`w-4 h-4 text-primary-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-primary-900">{analysisResult.basicInfo.hasChanges ? "Có thay đổi" : "Không thay đổi"}</p>
                          <p className="mt-2 text-xs text-primary-700 cursor-pointer hover:text-primary-900 underline">Xem chi tiết</p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border border-amber-100 bg-amber-50/70 cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${expandedAnalysisDetail === "skills" ? "ring-2 ring-amber-400" : ""}`}
                          onClick={() => setExpandedAnalysisDetail(expandedAnalysisDetail === "skills" ? null : "skills")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold">Kỹ năng</p>
                            <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform ${expandedAnalysisDetail === "skills" ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-amber-900">
                            {matchedSkillsNotInProfile.length + matchedSkillsDetails.length + unmatchedSkillSuggestions.length}
                          </p>
                          <p className="mt-2 text-xs text-amber-700 cursor-pointer hover:text-amber-900">
                            {matchedSkillsNotInProfile.length} cần tạo mới · {matchedSkillsDetails.length} trùng CV · {unmatchedSkillSuggestions.length} chưa có trong hệ thống
                            <span className="ml-2 text-amber-600 underline">(Nhấp để xem chi tiết)</span>
                          </p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border border-green-100 bg-green-50/70 cursor-pointer transition-all hover:shadow-md hover:border-green-300 ${expandedAnalysisDetail === "jobRoleLevels" ? "ring-2 ring-green-400" : ""}`}
                          onClick={() => setExpandedAnalysisDetail(expandedAnalysisDetail === "jobRoleLevels" ? null : "jobRoleLevels")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">Vị trí</p>
                            <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${expandedAnalysisDetail === "jobRoleLevels" ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-green-900">
                            {matchedJobRoleLevelsNotInProfile.length + jobRoleLevelsMatched.length + jobRoleLevelsUnmatched.length}
                          </p>
                          <p className="mt-2 text-xs text-green-700 cursor-pointer hover:text-green-900">
                            {matchedJobRoleLevelsNotInProfile.length} cần tạo mới · {jobRoleLevelsMatched.length} trùng CV · {jobRoleLevelsUnmatched.length} chưa có trong hệ thống
                            <span className="ml-2 text-green-600 underline">(Nhấp để xem chi tiết)</span>
                          </p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border border-purple-100 bg-purple-50/70 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 ${expandedAnalysisDetail === "projects" ? "ring-2 ring-purple-400" : ""}`}
                          onClick={() => setExpandedAnalysisDetail(expandedAnalysisDetail === "projects" ? null : "projects")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold">Dự án</p>
                            <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${expandedAnalysisDetail === "projects" ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-purple-900">{analysisResult.projects.newEntries.length}</p>
                          <p className="mt-2 text-xs text-purple-700 cursor-pointer hover:text-purple-900">
                            Dự án mới cần xem xét
                            <span className="ml-2 text-purple-600 underline">(Nhấp để xem chi tiết)</span>
                          </p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border border-blue-100 bg-blue-50/70 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${expandedAnalysisDetail === "experiences" ? "ring-2 ring-blue-400" : ""}`}
                          onClick={() => setExpandedAnalysisDetail(expandedAnalysisDetail === "experiences" ? null : "experiences")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Kinh nghiệm</p>
                            <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${expandedAnalysisDetail === "experiences" ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-blue-900">{analysisResult.workExperiences.newEntries.length}</p>
                          <p className="mt-2 text-xs text-blue-700 cursor-pointer hover:text-blue-900">
                            Kinh nghiệm làm việc mới phát hiện
                            <span className="ml-2 text-blue-600 underline">(Nhấp để xem chi tiết)</span>
                          </p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border border-rose-100 bg-rose-50/70 cursor-pointer transition-all hover:shadow-md hover:border-rose-300 ${expandedAnalysisDetail === "certificates" ? "ring-2 ring-rose-400" : ""}`}
                          onClick={() => setExpandedAnalysisDetail(expandedAnalysisDetail === "certificates" ? null : "certificates")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">Chứng chỉ</p>
                            <ChevronDown className={`w-4 h-4 text-rose-600 transition-transform ${expandedAnalysisDetail === "certificates" ? "rotate-180" : ""}`} />
                          </div>
                          <p className="mt-1 text-lg font-bold text-rose-900">
                            {analysisResult.certificates?.newFromCV?.length || 0}
                          </p>
                          <p className="mt-2 text-xs text-rose-700 cursor-pointer hover:text-rose-900">
                            Cần tạo loại chứng chỉ theo tên các chứng chỉ
                            <span className="ml-2 text-rose-600 underline">(Nhấp để xem chi tiết)</span>
                          </p>
                        </div>
                      </div>

                      {/* Chi tiết phân tích - Skills */}
                      {expandedAnalysisDetail === "skills" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-amber-900">Kỹ năng</h3>
                            <button
                              onClick={() => setExpandedAnalysisDetail(null)}
                              className="text-amber-600 hover:text-amber-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            {matchedSkillsDetails.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-800 mb-1.5">Trùng CV ({matchedSkillsDetails.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {matchedSkillsDetails.map((match, index) => (
                                    <span key={`skill-match-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                                      {match.skillName}: CV {match.cvLevel} ({match.cvYearsExp} năm) · Hồ sơ {match.systemLevel} ({match.systemYearsExp} năm)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {matchedSkillsNotInProfile.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-amber-800 mb-1.5">Cần tạo mới (có trong hệ thống, chưa có trong hồ sơ) ({matchedSkillsNotInProfile.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {matchedSkillsNotInProfile.map((skill, index) => (
                                    <div key={`skill-matched-notin-${index}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                                      <span>
                                        {skill.skillName}
                                      </span>
                                      <button
                                        onClick={() => handleQuickCreateSkill({
                                          skillId: skill.skillId,
                                          skillName: skill.skillName,
                                          cvLevel: skill.cvLevel,
                                          cvYearsExp: skill.cvYearsExp ?? undefined,
                                        })}
                                        className="px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-xs font-medium"
                                      >
                                        Tạo nhanh
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {unmatchedSkillSuggestions.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-amber-800 mb-1.5">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({unmatchedSkillSuggestions.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {unmatchedSkillSuggestions.map((skill, index) => (
                                    <span key={`skill-unmatched-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs text-amber-900">
                                      {skill.skillName}
                                      {skill.level && <span className="ml-1.5 text-amber-600">· {getLevelLabel(skill.level)}</span>}
                                      {skill.yearsExp && <span className="ml-1.5 text-amber-600">· {skill.yearsExp} năm</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {matchedSkillsDetails.length === 0 && matchedSkillsNotInProfile.length === 0 && unmatchedSkillSuggestions.length === 0 && (
                              <p className="text-xs text-amber-700">Không có gợi ý kỹ năng nào</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chi tiết phân tích - JobRoleLevels */}
                      {expandedAnalysisDetail === "jobRoleLevels" && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-green-900">Vị trí</h3>
                            <button
                              onClick={() => setExpandedAnalysisDetail(null)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            {jobRoleLevelsMatched.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-800 mb-1.5">Trùng CV ({jobRoleLevelsMatched.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {jobRoleLevelsMatched.map(({ suggestion, existing, system }, index) => {
                                    const systemLevelName = system ? getTalentLevelName(system.level) : undefined;
                                    const formattedSystemLevel = systemLevelName ? systemLevelName.charAt(0).toUpperCase() + systemLevelName.slice(1) : "—";
                                    return (
                                      <span key={`jobrole-match-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                                        {suggestion.position ?? system?.name ?? "Vị trí chưa rõ"}: CV Level {suggestion.level ?? "—"} ({suggestion.yearsOfExp ? `${suggestion.yearsOfExp} năm` : "Chưa rõ"}) · Hồ sơ Level {formattedSystemLevel} ({existing.yearsOfExp ?? "—"} năm)
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {matchedJobRoleLevelsNotInProfile.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-800 mb-1.5">Cần tạo mới (có trong hệ thống, chưa có trong hồ sơ) ({matchedJobRoleLevelsNotInProfile.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {matchedJobRoleLevelsNotInProfile.map((jobRole, index) => (
                                    <span key={`jobrole-matched-notin-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                                      {jobRole.position}
                                      {jobRole.level && <span className="ml-1.5 text-green-600">· Level {jobRole.level}</span>}
                                      {jobRole.yearsOfExp && <span className="ml-1.5 text-green-600">· {jobRole.yearsOfExp} năm</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {jobRoleLevelsUnmatched.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-800 mb-1.5">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({jobRoleLevelsUnmatched.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {jobRoleLevelsUnmatched.map((suggestion, index) => (
                                    <span key={`jobrole-unmatched-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-green-200 rounded-lg text-xs text-green-900">
                                      {suggestion.position ?? "Vị trí chưa rõ"}
                                      {suggestion.level && <span className="ml-1.5 text-green-600">· Level {suggestion.level}</span>}
                                      {suggestion.yearsOfExp && <span className="ml-1.5 text-green-600">· {suggestion.yearsOfExp} năm</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {jobRoleLevelsMatched.length === 0 && matchedJobRoleLevelsNotInProfile.length === 0 && jobRoleLevelsUnmatched.length === 0 && (
                              <p className="text-xs text-green-700">Không có gợi ý vị trí nào</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chi tiết phân tích - Certificates */}
                      {expandedAnalysisDetail === "certificates" && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-rose-900">Chứng chỉ</h3>
                            <button
                              onClick={() => setExpandedAnalysisDetail(null)}
                              className="text-rose-600 hover:text-rose-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            {/* Hiển thị tất cả chứng chỉ từ CV (chỉ hiển thị tên, cần tạo loại chứng chỉ dựa theo tên) */}
                            {analysisResult.certificates?.newFromCV && analysisResult.certificates.newFromCV.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-rose-800 mb-1.5">Cần tạo loại chứng chỉ theo tên các chứng chỉ ({analysisResult.certificates.newFromCV.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {analysisResult.certificates.newFromCV.map((cert, index) => (
                                    <span key={`cert-all-${index}`} className="inline-flex items-center px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-xs text-rose-900">
                                      {cert.certificateName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-rose-700">Không có gợi ý chứng chỉ nào</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chi tiết phân tích - Projects */}
                      {expandedAnalysisDetail === "projects" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-purple-900">Chi tiết Dự án</h3>
                            <button
                              onClick={() => setExpandedAnalysisDetail(null)}
                              className="text-purple-600 hover:text-purple-800 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {analysisResult.projects.newEntries.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-purple-900 mb-2">Dự án mới ({analysisResult.projects.newEntries.length})</h4>
                              <div className="space-y-2">
                                {analysisResult.projects.newEntries.map((project, index) => (
                                  <div key={`project-new-${index}`} className="bg-white p-3 rounded-lg border border-purple-200">
                                    <p className="font-medium text-purple-900">{project.projectName}</p>
                                    {project.position && <p className="text-xs text-purple-700 mt-1">Vị trí: {project.position}</p>}
                                    {project.technologies && <p className="text-xs text-purple-700">Công nghệ: {project.technologies}</p>}
                                    {project.description && <p className="text-xs text-purple-600 mt-1 line-clamp-2">{project.description}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.projects.potentialDuplicates.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-purple-900 mb-3">Có thể trùng ({analysisResult.projects.potentialDuplicates.length})</h4>
                              <div className="space-y-4">
                                {analysisResult.projects.potentialDuplicates.map((dup, index) => (
                                  <div key={`project-dup-${index}`} className="bg-white p-4 rounded-lg border border-purple-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                                      <div>
                                        <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                                        <ul className="space-y-1">
                                          <li>Tên dự án: {dup.existing.projectName ?? "—"}</li>
                                          <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                          <li>Công nghệ: {dup.existing.technologies ?? "—"}</li>
                                          <li>Mô tả: {dup.existing.description ? (dup.existing.description.length > 100 ? `${dup.existing.description.substring(0, 100)}...` : dup.existing.description) : "—"}</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-neutral-900 mb-2">Từ CV</p>
                                        <ul className="space-y-1">
                                          <li>Tên dự án: {dup.fromCV.projectName ?? "—"}</li>
                                          <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                          <li>Công nghệ: {dup.fromCV.technologies ?? "—"}</li>
                                          <li>Mô tả: {dup.fromCV.description ? (dup.fromCV.description.length > 100 ? `${dup.fromCV.description.substring(0, 100)}...` : dup.fromCV.description) : "—"}</li>
                                        </ul>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-purple-200">
                                      <p className="text-xs text-purple-700">
                                        <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                                        {dup.differencesSummary && dup.differencesSummary.length > 0 && (
                                          <span className="block mt-1 text-purple-600">
                                            Khác biệt: {dup.differencesSummary.join(", ")}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.projects.newEntries.length === 0 && analysisResult.projects.potentialDuplicates.length === 0 && (
                            <p className="text-sm text-purple-700">Không có gợi ý dự án nào</p>
                          )}
                        </div>
                      )}

                      {/* Chi tiết phân tích - Experiences */}
                      {expandedAnalysisDetail === "experiences" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-blue-900">Chi tiết Kinh nghiệm</h3>
                            <button
                              onClick={() => setExpandedAnalysisDetail(null)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {analysisResult.workExperiences.newEntries.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900 mb-2">Kinh nghiệm mới ({analysisResult.workExperiences.newEntries.length})</h4>
                              <div className="space-y-2">
                                {analysisResult.workExperiences.newEntries.map((exp, index) => (
                                  <div key={`exp-new-${index}`} className="bg-white p-3 rounded-lg border border-blue-200">
                                    <p className="font-medium text-blue-900">{exp.position}</p>
                                    <p className="text-xs text-blue-700 mt-1">Công ty: {exp.company}</p>
                                    <p className="text-xs text-blue-700">{exp.startDate ?? "—"} - {exp.endDate ?? "Hiện tại"}</p>
                                    {exp.description && <p className="text-xs text-blue-600 mt-1 line-clamp-2">{exp.description}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.workExperiences.potentialDuplicates.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900 mb-3">Có thể trùng ({analysisResult.workExperiences.potentialDuplicates.length})</h4>
                              <div className="space-y-4">
                                {analysisResult.workExperiences.potentialDuplicates.map((dup, index) => (
                                  <div key={`exp-dup-${index}`} className="bg-white p-4 rounded-lg border border-blue-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                                      <div>
                                        <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                                        <ul className="space-y-1">
                                          <li>Vị trí: {dup.existing.position ?? "—"}</li>
                                          <li>Công ty: {dup.existing.company ?? "—"}</li>
                                          <li>Thời gian: {dup.existing.startDate ? new Date(dup.existing.startDate).toLocaleDateString("vi-VN") : "—"} - {dup.existing.endDate ? new Date(dup.existing.endDate).toLocaleDateString("vi-VN") : "Hiện tại"}</li>
                                          <li>Mô tả: {dup.existing.description ? (dup.existing.description.length > 100 ? `${dup.existing.description.substring(0, 100)}...` : dup.existing.description) : "—"}</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="font-medium text-neutral-900 mb-2">Từ CV</p>
                                        <ul className="space-y-1">
                                          <li>Vị trí: {dup.fromCV.position ?? "—"}</li>
                                          <li>Công ty: {dup.fromCV.company ?? "—"}</li>
                                          <li>Thời gian: {dup.fromCV.startDate ?? "—"} - {dup.fromCV.endDate ?? "Hiện tại"}</li>
                                          <li>Mô tả: {dup.fromCV.description ? (dup.fromCV.description.length > 100 ? `${dup.fromCV.description.substring(0, 100)}...` : dup.fromCV.description) : "—"}</li>
                                        </ul>
                                      </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                      <p className="text-xs text-blue-700">
                                        <span className="font-medium">Khuyến nghị:</span> <span className="font-semibold">{dup.recommendation}</span>
                                        {dup.differencesSummary && dup.differencesSummary.length > 0 && (
                                          <span className="block mt-1 text-blue-600">
                                            Khác biệt: {dup.differencesSummary.join(", ")}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.workExperiences.newEntries.length === 0 && analysisResult.workExperiences.potentialDuplicates.length === 0 && (
                            <p className="text-sm text-blue-700">Không có gợi ý kinh nghiệm nào</p>
                          )}
                        </div>
                      )}
                      <div className="bg-neutral-50 rounded-xl border border-neutral-200">
                        <div 
                          className="p-4 cursor-pointer flex items-center justify-between hover:bg-neutral-100 transition-colors rounded-xl"
                          onClick={() => setExpandedBasicInfo(!expandedBasicInfo)}
                        >
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">So sánh thông tin cơ bản</h3>
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Có thay đổi:</span> {analysisResult.basicInfo.hasChanges ? "Có" : "Không"}
                            </p>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-neutral-600 transition-transform ${expandedBasicInfo ? "rotate-180" : ""}`} />
                        </div>
                        {expandedBasicInfo && (
                          <div className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                              <div>
                                <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                                <ul className="space-y-2 bg-white p-3 rounded-lg border border-neutral-200">
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Họ tên:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : ''}`}>
                                      {analysisResult.basicInfo.current.fullName ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Email:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : ''}`}>
                                      {analysisResult.basicInfo.current.email ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Điện thoại:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : ''}`}>
                                      {analysisResult.basicInfo.current.phone ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Nơi ở:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : ''}`}>
                                      {analysisResult.basicInfo.current.locationName ?? "—"}
                                    </span>
                                  </li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-neutral-900 mb-2">Gợi ý</p>
                                <ul className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Họ tên:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.fullName, analysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : 'text-blue-700'}`}>
                                      {analysisResult.basicInfo.suggested.fullName ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Email:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.email, analysisResult.basicInfo.suggested.email) ? 'text-red-700' : 'text-blue-700'}`}>
                                      {analysisResult.basicInfo.suggested.email ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Điện thoại:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.phone, analysisResult.basicInfo.suggested.phone) ? 'text-red-700' : 'text-blue-700'}`}>
                                      {analysisResult.basicInfo.suggested.phone ?? "—"}
                                    </span>
                                  </li>
                                  <li className={`flex justify-between ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                    <span className="text-neutral-500">Nơi ở:</span>
                                    <span className={`font-medium ${isValueDifferent(analysisResult.basicInfo.current.locationName, analysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : 'text-blue-700'}`}>
                                      {analysisResult.basicInfo.suggested.locationName ?? "—"}
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <details className="bg-neutral-50 rounded-xl border border-neutral-200">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 hover:text-primary-600">
                          Xem toàn bộ dữ liệu phân tích (JSON)
                        </summary>
                        <pre className="overflow-auto text-xs bg-black text-green-300 p-4 rounded-b-xl">
{JSON.stringify(analysisResult, null, 2)}
                        </pre>
                      </details>
                      {analysisResult.rawExtractedText && (
                        <details className="bg-neutral-50 rounded-xl border border-neutral-200">
                          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 hover:text-primary-600">
                            Raw Extracted Text
                          </summary>
                          <pre className="overflow-auto text-xs bg-neutral-900 text-neutral-100 p-4 rounded-b-xl whitespace-pre-wrap">
{analysisResult.rawExtractedText}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {/* CV của nhân sự */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setIsCVsExpanded(!isCVsExpanded)}>
                <button className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                  {isCVsExpanded ? (
                    <ChevronDown className="w-5 h-5 text-neutral-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-neutral-600" />
                  )}
                </button>
                <div className="p-2 bg-accent-100 rounded-lg">
                  <FileText className="w-5 h-5 text-accent-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">CV của nhân sự</h2>
              </div>
              <div className="flex gap-2">
                {showInlineForm !== "cv" && (
                  <Button
                    onClick={() => handleOpenInlineForm("cv")}
                    disabled={isSubmitting || !canEdit}
                    className={`group flex items-center justify-center bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm CV"}
                  >
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </Button>
                )}
                {selectedCVs.length > 0 && (
                  <Button
                    onClick={handleDeleteCVs}
                    disabled={!canEdit}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    Xóa CV ({selectedCVs.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
          {isCVsExpanded && (
            <div className="p-6">
              {/* Inline CV Form */}
              {showInlineForm === "cv" && (
                <div className="bg-white rounded-xl border-2 border-accent-200 p-6 mb-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Thêm CV mới</h3>
                    {/* Bỏ nút X - chỉ đóng khi hủy phân tích CV */}
                  </div>

                  {/* Giai đoạn 1: Chọn file CV (giống Create.tsx) */}
                  {!showCVFullForm && (
                    <div className="space-y-4">
                      {/* File Input - Giống Create.tsx */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-neutral-700">Chọn file CV (PDF)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleCVFileSelect}
                          className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        {selectedCVFile && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                            <FileText className="w-4 h-4" />
                            <span>File đã chọn: <span className="font-medium">{selectedCVFile.name}</span> ({(selectedCVFile.size / 1024).toFixed(2)} KB)</span>
                          </div>
                        )}
                      </div>

                      {/* Preview và nút Phân tích - Hiện khi đã chọn file */}
                      {selectedCVFile && cvPreviewUrl && (
                        <div className="space-y-4">
                          {/* CV Preview - Ở trên */}
                          <div className="border-2 border-primary-200 rounded-xl overflow-hidden bg-white shadow-md">
                            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 flex items-center justify-between border-b border-primary-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <Eye className="w-3.5 h-3.5 text-primary-600" />
                                </div>
                                <span className="text-xs font-semibold text-primary-800">Xem trước CV</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => window.open(cvPreviewUrl, '_blank')}
                                className="px-2 py-1 text-xs text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-lg flex items-center gap-1 transition-all"
                              >
                                <Eye className="w-3 h-3" />
                                Mở toàn màn hình
                              </button>
                            </div>
                            <div className="bg-white w-full" style={{ height: '500px' }}>
                              <iframe
                                src={cvPreviewUrl}
                                className="w-full h-full border-0"
                                title="CV Preview"
                              />
                            </div>
                          </div>

                          {/* Nút Phân tích - Ở dưới */}
                          <div>
                            <button
                              type="button"
                              onClick={handleAnalyzeCV}
                              disabled={extractingCV || !canEdit}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-sm px-4 py-3"
                              title={!canEdit ? "Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV." : ""}
                            >
                              {extractingCV ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Đang phân tích...
                                </>
                              ) : (
                                <>
                                  <Workflow className="w-4 h-4" />
                                  Phân tích CV
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Giai đoạn 2: Form đầy đủ - Chỉ hiện sau khi xác nhận phân tích */}
                  {showCVFullForm && (
                    <div className="space-y-6">
                      {/* Vị trí công việc */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Vị trí công việc <span className="text-red-500">*</span>
                        </label>
                        {cvFormErrors.jobRoleLevelId && (
                          <p className="text-xs text-red-600 mb-1">{cvFormErrors.jobRoleLevelId}</p>
                        )}
                        <select
                          value={inlineCVForm.jobRoleLevelId || 0}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setInlineCVForm({ ...inlineCVForm, jobRoleLevelId: value });
                            const newErrors = { ...cvFormErrors };
                            delete newErrors.jobRoleLevelId;
                            setCvFormErrors(newErrors);
                            // Clear version error khi chọn jobRoleLevelId mới - sẽ được validate lại sau khi fetch existingCVsForValidation
                            setCvVersionError("");
                          }}
                          disabled={isCVUploadedFromFirebase}
                          className={`w-full border rounded-xl px-4 py-3 focus:ring-accent-500 bg-white ${
                            isCVUploadedFromFirebase 
                              ? 'border-green-300 bg-green-50 cursor-not-allowed' 
                              : cvFormErrors.jobRoleLevelId
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-neutral-200 focus:border-accent-500'
                          }`}
                          required
                        >
                          <option value="0">-- Chọn vị trí công việc --</option>
                          {lookupJobRoleLevels.map(jobRoleLevel => (
                            <option key={jobRoleLevel.id} value={jobRoleLevel.id}>{jobRoleLevel.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Version */}
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Version CV <span className="text-red-500">*</span>
                        </label>
                        {cvFormErrors.version && (
                          <p className="text-xs text-red-600 mb-1">{cvFormErrors.version}</p>
                        )}
                        {cvVersionError && !isCVUploadedFromFirebase && (
                          <p className="text-xs text-red-500 mb-1">{cvVersionError}</p>
                        )}
                        <input
                          type="number"
                          value={inlineCVForm.version || 1}
                          onChange={(e) => {
                            const versionNum = Number(e.target.value);
                            setInlineCVForm({ ...inlineCVForm, version: versionNum });
                            const jobRoleLevelId = inlineCVForm.jobRoleLevelId || 0;
                            // Nếu chưa có CV nào và version = 1, không có lỗi
                            if (jobRoleLevelId > 0 && existingCVsForValidation.length === 0 && versionNum === 1) {
                              setCvVersionError("");
                              const newErrors = { ...cvFormErrors };
                              delete newErrors.version;
                              setCvFormErrors(newErrors);
                            } else {
                              const error = validateCVVersion(versionNum, jobRoleLevelId, existingCVsForValidation);
                              setCvVersionError(error);
                              const newErrors = { ...cvFormErrors };
                              if (error) {
                                newErrors.version = error;
                              } else {
                                delete newErrors.version;
                              }
                              setCvFormErrors(newErrors);
                            }
                          }}
                          placeholder="VD: 1, 2, 3..."
                          min="1"
                          step="1"
                          required
                          disabled={isCVUploadedFromFirebase || (inlineCVForm.jobRoleLevelId ? inlineCVForm.jobRoleLevelId > 0 && existingCVsForValidation.length === 0 : false)}
                          className={`w-full border rounded-xl px-4 py-3 focus:ring-accent-500 bg-white ${
                            isCVUploadedFromFirebase || (inlineCVForm.jobRoleLevelId ? inlineCVForm.jobRoleLevelId > 0 && existingCVsForValidation.length === 0 : false)
                              ? 'border-green-300 bg-green-50 cursor-not-allowed'
                              : cvVersionError || cvFormErrors.version
                                ? 'border-red-500 focus:border-red-500' 
                                : 'border-neutral-200 focus:border-accent-500'
                          }`}
                        />
                        {existingCVsForValidation.length > 0 && !isCVUploadedFromFirebase && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Các version hiện có: {existingCVsForValidation.map((cv: TalentCV) => cv.version || 'N/A').join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Upload File Section */}
                      <div className="bg-gradient-to-r from-accent-50 to-blue-50 rounded-xl p-6 border border-accent-200">
                        <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
                          <Upload className="w-5 h-5 text-accent-600" />
                          Upload File CV
                        </label>
                        
                        <div className="space-y-4">
                          {/* File Info - Hiện file đã chọn */}
                          {selectedCVFile && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                              <FileText className="w-4 h-4" />
                              <span>File đã chọn: <span className="font-medium">{selectedCVFile.name}</span> ({(selectedCVFile.size / 1024).toFixed(2)} KB)</span>
                            </div>
                          )}

                          {/* Thông báo khi reload và mất file */}
                          {!isCVUploadedFromFirebase && !selectedCVFile && showCVFullForm && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>Vui lòng chọn lại file CV để upload (file đã chọn trước đó không thể khôi phục sau khi reload trang).</span>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {uploadingCV && (
                            <div className="space-y-2">
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-accent-500 to-blue-500 h-3 rounded-full transition-all duration-300 animate-pulse"
                                  style={{ width: `${cvUploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-center text-accent-700 font-medium">
                                Đang upload... {cvUploadProgress}%
                              </p>
                            </div>
                          )}

                          {/* Upload Button */}
                          {!isCVUploadedFromFirebase && (
                            <button
                              type="button"
                              onClick={handleCVFileUpload}
                              disabled={!selectedCVFile || uploadingCV || !inlineCVForm.version || inlineCVForm.version <= 0 || !inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0 || !!cvVersionError}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-600 to-blue-600 hover:from-accent-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {uploadingCV ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Đang upload...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Upload lên Firebase
                                </>
                              )}
                            </button>
                          )}
                          {isCVUploadedFromFirebase && (
                            <div className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-xl font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Đã upload lên Firebase thành công
                            </div>
                          )}

                        </div>
                      </div>

                      {/* URL file CV */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        URL file CV <span className="text-red-500">*</span> {inlineCVForm.cvFileUrl && <span className="text-green-600 text-xs">(✓ Đã có)</span>}
                      </label>

                      <div className="flex gap-2">
                        <input
                          value={inlineCVForm.cvFileUrl || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setInlineCVForm({ ...inlineCVForm, cvFileUrl: value });
                            if (value && uploadedCVUrl !== value) {
                              setIsCVUploadedFromFirebase(false);
                              setUploadedCVUrl(null);
                            }
                          }}
                          placeholder="https://example.com/cv-file.pdf hoặc tự động từ Firebase"
                          required
                          disabled={!!(inlineCVForm.cvFileUrl && uploadedCVUrl === inlineCVForm.cvFileUrl) || uploadingCV || isCVUploadedFromFirebase}
                          className={`flex-1 border rounded-xl px-4 py-3 focus:ring-accent-500 bg-white ${
                            inlineCVForm.cvFileUrl && uploadedCVUrl === inlineCVForm.cvFileUrl
                              ? 'bg-gray-100 cursor-not-allowed opacity-75 border-gray-300'
                              : isCVUploadedFromFirebase 
                                ? 'border-green-300 bg-green-50 cursor-not-allowed' 
                                : 'border-neutral-200 focus:border-accent-500'
                          }`}
                          readOnly={uploadingCV || isCVUploadedFromFirebase}
                        />
                        {inlineCVForm.cvFileUrl && (
                          <>
                            <a
                              href={inlineCVForm.cvFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 bg-accent-100 text-accent-700 rounded-xl hover:bg-accent-200 transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              Xem
                            </a>
                            <button
                              type="button"
                              onClick={handleDeleteCVFile}
                              disabled={uploadingCV}
                              className="flex items-center gap-1.5 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title={uploadedCVUrl === inlineCVForm.cvFileUrl ? "Xóa URL và file trong Firebase" : "Xóa URL"}
                            >
                              <X className="w-4 h-4" />
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tóm tắt CV */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tóm tắt CV
                      </label>
                      <textarea
                        value={inlineCVForm.summary || ""}
                        onChange={(e) => setInlineCVForm({ ...inlineCVForm, summary: e.target.value })}
                        placeholder="Mô tả ngắn gọn về nội dung CV, bao gồm: tên ứng viên, vị trí công việc, kinh nghiệm làm việc, kỹ năng chính, dự án nổi bật, chứng chỉ (nếu có)..."
                        rows={4}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 focus:border-accent-500 focus:ring-accent-500 bg-white resize-none"
                      />
                    </div>

                    {/* Error messages */}
                    {cvFormErrors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{cvFormErrors.submit}</p>
                      </div>
                    )}

                    {/* Submit buttons */}
                    <div className="flex justify-end gap-2">
                      {/* Bỏ nút Hủy - chỉ đóng khi hủy phân tích CV */}
                      <Button
                        onClick={handleSubmitInlineCV}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Thêm CV
                          </>
                        )}
                      </Button>
                    </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal phân tích CV inline */}
              {showInlineCVAnalysisModal && inlineCVAnalysisResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  {/* Bỏ logic đóng modal khi click outside - chỉ đóng khi hủy phân tích */}
                  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Workflow className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Kết quả phân tích CV</h2>
                      </div>
                      {/* Bỏ nút X - chỉ đóng khi hủy phân tích CV */}
                    </div>
                    <div className="p-6 space-y-5">
                      <p className="text-sm text-neutral-600">
                        Hệ thống đã so sánh CV mới với dữ liệu hiện có của nhân sự.
                      </p>
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">So sánh thông tin cơ bản</h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          <span className="font-medium">Có thay đổi:</span> {inlineCVAnalysisResult.basicInfo.hasChanges ? "Có" : "Không"}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
                          <div>
                            <p className="font-medium text-neutral-900 mb-2">Hiện tại</p>
                            <ul className="space-y-2 bg-white p-3 rounded-lg border border-neutral-200">
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Họ tên:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : ''}`}>
                                  {inlineCVAnalysisResult.basicInfo.current.fullName ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Email:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'text-red-700' : ''}`}>
                                  {inlineCVAnalysisResult.basicInfo.current.email ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Điện thoại:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'text-red-700' : ''}`}>
                                  {inlineCVAnalysisResult.basicInfo.current.phone ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Nơi ở:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : ''}`}>
                                  {inlineCVAnalysisResult.basicInfo.current.locationName ?? "—"}
                                </span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 mb-2">Gợi ý từ CV</p>
                            <ul className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Họ tên:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName) ? 'text-red-700' : 'text-blue-700'}`}>
                                  {inlineCVAnalysisResult.basicInfo.suggested.fullName ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Email:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email) ? 'text-red-700' : 'text-blue-700'}`}>
                                  {inlineCVAnalysisResult.basicInfo.suggested.email ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Điện thoại:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone) ? 'text-red-700' : 'text-blue-700'}`}>
                                  {inlineCVAnalysisResult.basicInfo.suggested.phone ?? "—"}
                                </span>
                              </li>
                              <li className={`flex justify-between ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
                                <span className="text-neutral-500">Nơi ở:</span>
                                <span className={`font-medium ${isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName) ? 'text-red-700' : 'text-blue-700'}`}>
                                  {inlineCVAnalysisResult.basicInfo.suggested.locationName ?? "—"}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                        {/* Bỏ nút Đóng - chỉ đóng khi hủy phân tích CV */}
                        {inlineCVAnalysisResult.basicInfo.hasChanges && (
                          <Button
                            onClick={handleConfirmInlineCVAnalysis}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Xác nhận và xem gợi ý
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {talentCVs.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Danh sách CV</h3>
                    <p className="text-sm text-neutral-600 mt-1">Quản lý các phiên bản CV của nhân sự</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              checked={selectedCVs.length === talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).length && talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const currentPageItems = talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).map(cv => cv.id);
                                  setSelectedCVs([...new Set([...selectedCVs, ...currentPageItems])]);
                                } else {
                                  const currentPageItems = talentCVs.slice((pageCVs - 1) * itemsPerPage, pageCVs * itemsPerPage).map(cv => cv.id);
                                  setSelectedCVs(selectedCVs.filter(id => !currentPageItems.includes(id)));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Phiên bản</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {(() => {
                          // Nhóm CV theo jobRoleLevelName
                          const groupedCVs = new Map<string, (TalentCV & { jobRoleLevelName?: string })[]>();
                          talentCVs.forEach((cv) => {
                            const key = cv.jobRoleLevelName || "Chưa xác định";
                            if (!groupedCVs.has(key)) {
                              groupedCVs.set(key, []);
                            }
                            groupedCVs.get(key)!.push(cv);
                          });

                          // Lấy danh sách các nhóm đã sắp xếp
                          const sortedGroups = Array.from(groupedCVs.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                          // Lấy CV cho trang hiện tại
                          const startIndex = (pageCVs - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          let currentIndex = 0;
                          const rows: React.ReactNode[] = [];

                          sortedGroups.forEach(([jobRoleLevelName, cvs]) => {
                            // Sắp xếp CV: active trước (version giảm dần), inactive sau (version giảm dần)
                            const sortedCVs = [...cvs].sort((a, b) => {
                              if (a.isActive !== b.isActive) {
                                return a.isActive ? -1 : 1; // Active trước
                              }
                              return b.version - a.version; // Version giảm dần
                            });

                            const activeCVs = sortedCVs.filter(cv => cv.isActive);
                            const inactiveCVs = sortedCVs.filter(cv => !cv.isActive);
                            const isCollapsed = collapsedInactiveCVGroups.has(jobRoleLevelName);

                            // Hiển thị CV active
                            activeCVs.forEach((cv, index) => {
                              if (currentIndex >= startIndex && currentIndex < endIndex) {
                                const isLoading = analysisLoadingId === cv.id;
                                const isCurrentAnalysis = analysisResultCVId === cv.id && !!analysisResult;
                                const hasOtherAnalysis = !!analysisResult && analysisResultCVId !== null && analysisResultCVId !== cv.id;
                                const canAnalyze = !hasOtherAnalysis;
                                const analysisControls = isCurrentAnalysis
                                  ? (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelAnalysis();
                                      }}
                                      className="group flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-neutral-500 to-neutral-600 hover:from-neutral-600 hover:to-neutral-700 text-white text-xs"
                                    >
                                      <Workflow className="w-3 h-3" />
                                      Hủy
                                    </Button>
                                  )
                                  : (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAnalyzeCVFromUrl(cv);
                                      }}
                                      disabled={isLoading || !canAnalyze || !canEdit}
                                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 text-xs ${
                                        isLoading || !canAnalyze || !canEdit
                                          ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                                          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                      }`}
                                      title={!canEdit ? "Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV." : !canAnalyze ? "Vui lòng hủy phân tích CV đang hiển thị trước khi phân tích CV khác" : ""}
                                    >
                                      <Workflow className="w-3 h-3" />
                                      {isLoading ? "Đang phân tích..." : "Phân tích"}
                                    </Button>
                                  );

                                // Thêm nút collapse/expand vào phiên bản mới nhất (đầu tiên) nếu có phiên bản cũ
                                const isNewestVersion = index === 0 && inactiveCVs.length > 0;
                                const collapseButton = isNewestVersion ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCollapsedInactiveCVGroups(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(jobRoleLevelName)) {
                                          newSet.delete(jobRoleLevelName);
                                        } else {
                                          newSet.add(jobRoleLevelName);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors duration-200"
                                    title={isCollapsed ? `Hiển thị ${inactiveCVs.length} phiên bản cũ` : `Ẩn ${inactiveCVs.length} phiên bản cũ`}
                                  >
                                    {isCollapsed ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronUp className="w-4 h-4" />
                                    )}
                                    <span className="text-xs">({inactiveCVs.length})</span>
                                  </button>
                                ) : null;

                                rows.push(
                                  <tr 
                                    key={cv.id} 
                                    className="hover:bg-accent-50 transition-colors duration-200 cursor-pointer"
                                    onClick={() => navigate(`/ta/talent-cvs/edit/${cv.id}`)}
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={selectedCVs.includes(cv.id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setSelectedCVs([...selectedCVs, cv.id]);
                                          } else {
                                            setSelectedCVs(selectedCVs.filter(id => id !== cv.id));
                                          }
                                        }}
                                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                      />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm font-medium text-accent-800">{cv.jobRoleLevelName || "Chưa xác định"}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm text-accent-700">v{cv.version}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        Đang hoạt động
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={cv.cvFileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 text-sm font-medium"
                                        >
                                          <Eye className="w-4 h-4" />
                                          Xem PDF
                                        </a>
                                        {analysisControls}
                                        {collapseButton}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                              currentIndex++;
                            });

                            // Hiển thị các phiên bản cũ nếu không bị collapse
                            if (inactiveCVs.length > 0) {
                              if (!isCollapsed) {
                                inactiveCVs.forEach((cv) => {
                                  if (currentIndex >= startIndex && currentIndex < endIndex) {
                                    rows.push(
                                      <tr 
                                        key={cv.id} 
                                        className="hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-neutral-50/50"
                                        onClick={() => navigate(`/ta/talent-cvs/edit/${cv.id}`)}
                                      >
                                        <td className="px-4 py-3 whitespace-nowrap pl-8" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="checkbox"
                                            checked={selectedCVs.includes(cv.id)}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.checked) {
                                                setSelectedCVs([...selectedCVs, cv.id]);
                                              } else {
                                                setSelectedCVs(selectedCVs.filter(id => id !== cv.id));
                                              }
                                            }}
                                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                          />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="text-sm font-medium text-neutral-600">{cv.jobRoleLevelName || "Chưa xác định"}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="text-sm text-neutral-500">v{cv.version}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                            Không hoạt động
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={cv.cvFileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="group flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 text-sm font-medium"
                                            >
                                              <Eye className="w-4 h-4" />
                                              Xem PDF
                                            </a>
                                            {/* Không hiển thị nút phân tích cho CV không hoạt động */}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }
                                  currentIndex++;
                                });
                              } else {
                                // Nếu bị collapse, vẫn đếm số lượng để pagination đúng
                                currentIndex += inactiveCVs.length;
                              }
                            }
                          });

                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                  <SectionPagination
                    currentPage={pageCVs}
                    totalItems={talentCVs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPageCVs}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">Chưa có CV nào</p>
                  <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa upload CV</p>
                </div>
              )}
            </div>
          )}
        </div>
              </div>
            )}

            {/* Tab: Vị trí */}
            {activeTab === "jobRoleLevels" && (
              <div className="space-y-4">
                {/* Inline JobRoleLevel Form */}
                {showInlineForm === "jobRoleLevel" && (
                  <div className="bg-white rounded-xl border-2 border-warning-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thêm vị trí mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Vị trí <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Filter theo loại vị trí */}
                        <div className="mb-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsJobRoleFilterDropdownOpen(!isJobRoleFilterDropdownOpen)}
                              className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 rounded-lg bg-white text-left focus:border-warning-500 focus:ring-warning-500"
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
                                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-warning-500 focus:ring-warning-500"
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
                                        ? "bg-warning-50 text-warning-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    Tất cả loại vị trí
                                  </button>
                                  {jobRoles
                                    .filter(role => !jobRoleFilterSearch || role.name.toLowerCase().includes(jobRoleFilterSearch.toLowerCase()))
                                    .map(role => (
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
                                            ? "bg-warning-50 text-warning-700"
                                            : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {role.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsJobRoleLevelDropdownOpen(!isJobRoleLevelDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-warning-500/20 transition-all border-neutral-300 focus:border-warning-500"
                          >
                            <div className="flex items-center gap-2 text-sm text-neutral-700">
                              <Target className="w-4 h-4 text-neutral-400" />
                              <span>
                                {inlineJobRoleLevelForm.jobRoleLevelId && inlineJobRoleLevelForm.jobRoleLevelId > 0
                                  ? (() => {
                                      const level = lookupJobRoleLevelsForTalent.find(j => j.id === inlineJobRoleLevelForm.jobRoleLevelId);
                                      return level ? getJobRoleLevelDisplayText(level) : "Chọn vị trí";
                                    })()
                                  : "Chọn vị trí"}
                              </span>
                            </div>
                          </button>
                          {isJobRoleLevelDropdownOpen && (
                            <div 
                              className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                              onMouseLeave={() => {
                                setIsJobRoleLevelDropdownOpen(false);
                                setJobRoleLevelSearch("");
                              }}
                            >
                              <div className="p-3 border-b border-neutral-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                  <input
                                    type="text"
                                    value={jobRoleLevelSearch}
                                    onChange={(e) => setJobRoleLevelSearch(e.target.value)}
                                    placeholder="Tìm vị trí..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-warning-500 focus:ring-warning-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {(() => {
                                  const filteredByJobRole = selectedJobRoleFilterId
                                    ? lookupJobRoleLevelsForTalent.filter(j => j.jobRoleId === selectedJobRoleFilterId)
                                    : lookupJobRoleLevelsForTalent;
                                  const filtered = jobRoleLevelSearch
                                    ? filteredByJobRole.filter(j => {
                                        const displayText = getJobRoleLevelDisplayText(j);
                                        return displayText.toLowerCase().includes(jobRoleLevelSearch.toLowerCase());
                                      })
                                    : filteredByJobRole;
                                  if (filtered.length === 0) {
                                    return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                                  }
                                  
                                  // Get selected job role level IDs (excluding current form)
                                  const selectedJobRoleLevelIds = jobRoleLevels
                                    .map(jrl => jrl.jobRoleLevelId)
                                    .filter(id => id > 0);
                                  
                                  return filtered.map((jobRoleLevel) => {
                                    const isDisabled = selectedJobRoleLevelIds.includes(jobRoleLevel.id);
                                    return (
                                      <button
                                        type="button"
                                        key={jobRoleLevel.id}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            setInlineJobRoleLevelForm({ ...inlineJobRoleLevelForm, jobRoleLevelId: jobRoleLevel.id });
                                            setIsJobRoleLevelDropdownOpen(false);
                                            setJobRoleLevelSearch("");
                                            // Tự động điền vào ô lọc loại vị trí
                                            setSelectedJobRoleFilterId(jobRoleLevel.jobRoleId);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          inlineJobRoleLevelForm.jobRoleLevelId === jobRoleLevel.id
                                            ? "bg-warning-50 text-warning-700"
                                            : isDisabled
                                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                              : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {getJobRoleLevelDisplayText(jobRoleLevel)}{isDisabled ? ' (đã chọn)' : ''}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Kinh nghiệm (năm)</label>
                          <input
                            type="number"
                            value={inlineJobRoleLevelForm.yearsOfExp || 1}
                            onChange={(e) => setInlineJobRoleLevelForm({ ...inlineJobRoleLevelForm, yearsOfExp: Number(e.target.value) })}
                            min="0"
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineJobRoleLevel}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Vị trí</h3>
                    <div className="flex gap-2">
                      {showInlineForm !== "jobRoleLevel" && (
                        <Button
                          onClick={() => handleOpenInlineForm("jobRoleLevel")}
                          disabled={isSubmitting || !canEdit}
                          className={`group flex items-center justify-center bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm vị trí"}
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </Button>
                      )}
                      {selectedJobRoleLevels.length > 0 && (
                        <Button
                          onClick={handleDeleteJobRoleLevels}
                          disabled={!canEdit}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Xóa vị trí ({selectedJobRoleLevels.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  {analysisResult && (matchedJobRoleLevelsNotInProfile.length > 0 || jobRoleLevelsMatched.length > 0 || jobRoleLevelsOnlyInTalent.length > 0 || jobRoleLevelsUnmatched.length > 0) && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50/80 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Đề xuất vị trí</h3>
                        <span className="text-xs text-green-700">
                          {matchedJobRoleLevelsNotInProfile.length} cần tạo mới · {jobRoleLevelsMatched.length} trùng CV · {jobRoleLevelsUnmatched.length} chưa có trong hệ thống
                        </span>
                      </div>
                      {(matchedJobRoleLevelsNotInProfile.length > 0 || jobRoleLevelsUnmatched.length > 0) && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-3">
                          {matchedJobRoleLevelsNotInProfile.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-semibold text-amber-900">Cần tạo mới (có trong hệ thống, chưa có trong hồ sơ) ({matchedJobRoleLevelsNotInProfile.length}):</p>
                              <ul className="space-y-2">
                                {matchedJobRoleLevelsNotInProfile.map((jobRole, index) => (
                                  <li key={`jobrole-matched-notin-${index}`} className="flex flex-col rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm">
                                    <span className="font-semibold text-sm">
                                      {jobRole.position}
                                      {jobRole.level && <span className="ml-1.5 text-amber-600">· Level {jobRole.level}</span>}
                                      {jobRole.yearsOfExp && <span className="ml-1.5 text-amber-600">· {jobRole.yearsOfExp} năm</span>}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {jobRoleLevelsUnmatched.length > 0 && (
                            <div className="rounded-xl border border-dashed border-amber-300 bg-white p-3 text-xs text-amber-700">
                              <p className="font-semibold text-amber-900">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({jobRoleLevelsUnmatched.length}):</p>
                              <ul className="mt-2 space-y-1">
                                {jobRoleLevelsUnmatched.map((suggestion, index) => (
                                  <li key={`jobrole-unmatched-${index}`}>
                                    - {suggestion.position ?? "Vị trí chưa rõ"}{" "}
                                  </li>
                                ))}
                              </ul>
                              {/* Bỏ nút đề xuất - chỉ có ở phần Skills */}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {jobRoleLevels.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedJobRoleLevels.length === jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).length && jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const currentPageItems = jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).map(jrl => jrl.id);
                                      setSelectedJobRoleLevels([...new Set([...selectedJobRoleLevels, ...currentPageItems])]);
                                    } else {
                                      const currentPageItems = jobRoleLevels.slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage).map(jrl => jrl.id);
                                      setSelectedJobRoleLevels(selectedJobRoleLevels.filter(id => !currentPageItems.includes(id)));
                                    }
                                  }}
                                  className="w-4 h-4 text-warning-600 bg-gray-100 border-gray-300 rounded focus:ring-warning-500 focus:ring-2"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Kinh nghiệm</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {jobRoleLevels
                              .slice((pageJobRoleLevels - 1) * itemsPerPage, pageJobRoleLevels * itemsPerPage)
                              .map((jrl) => (
                                <tr 
                                  key={jrl.id} 
                                  className="hover:bg-warning-50 transition-colors duration-200 cursor-pointer"
                                  onClick={() => navigate(`/ta/talent-job-role-levels/edit/${jrl.id}`)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={selectedJobRoleLevels.includes(jrl.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedJobRoleLevels([...selectedJobRoleLevels, jrl.id]);
                                        } else {
                                          setSelectedJobRoleLevels(selectedJobRoleLevels.filter(id => id !== jrl.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-warning-600 bg-gray-100 border-gray-300 rounded focus:ring-warning-500 focus:ring-2"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-warning-800">{jrl.jobRoleLevelName}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-warning-700">{jrl.yearsOfExp === 0 ? 'không có' : `${jrl.yearsOfExp} năm`}</div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageJobRoleLevels}
                        totalItems={jobRoleLevels.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageJobRoleLevels}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium">Chưa có thông tin vị trí</p>
                      <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật vị trí làm việc</p>
                    </div>
                  )}
              </div>
            )}

            {/* Tab: Kỹ năng của nhân sự */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                {/* Inline Skill Form */}
                {showInlineForm === "skill" && (
                  <div className="bg-white rounded-xl border-2 border-secondary-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thêm kỹ năng mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {/* Skill Filter - Lọc theo nhóm kỹ năng */}
                      {lookupSkills.length > 0 && lookupSkillGroups.length > 0 && (
                        <div className="mb-4">
                          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                            <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                              <Filter className="w-3.5 h-3.5" />
                              Lọc danh sách kỹ năng theo nhóm
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsSkillGroupDropdownOpen(!isSkillGroupDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-1.5 border rounded-lg bg-white text-left focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-all border-neutral-300"
                              >
                                <div className="flex items-center gap-2 text-xs text-neutral-700">
                                  <Filter className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>
                                    {selectedSkillGroupId
                                      ? lookupSkillGroups.find(g => g.id === selectedSkillGroupId)?.name || "Nhóm kỹ năng"
                                      : "Tất cả nhóm kỹ năng"}
                                  </span>
                                </div>
                              </button>
                              {isSkillGroupDropdownOpen && (
                                <div 
                                  className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                  onMouseLeave={() => {
                                    setIsSkillGroupDropdownOpen(false);
                                    setSkillGroupSearchQuery("");
                                  }}
                                >
                                  <div className="p-3 border-b border-neutral-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={skillGroupSearchQuery}
                                        onChange={(e) => setSkillGroupSearchQuery(e.target.value)}
                                        placeholder="Tìm nhóm kỹ năng..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSkillGroupId(undefined);
                                        setIsSkillGroupDropdownOpen(false);
                                        setSkillGroupSearchQuery("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        !selectedSkillGroupId
                                          ? "bg-primary-50 text-primary-700"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                      }`}
                                    >
                                      Tất cả nhóm kỹ năng
                                    </button>
                                    {(() => {
                                      const filtered = skillGroupSearchQuery
                                        ? lookupSkillGroups.filter(g =>
                                          g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()) ||
                                          (g.description && g.description.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()))
                                        )
                                        : lookupSkillGroups;
                                      if (filtered.length === 0) {
                                        return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy nhóm kỹ năng</p>;
                                      }
                                      return filtered.map((group) => (
                                        <button
                                          type="button"
                                          key={group.id}
                                          onClick={() => {
                                            setSelectedSkillGroupId(group.id);
                                            setIsSkillGroupDropdownOpen(false);
                                            setSkillGroupSearchQuery("");
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            selectedSkillGroupId === group.id
                                              ? "bg-primary-50 text-primary-700"
                                              : "hover:bg-neutral-50 text-neutral-700"
                                          }`}
                                        >
                                          {group.name}
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Kỹ năng <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-secondary-500/20 transition-all border-neutral-300 focus:border-secondary-500"
                          >
                            <div className="flex items-center gap-2 text-sm text-neutral-700">
                              <Star className="w-4 h-4 text-neutral-400" />
                              <span>
                                {inlineSkillForm.skillId && inlineSkillForm.skillId > 0
                                  ? lookupSkills.find(s => s.id === inlineSkillForm.skillId)?.name || "Chọn kỹ năng"
                                  : "Chọn kỹ năng"}
                              </span>
                            </div>
                          </button>
                          {isSkillDropdownOpen && (
                            <div 
                              className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                              onMouseLeave={() => {
                                setIsSkillDropdownOpen(false);
                                setSkillSearchQuery("");
                              }}
                            >
                              <div className="p-3 border-b border-neutral-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                  <input
                                    type="text"
                                    value={skillSearchQuery}
                                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                                    placeholder="Tìm kỹ năng..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-secondary-500 focus:ring-secondary-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {(() => {
                                  // Filter skills theo search query và skill group
                                  const filteredSkills = lookupSkills.filter((s) => {
                                    const matchesSearch = !skillSearchQuery ||
                                      s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                                      (s.description && s.description.toLowerCase().includes(skillSearchQuery.toLowerCase()));
                                    const matchesGroup = !selectedSkillGroupId || s.skillGroupId === selectedSkillGroupId;
                                    return matchesSearch && matchesGroup;
                                  });

                                  if (filteredSkills.length === 0) {
                                    return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy kỹ năng nào</p>;
                                  }

                                  // Check if skill is already selected
                                  const selectedSkillIds = talentSkills
                                    .map(skill => skill.skillId)
                                    .filter(id => id > 0);

                                  return filteredSkills.map((skill) => {
                                    const isDisabled = selectedSkillIds.includes(skill.id);
                                    return (
                                      <button
                                        type="button"
                                        key={skill.id}
                                        onClick={() => {
                                          if (!isDisabled) {
                                            setInlineSkillForm({ ...inlineSkillForm, skillId: skill.id });
                                            // Tự động set nhóm kỹ năng theo skill đã chọn
                                            if (skill.skillGroupId) {
                                              setSelectedSkillGroupId(skill.skillGroupId);
                                            }
                                            setIsSkillDropdownOpen(false);
                                            setSkillSearchQuery("");
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          inlineSkillForm.skillId === skill.id
                                            ? "bg-secondary-50 text-secondary-700"
                                            : isDisabled
                                              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                              : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {skill.name}{isDisabled ? ' (đã chọn)' : ''}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Trình độ</label>
                          <select
                            value={inlineSkillForm.level || "Beginner"}
                            onChange={(e) => setInlineSkillForm({ ...inlineSkillForm, level: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500"
                          >
                            <option value="Beginner">Mới bắt đầu</option>
                            <option value="Intermediate">Trung bình</option>
                            <option value="Advanced">Nâng cao</option>
                            <option value="Expert">Chuyên gia</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Số năm kinh nghiệm</label>
                          <input
                            type="number"
                            value={inlineSkillForm.yearsExp || 1}
                            onChange={(e) => setInlineSkillForm({ ...inlineSkillForm, yearsExp: Number(e.target.value) })}
                            min="0"
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineSkill}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Kỹ năng của nhân sự</h3>
                    <div className="flex gap-2">
                      {showInlineForm !== "skill" && (
                        <Button
                          onClick={() => handleOpenInlineForm("skill")}
                          disabled={isSubmitting || !canEdit}
                          className={`group flex items-center justify-center bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm kỹ năng"}
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </Button>
                      )}
                      {selectedSkills.length > 0 && (
                        <Button
                          onClick={handleDeleteSkills}
                          disabled={!canEdit}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Xóa kỹ năng ({selectedSkills.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  {analysisResult && (analysisResult.skills.newFromCV.length > 0 || analysisResult.skills.matched.length > 0) && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Đề xuất kỹ năng</h3>
                        <span className="text-xs text-amber-700">
                          {matchedSkillsNotInProfile.length} cần tạo mới · {matchedSkillsDetails.length} trùng CV · {unmatchedSkillSuggestions.length} chưa có trong hệ thống
                        </span>
                      </div>
                      {(matchedSkillsNotInProfile.length > 0 || unmatchedSkillSuggestions.length > 0) && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                          <p className="font-medium mb-2 text-sm text-amber-900">So sánh khác với hồ sơ hiện tại:</p>
                          {matchedSkillsNotInProfile.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-semibold text-amber-900">Cần tạo mới (có trong hệ thống, chưa có trong hồ sơ) ({matchedSkillsNotInProfile.length}):</p>
                              <ul className="space-y-1">
                                {matchedSkillsNotInProfile.map((skill, index) => (
                                  <li key={`missing-skill-system-${index}`} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-sm">
                                        {skill.skillName}
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() => handleQuickCreateSkill({
                                        skillId: skill.skillId,
                                        skillName: skill.skillName,
                                        cvLevel: skill.cvLevel,
                                        cvYearsExp: skill.cvYearsExp ?? undefined,
                                      })}
                                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:from-primary-700 hover:to-primary-800"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Tạo nhanh
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {unmatchedSkillSuggestions.length > 0 && (
                            <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-white p-3 text-xs text-amber-700">
                              <p className="font-semibold text-amber-900">Chưa có trong hệ thống (cần đề xuất admin tạo mới) ({unmatchedSkillSuggestions.length}):</p>
                              <ul className="mt-2 space-y-1">
                                {unmatchedSkillSuggestions.map((skill, index) => (
                                  <li key={`unmatched-skill-${index}`}>- {skill.skillName}</li>
                                ))}
                              </ul>
                              <div className="mt-3 flex flex-col items-end gap-1">
                                <Button
                                  onClick={() =>
                                    handleSuggestionRequest(
                                      "skill",
                                      skillSuggestionRequestKey,
                                      skillSuggestionDisplayItems,
                                      skillSuggestionDetailItems
                                    )
                                  }
                                  disabled={
                                    !skillSuggestionDisplayItems.length || isSuggestionPending(skillSuggestionRequestKey)
                                  }
                                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all duration-300 ${
                                    !skillSuggestionDisplayItems.length || isSuggestionPending(skillSuggestionRequestKey)
                                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                                  }`}
                                >
                                  <Plus className="w-4 h-4" />
                                  {isSuggestionPending(skillSuggestionRequestKey)
                                    ? "Đã gửi đề xuất"
                                    : "Đề xuất thêm kỹ năng vào hệ thống"}
                                </Button>
                                {isSuggestionPending(skillSuggestionRequestKey) && (
                                  <span className="text-xs text-amber-600">
                                    Đang chờ Admin xem xét đề xuất này.
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {talentSkills.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-neutral-600">
                          Tổng cộng{" "}
                          <span className="font-semibold text-neutral-900">
                            {talentSkills.length}
                          </span>{" "}
                          kỹ năng
                        </p>
                        <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                            checked={showOnlyUnverifiedSkills}
                            onChange={(e) => setShowOnlyUnverifiedSkills(e.target.checked)}
                          />
                          <span>Chỉ xem nhóm kỹ năng chưa verify</span>
                        </label>
                      </div>
                      {/* Tìm kiếm và lọc danh sách kỹ năng */}
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Tìm kiếm theo tên kỹ năng */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input
                            type="text"
                            value={skillListSearchQuery}
                            onChange={(e) => setSkillListSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên kỹ năng..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 bg-white"
                          />
                        </div>
                        {/* Lọc theo nhóm kỹ năng */}
                        {lookupSkillGroups.length > 0 && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsSkillGroupListDropdownOpen(!isSkillGroupListDropdownOpen)}
                              className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all border-neutral-300"
                            >
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Filter className="w-4 h-4 text-neutral-400" />
                                <span>
                                  {selectedSkillGroupIdForList
                                    ? lookupSkillGroups.find(g => g.id === selectedSkillGroupIdForList)?.name || "Nhóm kỹ năng"
                                    : "Tất cả nhóm kỹ năng"}
                                </span>
                              </div>
                            </button>
                            {isSkillGroupListDropdownOpen && (
                              <div 
                                className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                onMouseLeave={() => {
                                  setIsSkillGroupListDropdownOpen(false);
                                  setSkillGroupListSearchQuery("");
                                }}
                              >
                                <div className="p-3 border-b border-neutral-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                    <input
                                      type="text"
                                      value={skillGroupListSearchQuery}
                                      onChange={(e) => setSkillGroupListSearchQuery(e.target.value)}
                                      placeholder="Tìm nhóm kỹ năng..."
                                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSkillGroupIdForList(undefined);
                                      setIsSkillGroupListDropdownOpen(false);
                                      setSkillGroupListSearchQuery("");
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${
                                      !selectedSkillGroupIdForList
                                        ? "bg-primary-50 text-primary-700"
                                        : "hover:bg-neutral-50 text-neutral-700"
                                    }`}
                                  >
                                    Tất cả nhóm kỹ năng
                                  </button>
                                  {(() => {
                                    const filtered = skillGroupListSearchQuery
                                      ? lookupSkillGroups.filter(g =>
                                        g.name.toLowerCase().includes(skillGroupListSearchQuery.toLowerCase()) ||
                                        (g.description && g.description.toLowerCase().includes(skillGroupListSearchQuery.toLowerCase()))
                                      )
                                      : lookupSkillGroups;
                                    if (filtered.length === 0) {
                                      return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy nhóm kỹ năng</p>;
                                    }
                                    return filtered.map((group) => (
                                      <button
                                        type="button"
                                        key={group.id}
                                        onClick={() => {
                                          setSelectedSkillGroupIdForList(group.id);
                                          setIsSkillGroupListDropdownOpen(false);
                                          setSkillGroupListSearchQuery("");
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          selectedSkillGroupIdForList === group.id
                                            ? "bg-primary-50 text-primary-700"
                                            : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {group.name}
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {(() => {
                        // Filter skills theo tên kỹ năng và nhóm kỹ năng trước khi gom nhóm
                        let filteredSkills = talentSkills;
                        
                        // Filter theo tên kỹ năng
                        if (skillListSearchQuery) {
                          filteredSkills = filteredSkills.filter((skill) => {
                            const skillName = skill.skillName?.toLowerCase() || "";
                            const searchLower = skillListSearchQuery.toLowerCase();
                            return skillName.includes(searchLower);
                          });
                        }
                        
                        // Filter theo nhóm kỹ năng
                        if (selectedSkillGroupIdForList !== undefined) {
                          filteredSkills = filteredSkills.filter((skill) => {
                            return skill.skillGroupId === selectedSkillGroupIdForList;
                          });
                        }

                        // Gom skill theo nhóm
                        const groupMap: Record<
                          string,
                          {
                            key: string;
                            skillGroupId?: number;
                            groupName: string;
                            skills: (TalentSkill & { skillName: string; skillGroupId?: number })[];
                          }
                        > = {};

                        filteredSkills.forEach((skill) => {
                          const groupId = skill.skillGroupId;
                          const key = groupId ? `group-${groupId}` : "group-ungrouped";
                          if (!groupMap[key]) {
                            const group = groupId
                              ? lookupSkillGroups.find((g) => g.id === groupId)
                              : undefined;
                            groupMap[key] = {
                              key,
                              skillGroupId: groupId,
                              groupName: group?.name ?? (groupId ? `Nhóm #${groupId}` : "Khác"),
                              skills: [],
                            };
                          }
                          groupMap[key].skills.push(skill);
                        });

                        let groups = Object.values(groupMap);

                        // Áp dụng filter: chỉ xem NHÓM kỹ năng chưa verify (bao gồm cả cần verify lại)
                        if (showOnlyUnverifiedSkills) {
                          groups = groups.filter((g) => {
                            if (!g.skillGroupId) return true; // nhóm không có ID vẫn hiển thị
                            const status =
                              skillGroupVerificationStatuses[g.skillGroupId];
                            const isVerified = status?.isVerified === true;
                            const needsReverification = status?.needsReverification === true;
                            // Hiển thị nếu chưa verify HOẶC cần verify lại
                            return !isVerified || needsReverification;
                          });
                        }

                        if (groups.length === 0) {
                          return (
                            <div className="text-center py-6 text-sm text-neutral-500">
                              Không có kỹ năng nào phù hợp với bộ lọc.
                            </div>
                          );
                        }

                        // Áp dụng phân trang: chỉ hiển thị 3 nhóm mỗi trang
                        const totalGroups = groups.length;
                        const startIndex = (pageSkills - 1) * skillGroupsPerPage;
                        const endIndex = startIndex + skillGroupsPerPage;
                        const paginatedGroups = groups.slice(startIndex, endIndex);

                        return (
                          <>
                            <div className="space-y-3">
                              {paginatedGroups.map((group) => {
                              const status: SkillGroupVerificationStatus | undefined =
                                group.skillGroupId !== undefined
                                  ? skillGroupVerificationStatuses[group.skillGroupId] ?? undefined
                                  : undefined;
                              // Logic hiển thị trạng thái verify theo quy trình mới:
                              // Backend đã tính: IsVerified = latestAssessment.IsVerified && latestAssessment.IsActive && !needsReverification
                              // FE chỉ cần check status.isVerified từ API response
                              // Nếu không có status thì coi như chưa verify
                              const needsReverification = status?.needsReverification === true;
                              const isVerified = status?.isVerified === true; // Backend đã tính toán đầy đủ
                              const hasBeenVerified = status?.lastVerifiedDate != null; // Đã từng verify (pass hoặc fail)

                              // Tính toán checkbox chọn cả nhóm
                              const groupSkillIds = group.skills.map((s) => s.id);
                              const allSelected =
                                groupSkillIds.length > 0 &&
                                groupSkillIds.every((id) => selectedSkills.includes(id));

                              return (
                                <div
                                  key={group.key}
                                  className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden"
                                >
                                  <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        {group.skills.length > 0 && (
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                                            checked={allSelected}
                                            onChange={(e) => {
                                              const shouldSelect = e.target.checked;
                                              setSelectedSkills((prev) => {
                                                if (shouldSelect) {
                                                  const newIds = groupSkillIds.filter(
                                                    (id) => !prev.includes(id)
                                                  );
                                                  return [...prev, ...newIds];
                                                }
                                                // Bỏ chọn toàn bộ skill thuộc group
                                                return prev.filter(
                                                  (id) => !groupSkillIds.includes(id)
                                                );
                                              });
                                            }}
                                          />
                                        )}
                                        <h4 className="text-sm font-semibold text-neutral-900">
                                          {group.groupName}
                                        </h4>
                                        {group.skillGroupId && (
                                          needsReverification ? (
                                            <span 
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
                                              title={status?.reason || "Có kỹ năng được thêm hoặc cập nhật sau lần verify cuối"}
                                            >
                                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                                              Cần verify lại
                                              {status?.reason && (
                                                <span className="ml-1 text-[10px] opacity-75" title={status.reason}>
                                                  ⚠️
                                                </span>
                                              )}
                                            </span>
                                          ) : isVerified ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                              Đã verify
                                            </span>
                                          ) : hasBeenVerified ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                              <span className="w-2 h-2 rounded-full bg-red-500" />
                                              Không hợp lệ / bị hủy
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-300">
                                              <span className="w-2 h-2 rounded-full bg-neutral-400" />
                                              Chưa verify
                                            </span>
                                          )
                                        )}
                                      </div>
                                      {status?.lastVerifiedDate && (
                                        <div className="mt-1 space-y-0.5">
                                          <p className="text-[11px] text-neutral-500">
                                            Lần cuối:{" "}
                                            {new Date(
                                              status.lastVerifiedDate
                                            ).toLocaleString("vi-VN")}
                                            {status.lastVerifiedByExpertName && (
                                              <>
                                                {" "}
                                                · Bởi{" "}
                                                <span className="font-medium">
                                                  {status.lastVerifiedByExpertName}
                                                </span>
                                              </>
                                            )}
                                          </p>
                                          {needsReverification && status?.reason && (
                                            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                              <span className="font-medium">Lý do:</span> {status.reason}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {group.skillGroupId && (
                                        <>
                                          {/* Nếu chưa verify -> cho phép Verify group */}
                                          {!isVerified && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleOpenVerifySkillGroup(group.skillGroupId)
                                              }
                                              disabled={!canEdit}
                                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary-600 text-white hover:bg-secondary-700 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              title={!canEdit ? "Bạn không có quyền verify. Chỉ TA đang quản lý nhân sự này mới được verify." : ""}
                                            >
                                              Verify group
                                            </button>
                                          )}

                                          {/* Nếu đã có đánh giá (status) -> luôn cho xem lịch sử */}
                                          {status && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleOpenHistorySkillGroup(group.skillGroupId)
                                              }
                                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                                            >
                                              Lịch sử
                                            </button>
                                          )}

                                          {/* Chỉ khi nhóm đang ở trạng thái đã verify mới cho phép Hủy đánh giá */}
                                          {status && isVerified && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleInvalidateSkillGroup(group.skillGroupId)
                                              }
                                              disabled={!canEdit}
                                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              title={!canEdit ? "Bạn không có quyền hủy đánh giá. Chỉ TA đang quản lý nhân sự này mới được hủy đánh giá." : ""}
                                            >
                                              Hủy đánh giá
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="divide-y divide-neutral-100">
                                    {group.skills.map((skill) => (
                                      <div
                                  key={skill.id} 
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary-50 cursor-pointer transition-colors"
                                        onClick={() =>
                                          navigate(`/ta/talent-skills/edit/${skill.id}`)
                                        }
                                      >
                                        <div
                                          className="flex items-center gap-3"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                    <input
                                      type="checkbox"
                                            className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                                      checked={selectedSkills.includes(skill.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSkills([...selectedSkills, skill.id]);
                                        } else {
                                                setSelectedSkills(
                                                  selectedSkills.filter((id) => id !== skill.id)
                                                );
                                              }
                                            }}
                                          />
                                          <div>
                                            <div className="text-sm font-medium text-neutral-900">
                                              {skill.skillName}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                              Level: {getLevelLabel(skill.level)} ·{" "}
                                              {skill.yearsExp === 0
                                                ? "0 năm"
                                                : `${skill.yearsExp} năm`}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                      </div>
                                </div>
                              );
                            })}
                            </div>
                            {totalGroups > skillGroupsPerPage && (
                              <SectionPagination
                                currentPage={pageSkills}
                                totalItems={totalGroups}
                                itemsPerPage={skillGroupsPerPage}
                                onPageChange={setPageSkills}
                              />
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium">Chưa có kỹ năng nào</p>
                      <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật kỹ năng</p>
                    </div>
                  )}

                  {/* Modal verify nhóm kỹ năng */}
                  {skillGroupVerifyModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Verify nhóm kỹ năng
                            </h3>
                            <p className="text-sm text-neutral-600 mt-1">
                              Nhóm kỹ năng:{" "}
                              <span className="font-medium text-secondary-700">
                                {skillGroupVerifyModal.skillGroupName}
                              </span>
                            </p>
              </div>
                          <button
                            onClick={handleCloseVerifySkillGroupModal}
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
                                  ✅ Verify Pass (Hợp lệ)
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
                                  value={selectedExpertId === "" ? "" : selectedExpertId}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    const idNum = v ? Number(v) : "";
                                    setSelectedExpertId(idNum);
                                    const found =
                                      typeof idNum === "number"
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
                                      {ex.specialization ? ` · ${ex.specialization}` : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                                    ⚠️ Không có chuyên gia nào được gán cho nhóm kỹ năng này. 
                                    Vui lòng liên hệ Admin để gán chuyên gia trước khi verify.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                              Ghi chú {verifyResult === false && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                              value={verifyNote}
                              onChange={(e) => setVerifyNote(e.target.value)}
                              rows={3}
                              placeholder={verifyResult === false 
                                ? "Nhập lý do tại sao không hợp lệ (bắt buộc khi verify fail)..."
                                : "Ghi chú thêm (ví dụ: phạm vi đánh giá, tiêu chí, ... )"}
                              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500/20 resize-none ${
                                verifyResult === false && !verifyNote.trim()
                                  ? "border-amber-300 focus:border-amber-500"
                                  : "border-neutral-300 focus:border-secondary-500"
                              }`}
                            />
                            {verifyResult === false && !verifyNote.trim() && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Vui lòng nhập ghi chú lý do khi verify fail.
                              </p>
                            )}
                          </div>

                          {skillGroupVerifyModal.skillGroupId && verifyResult && (
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

                              {(() => {
                                // Lấy tất cả skills trong group
                                const groupSkills = talentSkills.filter(
                                  (s: TalentSkill & {
                                    skillName: string;
                                    skillGroupId?: number;
                                  }) => s.skillGroupId === skillGroupVerifyModal.skillGroupId
                                );

                                // Nếu có nhiều skill thì mới cần pagination
                                const MAX_VISIBLE = 8;
                                const needsPagination = groupSkills.length > MAX_VISIBLE;
                                const visibleSkills = needsPagination && !showAllSkillsInVerifyModal
                                  ? groupSkills.slice(0, MAX_VISIBLE)
                                  : groupSkills;

                                return (
                                  <>
                                    <ul className="list-disc list-inside space-y-0.5 max-h-40 overflow-y-auto pr-1">
                                      {visibleSkills.map((s) => (
                                        <li key={s.id}>
                                          {s.skillName} – {getLevelLabel(s.level)} ({s.yearsExp}{" "}
                                          năm)
                                        </li>
                                      ))}
                                    </ul>
                                    {needsPagination && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowAllSkillsInVerifyModal((prev) => !prev)
                                        }
                                        className="mt-1 text-[11px] font-medium text-secondary-700 hover:text-secondary-900 underline"
                                      >
                                        {showAllSkillsInVerifyModal
                                          ? "Thu gọn danh sách kỹ năng"
                                          : `Xem đầy đủ ${groupSkills.length} kỹ năng`}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleCloseVerifySkillGroupModal}
                            disabled={isVerifyingSkillGroup}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmVerifySkillGroup}
                            disabled={isVerifyingSkillGroup || (verifyResult === false && !verifyNote.trim()) || expertsForSkillGroup.length === 0 || !selectedExpertId}
                            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm flex items-center justify-center gap-2 ${
                              isVerifyingSkillGroup || (verifyResult === false && !verifyNote.trim()) || expertsForSkillGroup.length === 0 || !selectedExpertId
                                ? "bg-neutral-300 cursor-not-allowed"
                                : verifyResult === false
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-secondary-600 hover:bg-secondary-700"
                            }`}
                          >
                            {isVerifyingSkillGroup && (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {isVerifyingSkillGroup 
                              ? "Đang xử lý..." 
                              : verifyResult === false 
                              ? "Xác nhận Fail" 
                              : "Xác nhận Verify"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal lịch sử đánh giá nhóm kỹ năng */}
                  {historyModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Lịch sử đánh giá nhóm kỹ năng
                            </h3>
                            <p className="text-sm text-neutral-600 mt-1">
                              Nhóm kỹ năng:{" "}
                              <span className="font-medium text-secondary-700">
                                {historyModal.skillGroupName}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => setHistoryModal((prev) => ({ ...prev, isOpen: false }))}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-neutral-100 rounded-lg">
                          {historyModal.loading ? (
                            <div className="flex items-center justify-center py-10 text-sm text-neutral-500">
                              Đang tải lịch sử đánh giá...
                            </div>
                          ) : historyModal.items.length === 0 ? (
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
                                {historyModal.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-neutral-800 whitespace-nowrap">
                                      {new Date(item.assessmentDate).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-neutral-800 whitespace-nowrap">
                                      {item.expertName || item.verifiedByName || "—"}
                                    </td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                          item.isVerified
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                      >
                                        {item.isVerified ? "Đã verify" : "Không hợp lệ / bị hủy"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                          item.isActive
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-neutral-50 text-neutral-500 border-neutral-200"
                                        }`}
                                      >
                                        {item.isActive ? "✓ Active" : "✗ Inactive"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-neutral-700 max-w-md">
                                      {item.note ? (
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                          {item.note.split("\n").map((line, idx) => {
                                            const isInvalidated = line.trim().startsWith("Invalidated:");
                                            return (
                                              <div
                                                key={idx}
                                                className={
                                                  isInvalidated
                                                    ? "text-red-700 font-medium bg-red-50 px-2 py-1 rounded border border-red-200 break-words"
                                                    : "text-neutral-700 break-words"
                                                }
                                              >
                                                {line.trim() || "\u00A0"}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setHistoryModal((prev) => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Tab: Lịch sẵn sàng của nhân sự */}
            {activeTab === "availableTimes" && (
              <div className="space-y-4">
                {/* Inline AvailableTime Form */}
                {showInlineForm === "availableTime" && (
                  <div className="bg-white rounded-xl border-2 border-secondary-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thêm thời gian sẵn sàng mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Thời gian bắt đầu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={inlineAvailableTimeForm.startTime || ""}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => {
                              const value = e.target.value;
                              setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, startTime: value });
                              // Validate startTime
                              const newErrors = { ...availableTimeFormErrors };
                              if (value && !validateStartTime(value)) {
                                newErrors.startTime = "⚠️ Thời gian bắt đầu phải nằm trong tương lai.";
                              } else {
                                delete newErrors.startTime;
                              }
                              // Re-validate endTime if startTime changes
                              if (inlineAvailableTimeForm.endTime && value) {
                                if (!validateEndTime(value, inlineAvailableTimeForm.endTime)) {
                                  newErrors.endTime = "⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.";
                                } else {
                                  delete newErrors.endTime;
                                }
                              }
                              setAvailableTimeFormErrors(newErrors);
                            }}
                            className={`w-full px-4 py-2 border rounded-lg bg-white ${
                              availableTimeFormErrors.startTime
                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                : "border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500"
                            }`}
                          />
                          {availableTimeFormErrors.startTime && (
                            <p className="text-xs text-red-600 mt-1">{availableTimeFormErrors.startTime}</p>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            Chọn ngày và giờ bắt đầu có sẵn (phải lớn hơn thời điểm hiện tại)
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Thời gian kết thúc (tùy chọn)</label>
                          <input
                            type="datetime-local"
                            value={inlineAvailableTimeForm.endTime || ""}
                            min={inlineAvailableTimeForm.startTime ? (() => {
                              const startDate = new Date(inlineAvailableTimeForm.startTime);
                              startDate.setMinutes(startDate.getMinutes() + 1);
                              return startDate.toISOString().slice(0, 16);
                            })() : undefined}
                            onChange={(e) => {
                              const value = e.target.value || undefined;
                              setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, endTime: value });
                              // Validate endTime
                              const newErrors = { ...availableTimeFormErrors };
                              if (value && inlineAvailableTimeForm.startTime) {
                                if (!validateEndTime(inlineAvailableTimeForm.startTime, value)) {
                                  newErrors.endTime = "⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.";
                                } else {
                                  delete newErrors.endTime;
                                }
                              } else if (value && !inlineAvailableTimeForm.startTime) {
                                newErrors.endTime = "⚠️ Vui lòng chọn thời gian bắt đầu trước.";
                              } else {
                                delete newErrors.endTime;
                              }
                              setAvailableTimeFormErrors(newErrors);
                            }}
                            className={`w-full px-4 py-2 border rounded-lg bg-white ${
                              availableTimeFormErrors.endTime
                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                : "border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500"
                            }`}
                          />
                          {availableTimeFormErrors.endTime && (
                            <p className="text-xs text-red-600 mt-1">{availableTimeFormErrors.endTime}</p>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            Để trống nếu không có thời gian kết thúc cụ thể
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Ghi chú</label>
                        <textarea
                          value={inlineAvailableTimeForm.notes || ""}
                          onChange={(e) => setInlineAvailableTimeForm({ ...inlineAvailableTimeForm, notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-secondary-500/20 focus:border-secondary-500 resize-none"
                          placeholder="Nhập ghi chú"
                        />
                      </div>
                      {availableTimeFormErrors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">{availableTimeFormErrors.submit}</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineAvailableTime}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Lịch sẵn sàng của nhân sự</h3>
                    <div className="flex gap-2">
                      {showInlineForm !== "availableTime" && (
                        <Button
                          onClick={() => handleOpenInlineForm("availableTime")}
                          disabled={isSubmitting || !canEdit}
                          className={`group flex items-center justify-center bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm thời gian"}
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </Button>
                      )}
                      {selectedAvailableTimes.length > 0 && (
                        <Button
                          onClick={handleDeleteAvailableTimes}
                          disabled={!canEdit}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Xóa thời gian ({selectedAvailableTimes.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  {availableTimes.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedAvailableTimes.length === availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).length && availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const currentPageItems = availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).map(time => time.id);
                                      setSelectedAvailableTimes([...new Set([...selectedAvailableTimes, ...currentPageItems])]);
                                    } else {
                                      const currentPageItems = availableTimes.slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage).map(time => time.id);
                                      setSelectedAvailableTimes(selectedAvailableTimes.filter(id => !currentPageItems.includes(id)));
                                    }
                                  }}
                                  className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Từ ngày</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Đến ngày</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {availableTimes
                              .slice((pageAvailableTimes - 1) * itemsPerPage, pageAvailableTimes * itemsPerPage)
                              .map((time) => (
                                <tr 
                                  key={time.id} 
                                  className="hover:bg-secondary-50 transition-colors duration-200 cursor-pointer"
                                  onClick={() => navigate(`/ta/talent-available-times/edit/${time.id}`)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAvailableTimes.includes(time.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedAvailableTimes([...selectedAvailableTimes, time.id]);
                                        } else {
                                          setSelectedAvailableTimes(selectedAvailableTimes.filter(id => id !== time.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-secondary-600 bg-gray-100 border-gray-300 rounded focus:ring-secondary-500 focus:ring-2"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-secondary-700">{new Date(time.startTime).toLocaleDateString('vi-VN')}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-secondary-600">{time.endTime ? new Date(time.endTime).toLocaleDateString('vi-VN') : 'Không giới hạn'}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-700">{time.notes || '—'}</div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageAvailableTimes}
                        totalItems={availableTimes.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageAvailableTimes}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium">Chưa có thông tin thời gian</p>
                      <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật thời gian có sẵn</p>
                    </div>
                  )}
              </div>
            )}

            {/* Tab: Chứng chỉ */}
            {activeTab === "certificates" && (
              <div className="space-y-4">
                {/* Inline Certificate Form */}
                {showInlineForm === "certificate" && (
                  <div className="bg-white rounded-xl border-2 border-primary-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thêm chứng chỉ mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Loại chứng chỉ <span className="text-red-500">*</span>
                        </label>
                        {certificateFormErrors.certificateTypeId && (
                          <p className="text-xs text-red-600 mb-1">{certificateFormErrors.certificateTypeId}</p>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCertificateTypeDropdownOpen(!isCertificateTypeDropdownOpen);
                              const newErrors = { ...certificateFormErrors };
                              delete newErrors.certificateTypeId;
                              setCertificateFormErrors(newErrors);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 transition-all ${
                              certificateFormErrors.certificateTypeId
                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                : "border-neutral-300 focus:ring-primary-500/20 focus:border-primary-500"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-sm text-neutral-700">
                              <Award className="w-4 h-4 text-neutral-400" />
                              <span>
                                {inlineCertificateForm.certificateTypeId && inlineCertificateForm.certificateTypeId > 0
                                  ? lookupCertificateTypes.find(t => t.id === inlineCertificateForm.certificateTypeId)?.name || "Chọn loại chứng chỉ"
                                  : "Chọn loại chứng chỉ"}
                              </span>
                            </div>
                          </button>
                          {isCertificateTypeDropdownOpen && (
                            <div 
                              className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                              onMouseLeave={() => {
                                setIsCertificateTypeDropdownOpen(false);
                                setCertificateTypeSearch("");
                              }}
                            >
                              <div className="p-3 border-b border-neutral-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                  <input
                                    type="text"
                                    value={certificateTypeSearch}
                                    onChange={(e) => setCertificateTypeSearch(e.target.value)}
                                    placeholder="Tìm loại chứng chỉ..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {(() => {
                                  const filtered = certificateTypeSearch
                                    ? lookupCertificateTypes.filter(t => t.name.toLowerCase().includes(certificateTypeSearch.toLowerCase()))
                                    : lookupCertificateTypes;
                                  if (filtered.length === 0) {
                                    return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại chứng chỉ nào</p>;
                                  }
                                  return filtered.map((type) => (
                                    <button
                                      type="button"
                                      key={type.id}
                                      onClick={() => {
                                        setInlineCertificateForm({ ...inlineCertificateForm, certificateTypeId: type.id });
                                        setIsCertificateTypeDropdownOpen(false);
                                        setCertificateTypeSearch("");
                                        const newErrors = { ...certificateFormErrors };
                                        delete newErrors.certificateTypeId;
                                        setCertificateFormErrors(newErrors);
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        inlineCertificateForm.certificateTypeId === type.id
                                          ? "bg-primary-50 text-primary-700"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                      }`}
                                    >
                                      {type.name}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Tên chứng chỉ <span className="text-red-500">*</span>
                        </label>
                        {certificateFormErrors.certificateName && (
                          <p className="text-xs text-red-600 mb-1">{certificateFormErrors.certificateName}</p>
                        )}
                        <input
                          type="text"
                          value={inlineCertificateForm.certificateName || ""}
                          onChange={(e) => {
                            setInlineCertificateForm({ ...inlineCertificateForm, certificateName: e.target.value });
                            const newErrors = { ...certificateFormErrors };
                            delete newErrors.certificateName;
                            setCertificateFormErrors(newErrors);
                          }}
                          maxLength={255}
                          className={`w-full px-4 py-2 border rounded-lg bg-white ${
                            certificateFormErrors.certificateName
                              ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                              : "border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                          }`}
                          placeholder="Nhập tên chứng chỉ"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày cấp</label>
                          <input
                            type="date"
                            value={inlineCertificateForm.issuedDate || ""}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              const value = e.target.value || undefined;
                              setInlineCertificateForm({ ...inlineCertificateForm, issuedDate: value });
                              // Validate issued date
                              const newErrors = { ...certificateFormErrors };
                              if (value && !validateIssuedDate(value)) {
                                newErrors.issuedDate = "⚠️ Ngày cấp không được là ngày trong tương lai.";
                              } else {
                                delete newErrors.issuedDate;
                              }
                              setCertificateFormErrors(newErrors);
                            }}
                            className={`w-full px-4 py-2 border rounded-lg bg-white ${
                              certificateFormErrors.issuedDate
                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                : "border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            }`}
                          />
                          {certificateFormErrors.issuedDate && (
                            <p className="text-xs text-red-600 mt-1">{certificateFormErrors.issuedDate}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">URL hình ảnh</label>
                          <input
                            type="url"
                            value={inlineCertificateForm.imageUrl || ""}
                            onChange={(e) => {
                              // Only allow manual URL input if not uploaded from Firebase
                              if (!uploadedCertificateUrl || uploadedCertificateUrl !== inlineCertificateForm.imageUrl) {
                                setInlineCertificateForm({ ...inlineCertificateForm, imageUrl: e.target.value });
                              }
                            }}
                            disabled={!!(inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl)}
                            className={`w-full px-4 py-2 border rounded-lg bg-white ${
                              inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl
                                ? "bg-gray-100 cursor-not-allowed opacity-75 border-gray-300"
                                : "border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            }`}
                            placeholder="https://... hoặc upload từ file ảnh đã chọn"
                          />
                          {inlineCertificateForm.imageUrl && uploadedCertificateUrl === inlineCertificateForm.imageUrl && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              URL này được upload từ Firebase. Để thay đổi, hãy xóa và upload ảnh mới.
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Upload ảnh chứng chỉ */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                          Upload ảnh chứng chỉ
                        </label>
                        <div className="space-y-2">
                          {/* File Input */}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCertificateImageFileChange}
                              disabled={uploadingCertificateImage}
                              className="w-full text-xs py-1.5 px-2 border rounded-lg bg-white border-neutral-300 focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {certificateImageFile && (
                              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-1">
                                <FileText className="w-3 h-3" />
                                <span>Đã chọn: <span className="font-medium">{certificateImageFile.name}</span> ({(certificateImageFile.size / 1024).toFixed(2)} KB)</span>
                              </div>
                            )}
                          </div>

                          {/* Upload Progress */}
                          {uploadingCertificateImage && (
                            <div className="space-y-1">
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                                  style={{ width: `${certificateUploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-center text-primary-700 font-medium">
                                Đang upload... {certificateUploadProgress}%
                              </p>
                            </div>
                          )}

                          {/* Upload Button */}
                          <button
                            type="button"
                            onClick={handleUploadCertificateImage}
                            disabled={!certificateImageFile || uploadingCertificateImage}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {uploadingCertificateImage ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                Upload ảnh lên Firebase
                              </>
                            )}
                          </button>
                        </div>
                        {inlineCertificateForm.imageUrl && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={handleDeleteCertificateImage}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs"
                              title={uploadedCertificateUrl === inlineCertificateForm.imageUrl ? "Xóa URL và file trong Firebase" : "Xóa URL"}
                            >
                              <X className="w-3.5 h-3.5" />
                              Xóa ảnh
                            </button>
                            <a
                              href={inlineCertificateForm.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem ảnh
                            </a>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
                        <textarea
                          value={inlineCertificateForm.certificateDescription || ""}
                          onChange={(e) => setInlineCertificateForm({ ...inlineCertificateForm, certificateDescription: e.target.value })}
                          rows={3}
                          maxLength={1000}
                          className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                          placeholder="Nhập mô tả về chứng chỉ..."
                        />
                      </div>
                      {/* Error messages */}
                      {(certificateFormErrors.certificateTypeId || certificateFormErrors.certificateName || certificateFormErrors.issuedDate) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                          {certificateFormErrors.certificateTypeId && (
                            <p className="text-sm text-red-700">{certificateFormErrors.certificateTypeId}</p>
                          )}
                          {certificateFormErrors.certificateName && (
                            <p className="text-sm text-red-700">{certificateFormErrors.certificateName}</p>
                          )}
                          {certificateFormErrors.issuedDate && (
                            <p className="text-sm text-red-700">{certificateFormErrors.issuedDate}</p>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineCertificate}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chứng chỉ</h3>
                    <div className="flex gap-2">
                      {showInlineForm !== "certificate" && (
                        <Button
                          onClick={() => handleOpenInlineForm("certificate")}
                          disabled={isSubmitting || !canEdit}
                          className={`group flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm chứng chỉ"}
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </Button>
                      )}
                      {selectedCertificates.length > 0 && (
                        <Button
                          onClick={handleDeleteCertificates}
                          disabled={!canEdit}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Xóa chứng chỉ ({selectedCertificates.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  {(certificatesRecognized.length > 0 || certificatesMatched.length > 0 || certificatesOnlyInTalent.length > 0 || certificatesUnmatched.length > 0) && (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-rose-900 uppercase tracking-wide">Đề xuất chứng chỉ</h3>
                        <span className="text-xs text-rose-700">
                          {certificatesRecognized.length} đề xuất thêm · {certificatesMatched.length} trùng CV · {certificatesUnmatched.length} cần tạo mới
                        </span>
                      </div>
                      {(certificatesRecognized.length > 0 || certificatesUnmatched.length > 0) && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-3">
                          {certificatesRecognized.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-semibold text-amber-900">Thiếu trong hồ sơ (đã có trong hệ thống):</p>
                              <ul className="space-y-2">
                                {certificatesRecognized.map(({ suggestion }, index) => (
                                  <li key={`certificate-recognized-${index}`} className="flex flex-col rounded-lg border border-amber-200 bg-white px-3 py-2 text-amber-900 shadow-sm">
                                    <span className="font-semibold text-sm">{suggestion.certificateName}</span>
                                    <p className="text-xs text-amber-600 mt-1">Gợi ý CV: Ngày cấp {suggestion.issuedDate ?? "Chưa rõ"}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {certificatesUnmatched.length > 0 && (
                            <div className="rounded-xl border border-dashed border-amber-300 bg-white p-3 text-xs text-amber-700">
                              <p className="font-semibold text-amber-900">Thiếu trong hồ sơ (chưa có trong hệ thống):</p>
                              <ul className="mt-2 space-y-1">
                                {certificatesUnmatched.map((suggestion, index) => (
                                  <li key={`certificate-unmatched-${index}`}>- {suggestion.certificateName}</li>
                                ))}
                              </ul>
                              {/* Bỏ nút đề xuất - chỉ có ở phần Skills */}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {certificates.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedCertificates.length === certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage).length && certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage).length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const currentPageItems = certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage).map(cert => cert.id);
                                      setSelectedCertificates([...new Set([...selectedCertificates, ...currentPageItems])]);
                                    } else {
                                      const currentPageItems = certificates.slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage).map(cert => cert.id);
                                      setSelectedCertificates(selectedCertificates.filter(id => !currentPageItems.includes(id)));
                                    }
                                  }}
                                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Loại chứng chỉ</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tên chứng chỉ</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Ngày cấp</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Trạng thái</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {certificates
                              .slice((pageCertificates - 1) * itemsPerPage, pageCertificates * itemsPerPage)
                              .map((cert) => (
                                <tr 
                                  key={cert.id} 
                                  className="hover:bg-primary-50 transition-colors duration-200 cursor-pointer"
                                  onClick={() => navigate(`/ta/talent-certificates/edit/${cert.id}`)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={selectedCertificates.includes(cert.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedCertificates([...selectedCertificates, cert.id]);
                                        } else {
                                          setSelectedCertificates(selectedCertificates.filter(id => id !== cert.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-primary-800">{cert.certificateTypeName}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-primary-800">{cert.certificateName || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-primary-700">{cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${cert.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {cert.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    {cert.imageUrl && (
                                      <a
                                        href={cert.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Xem
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageCertificates}
                        totalItems={certificates.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageCertificates}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium">Chưa có chứng chỉ nào</p>
                      <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa upload chứng chỉ</p>
                    </div>
                  )}
              </div>
            )}

            {/* Tab: Kinh nghiệm làm việc */}
            {activeTab === "experiences" && (
              <div className="space-y-4">
                {/* Inline Experience Form */}
                {showInlineForm === "experience" && (
                  <div className="bg-white rounded-xl border-2 border-accent-200 p-6 mb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Thêm kinh nghiệm mới</h3>
                      <button
                        onClick={handleCloseInlineForm}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Công ty <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={inlineExperienceForm.company || ""}
                            onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, company: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                            placeholder="Nhập tên công ty"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Vị trí <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsWorkExperiencePositionDropdownOpen(!isWorkExperiencePositionDropdownOpen)}
                              className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-accent-500/20 transition-all border-neutral-300 focus:border-accent-500"
                            >
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Target className="w-4 h-4 text-neutral-400" />
                                <span className={inlineExperienceForm.position ? "text-neutral-800" : "text-neutral-500"}>
                                  {inlineExperienceForm.position || "Chọn vị trí"}
                                </span>
                              </div>
                            </button>
                            {isWorkExperiencePositionDropdownOpen && (
                              <div 
                                className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                onMouseLeave={() => {
                                  setIsWorkExperiencePositionDropdownOpen(false);
                                  setWorkExperiencePositionSearch("");
                                }}
                              >
                                <div className="p-3 border-b border-neutral-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                    <input
                                      type="text"
                                      value={workExperiencePositionSearch}
                                      onChange={(e) => setWorkExperiencePositionSearch(e.target.value)}
                                      placeholder="Tìm vị trí..."
                                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-accent-500 focus:ring-accent-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {(() => {
                                    const filtered = workExperiencePositionSearch
                                      ? workExperiencePositions.filter(p => p.toLowerCase().includes(workExperiencePositionSearch.toLowerCase()))
                                      : workExperiencePositions;
                                    if (filtered.length === 0) {
                                      return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                                    }
                                    return filtered.map((position) => (
                                      <button
                                        type="button"
                                        key={position}
                                        onClick={() => {
                                          setInlineExperienceForm({ ...inlineExperienceForm, position: position });
                                          setIsWorkExperiencePositionDropdownOpen(false);
                                          setWorkExperiencePositionSearch("");
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${
                                          inlineExperienceForm.position === position
                                            ? "bg-accent-50 text-accent-700"
                                            : "hover:bg-neutral-50 text-neutral-700"
                                        }`}
                                      >
                                        {position}
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Ngày bắt đầu <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={inlineExperienceForm.startDate || ""}
                            onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, startDate: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày kết thúc</label>
                          <input
                            type="date"
                            value={inlineExperienceForm.endDate || ""}
                            onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, endDate: e.target.value || undefined })}
                            className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">Mô tả</label>
                        <textarea
                          value={inlineExperienceForm.description || ""}
                          onChange={(e) => setInlineExperienceForm({ ...inlineExperienceForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-none"
                          placeholder="Nhập mô tả kinh nghiệm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleCloseInlineForm}
                          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSubmitInlineExperience}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Lưu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Kinh nghiệm làm việc</h3>
                    <div className="flex gap-2">
                      {showInlineForm !== "experience" && (
                        <Button
                          onClick={() => handleOpenInlineForm("experience")}
                          disabled={isSubmitting || !canEdit}
                          className={`group flex items-center justify-center bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 ${(isSubmitting || !canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền chỉnh sửa. Chỉ TA đang quản lý nhân sự này mới được chỉnh sửa." : isSubmitting ? "Đang xử lý..." : "Thêm kinh nghiệm"}
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </Button>
                      )}
                      {selectedExperiences.length > 0 && (
                        <Button
                          onClick={handleDeleteExperiences}
                          disabled={!canEdit}
                          className={`group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={!canEdit ? "Bạn không có quyền xóa. Chỉ TA đang quản lý nhân sự này mới được xóa." : ""}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Xóa kinh nghiệm ({selectedExperiences.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  {analysisResult && (analysisResult.workExperiences.newEntries.length > 0 || analysisResult.workExperiences.potentialDuplicates.length > 0) && (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Đề xuất kinh nghiệm làm việc</h3>
                        <span className="text-xs text-blue-700">{analysisResult.workExperiences.newEntries.length} mục mới · {analysisResult.workExperiences.potentialDuplicates.length} mục có thể trùng</span>
                      </div>
                      {analysisResult.workExperiences.newEntries.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-blue-700 font-medium">Kinh nghiệm mới nên thêm:</p>
                          {analysisResult.workExperiences.newEntries.map((exp, index) => (
                            <div
                              key={`suggested-exp-${index}`}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm"
                            >
                              <p className="font-semibold">{exp.position}</p>
                              <p className="text-xs text-blue-700">{exp.company}</p>
                              <p className="text-xs text-blue-600">
                                {exp.startDate ?? "—"} - {exp.endDate ?? "Hiện tại"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {analysisResult.workExperiences.potentialDuplicates.length > 0 && (
                        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                          <p className="font-medium mb-1">Mục cần rà soát trùng lặp:</p>
                          <ul className="space-y-1">
                            {analysisResult.workExperiences.potentialDuplicates.map((dup, index) => (
                              <li key={`dup-exp-${index}`}>
                                - {dup.fromCV.position} tại {dup.fromCV.company} · Khuyến nghị: <span className="font-semibold">{dup.recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {workExperiences.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedExperiences.length === workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).length && workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const currentPageItems = workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).map(exp => exp.id);
                                      setSelectedExperiences([...new Set([...selectedExperiences, ...currentPageItems])]);
                                    } else {
                                      const currentPageItems = workExperiences.slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage).map(exp => exp.id);
                                      setSelectedExperiences(selectedExperiences.filter(id => !currentPageItems.includes(id)));
                                    }
                                  }}
                                  className="w-4 h-4 text-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Vị trí</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Công ty</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-neutral-200">
                            {workExperiences
                              .slice((pageExperiences - 1) * itemsPerPage, pageExperiences * itemsPerPage)
                              .map((exp) => (
                                <tr 
                                  key={exp.id} 
                                  className="hover:bg-accent-50 transition-colors duration-200 cursor-pointer"
                                  onClick={() => navigate(`/ta/talent-work-experiences/edit/${exp.id}`)}
                                >
                                  <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={selectedExperiences.includes(exp.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) {
                                          setSelectedExperiences([...selectedExperiences, exp.id]);
                                        } else {
                                          setSelectedExperiences(selectedExperiences.filter(id => id !== exp.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-accent-600 bg-gray-100 border-gray-300 rounded focus:ring-accent-500 focus:ring-2"
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-accent-800">{exp.position}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-accent-700">{exp.company}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-accent-600">{new Date(exp.startDate).toLocaleDateString('vi-VN')} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString('vi-VN') : 'Hiện tại'}</div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageExperiences}
                        totalItems={workExperiences.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageExperiences}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Workflow className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 text-lg font-medium">Chưa có kinh nghiệm làm việc</p>
                      <p className="text-neutral-400 text-sm mt-1">Nhân sự chưa cập nhật kinh nghiệm</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


function InfoItem({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <div className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300 break-words max-w-full overflow-hidden">
        {value || "—"}
      </div>
    </div>
  );
}

// Pagination component for sections
function SectionPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = endIndex;

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
      <p className="text-sm text-neutral-600">
        {startItem}-{endItem} của {totalItems} mục
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-primary-600"
            }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-primary-600"
            }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
