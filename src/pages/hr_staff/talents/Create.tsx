import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, Link as LinkIcon, Github, Upload, FileText, Calendar, Globe, Plus, X, Award, MapPin, Eye, Target, Star, Building2, Workflow, Search, Filter, Layers, Briefcase, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/hr_staff/SidebarItems";
import {
  type TalentWithRelatedDataCreateModel,
  type TalentSkillCreateModel,
  type TalentWorkExperienceCreateModel,
  type TalentProjectCreateModel,
  type TalentCertificateCreateModel,
  type TalentJobRoleLevelCreateModel,
  type TalentCVCreateModel,
  talentService
} from "../../../services/Talent";
import { type Partner, partnerService } from "../../../services/Partner";
import { talentCVService, type TalentCVExtractResponse } from "../../../services/TalentCV";
import { type Skill, skillService } from "../../../services/Skill";
import { skillGroupService, type SkillGroup } from "../../../services/SkillGroup";
import { type JobRole, jobRoleService } from "../../../services/JobRole";
import { type CertificateType, certificateTypeService } from "../../../services/CertificateType";
import { type JobRoleLevel, jobRoleLevelService, TalentLevel } from "../../../services/JobRoleLevel";
import { type Location, locationService } from "../../../services/location";
import { WorkingMode } from "../../../types/WorkingMode";
import { uploadFile } from "../../../utils/firebaseStorage";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../../../configs/firebase";
import { notificationService, NotificationPriority, NotificationType } from "../../../services/Notification";
import { userService } from "../../../services/User";
import { decodeJWT } from "../../../services/Auth";

export default function CreateTalent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extractingCV, setExtractingCV] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState<string>("");
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState<Record<number, string>>({});
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState<Record<number, boolean>>({});
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState<string>("");
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [certificateTypeSearch, setCertificateTypeSearch] = useState<Record<number, string>>({});
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState<Record<number, boolean>>({});
  const [jobRoleLevels, setJobRoleLevels] = useState<JobRoleLevel[]>([]);
  const [jobRoleLevelsForCV, setJobRoleLevelsForCV] = useState<JobRoleLevel[]>([]); // Cho CV ban đầu (distinctByName: true)
  const [jobRoleLevelSearch, setJobRoleLevelSearch] = useState<Record<number, string>>({});
  const [isJobRoleLevelDropdownOpen, setIsJobRoleLevelDropdownOpen] = useState<Record<number, boolean>>({});
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<Record<number, number | undefined>>({});
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<Record<number, string>>({});
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState<Record<number, boolean>>({});
  // State cho dropdown tách riêng: Vị trí (name) và Cấp độ (level)
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<Record<number, string>>({}); // Lưu name đã chọn cho mỗi index
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState<Record<number, boolean>>({});
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<Record<number, string>>({});
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState<Record<number, boolean>>({});
  const [workExperiencePositionSearch, setWorkExperiencePositionSearch] = useState<Record<number, string>>({});
  const [isWorkExperiencePositionDropdownOpen, setIsWorkExperiencePositionDropdownOpen] = useState<Record<number, boolean>>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadedFromFirebase, setIsUploadedFromFirebase] = useState(false);
  const [uploadedCVUrl, setUploadedCVUrl] = useState<string | null>(null); // Track CV URL uploaded from Firebase
  // Certificate image upload states
  const [certificateImageFiles, setCertificateImageFiles] = useState<Record<number, File>>({});
  const [uploadingCertificateIndex, setUploadingCertificateIndex] = useState<number | null>(null);
  const [certificateUploadProgress, setCertificateUploadProgress] = useState<Record<number, number>>({});
  const [uploadedCertificateUrls, setUploadedCertificateUrls] = useState<Record<number, string>>({}); // Track URLs uploaded from Firebase

  const [formData, setFormData] = useState<Partial<TalentWithRelatedDataCreateModel>>({
    currentPartnerId: 1,
    userId: null,
    fullName: "",
    email: "",
    phone: undefined,
    dateOfBirth: undefined,
    locationId: undefined,
    workingMode: WorkingMode.None,
    githubUrl: undefined,
    portfolioUrl: undefined,
    status: "Available",
  });

  // Related data states
  const [talentSkills, setTalentSkills] = useState<TalentSkillCreateModel[]>([]);
  const [talentWorkExperiences, setTalentWorkExperiences] = useState<TalentWorkExperienceCreateModel[]>([]);
  const [talentProjects, setTalentProjects] = useState<TalentProjectCreateModel[]>([]);
  const [talentCertificates, setTalentCertificates] = useState<TalentCertificateCreateModel[]>([]);
  // State for job role levels (bắt buộc, tự động tạo 1 item mặc định)
  const [talentJobRoleLevels, setTalentJobRoleLevels] = useState<TalentJobRoleLevelCreateModel[]>([{
    jobRoleLevelId: 0,
    yearsOfExp: 0,
    ratePerMonth: undefined
  }]); // Tự động tạo 1 job role level mặc định vì bắt buộc
  // State for initial CV (bắt buộc, chỉ 1 CV)
  const [initialCVs, setInitialCVs] = useState<Partial<TalentCVCreateModel>[]>([{
    jobRoleLevelId: undefined,
    version: 1,
    cvFileUrl: "",
    isActive: true, // Mặc định active là "có"
    summary: "",
    isGeneratedFromTemplate: false,
    sourceTemplateId: undefined,
    generatedForJobRequestId: undefined
  }]); // Tự động tạo CV mặc định vì bắt buộc
  const [uploadingCVIndex, setUploadingCVIndex] = useState<number | null>(null);
  const [showCVSummary, setShowCVSummary] = useState<Record<number, boolean>>({}); // State để quản lý đóng/mở phần Mô tả/Tóm tắt cho mỗi CV
  
  // State cho modal trích xuất CV
  const [showExtractCVModal, setShowExtractCVModal] = useState(false);
  const [useExtractCV, setUseExtractCV] = useState(false); // Checkbox "Trích xuất thông tin từ CV"
  const [createCVFromExtract, setCreateCVFromExtract] = useState(true); // Checkbox "Tạo CV luôn" trong modal (mặc định checked)
  const [modalCVFile, setModalCVFile] = useState<File | null>(null); // CV file trong modal
  const [modalCVPreviewUrl, setModalCVPreviewUrl] = useState<string | null>(null); // Preview URL trong modal
  
  // State cho tab navigation
  const [activeTab, setActiveTab] = useState<string>("required");
  // State cho tab navigation trong sidebar
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("overview");
  // State cho popup xem CV
  const [showCVViewerModal, setShowCVViewerModal] = useState(false);

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

  // Interface for extracted CV data
  interface ExtractedCVData {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null; // YYYY-MM-DD or null
    locationName?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    workingMode?: string | null; // Remote/Onsite/Hybrid
    skills?: Array<{
      skillName: string;
      level?: string | null; // Beginner/Intermediate/Advanced/Expert
      yearsExp?: number | null;
    }>;
    workExperiences?: Array<{
      company?: string | null;
      position?: string | null;
      startDate?: string; // YYYY-MM or string
      endDate?: string | null; // YYYY-MM or string or 'Present'
      description?: string | null;
    }>;
    projects?: Array<{
      projectName?: string | null;
      position?: string | null;
      description?: string | null;
      technologies?: string | null;
    }>;
    certificates?: Array<{
      certificateName: string;
      certificateDescription?: string | null;
      issuedDate?: string | null; // YYYY-MM or string or null
      imageUrl?: string | null;
    }>;
    jobRoleLevels?: Array<{
      position: string; // e.g., Frontend Developer, Backend Developer
      level?: string | null; // Junior/Middle/Senior/Lead
      yearsOfExp?: number | null;
      ratePerMonth?: number | null; // in VND
    }>;
    [key: string]: unknown;
  }

  const [extractedData, setExtractedData] = useState<ExtractedCVData | null>(null);

  // State for unmatched data (data in CV but not in system)
  const [unmatchedData, setUnmatchedData] = useState<{
    location?: string;
    skills?: string[];
    certificateTypes?: string[];
    jobRoles?: string[];
  }>({});
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);
  const [pendingSuggestionNotifications, setPendingSuggestionNotifications] = useState<
    Record<
      string,
      {
        ids: number[];
        readMap: Record<number, boolean>;
        category: "location" | "jobRole" | "skill" | "certificateType";
      }
    >
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          partnersData,
          locationsData,
          skillsData,
          jobRolesData,
          certificateTypesData,
          jobRoleLevelsData,
          jobRoleLevelsForCVData
        ] = await Promise.all([
          partnerService.getAll(),
          locationService.getAll({ excludeDeleted: true }),
          skillService.getAll({ excludeDeleted: true }),
          jobRoleService.getAll({ excludeDeleted: true }),
          certificateTypeService.getAll({ excludeDeleted: true }),
          jobRoleLevelService.getAll({ excludeDeleted: true }), // Cho vị trí của talent
          jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true }) // Cho CV ban đầu
        ]);
        // Xử lý dữ liệu - đảm bảo là array
        const partnersArray = Array.isArray(partnersData) ? partnersData : (Array.isArray((partnersData as any)?.items) ? (partnersData as any).items : (Array.isArray((partnersData as any)?.data) ? (partnersData as any).data : []));
        const locationsArray = Array.isArray(locationsData) ? locationsData : (Array.isArray((locationsData as any)?.items) ? (locationsData as any).items : (Array.isArray((locationsData as any)?.data) ? (locationsData as any).data : []));
        const skillsArray = Array.isArray(skillsData) ? skillsData : (Array.isArray((skillsData as any)?.items) ? (skillsData as any).items : (Array.isArray((skillsData as any)?.data) ? (skillsData as any).data : []));
        const jobRolesArray = Array.isArray(jobRolesData) ? jobRolesData : (Array.isArray((jobRolesData as any)?.items) ? (jobRolesData as any).items : (Array.isArray((jobRolesData as any)?.data) ? (jobRolesData as any).data : []));
        const certificateTypesArray = Array.isArray(certificateTypesData) ? certificateTypesData : (Array.isArray((certificateTypesData as any)?.items) ? (certificateTypesData as any).items : (Array.isArray((certificateTypesData as any)?.data) ? (certificateTypesData as any).data : []));
        const jobRoleLevelsArray = Array.isArray(jobRoleLevelsData) ? jobRoleLevelsData : (Array.isArray((jobRoleLevelsData as any)?.items) ? (jobRoleLevelsData as any).items : (Array.isArray((jobRoleLevelsData as any)?.data) ? (jobRoleLevelsData as any).data : []));
        const jobRoleLevelsForCVArray = Array.isArray(jobRoleLevelsForCVData) ? jobRoleLevelsForCVData : (Array.isArray((jobRoleLevelsForCVData as any)?.items) ? (jobRoleLevelsForCVData as any).items : (Array.isArray((jobRoleLevelsForCVData as any)?.data) ? (jobRoleLevelsForCVData as any).data : []));

        setPartners(partnersArray);
        setLocations(locationsArray);
        setSkills(skillsArray);
        setJobRoles(jobRolesArray);
        setCertificateTypes(certificateTypesArray);
        setJobRoleLevels(jobRoleLevelsArray);
        setJobRoleLevelsForCV(jobRoleLevelsForCVArray);

        // Load skill groups riêng để xử lý lỗi tốt hơn
        try {
          const skillGroupsData = await skillGroupService.getAll({ excludeDeleted: true });
          const skillGroupsArray = Array.isArray(skillGroupsData)
            ? skillGroupsData
            : (Array.isArray((skillGroupsData as any)?.items)
              ? (skillGroupsData as any).items
              : (Array.isArray((skillGroupsData as any)?.data)
                ? (skillGroupsData as any).data
                : []));
          setSkillGroups(skillGroupsArray);
        } catch (skillGroupsError) {
          console.error("❌ Lỗi khi tải nhóm kỹ năng:", skillGroupsError);
          setSkillGroups([]); // Set empty array nếu có lỗi
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await userService.getAll({
          role: "Admin",
          excludeDeleted: true,
          pageNumber: 1,
          pageSize: 100,
        });
        const items = Array.isArray((response as any)?.items)
          ? (response as any).items
          : Array.isArray((response as any)?.data)
            ? (response as any).data
            : Array.isArray(response)
              ? response
              : [];
        const admins = items.filter((user: any) =>
          Array.isArray(user.roles)
            ? user.roles.some((role: string) => role?.toLowerCase().includes("admin"))
            : false
        );
        setAdminUserIds(admins.map((user: any) => user.id).filter(Boolean));
      } catch (error) {
        console.error("Không thể tải danh sách Admin để gửi thông báo:", error);
      }
    };

    fetchAdminUsers();
  }, []);

  const isSuggestionPending = useCallback(
    (key: string) => {
      if (!key) return false;
      const entry = pendingSuggestionNotifications[key];
      if (!entry) return false;
      return entry.ids.some((notificationId) => !entry.readMap[notificationId]);
    },
    [pendingSuggestionNotifications]
  );

  // Cleanup URL object when component unmounts or cvPreviewUrl changes
  useEffect(() => {
    return () => {
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
      }
    };
  }, [cvPreviewUrl, modalCVPreviewUrl]);

  // Cảnh báo khi reload trang sau khi đã upload CV lên Firebase
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadedFromFirebase) {
        e.preventDefault();
        e.returnValue = "Bạn đã upload CV lên Firebase. Bạn có chắc chắn muốn rời khỏi trang không?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploadedFromFirebase]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");

  const handleSendSuggestion = async (
    category: "location" | "jobRole" | "skill" | "certificateType",
    actionUrl?: string
  ) => {
    if (suggestionLoading) return;
    if (isSuggestionPending(category)) {
      alert("Đã gửi đề xuất này và đang chờ Admin xử lý. Vui lòng đợi Admin đọc thông báo trước khi gửi lại.");
      return;
    }

    const suggestionConfigs: Record<
      typeof category,
      { label: string; title: string; defaultActionUrl: string }
    > = {
      location: {
        label: "khu vực làm việc",
        title: "[Đề xuất] Thêm khu vực làm việc mới",
        defaultActionUrl: "/admin/categories/locations/create",
      },
      jobRole: {
        label: "vị trí công việc",
        title: "[Đề xuất] Thêm vị trí công việc mới",
        defaultActionUrl: "/admin/categories/job-roles/create",
      },
      skill: {
        label: "kỹ năng",
        title: "[Đề xuất] Thêm kỹ năng mới",
        defaultActionUrl: "/admin/categories/skills/create",
      },
      certificateType: {
        label: "tên chứng chỉ có loại chứng chỉ không có trong hệ thống",
        title: "[Đề xuất] Tên chứng chỉ có loại chứng chỉ không có trong hệ thống",
        defaultActionUrl: "/admin/categories/certificate-types/create",
      },
    };

    const config = suggestionConfigs[category];
    if (!config) return;

    let items: string[] = [];
    if (category === "location") {
      if (unmatchedData.location) {
        items = [unmatchedData.location];
      }
    } else if (category === "jobRole") {
      items = unmatchedData.jobRoles ?? [];
    } else if (category === "skill") {
      items = unmatchedData.skills ?? [];
    } else if (category === "certificateType") {
      items = unmatchedData.certificateTypes ?? [];
    }

    const uniqueItems = Array.from(
      new Set(
        items
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item && item.toLowerCase() !== "null" && item.toLowerCase() !== "undefined")
      )
    );

    if (!uniqueItems.length) {
      alert("Không có dữ liệu để gửi đề xuất.");
      return;
    }

    if (!adminUserIds.length) {
      alert("Không tìm thấy tài khoản Admin để gửi đề xuất. Vui lòng thử lại sau.");
      return;
    }

    const confirmMessage = `Bạn có chắc muốn gửi đề xuất tới Admin để bổ sung ${config.label}?\n${uniqueItems
      .map((item, idx) => ` ${idx + 1}. ${item}`)
      .join("\n")}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const token = localStorage.getItem("accessToken");
    let requesterName = "TA Staff";
    try {
      const decoded = token ? decodeJWT(token) : null;
      requesterName =
        decoded?.unique_name ||
        decoded?.email ||
        decoded?.given_name ||
        decoded?.name ||
        requesterName;
    } catch (error) {
      console.warn("Không thể giải mã token người dùng:", error);
    }

    const potentialTalentName = (formData.fullName || extractedData?.fullName || "").trim();
    const messageLines = uniqueItems.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    let message = "";
    if (category === "certificateType") {
      // Đề xuất về tên chứng chỉ có loại chứng chỉ không có trong hệ thống
      message =
        `${requesterName} đề xuất:` +
        (potentialTalentName ? `\nCho nhân sự "${potentialTalentName}"` : "") +
        `\n\nCác tên chứng chỉ sau có loại chứng chỉ không có trong hệ thống:\n${messageLines}` +
        `\n\nVui lòng thêm loại chứng chỉ tương ứng vào hệ thống.`;
    } else {
      message =
        `${requesterName} đề xuất bổ sung ${config.label}` +
        (potentialTalentName ? ` cho nhân sự "${potentialTalentName}"` : "") +
        `:\n${messageLines}`;
    }

    setSuggestionLoading(category);
    try {
      const metaData: Record<string, string> = {
        category,
        suggestions: JSON.stringify(uniqueItems),
        source: "talent-create",
      };
      if (potentialTalentName) {
        metaData.talentName = potentialTalentName;
      }

      const payload = {
        title: config.title,
        message,
        type: NotificationType.DocumentUploaded,
        priority: NotificationPriority.Medium,
        userIds: adminUserIds,
        entityType: "TalentSuggestion",
        entityId: undefined,
        actionUrl: actionUrl ?? config.defaultActionUrl,
        metaData,
      } as const;

      const response = await notificationService.create(payload);
      const notifications = Array.isArray(response) ? response : [response];
      const ids = notifications
        .map((notification) => notification.id)
        .filter((notificationId): notificationId is number => typeof notificationId === "number");

      if (ids.length) {
        setPendingSuggestionNotifications((prev) => ({
          ...prev,
          [category]: {
            ids,
            readMap: ids.reduce<Record<number, boolean>>((acc, notificationId) => {
              acc[notificationId] = false;
              return acc;
            }, {}),
            category,
          },
        }));
      }

      alert("✅ Đã gửi đề xuất tới Admin. Cảm ơn bạn!");
    } catch (error) {
      console.error("Không thể gửi đề xuất:", error);
      alert("❌ Không thể gửi đề xuất tới Admin. Vui lòng thử lại sau.");
    } finally {
      setSuggestionLoading(null);
    }
  };

  useEffect(() => {
    const entries = Object.entries(pendingSuggestionNotifications).filter(([_, entry]) =>
      entry.ids.some((notificationId) => !entry.readMap[notificationId])
    );

    if (!entries.length) return;

    let cancelled = false;

    const checkStatuses = async () => {
      if (cancelled) return;
      const updates: Array<{ key: string; notificationId: number }> = [];

      for (const [key, entry] of entries) {
        for (const notificationId of entry.ids) {
          if (entry.readMap[notificationId]) continue;
          try {
            const notification = await notificationService.getById(notificationId);
            // Nếu notification đã được đọc, đánh dấu là đã xử lý
            if (notification?.isRead) {
              updates.push({ key, notificationId });
            }
          } catch (error: any) {
            // Nếu notification bị xóa (404) hoặc không tồn tại, cũng đánh dấu là đã xử lý
            const isNotFound = error?.response?.status === 404 || error?.status === 404;
            if (isNotFound) {
              updates.push({ key, notificationId });
            } else {
              console.error("Không thể kiểm tra trạng thái thông báo đề xuất:", error);
            }
          }
        }
      }

      if (!updates.length || cancelled) return;

      setPendingSuggestionNotifications((prev) => {
        let changed = false;
        const next = { ...prev };

        updates.forEach(({ key, notificationId }) => {
          const entry = next[key];
          if (!entry) return;
          if (entry.readMap[notificationId]) return;
          changed = true;
          const newReadMap = { ...entry.readMap, [notificationId]: true };
          // Nếu tất cả notifications đã được xử lý (đọc hoặc xóa), xóa entry để cho phép gửi lại
          if (Object.values(newReadMap).every(Boolean)) {
            delete next[key];
          } else {
            next[key] = { ...entry, readMap: newReadMap };
          }
        });

        return changed ? next : prev;
      });
    };

    checkStatuses();
    const intervalId = window.setInterval(checkStatuses, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingSuggestionNotifications]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateDateOfBirth = (date: string): boolean => {
    if (!date) return false;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18 && age - 1 <= 100;
    }
    return age >= 18 && age <= 100;
  };

  const validateStartDate = (date: string): boolean => {
    if (!date) return false;
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date

    // Không được sau ngày hiện tại
    if (startDate > today) return false;

    // Không được quá xa trong quá khứ (ví dụ: không quá 100 năm trước)
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(today.getFullYear() - 100);

    return startDate >= hundredYearsAgo;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    // Validate fullName
    if (name === 'fullName') {
      if (value && value.trim() !== '') {
        delete newErrors.fullName;
      } else if (errors.fullName) {
        // Keep error if field is empty and error exists
      }
    }

    // Validate email
    if (name === 'email') {
      if (value && validateEmail(value)) {
        delete newErrors.email;
      } else if (value && !validateEmail(value)) {
        newErrors.email = 'Email không hợp lệ';
      }
    }

    // Validate phone
    if (name === 'phone') {
      if (value && validatePhone(value)) {
        delete newErrors.phone;
      } else if (value && !validatePhone(value)) {
        newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
      }
    }

    // Validate date of birth
    if (name === 'dateOfBirth') {
      if (value && validateDateOfBirth(value)) {
        delete newErrors.dateOfBirth;
      } else if (value && !validateDateOfBirth(value)) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
      }
    }

    // Validate workingMode
    if (name === 'workingMode') {
      const numValue = Number(value);
      if (numValue && numValue !== 0 && numValue !== WorkingMode.None) {
        delete newErrors.workingMode;
      }
    }

    // Validate locationId
    if (name === 'locationId') {
      const numValue = Number(value);
      if (numValue && numValue > 0) {
        delete newErrors.locationId;
      }
    }

    // Validate currentPartnerId
    if (name === 'currentPartnerId') {
      const numValue = Number(value);
      if (numValue && numValue > 0) {
        delete newErrors.currentPartnerId;
      }
    }

    setErrors(newErrors);

    setFormData((prev) => ({
      ...prev,
      [name]: name === "workingMode" || name === "locationId" || name === "currentPartnerId"
        ? Number(value) || undefined
        : value,
    }));
  };

  // Handle file change trong modal
  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke old URL if exists
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
      }

      setModalCVFile(file);
      // Create preview URL for PDF
      const url = URL.createObjectURL(file);
      setModalCVPreviewUrl(url);
    }
  };


  // Handle CV upload to Firebase for a specific CV index
  const handleUploadCV = async (cvIndex: number) => {
    if (!cvFile) {
      alert("Vui lòng chọn file CV trước!");
      return;
    }

    const currentCV = initialCVs[cvIndex];
    if (!currentCV?.version || currentCV.version <= 0) {
      alert("Vui lòng nhập version CV trước khi upload!");
      return;
    }

    if (!currentCV?.jobRoleLevelId || currentCV.jobRoleLevelId <= 0) {
      alert("⚠️ Vui lòng chọn vị trí công việc cho CV trước khi upload lên Firebase!");
      return;
    }

    // Xác nhận trước khi upload
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload file "${cvFile.name}" lên Firebase không?\n\n` +
      `Version: ${currentCV.version}\n` +
      `Kích thước file: ${(cvFile.size / 1024).toFixed(2)} KB`
    );

    if (!confirmed) {
      return;
    }

    setUploadingCVIndex(cvIndex);
    setUploadingCV(true);
    setUploadProgress(0);

    try {
      // Upload to temp folder (will be moved when talent is created)
      const timestamp = Date.now();
      const sanitizedVersionName = `v${currentCV.version}`.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileExtension = cvFile.name.split('.').pop();
      const fileName = `temp_${sanitizedVersionName}_${timestamp}.${fileExtension}`;
      const filePath = `temp-talents/${fileName}`;

      const downloadURL = await uploadFile(
        cvFile,
        filePath,
        (progress) => setUploadProgress(progress)
      );

      // Update the specific CV in the array with the download URL
      setInitialCVs(prev => prev.map((cv, index) =>
        index === cvIndex ? { ...cv, cvFileUrl: downloadURL } : cv
      ));

      // Đánh dấu đã upload lên Firebase và track URL
      setIsUploadedFromFirebase(true);
      setUploadedCVUrl(downloadURL);

      alert("✅ Upload CV thành công!");
    } catch (err: any) {
      console.error("❌ Error uploading CV:", err);
      alert(`❌ Lỗi khi upload CV: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploadingCV(false);
      setUploadingCVIndex(null);
      setUploadProgress(0);
    }
  };

  // Handle certificate image file selection
  const handleFileChangeCertificate = (certIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
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

      setCertificateImageFiles(prev => ({ ...prev, [certIndex]: file }));
    }
  };

  // Handle certificate image upload to Firebase
  const handleUploadCertificateImage = async (certIndex: number) => {
    const imageFile = certificateImageFiles[certIndex];
    if (!imageFile) {
      alert("Vui lòng chọn file ảnh trước!");
      return;
    }

    // Xác nhận trước khi upload
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload ảnh "${imageFile.name}" lên Firebase không?\n\n` +
      `Kích thước file: ${(imageFile.size / 1024).toFixed(2)} KB`
    );

    if (!confirmed) {
      return;
    }

    setUploadingCertificateIndex(certIndex);
    setCertificateUploadProgress(prev => ({ ...prev, [certIndex]: 0 }));

    try {
      // Upload to certificates folder
      const timestamp = Date.now();
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const fileName = `cert_${certIndex}_${timestamp}_${sanitizedFileName}`;
      const filePath = `certificates/${fileName}`;

      const downloadURL = await uploadFile(
        imageFile,
        filePath,
        (progress) => setCertificateUploadProgress(prev => ({ ...prev, [certIndex]: progress }))
      );

      // Update the certificate with the download URL
      updateCertificate(certIndex, 'imageUrl', downloadURL);

      // Track this URL as uploaded from Firebase
      setUploadedCertificateUrls(prev => ({ ...prev, [certIndex]: downloadURL }));

      // Clear the file from state after successful upload
      setCertificateImageFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[certIndex];
        return newFiles;
      });

      alert("✅ Upload ảnh chứng chỉ thành công!");
    } catch (err: any) {
      console.error("❌ Error uploading certificate image:", err);
      alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploadingCertificateIndex(null);
      setCertificateUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[certIndex];
        return newProgress;
      });
    }
  };

  // Extract Firebase Storage path from download URL
  const extractFirebasePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        // Decode the path (Firebase encodes spaces and special chars)
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Delete CV file from Firebase Storage (with optional skipConfirm)
  const handleDeleteCVFile = async (cvIndex: number, skipConfirm: boolean = false) => {
    const currentCV = initialCVs[cvIndex];
    const currentUrl = currentCV?.cvFileUrl;
    if (!currentUrl) {
      return;
    }

    if (!uploadedCVUrl || uploadedCVUrl !== currentUrl) {
      // URL không phải từ Firebase upload, chỉ cần xóa URL
      updateInitialCV(cvIndex, 'cvFileUrl', "");
      setUploadedCVUrl(null);
      setIsUploadedFromFirebase(false);
      return;
    }

    // Xác nhận xóa file từ Firebase (trừ khi skipConfirm = true)
    if (!skipConfirm) {
      const confirmed = window.confirm(
        "⚠️ Bạn có chắc chắn muốn xóa file CV này?\n\n" +
        "File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
        "Bạn có muốn tiếp tục không?"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
        // File đã được xóa từ Firebase
      } else {
        // Không thể extract path từ URL, chỉ xóa URL khỏi form
      }

      // Xóa URL khỏi CV
      updateInitialCV(cvIndex, 'cvFileUrl', "");

      // Xóa khỏi tracking
      setUploadedCVUrl(null);
      setIsUploadedFromFirebase(false);

      if (!skipConfirm) {
        alert("✅ Đã xóa file CV thành công!");
      }
    } catch (err: any) {
      console.error("❌ Error deleting CV file:", err);
      // Vẫn xóa URL khỏi form dù không xóa được file
      updateInitialCV(cvIndex, 'cvFileUrl', "");
      setUploadedCVUrl(null);
      setIsUploadedFromFirebase(false);
      if (!skipConfirm) {
        alert("⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.");
      }
    }
  };

  // Handle manual CV URL change with warning - BẮT BUỘC xóa file Firebase trước
  const handleCVUrlChange = async (cvIndex: number, newUrl: string) => {
    const currentCV = initialCVs[cvIndex];
    const currentUrl = currentCV?.cvFileUrl;

    // Nếu đang thay đổi URL đã upload từ Firebase
    if (currentUrl && uploadedCVUrl && currentUrl === uploadedCVUrl && newUrl !== currentUrl) {
      // BẮT BUỘC phải xóa file trong Firebase trước
      const confirmed = window.confirm(
        "⚠️ BẮT BUỘC XÓA FILE TRONG FIREBASE!\n\n" +
        "URL hiện tại đã được upload từ Firebase.\n\n" +
        "Để nhập URL thủ công, bạn PHẢI xóa file trong Firebase trước.\n\n" +
        "Nhấn OK để xóa file trong Firebase và cho phép nhập URL mới\n" +
        "Nhấn Cancel để hủy thay đổi"
      );

      if (!confirmed) {
        // Hủy thay đổi - giữ nguyên URL cũ
        return;
      }

      // Xóa file cũ trước
      try {
        await handleDeleteCVFile(cvIndex);
        // Sau khi xóa thành công, cập nhật URL mới
        updateInitialCV(cvIndex, 'cvFileUrl', newUrl);
      } catch (error) {
        // Nếu xóa thất bại, không cho phép thay đổi URL
        alert("❌ Không thể xóa file trong Firebase. Vui lòng thử lại hoặc liên hệ admin.");
        // Khôi phục URL cũ
        return;
      }
    } else {
      // Không phải URL từ Firebase, chỉ cập nhật bình thường
      updateInitialCV(cvIndex, 'cvFileUrl', newUrl);
    }
  };

  // Delete certificate image from Firebase Storage
  const handleDeleteCertificateImage = async (certIndex: number) => {
    const currentUrl = talentCertificates[certIndex]?.imageUrl;
    if (!currentUrl) {
      return;
    }

    const uploadedUrl = uploadedCertificateUrls[certIndex];
    if (!uploadedUrl || uploadedUrl !== currentUrl) {
      // URL không phải từ Firebase upload, chỉ cần xóa URL
      updateCertificate(certIndex, 'imageUrl', "");
      setUploadedCertificateUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[certIndex];
        return newUrls;
      });
      return;
    }

    // Xác nhận xóa file từ Firebase
    const confirmed = window.confirm(
      "⚠️ Bạn có chắc chắn muốn xóa ảnh chứng chỉ này?\n\n" +
      "File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
      "Bạn có muốn tiếp tục không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
        // File đã được xóa từ Firebase
      } else {
        // Không thể extract path từ URL, chỉ xóa URL khỏi form
      }

      // Xóa URL khỏi certificate
      updateCertificate(certIndex, 'imageUrl', "");

      // Xóa khỏi tracking
      setUploadedCertificateUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[certIndex];
        return newUrls;
      });

      alert("✅ Đã xóa ảnh chứng chỉ thành công!");
    } catch (err: any) {
      console.error("❌ Error deleting certificate image:", err);
      // Vẫn xóa URL khỏi form dù không xóa được file
      updateCertificate(certIndex, 'imageUrl', "");
      setUploadedCertificateUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[certIndex];
        return newUrls;
      });
      alert("⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.");
    }
  };

  // Handle manual URL change with warning - BẮT BUỘC xóa file Firebase trước
  const handleCertificateImageUrlChange = async (certIndex: number, newUrl: string) => {
    const currentUrl = talentCertificates[certIndex]?.imageUrl;
    const uploadedUrl = uploadedCertificateUrls[certIndex];

    // Nếu đang thay đổi URL đã upload từ Firebase
    if (currentUrl && uploadedUrl && currentUrl === uploadedUrl && newUrl !== currentUrl) {
      // BẮT BUỘC phải xóa file trong Firebase trước
      const confirmed = window.confirm(
        "⚠️ BẮT BUỘC XÓA FILE TRONG FIREBASE!\n\n" +
        "URL hiện tại đã được upload từ Firebase.\n\n" +
        "Để nhập URL thủ công, bạn PHẢI xóa file trong Firebase trước.\n\n" +
        "Nhấn OK để xóa file trong Firebase và cho phép nhập URL mới\n" +
        "Nhấn Cancel để hủy thay đổi"
      );

      if (!confirmed) {
        // Hủy thay đổi - giữ nguyên URL cũ
        return;
      }

      // Xóa file cũ trước
      try {
        await handleDeleteCertificateImage(certIndex);
        // Sau khi xóa thành công, cập nhật URL mới
        updateCertificate(certIndex, 'imageUrl', newUrl);
      } catch (error) {
        // Nếu xóa thất bại, không cho phép thay đổi URL
        alert("❌ Không thể xóa file trong Firebase. Vui lòng thử lại hoặc liên hệ admin.");
        // Khôi phục URL cũ
        return;
      }
    } else {
      // Không phải URL từ Firebase, chỉ cập nhật bình thường
      updateCertificate(certIndex, 'imageUrl', newUrl);
    }
  };

  // CV bắt buộc và tự động tạo, không cần hàm addInitialCV nữa

  // Remove initial CV (không dùng nữa vì CV bắt buộc)
  // const removeInitialCV = (index: number) => {
  //   setInitialCVs(initialCVs.filter((_, i) => i !== index));
  // };

  // Validate version không trùng và phải lớn hơn version cao nhất của cùng jobRoleLevelId
  const validateCVVersion = (version: number, jobRoleLevelId: number | undefined, cvIndex: number, allCVs: Partial<TalentCVCreateModel>[]): string => {
    if (version <= 0) {
      return "Version phải lớn hơn 0";
    }
    
    if (!jobRoleLevelId || jobRoleLevelId === 0) {
      return "";
    }
    
    // Lấy danh sách CV cùng jobRoleLevelId (trừ CV hiện tại)
    const cvsSameJobRoleLevel = allCVs.filter((cv, i) => 
      i !== cvIndex && cv.jobRoleLevelId === jobRoleLevelId && cv.version && cv.version > 0
    );
    
    // Nếu chưa có CV nào cho jobRoleLevelId này, chỉ cho phép version = 1
    if (cvsSameJobRoleLevel.length === 0) {
      if (version !== 1) {
        return "Chưa có CV nào cho vị trí công việc này. Vui lòng tạo version 1 trước.";
      }
      return "";
    }
    
    // Tìm version cao nhất trong danh sách CV cùng jobRoleLevelId
    const maxVersion = Math.max(...cvsSameJobRoleLevel.map(cv => cv.version || 0));
    
    // Kiểm tra trùng với các CV cùng jobRoleLevelId
    const duplicateCV = cvsSameJobRoleLevel.find((cv) => cv.version === version);
    
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

  // Update initial CV
  const updateInitialCV = (index: number, field: keyof TalentCVCreateModel, value: string | number | boolean | undefined) => {
    setInitialCVs(prev => {
      const updated = prev.map((cv, i) =>
        i === index ? { ...cv, [field]: value } : cv
      );
      
      // Nếu thay đổi jobRoleLevelId, tự động set version = 1 nếu đây là CV đầu tiên cho jobRoleLevelId đó
      if (field === 'jobRoleLevelId' && value && typeof value === 'number') {
        const cvsSameJobRoleLevel = updated.filter((cv, i) => 
          i !== index && cv.jobRoleLevelId === value
        );
        
        // Nếu đây là CV đầu tiên cho jobRoleLevelId này, tự động set version = 1
        if (cvsSameJobRoleLevel.length === 0) {
          updated[index] = { ...updated[index], version: 1 };
        }
      }
      
      // Nếu thay đổi version, validate
      if (field === 'version' && typeof value === 'number') {
        const currentCV = updated[index];
        const error = validateCVVersion(value, currentCV.jobRoleLevelId, index, updated);
        // Suppress unused variable warning - error may be used in future
        void error;
        // Có thể lưu error vào state nếu cần hiển thị
      }
      
      return updated;
    });
  };

  // Clean phone number to digits only
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // Tạo tóm tắt CV từ dữ liệu trích xuất
  const generateSummaryFromExtractedData = (data: any): string => {
    const parts: string[] = [];

    // Thông tin cơ bản
    if (data.fullName) {
      parts.push(`Tên: ${data.fullName}`);
    }

    // Vị trí công việc (jobRoleLevels)
    if (data.jobRoleLevels && Array.isArray(data.jobRoleLevels) && data.jobRoleLevels.length > 0) {
      const positions = data.jobRoleLevels
        .map((jrl: any) => jrl.position || jrl.jobRole)
        .filter((p: string) => p)
        .slice(0, 3);
      if (positions.length > 0) {
        parts.push(`Vị trí: ${positions.join(', ')}`);
      }
    }

    // Kinh nghiệm làm việc
    if (data.workExperiences && Array.isArray(data.workExperiences) && data.workExperiences.length > 0) {
      const totalExp = data.workExperiences.length;
      const companies = data.workExperiences
        .map((we: any) => we.company)
        .filter((c: string) => c)
        .slice(0, 3);
      if (companies.length > 0) {
        parts.push(`Kinh nghiệm: ${totalExp} vị trí tại ${companies.join(', ')}`);
      }
    }

    // Kỹ năng chính
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      const skillNames = data.skills
        .map((skill: any) => typeof skill === 'string' ? skill : skill.skillName || skill.name)
        .filter((s: string) => s)
        .slice(0, 7);
      if (skillNames.length > 0) {
        parts.push(`Kỹ năng: ${skillNames.join(', ')}`);
      }
    }

    // Dự án nổi bật
    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      const projectNames = data.projects
        .map((proj: any) => proj.projectName || proj.name)
        .filter((p: string) => p)
        .slice(0, 2);
      if (projectNames.length > 0) {
        parts.push(`Dự án: ${projectNames.join(', ')}`);
      }
    }

    // Chứng chỉ
    if (data.certificates && Array.isArray(data.certificates) && data.certificates.length > 0) {
      const certNames = data.certificates
        .map((cert: any) => cert.certificateName || cert.name)
        .filter((c: string) => c)
        .slice(0, 3);
      if (certNames.length > 0) {
        parts.push(`Chứng chỉ: ${certNames.join(', ')}`);
      }
    }

    // Nếu không có dữ liệu, tạo tóm tắt mặc định
    if (parts.length === 0) {
      return "CV đã được trích xuất. Vui lòng xem chi tiết trong phần dữ liệu đã trích xuất.";
    }

    return parts.join('. ') + '.';
  };

  // Helper function để extract và fill data từ CV
  const extractAndFillDataFromCV = async (file: File, shouldCreateCV: boolean = false) => {
    try {
      setExtractingCV(true);

      // Clear extracted data cũ trước khi trích xuất mới
      setExtractedData(null);
      setUnmatchedData({});

      // Clear các dữ liệu đã tự động thêm từ CV cũ (nếu có)
      setTalentSkills([]);
      setTalentWorkExperiences([]);
      setTalentProjects([]);
      setTalentCertificates([]);
      // Reset job role levels về mặc định (bắt buộc phải có ít nhất 1)
      setTalentJobRoleLevels([{
        jobRoleLevelId: 0,
        yearsOfExp: 0,
        ratePerMonth: undefined
      }]);

      const result: TalentCVExtractResponse = await talentCVService.extractFromPDF(file);

      if (result.isSuccess && result.generateText) {
        try {
          // Clean the response text by removing markdown code blocks
          let cleanText = result.generateText.trim();

          // Remove markdown code block markers if present
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsedData = JSON.parse(cleanText);

          // Clean phone number to digits only
          if (parsedData.phone) {
            parsedData.phone = cleanPhoneNumber(parsedData.phone);
          }

          setExtractedData(parsedData);

          // Auto-fill form with extracted data (with safety checks)
          // Auto-match location from CV
          let matchedLocationId: number | undefined = undefined;
          const locationNameFromCV = parsedData.locationName;

          // Map workingMode string to number
          let workingModeValue: number = WorkingMode.None;
          if (parsedData.workingMode) {
            const workingModeStr = parsedData.workingMode.toLowerCase();
            if (workingModeStr === 'onsite') {
              workingModeValue = WorkingMode.Onsite;
            } else if (workingModeStr === 'remote') {
              workingModeValue = WorkingMode.Remote;
            } else if (workingModeStr === 'hybrid') {
              workingModeValue = WorkingMode.Hybrid;
            } else if (workingModeStr === 'flexible') {
              workingModeValue = WorkingMode.Flexible;
            }
          }

          // Helper function to normalize Vietnamese text (remove diacritics)
          const normalizeVietnamese = (text: string): string => {
            return text
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
              .toLowerCase()
              .trim();
          };

          // Helper function to normalize skill/tech name (remove special chars, extensions, etc.)
          const normalizeSkillName = (text: string): string => {
            return text
              .toLowerCase()
              .replace(/\.(js|ts|jsx|tsx|net|py|java|cpp|csharp|php|go|rb|swift|kt|dart)$/i, '') // Remove common extensions
              .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
          };

          // Helper function to fuzzy match text (exact → normalized → substring → contains)
          const fuzzyMatch = (cvText: string, systemText: string): boolean => {
            const cvLower = cvText.toLowerCase().trim();
            const sysLower = systemText.toLowerCase().trim();

            // 1. Exact match (case-insensitive)
            if (cvLower === sysLower) return true;

            // 2. Normalized match (remove diacritics, special chars)
            const cvNormalized = normalizeSkillName(cvText);
            const sysNormalized = normalizeSkillName(systemText);
            if (cvNormalized === sysNormalized) return true;

            // 3. Substring match (one contains the other)
            if (cvNormalized.includes(sysNormalized) || sysNormalized.includes(cvNormalized)) {
              // Only match if the shorter string is at least 3 chars
              const minLength = Math.min(cvNormalized.length, sysNormalized.length);
              if (minLength >= 3) return true;
            }

            // 4. Word-based match (at least 2 words match)
            const cvWords = cvNormalized.split(/\s+/).filter(w => w.length > 2);
            const sysWords = sysNormalized.split(/\s+/).filter(w => w.length > 2);
            const commonWords = cvWords.filter(w => sysWords.includes(w));
            if (commonWords.length >= 2) return true;

            return false;
          };

          // Mapping dictionary for common city names (English -> Vietnamese)
          const locationMapping: Record<string, string[]> = {
            'ho chi minh city': ['ho chi minh', 'thanh pho ho chi minh', 'tp hcm', 'hcm', 'hochiminh'],
            'hanoi': ['ha noi', 'thanh pho ha noi', 'tp ha noi', 'hanoi'],
            'da nang': ['da nang', 'thanh pho da nang', 'tp da nang', 'danang'],
            'haiphong': ['hai phong', 'thanh pho hai phong', 'tp hai phong', 'haiphong'],
            'can tho': ['can tho', 'thanh pho can tho', 'tp can tho', 'cantho'],
            'nha trang': ['nha trang', 'khanh hoa', 'nhatrang'],
            'vung tau': ['vung tau', 'ba ria vung tau', 'vungtau'],
            'hue': ['hue', 'thua thien hue', 'hue'],
          };

          if (locationNameFromCV && typeof locationNameFromCV === 'string' && locations.length > 0) {
            const normalizedCVLocation = normalizeVietnamese(locationNameFromCV);

            // Tìm location trong danh sách locations hệ thống (case-insensitive, exact match trước)
            let matchedLocation = locations.find(loc => {
              const normalizedLocName = normalizeVietnamese(loc.name);
              return normalizedLocName === normalizedCVLocation;
            });

            // Nếu không tìm thấy exact match, thử mapping dictionary
            if (!matchedLocation) {
              // Tìm trong mapping dictionary
              const mappingKey = Object.keys(locationMapping).find(key =>
                normalizedCVLocation.includes(normalizeVietnamese(key)) ||
                normalizeVietnamese(key).includes(normalizedCVLocation)
              );

              if (mappingKey) {
                const mappedNames = locationMapping[mappingKey];
                matchedLocation = locations.find(loc => {
                  const normalizedLocName = normalizeVietnamese(loc.name);
                  return mappedNames.some(mappedName =>
                    normalizedLocName === normalizeVietnamese(mappedName) ||
                    normalizedLocName.includes(normalizeVietnamese(mappedName)) ||
                    normalizeVietnamese(mappedName).includes(normalizedLocName)
                  );
                });
              }
            }

            // Nếu vẫn chưa tìm thấy, thử fuzzy matching (chứa nhau)
            if (!matchedLocation) {
              matchedLocation = locations.find(loc => {
                const normalizedLocName = normalizeVietnamese(loc.name);
                // Tách thành các từ và so sánh
                const cvWords = normalizedCVLocation.split(/\s+/);
                const locWords = normalizedLocName.split(/\s+/);

                // Nếu có ít nhất 2 từ trùng nhau hoặc một từ dài trùng
                const commonWords = cvWords.filter(word =>
                  word.length > 3 && locWords.some(locWord =>
                    locWord.includes(word) || word.includes(locWord)
                  )
                );

                return commonWords.length > 0 ||
                  normalizedLocName.includes(normalizedCVLocation) ||
                  normalizedCVLocation.includes(normalizedLocName);
              });
            }

            if (matchedLocation) {
              matchedLocationId = matchedLocation.id;
              // Clear unmatched location if matched
              setUnmatchedData(prev => ({ ...prev, location: undefined }));
            } else {
              // Set unmatched location
              setUnmatchedData(prev => ({ ...prev, location: locationNameFromCV }));
            }
          } else if (locationNameFromCV && locations.length === 0) {
            // Set unmatched location
            setUnmatchedData(prev => ({ ...prev, location: locationNameFromCV }));
          }

          // Reset formData cơ bản trước khi điền dữ liệu CV mới (tránh lẫn lộn với CV cũ)
          // Chỉ giữ lại các trường không liên quan đến CV (status, currentPartnerId)
          setFormData(prev => ({
            ...prev,
            fullName: parsedData.fullName || "",
            email: parsedData.email || "",
            phone: parsedData.phone || undefined,
            dateOfBirth: parsedData.dateOfBirth || undefined,
            locationId: matchedLocationId !== undefined ? matchedLocationId : undefined,
            workingMode: workingModeValue !== WorkingMode.None ? (workingModeValue as WorkingMode) : WorkingMode.None,
            githubUrl: parsedData.githubUrl || undefined,
            portfolioUrl: parsedData.portfolioUrl || undefined,
          }));

          // Auto-add skills from CV to form
          let addedSkillsCount = 0;
          const unmatchedSkills: string[] = [];
          if (parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
            // Tính toán số lượng skills sẽ được thêm trước
            const newSkills: TalentSkillCreateModel[] = [];
            parsedData.skills.forEach((skillObj: any) => {
              // Support both old format (string) and new format (object with skillName)
              const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skillName;
              const skillLevel = typeof skillObj === 'object' ? (skillObj.level || "Intermediate") : "Intermediate";
              const skillYearsExp = typeof skillObj === 'object' ? (skillObj.yearsExp || 0) : 0;

              // Tìm skill trong danh sách skills hệ thống (fuzzy matching)
              let matchedSkill = skills.find(s =>
                s.name.toLowerCase().trim() === skillName.toLowerCase().trim()
              );

              // Nếu không tìm thấy exact match, thử fuzzy matching
              if (!matchedSkill) {
                matchedSkill = skills.find(s => fuzzyMatch(skillName, s.name));
              }
              if (matchedSkill) {
                // Kiểm tra xem skill đã tồn tại chưa (sử dụng current state)
                const exists = talentSkills.some(ts => ts.skillId === matchedSkill.id);
                if (!exists) {
                  // Map level string to valid level
                  let mappedLevel = skillLevel;
                  if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skillLevel)) {
                    mappedLevel = "Intermediate"; // Default if invalid
                  }

                  // Tự động set yearsExp = 1 nếu đang là 0
                  const yearsExp = (skillYearsExp && skillYearsExp > 0) ? skillYearsExp : 1;
                  
                  newSkills.push({
                    skillId: matchedSkill.id,
                    level: mappedLevel,
                    yearsExp: yearsExp
                  });
                }
              } else {
                // Skill không match được, thêm vào unmatched
                unmatchedSkills.push(skillName);
              }
            });
            addedSkillsCount = newSkills.length;
            // Thêm skills vào state
            if (newSkills.length > 0) {
              setTalentSkills(prev => [...prev, ...newSkills]);
            }
            // Update unmatched skills
            setUnmatchedData(prev => ({ ...prev, skills: unmatchedSkills.length > 0 ? unmatchedSkills : undefined }));
          }

          // Auto-add work experiences from CV to form
          let addedWorkExperiencesCount = 0;
          if (parsedData.workExperiences && Array.isArray(parsedData.workExperiences) && parsedData.workExperiences.length > 0) {
            const newWorkExperiences: TalentWorkExperienceCreateModel[] = parsedData.workExperiences.map((exp: any) => {
              // Convert date format: YYYY-MM -> YYYY-MM-DD (thêm -01 cho ngày đầu tháng)
              const formatDateForInput = (dateStr: string | null | undefined): string | undefined => {
                if (!dateStr) return undefined;
                // Nếu là 'Present', trả về undefined
                if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'hiện tại') {
                  return undefined;
                }
                // Nếu đã có format YYYY-MM-DD, giữ nguyên
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                // Nếu có format YYYY-MM, thêm -01
                if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
                // Nếu có format khác, thử parse
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                  }
                } catch {
                  // Nếu không parse được, trả về undefined
                }
                return undefined;
              };

              return {
                company: exp.company || "",
                position: exp.position || "",
                startDate: formatDateForInput(exp.startDate) || "",
                endDate: formatDateForInput(exp.endDate),
                description: exp.description || ""
              };
            });
            addedWorkExperiencesCount = newWorkExperiences.length;
            // Thêm vào đầu danh sách (giữ lại các work experiences đã có)
            setTalentWorkExperiences(prev => [...newWorkExperiences, ...prev]);
          }

          // Auto-add projects from CV to form
          let addedProjectsCount = 0;
          if (parsedData.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0) {
            const newProjects: TalentProjectCreateModel[] = parsedData.projects.map((project: any) => ({
              projectName: project.projectName || "",
              position: project.position || "",
              technologies: project.technologies || "",
              description: project.description || ""
            }));
            addedProjectsCount = newProjects.length;
            // Thêm vào đầu danh sách (giữ lại các projects đã có)
            setTalentProjects(prev => [...newProjects, ...prev]);
          }

          // Auto-add certificates from CV to form - Tự động điền thông tin và tự động match loại chứng chỉ
          let addedCertificatesCount = 0;
          let matchedCertificatesCount = 0;
          let unmatchedCertificatesCount = 0;
          const unmatchedCertificateTypes: string[] = [];
          if (parsedData.certificates && Array.isArray(parsedData.certificates) && parsedData.certificates.length > 0) {
            const newCertificates: TalentCertificateCreateModel[] = [];

            parsedData.certificates.forEach((cert: any) => {
              // Convert YYYY-MM format to YYYY-MM-DD for date inputs
              const formatDateForInput = (dateStr: string | null | undefined): string | undefined => {
                if (!dateStr) return undefined;
                // Nếu đã có format YYYY-MM-DD, giữ nguyên
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                // Nếu có format YYYY-MM, thêm -01
                if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
                return dateStr;
              };

              const certificateName = cert.certificateName || "";
              let matchedCertificateTypeId: number = 0;

              // Tự động match loại chứng chỉ dựa trên keyword trong tên chứng chỉ
              // CertificateType.name là tên loại chứng chỉ (ví dụ: "Chứng chỉ AWS (Cloud Practitioner, Architect...)")
              // certificateName là tên chứng chỉ cụ thể (ví dụ: "AWS Certified Solutions Architect")
              // Cần extract keyword từ tên loại chứng chỉ và tìm trong tên chứng chỉ
              if (certificateName && certificateTypes.length > 0) {
                // Helper function để extract keywords từ tên loại chứng chỉ
                // Ưu tiên từ đầu tiên sau "Chứng chỉ" và các từ trong ngoặc
                // Ví dụ: "Chứng chỉ AWS (Cloud Practitioner, Architect...)" → primary: ["aws"], secondary: ["cloud", "practitioner"]
                // Ví dụ: "Chứng chỉ Tiếng Anh (IELTS, TOEIC, TOEFL...)" → primary: ["tiếng", "anh"], secondary: ["ielts", "toeic", "toefl"]
                const extractKeywords = (typeName: string): { primary: string[], secondary: string[] } => {
                  const normalized = typeName.toLowerCase().trim();
                  
                  // Lấy các từ trong ngoặc (thường là keyword chính)
                  const inParentheses = normalized.match(/\(([^)]+)\)/);
                  const parenthesesWords: string[] = [];
                  if (inParentheses) {
                    const parenthesesContent = inParentheses[1]
                      .replace(/[^\w\s]/g, ' ')
                      .split(/\s*[,\/]\s*/)
                      .map(w => w.trim().toLowerCase())
                      .filter(w => w.length >= 3);
                    parenthesesWords.push(...parenthesesContent);
                  }
                  
                  // Loại bỏ nội dung trong ngoặc để lấy phần chính
                  let mainPart = normalized
                    .replace(/\([^)]*\)/g, '') // Loại bỏ nội dung trong ngoặc
                    .replace(/\[[^\]]*\]/g, '') // Loại bỏ nội dung trong ngoặc vuông
                    .replace(/^chứng chỉ\s*/i, '')
                    .replace(/^certificate\s*/i, '')
                    .replace(/^cert\s*/i, '')
                    .replace(/\.{2,}/g, '')
                    .replace(/[^\w\s]/g, ' ')
                    .trim();
                  
                  // Lấy từ đầu tiên (thường là keyword chính)
                  const firstWord = mainPart.split(/\s+/)[0];
                  const primary: string[] = [];
                  if (firstWord && firstWord.length >= 3) {
                    primary.push(firstWord);
                  }
                  
                  // Lấy các từ còn lại làm secondary
                  const remainingWords = mainPart.split(/\s+/).slice(1).filter(w => w.length >= 3);
                  
                  // Loại bỏ các từ stop words chung chung
                  const stopWords = ['certified', 'certificate', 'cert', 'solutions', 'architect', 'practitioner', 'engineer', 'developer', 'professional', 'associate', 'specialist', 'expert', 'master', 'foundation', 'fundamentals', 'tiếng', 'anh', 'chứng', 'chỉ'];
                  
                  const filteredPrimary = primary.filter(word => !stopWords.includes(word));
                  const filteredSecondary = [...remainingWords, ...parenthesesWords].filter(word => !stopWords.includes(word));
                  
                  return { primary: filteredPrimary, secondary: filteredSecondary };
                };
                
                // Helper function để normalize tên chứng chỉ (loại bỏ các từ chung chung)
                const normalizeCertificateName = (certName: string): string => {
                  return certName.toLowerCase()
                    .replace(/\b(certified|certificate|cert|solutions|architect|practitioner|engineer|developer|professional|associate|specialist|expert|master|foundation|fundamentals)\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                };
                
                // Tìm loại chứng chỉ mà keyword của nó có trong tên chứng chỉ
                // Ưu tiên match với primary keywords (từ đầu tiên hoặc trong ngoặc)
                // Ví dụ: "AWS Certified Solutions Architect" chứa "AWS" → match với loại "Chứng chỉ AWS (...)"
                // Không match: "AWS Certified Solutions Architect" với "Chứng chỉ Tiếng Anh (...)" vì không có "tiếng", "anh", "ielts", "toeic", "toefl"
                let matchedType = certificateTypes.find(ct => {
                  const { primary, secondary } = extractKeywords(ct.name);
                  if (primary.length === 0 && secondary.length === 0) return false;
                  
                  // Normalize tên chứng chỉ để loại bỏ các từ chung chung
                  const normalizedCert = normalizeCertificateName(certificateName);
                  
                  // Ưu tiên match với primary keywords trước
                  const primaryMatch = primary.some(keyword => {
                    if (keyword.length < 3) return false;
                    return normalizedCert.includes(keyword);
                  });
                  
                  if (primaryMatch) return true;
                  
                  // Nếu không match primary, thử match với secondary
                  return secondary.some(keyword => {
                    if (keyword.length < 3) return false;
                    return normalizedCert.includes(keyword);
                  });
                });

                if (matchedType) {
                  matchedCertificateTypeId = matchedType.id;
                } else {
                  // Thêm vào unmatched nếu chưa có
                  if (!unmatchedCertificateTypes.includes(certificateName)) {
                    unmatchedCertificateTypes.push(certificateName);
                  }
                }
              } else if (certificateName && certificateTypes.length === 0) {
                if (!unmatchedCertificateTypes.includes(certificateName)) {
                  unmatchedCertificateTypes.push(certificateName);
                }
              }

              // Chỉ tự động thêm vào form nếu đã match được loại chứng chỉ (certificateTypeId > 0)
              if (matchedCertificateTypeId > 0) {
                // Tự động điền: certificateTypeId (đã match được), certificateName, certificateDescription, imageUrl
                newCertificates.push({
                  certificateTypeId: matchedCertificateTypeId,
                  certificateName: certificateName,
                  certificateDescription: cert.certificateDescription || "",
                  issuedDate: formatDateForInput(cert.issuedDate),
                  isVerified: false,
                  imageUrl: cert.imageUrl || ""
                });
              }
            });

            addedCertificatesCount = newCertificates.length;
            // Đếm số lượng chứng chỉ đã tự động match loại (tất cả đều đã match vì chỉ thêm khi match được)
            matchedCertificatesCount = newCertificates.length;
            // Đếm số lượng chứng chỉ không match được (không được thêm vào form)
            unmatchedCertificatesCount = parsedData.certificates.length - matchedCertificatesCount;
            // Thêm vào đầu danh sách (giữ lại các certificates đã có)
            if (newCertificates.length > 0) {
              setTalentCertificates(prev => [...newCertificates, ...prev]);
            }
            // Update unmatched certificate types
            setUnmatchedData(prev => ({ 
              ...prev, 
              certificateTypes: unmatchedCertificateTypes.length > 0 ? unmatchedCertificateTypes : undefined 
            }));
          }

          // Auto-add job role levels from CV to form
          let addedJobRoleLevelsCount = 0;
          const unmatchedJobRoles: string[] = [];
          let newJobRoleLevels: TalentJobRoleLevelCreateModel[] = []; // Lưu vào biến scope lớn hơn để dùng cho shouldCreateCV
          if (parsedData.jobRoleLevels && Array.isArray(parsedData.jobRoleLevels) && parsedData.jobRoleLevels.length > 0) {
            newJobRoleLevels = parsedData.jobRoleLevels.map((jrl: any) => {
              // Tìm job role level trong hệ thống dựa trên position và level
              // Position format: "Frontend Developer", level: "Junior/Middle/Senior/Lead"
              let matchedJobRoleLevel = jobRoleLevels.find(jrLevel => {
                // Tìm job role dựa trên position string (fuzzy matching)
                let matchedJobRole = jobRoles.find(jr =>
                  jr.name.toLowerCase().includes(jrl.position.toLowerCase()) ||
                  jrl.position.toLowerCase().includes(jr.name.toLowerCase())
                );

                // Nếu không tìm thấy, thử fuzzy matching
                if (!matchedJobRole) {
                  matchedJobRole = jobRoles.find(jr => fuzzyMatch(jrl.position, jr.name));
                }

                if (!matchedJobRole) {
                  // Thêm vào unmatched nếu chưa có
                  if (!unmatchedJobRoles.includes(jrl.position)) {
                    unmatchedJobRoles.push(jrl.position);
                  }
                  return false;
                }

                // Map level string to level enum
                const levelMap: Record<string, string> = {
                  'junior': 'Junior',
                  'middle': 'Middle',
                  'senior': 'Senior',
                  'lead': 'Lead'
                };
                const normalizedLevel = jrl.level ? levelMap[jrl.level.toLowerCase()] || jrl.level : null;

                // Tìm job role level matching (không cần match jobRoleId nữa, chỉ cần match level)
                return normalizedLevel ? jrLevel.level === normalizedLevel : true;
              });

              // Nếu không tìm thấy exact match, tìm job role level đầu tiên match với position name
              if (!matchedJobRoleLevel) {
                matchedJobRoleLevel = jobRoleLevels.find(jrLevel =>
                  jrLevel.name.toLowerCase().includes(jrl.position.toLowerCase()) ||
                  jrl.position.toLowerCase().includes(jrLevel.name.toLowerCase())
                );
              }
              
              // Nếu vẫn không tìm thấy, thử fuzzy matching
              if (!matchedJobRoleLevel) {
                matchedJobRoleLevel = jobRoleLevels.find(jrLevel => fuzzyMatch(jrl.position, jrLevel.name));
              }

              // Tự động set yearsOfExp = 1 nếu đang là 0
              const yearsOfExp = (jrl.yearsOfExp && jrl.yearsOfExp > 0) ? jrl.yearsOfExp : 1;
              
              return {
                jobRoleLevelId: matchedJobRoleLevel ? matchedJobRoleLevel.id : 0,
                yearsOfExp: yearsOfExp,
                ratePerMonth: jrl.ratePerMonth || undefined
              };
            });
            addedJobRoleLevelsCount = newJobRoleLevels.length;
            // Thêm vào đầu danh sách (giữ lại các job role levels đã có)
            setTalentJobRoleLevels(prev => [...newJobRoleLevels, ...prev]);
            // Update unmatched job roles
            setUnmatchedData(prev => ({ ...prev, jobRoles: unmatchedJobRoles.length > 0 ? unmatchedJobRoles : undefined }));
          }

          // Tự động tạo và điền tóm tắt CV
          try {
            const summary = generateSummaryFromExtractedData(parsedData);
            setInitialCVs(prev => prev.map((cv, index) =>
              index === 0 ? { ...cv, summary } : cv
            ));
          } catch (summaryError) {
            console.error("Lỗi khi tạo tóm tắt CV:", summaryError);
          }

          // Nếu shouldCreateCV = true, upload CV lên Firebase và lưu vào initialCVs
          if (shouldCreateCV && file) {
            try {
              // Tìm jobRoleLevelId từ newJobRoleLevels đã tạo ở trên (nếu có)
              let jobRoleLevelIdForCV = 0;
              
              if (newJobRoleLevels.length > 0) {
                // Lấy jobRoleLevelId đầu tiên từ newJobRoleLevels đã match được
                const firstMatchedJRL = newJobRoleLevels.find(jrl => jrl.jobRoleLevelId > 0);
                if (firstMatchedJRL) {
                  jobRoleLevelIdForCV = firstMatchedJRL.jobRoleLevelId;
                }
              }

              // Upload CV lên Firebase
              const timestamp = Date.now();
              const sanitizedVersionName = `v1`.replace(/[^a-zA-Z0-9-_]/g, '_');
              const fileExtension = file.name.split('.').pop();
              const fileName = `temp_${sanitizedVersionName}_${timestamp}.${fileExtension}`;
              const filePath = `temp-talents/${fileName}`;

              const downloadURL = await uploadFile(
                file,
                filePath,
                () => {} // Không cần progress trong modal
              );

              // Tạo summary từ extracted data (đã tạo ở trên)
              const summary = generateSummaryFromExtractedData(parsedData);

              // Lưu CV vào initialCVs
              // Nếu chưa có jobRoleLevelId, vẫn lưu CV nhưng user sẽ phải chọn sau
              setInitialCVs(prev => prev.map((cv, index) =>
                index === 0 ? {
                  ...cv,
                  jobRoleLevelId: jobRoleLevelIdForCV > 0 ? jobRoleLevelIdForCV : undefined,
                  version: 1,
                  cvFileUrl: downloadURL,
                  summary: summary,
                  isActive: true
                } : cv
              ));

              // Đánh dấu đã upload
              setIsUploadedFromFirebase(true);
              setUploadedCVUrl(downloadURL);
              setCvFile(file);
              const previewUrl = URL.createObjectURL(file);
              setCvPreviewUrl(previewUrl);

              if (jobRoleLevelIdForCV === 0) {
                alert("⚠️ CV đã được upload nhưng chưa có vị trí công việc. Vui lòng chọn vị trí công việc cho CV sau.");
              }
            } catch (uploadError: any) {
              console.error("Lỗi upload CV:", uploadError);
              alert(`⚠️ Đã trích xuất thông tin nhưng không thể upload CV: ${uploadError.message || 'Vui lòng thử lại.'}`);
            }
          }

          const successMessage = `✅ Trích xuất thông tin CV thành công!${matchedLocationId !== undefined
            ? `\nĐã tự động chọn khu vực làm việc.`
            : ''
            }${workingModeValue !== WorkingMode.None
              ? `\nĐã tự động chọn chế độ làm việc.`
              : ''
            }${addedSkillsCount > 0
              ? `\nĐã tự động thêm ${addedSkillsCount} kỹ năng vào form.`
              : ''
            }${addedWorkExperiencesCount > 0
              ? `\nĐã tự động thêm ${addedWorkExperiencesCount} kinh nghiệm làm việc vào form.`
              : ''
            }${addedProjectsCount > 0
              ? `\nĐã tự động thêm ${addedProjectsCount} dự án vào form.`
              : ''
            }${addedCertificatesCount > 0
              ? `\nĐã tự động thêm ${addedCertificatesCount} chứng chỉ vào form (chỉ những chứng chỉ đã match được loại chứng chỉ trong hệ thống).`
              : ''
            }${unmatchedCertificatesCount > 0
              ? `\n⚠️ Có ${unmatchedCertificatesCount} chứng chỉ không match được loại chứng chỉ trong hệ thống, không được tự động thêm vào form. Xem phần "Cảnh báo" để gửi đề xuất thêm loại chứng chỉ.`
              : ''
            }${addedJobRoleLevelsCount > 0
              ? `\nĐã tự động thêm ${addedJobRoleLevelsCount} vị trí công việc vào form.`
              : ''
            }${shouldCreateCV ? `\n✅ Đã tạo CV và upload lên Firebase.` : ''}`;
          alert(successMessage);
        } catch (parseError) {
          console.error("Lỗi parse JSON:", parseError);
          alert("❌ Lỗi khi phân tích dữ liệu CV!");
          // Reset checkbox & trạng thái nếu lỗi parse
          setUseExtractCV(false);
        }
      } else {
        alert("❌ Không thể trích xuất thông tin từ CV!");
        // Reset checkbox & trạng thái nếu BE trả về isSuccess = false
        setUseExtractCV(false);
      }
    } catch (error) {
      console.error("Lỗi extract CV:", error);
      alert("❌ Lỗi khi trích xuất CV!");
      // Reset checkbox & trạng thái nếu call API lỗi
      setUseExtractCV(false);
    } finally {
      setExtractingCV(false);
    }
  };

  // Handle extract CV từ modal
  const handleExtractCVFromModal = async () => {
    if (!modalCVFile) {
      alert("Vui lòng chọn file CV trước!");
      return;
    }

    // Gọi hàm extract và fill data
    await extractAndFillDataFromCV(modalCVFile, createCVFromExtract);

    // Copy file và preview URL sang trang chính để có thể xem CV sau khi trích xuất
    setCvFile(modalCVFile);
    if (modalCVPreviewUrl) {
      // Tạo URL mới từ file để dùng ở trang chính (không revoke URL cũ vì đang dùng trong modal)
      const newPreviewUrl = URL.createObjectURL(modalCVFile);
      setCvPreviewUrl(newPreviewUrl);
    }

    // Đóng modal sau khi extract thành công
    setShowExtractCVModal(false);
    setModalCVFile(null);
    if (modalCVPreviewUrl) {
      URL.revokeObjectURL(modalCVPreviewUrl);
      setModalCVPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Xác nhận trước khi tạo
    const confirmed = window.confirm("Bạn có chắc chắn muốn tạo nhân sự mới không?");
    if (!confirmed) {
      return;
    }

    // Validate all required fields
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim() === '') {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
    }

    // Validate date of birth only if provided (not required)
    if (formData.dateOfBirth && !validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
    }

    if (formData.workingMode === undefined || (formData.workingMode as number) === 0) {
      newErrors.workingMode = 'Vui lòng chọn chế độ làm việc';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Vui lòng chọn khu vực làm việc';
    }

    if (!formData.currentPartnerId) {
      newErrors.currentPartnerId = 'Vui lòng chọn đối tác';
    }

    // Validation CV - Bắt buộc luôn
    if (initialCVs.length === 0 || !initialCVs[0]) {
      alert("⚠️ Vui lòng thêm CV ban đầu!");
      setErrors(prev => ({ ...prev, cv: 'CV ban đầu là bắt buộc' }));
      return;
    }

    const cv = initialCVs[0];
    if (!cv.jobRoleLevelId || cv.jobRoleLevelId <= 0) {
      alert("⚠️ Vui lòng chọn vị trí công việc cho CV!");
      setErrors(prev => ({ ...prev, cv: 'Vị trí công việc là bắt buộc' }));
      return;
    }
    if (!cv.version || cv.version <= 0) {
      alert("⚠️ Vui lòng nhập version CV!");
      setErrors(prev => ({ ...prev, cv: 'Version CV là bắt buộc' }));
      return;
    }
    if (!cv.cvFileUrl || cv.cvFileUrl.trim() === "") {
      alert("⚠️ Vui lòng upload CV lên Firebase hoặc nhập URL file CV! CV là bắt buộc.");
      setErrors(prev => ({ ...prev, cv: 'URL file CV là bắt buộc' }));
      return;
    }

    // Validation cho các trường bắt buộc trong arrays
    // Validate Skills: skillId phải > 0
    talentSkills.forEach((skill, index) => {
      if (!skill.skillId || skill.skillId === 0) {
        newErrors[`skill_${index}`] = `Kỹ năng #${index + 1}: Vui lòng chọn kỹ năng`;
      }
    });

    // Validate Projects: projectName và position bắt buộc
    talentProjects.forEach((project, index) => {
      if (!project.projectName || project.projectName.trim() === "") {
        newErrors[`project_name_${index}`] = `Dự án #${index + 1}: Vui lòng nhập tên dự án`;
      }
      if (!project.position || project.position.trim() === "") {
        newErrors[`project_position_${index}`] = `Dự án #${index + 1}: Vui lòng nhập vị trí trong dự án`;
      }
    });

    // Validate Work Experiences: company, position, startDate bắt buộc
    talentWorkExperiences.forEach((exp, index) => {
      if (!exp.company || exp.company.trim() === "") {
        newErrors[`workexp_company_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập công ty`;
      }
      if (!exp.position || exp.position.trim() === "") {
        newErrors[`workexp_position_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập vị trí`;
      }
      if (!exp.startDate || exp.startDate.trim() === "") {
        newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng chọn ngày bắt đầu`;
      } else if (!validateStartDate(exp.startDate)) {
        newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày bắt đầu không hợp lệ (không được sau ngày hiện tại)`;
      }
      // Validate endDate nếu có (phải sau startDate)
      if (exp.endDate && exp.endDate.trim() !== "") {
        const startDate = new Date(exp.startDate);
        const endDate = new Date(exp.endDate);
        if (endDate < startDate) {
          newErrors[`workexp_enddate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày kết thúc phải sau ngày bắt đầu`;
        }
      }
    });

    // Validation Job Role Levels bắt buộc
    if (talentJobRoleLevels.length === 0) {
      alert("⚠️ Vui lòng thêm ít nhất 1 vị trí!");
      return;
    }

    // Validate Job Role Levels: jobRoleLevelId phải > 0
    talentJobRoleLevels.forEach((jrl, index) => {
      if (!jrl.jobRoleLevelId || jrl.jobRoleLevelId === 0) {
        newErrors[`jobrolelevel_${index}`] = `Vị trí & cấp độ #${index + 1}: Vui lòng chọn vị trí & cấp độ`;
      }
    });

    // Validate Certificates: certificateTypeId phải > 0, certificateName bắt buộc
    talentCertificates.forEach((cert, index) => {
      if (!cert.certificateTypeId || cert.certificateTypeId === 0) {
        newErrors[`certificate_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng chọn loại chứng chỉ`;
      }
      if (!cert.certificateName || cert.certificateName.trim() === "") {
        newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng nhập tên chứng chỉ`;
      }
      if (cert.certificateName && cert.certificateName.length > 255) {
        newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Tên chứng chỉ không được vượt quá 255 ký tự`;
      }
      if (cert.certificateDescription && cert.certificateDescription.length > 1000) {
        newErrors[`certificate_description_${index}`] = `Chứng chỉ #${index + 1}: Mô tả chứng chỉ không được vượt quá 1000 ký tự`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Tạo thông báo chi tiết về các lỗi
      const basicErrors = Object.entries(newErrors)
        .filter(([key]) => !key.startsWith('skill_') && !key.startsWith('project_') && !key.startsWith('workexp_') && !key.startsWith('jobrolelevel_') && !key.startsWith('certificate_'))
        .map(([, value]) => value);

      const arrayErrors = Object.values(newErrors).filter(msg =>
        msg.includes('Kỹ năng') || msg.includes('Dự án') || msg.includes('Kinh nghiệm') || msg.includes('Vị trí & cấp độ') || msg.includes('Chứng chỉ')
      );

      let alertMessage = '⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc';
      if (basicErrors.length > 0) {
        alertMessage += '\n\n' + basicErrors.join('\n');
      }
      if (arrayErrors.length > 0) {
        alertMessage += '\n\n' + arrayErrors.slice(0, 5).join('\n'); // Hiển thị tối đa 5 lỗi đầu tiên
        if (arrayErrors.length > 5) {
          alertMessage += `\n... và ${arrayErrors.length - 5} lỗi khác`;
        }
      }
      alert(alertMessage);
      return;
    }

    setLoading(true);
    try {
      // Convert dateOfBirth to UTC ISO string if provided
      const payload: TalentWithRelatedDataCreateModel = {
        currentPartnerId: formData.currentPartnerId!,
        userId: formData.userId,
        fullName: formData.fullName!,
        email: formData.email!,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth + 'T00:00:00').toISOString()
          : undefined,
        locationId: formData.locationId,
        workingMode: formData.workingMode!,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        status: formData.status,
        skills: talentSkills.length > 0 ? talentSkills : undefined,
        // Gán talentCVId = 0 cho work experiences và projects để backend biết đây là CV mới
        // Backend sẽ tự động gán talentCVId từ initialCV sau khi tạo CV
        workExperiences: talentWorkExperiences.length > 0
          ? talentWorkExperiences.map(exp => ({
            ...exp,
            talentCVId: 0 // Backend sẽ tự động gán từ initialCV
          }))
          : undefined,
        projects: talentProjects.length > 0
          ? talentProjects.map(proj => ({
            ...proj,
            talentCVId: 0 // Backend sẽ tự động gán từ initialCV
          }))
          : undefined,
        certificates: talentCertificates.length > 0 ? talentCertificates : undefined,
        jobRoleLevels: talentJobRoleLevels.length > 0 ? talentJobRoleLevels : undefined,
        initialCV: (() => {
          // CV bắt buộc - luôn gửi nếu có đầy đủ thông tin (không phụ thuộc vào useExtractCV)
          if (initialCVs[0] && initialCVs[0].jobRoleLevelId && initialCVs[0].version && initialCVs[0].cvFileUrl) {
            const cv = initialCVs[0];
            return {
              jobRoleLevelId: cv.jobRoleLevelId!,
              version: cv.version!,
              cvFileUrl: cv.cvFileUrl!,
              isActive: true, // CV mới khi tạo talent luôn mặc định active
              generatedForJobRequestId: cv.generatedForJobRequestId,
              summary: cv.summary || "",
              isGeneratedFromTemplate: cv.isGeneratedFromTemplate !== undefined ? cv.isGeneratedFromTemplate : false,
              sourceTemplateId: cv.sourceTemplateId
            };
          }
          return undefined;
        })(),
      };

      await talentService.createWithRelatedData(payload);
      alert("✅ Tạo nhân sự thành công!");
      navigate('/ta/developers');
    } catch (error: any) {
      console.error(error);
      // Thu thập thông điệp lỗi từ mọi trường khả dĩ (kể cả objecterror)
      const data = error?.response?.data;
      let combined = "";
      if (typeof data === "string") {
        combined = data;
      } else if (data && typeof data === "object") {
        try {
          // Thu thập các field phổ biến
          const candidates: string[] = [];
          const tryPush = (v: unknown) => {
            if (typeof v === "string" && v) candidates.push(v);
          };
          tryPush((data as any).error);
          tryPush((data as any).message);
          tryPush((data as any).objecterror);
          tryPush((data as any).Objecterror);
          tryPush((data as any).detail);
          tryPush((data as any).title);
          // Nếu có mảng/lỗi chi tiết
          const values = Object.values(data)
            .map((v) => (typeof v === "string" ? v : ""))
            .filter(Boolean);
          candidates.push(...values);
          combined = candidates.join(" ");
          if (!combined) combined = JSON.stringify(data);
        } catch {
          combined = JSON.stringify(data);
        }
      }
      const lower = (combined || error?.message || "").toLowerCase();
      if (lower.includes("email already exists") || (lower.includes("already exists") && lower.includes("email"))) {
        setErrors(prev => ({ ...prev, email: "Email đã tồn tại trong hệ thống" }));
        setFormError("Email đã tồn tại trong hệ thống");
        alert("❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.");
        return;
      }
      alert("❌ Lỗi khi tạo nhân sự!");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for managing arrays
  const addSkill = () => {
    setTalentSkills([{ skillId: 0, level: "Beginner", yearsExp: 0 }, ...talentSkills]);
  };

  const removeSkill = (index: number) => {
    setTalentSkills(talentSkills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof TalentSkillCreateModel, value: string | number) => {
    const updated = [...talentSkills];
    updated[index] = { ...updated[index], [field]: value };
    
    // Tự động set yearsExp = 1 nếu đang là 0 khi chọn skillId
    if (field === 'skillId' && value && typeof value === 'number' && value > 0) {
      if (updated[index].yearsExp === 0 || updated[index].yearsExp === undefined) {
        updated[index].yearsExp = 1;
      }
    }
    
    setTalentSkills(updated);
  };

  const addWorkExperience = () => {
    setTalentWorkExperiences([{
      company: "",
      position: "",
      startDate: "",
      endDate: undefined,
      description: ""
    }, ...talentWorkExperiences]);
  };

  const removeWorkExperience = (index: number) => {
    setTalentWorkExperiences(talentWorkExperiences.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index: number, field: keyof TalentWorkExperienceCreateModel, value: string | undefined) => {
    const updated = [...talentWorkExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setTalentWorkExperiences(updated);
  };

  const addProject = () => {
    setTalentProjects([{
      projectName: "",
      position: "",
      technologies: "",
      description: ""
    }, ...talentProjects]);
  };

  const removeProject = (index: number) => {
    setTalentProjects(talentProjects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof TalentProjectCreateModel, value: string) => {
    const updated = [...talentProjects];
    updated[index] = { ...updated[index], [field]: value };
    setTalentProjects(updated);
  };

  const addCertificate = () => {
    setTalentCertificates([{
      certificateTypeId: 0,
      certificateName: "",
      certificateDescription: "",
      issuedDate: undefined,
      isVerified: false,
      imageUrl: ""
    }, ...talentCertificates]);
  };

  const removeCertificate = (index: number) => {
    setTalentCertificates(talentCertificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, field: keyof TalentCertificateCreateModel, value: string | number | boolean | undefined) => {
    const updated = [...talentCertificates];
    updated[index] = { ...updated[index], [field]: value };
    setTalentCertificates(updated);
  };

  const addJobRoleLevel = () => {
    setTalentJobRoleLevels([{
      jobRoleLevelId: 0,
      yearsOfExp: 0,
      ratePerMonth: undefined
    }, ...talentJobRoleLevels]);
  };

  const removeJobRoleLevel = (index: number) => {
    // Không cho phép xóa nếu chỉ còn 1 item (bắt buộc)
    if (talentJobRoleLevels.length <= 1) {
      alert("⚠️ Vị trí là bắt buộc. Phải có ít nhất 1 vị trí.");
      return;
    }
    setTalentJobRoleLevels(talentJobRoleLevels.filter((_, i) => i !== index));
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


  const updateJobRoleLevel = (index: number, field: keyof TalentJobRoleLevelCreateModel, value: string | number | undefined) => {
    const updated = [...talentJobRoleLevels];
    updated[index] = { ...updated[index], [field]: value };
    
    // Tự động set yearsOfExp = 1 nếu đang là 0 khi chọn jobRoleLevelId
    if (field === 'jobRoleLevelId' && value && typeof value === 'number' && value > 0) {
      if (updated[index].yearsOfExp === 0 || updated[index].yearsOfExp === undefined) {
        updated[index].yearsOfExp = 1;
      }
    }
    
    setTalentJobRoleLevels(updated);
  };


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="border-b border-neutral-200 bg-white">
            <div className="px-6 py-4">
              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {formError}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <Link to="/ta/developers" className="text-primary-600 hover:text-primary-700 cursor-pointer transition-colors">
                  Nhân sự
                </Link>
                <span>/</span>
                <span className="text-neutral-900 font-semibold">Tạo nhân sự mới</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Tạo nhân sự mới</h1>
                  <p className="text-sm text-neutral-600">
                    Thêm nhân sự (developer) mới vào hệ thống DevPool
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form with Extracted Data Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 py-6">
            {/* Main Form */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
              <form onSubmit={handleSubmit}>
                {/* Checkbox "Trích xuất thông tin từ CV" ở đầu form */}
                <div className="p-6 border-b border-neutral-200">
                  <div className="bg-gradient-to-br from-primary-50 via-primary-50/80 to-secondary-50 rounded-2xl p-6 border border-primary-200/50 shadow-soft">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useExtractCV}
                        onChange={async (e) => {
                          if (e.target.checked) {
                            setUseExtractCV(true);
                            setShowExtractCVModal(true);
                          } else {
                            // Khi uncheck, kiểm tra nếu đã có dữ liệu trích xuất
                            if (extractedData) {
                              // Xây dựng thông báo cảnh báo
                              let warningMessage = "⚠️ Bạn có chắc chắn muốn bỏ trích xuất CV?\n\n";
                              warningMessage += "Tất cả dữ liệu đã trích xuất sẽ bị xóa.\n\n";
                              
                              // Nếu đã upload CV lên Firebase (tạo CV luôn), thêm cảnh báo về việc xóa file
                              if (isUploadedFromFirebase && initialCVs[0]?.cvFileUrl && uploadedCVUrl === initialCVs[0].cvFileUrl) {
                                warningMessage += "⚠️ File CV đã được upload lên Firebase sẽ bị xóa vĩnh viễn.\n\n";
                              }
                              
                              warningMessage += "Bạn có muốn tiếp tục không?";
                              
                              const confirmed = window.confirm(warningMessage);
                              
                              if (!confirmed) {
                                // Người dùng hủy, không làm gì cả
                                return;
                              }
                              
                              // Nếu đã upload CV lên Firebase và đã chọn "Tạo CV luôn", xóa file trên Firebase
                              if (isUploadedFromFirebase && initialCVs[0]?.cvFileUrl && uploadedCVUrl === initialCVs[0].cvFileUrl) {
                                try {
                                  await handleDeleteCVFile(0, true); // skipConfirm = true vì đã confirm ở trên
                                } catch (error) {
                                  console.error("Lỗi khi xóa file CV từ Firebase:", error);
                                  // Vẫn tiếp tục reset dữ liệu dù không xóa được file
                                }
                              }
                            }
                            
                            // Reset tất cả dữ liệu
                            setUseExtractCV(false);
                            setShowExtractCVModal(false);
                            setModalCVFile(null);
                            setCvFile(null);
                            if (modalCVPreviewUrl) {
                              URL.revokeObjectURL(modalCVPreviewUrl);
                              setModalCVPreviewUrl(null);
                            }
                            if (cvPreviewUrl) {
                              URL.revokeObjectURL(cvPreviewUrl);
                              setCvPreviewUrl(null);
                            }
                            // Reset CV URL trong initialCVs và reset về trạng thái ban đầu
                            setInitialCVs([{
                              jobRoleLevelId: undefined,
                              version: 1,
                              cvFileUrl: "",
                              isActive: true,
                              summary: "",
                              isGeneratedFromTemplate: false,
                              sourceTemplateId: undefined,
                              generatedForJobRequestId: undefined
                            }]);
                            setUploadedCVUrl(null);
                            setIsUploadedFromFirebase(false);
                            // Reset extracted data
                            setExtractedData(null);
                            setUnmatchedData({});
                          }
                        }}
                        className="w-5 h-5 text-primary-600 border-2 border-primary-300 rounded focus:ring-2 focus:ring-primary-500/30"
                      />
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary-600" />
                        <div>
                          <h3 className="text-lg font-bold text-primary-900">Trích xuất thông tin từ CV</h3>
                          <p className="text-sm text-primary-700 mt-1">Tải lên file PDF để tự động điền thông tin vào form</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Upload CV Section - Chỉ hiển thị khi useExtractCV = true và chưa trích xuất CV */}
                  {useExtractCV && !extractedData && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Upload className="w-5 h-5 text-primary-600" />
                        <label className="block text-sm font-semibold text-neutral-700">
                          Chọn file CV (PDF)
                        </label>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setCvFile(file);
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setCvPreviewUrl(url);
                            } else {
                              if (cvPreviewUrl) {
                                URL.revokeObjectURL(cvPreviewUrl);
                                setCvPreviewUrl(null);
                              }
                            }
                          }}
                          className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />

                        {/* File Info */}
                        {cvFile && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <FileText className="w-4 h-4" />
                            <span>File đã chọn: <span className="font-medium">{cvFile.name}</span> ({(cvFile.size / 1024).toFixed(2)} KB)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CV Ban Đầu Section - Luôn hiển thị */}
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-neutral-800">
                        CV Ban Đầu <span className="text-red-500">*</span>
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {initialCVs.map((cv, index) => (
                        <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-semibold text-neutral-700">CV Ban Đầu</span>
                          </div>

                          {/* Chọn file CV và Upload Section - Gộp lại */}
                          <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Upload className="w-5 h-5 text-primary-600" />
                              <label className="block text-sm font-semibold text-neutral-700">
                                {cvFile ? 'Upload CV lên Firebase' : 'Chọn file CV (PDF)'}
                              </label>
                            </div>

                            <div className="space-y-3">
                              {!cvFile ? (
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setCvFile(file);
                                    if (file) {
                                      const url = URL.createObjectURL(file);
                                      setCvPreviewUrl(url);
                                    } else {
                                      if (cvPreviewUrl) {
                                        URL.revokeObjectURL(cvPreviewUrl);
                                        setCvPreviewUrl(null);
                                      }
                                    }
                                  }}
                                  className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                              ) : (
                                <>
                                  {/* File Info */}
                                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <FileText className="w-4 h-4" />
                                    <span>File đã chọn: <span className="font-medium">{cvFile.name}</span> ({(cvFile.size / 1024).toFixed(2)} KB)</span>
                                  </div>

                                  {/* Upload Progress */}
                                  {uploadingCV && uploadingCVIndex === index && (
                                    <div className="space-y-2">
                                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-primary-500 to-blue-500 h-3 rounded-full transition-all duration-300 animate-pulse"
                                          style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                      </div>
                                      <p className="text-sm text-center text-primary-700 font-medium">
                                        Đang upload... {uploadProgress}%
                                      </p>
                                    </div>
                                  )}

                                  {/* Upload Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleUploadCV(index)}
                                    disabled={!cvFile || uploadingCV || !cv.version || cv.version <= 0 || !cv.jobRoleLevelId || isUploadedFromFirebase}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {uploadingCV && uploadingCVIndex === index ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang upload...
                                      </>
                                    ) : isUploadedFromFirebase ? (
                                      <>
                                        <Upload className="w-4 h-4" />
                                        Đã upload lên Firebase
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4" />
                                        Upload CV lên Firebase
                                      </>
                                    )}
                                  </button>
                                  {isUploadedFromFirebase && (
                                    <p className="text-xs text-green-600 italic">
                                      ✓ File đã được upload lên Firebase, không thể upload lại
                                    </p>
                                  )}
                                  {(!cv.version || cv.version <= 0) && !isUploadedFromFirebase && (
                                    <p className="text-xs text-red-600 italic">
                                      ⚠️ Vui lòng nhập version CV trước khi upload
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                  Vị trí công việc <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setIsJobRoleLevelDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                                    disabled={isUploadedFromFirebase}
                                    className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white/50 text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${isUploadedFromFirebase ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75' : 'border-neutral-300 focus:border-primary-500'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                                      <Target className="w-4 h-4 text-neutral-400" />
                                      <span>
                                        {cv.jobRoleLevelId
                                          ? jobRoleLevelsForCV.find(jrl => jrl.id === cv.jobRoleLevelId)?.name || "Chọn vị trí"
                                          : "Chọn vị trí"}
                                      </span>
                                    </div>
                                  </button>
                                  {isJobRoleLevelDropdownOpen[index] && !isUploadedFromFirebase && (
                                    <div 
                                      className="absolute z-[60] mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                      onMouseLeave={() => {
                                        setIsJobRoleLevelDropdownOpen(prev => ({ ...prev, [index]: false }));
                                        setJobRoleLevelSearch(prev => ({ ...prev, [index]: "" }));
                                      }}
                                    >
                                      <div className="p-3 border-b border-neutral-100">
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                          <input
                                            type="text"
                                            value={jobRoleLevelSearch[index] || ""}
                                            onChange={(e) => setJobRoleLevelSearch(prev => ({ ...prev, [index]: e.target.value }))}
                                            placeholder="Tìm vị trí..."
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-56 overflow-y-auto">
                                        {(() => {
                                          const searchTerm = jobRoleLevelSearch[index] || "";
                                          const filtered = searchTerm
                                            ? jobRoleLevelsForCV.filter(jrl => jrl.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            : jobRoleLevelsForCV;
                                          if (filtered.length === 0) {
                                            return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                                          }
                                          return filtered.map((jobRoleLevel) => (
                                            <button
                                              type="button"
                                              key={jobRoleLevel.id}
                                              onClick={() => {
                                                updateInitialCV(index, 'jobRoleLevelId', jobRoleLevel.id);
                                                setIsJobRoleLevelDropdownOpen(prev => ({ ...prev, [index]: false }));
                                                setJobRoleLevelSearch(prev => ({ ...prev, [index]: "" }));
                                                
                                                // Tự động set version = 1 nếu đây là CV đầu tiên cho jobRoleLevelId này
                                                const cvsSameJobRoleLevel = initialCVs.filter((c, i) => 
                                                  i !== index && c.jobRoleLevelId === jobRoleLevel.id
                                                );
                                                if (cvsSameJobRoleLevel.length === 0) {
                                                  updateInitialCV(index, 'version', 1);
                                                }
                                              }}
                                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                                cv.jobRoleLevelId === jobRoleLevel.id
                                                  ? "bg-primary-50 text-primary-700"
                                                  : "hover:bg-neutral-50 text-neutral-700"
                                              }`}
                                            >
                                              {jobRoleLevel.name}
                                            </button>
                                          ));
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {!cv.jobRoleLevelId && !isUploadedFromFirebase && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Phải chọn vị trí công việc trước khi upload CV lên Firebase
                                  </p>
                                )}
                                {isUploadedFromFirebase && (
                                  <p className="text-xs text-green-600 mt-1">
                                    File đã được upload lên Firebase, không thể thay đổi vị trí công việc
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                  Version <span className="text-red-500">*</span>
                                </label>
                                {(() => {
                                  // Kiểm tra xem đây có phải là CV đầu tiên cho jobRoleLevelId này không
                                  const cvsSameJobRoleLevel = initialCVs.filter((c, i) => 
                                    i !== index && c.jobRoleLevelId === cv.jobRoleLevelId
                                  );
                                  const isFirstCVForJobRoleLevel = Boolean(cv.jobRoleLevelId && cv.jobRoleLevelId > 0 && cvsSameJobRoleLevel.length === 0);
                                  const versionError = cv.jobRoleLevelId && cv.version ? validateCVVersion(cv.version, cv.jobRoleLevelId, index, initialCVs) : "";
                                  
                                  return (
                                    <>
                                      <input
                                        type="number"
                                        value={cv.version || 1}
                                        onChange={(e) => {
                                          const newVersion = Number(e.target.value);
                                          updateInitialCV(index, 'version', newVersion);
                                        }}
                                        placeholder="1"
                                        min="1"
                                        step="1"
                                        required={cvFile ? true : false}
                                        disabled={isUploadedFromFirebase || isFirstCVForJobRoleLevel}
                                        className={`w-full py-2 px-4 border rounded-lg bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                                          isUploadedFromFirebase || isFirstCVForJobRoleLevel
                                            ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-75'
                                            : versionError
                                              ? 'border-red-500 focus:border-red-500'
                                              : ''
                                        }`}
                                      />
                                      {(isUploadedFromFirebase || isFirstCVForJobRoleLevel) && (
                                        <p className="text-xs text-green-600 mt-1">
                                          {isUploadedFromFirebase 
                                            ? "File đã được upload lên Firebase, không thể thay đổi version CV"
                                            : "Đây là CV đầu tiên cho vị trí công việc này, version mặc định là 1 và không thể thay đổi"}
                                        </p>
                                      )}
                                      {versionError && !isUploadedFromFirebase && !isFirstCVForJobRoleLevel && (
                                        <p className="text-xs text-red-500 mt-1">{versionError}</p>
                                      )}
                                      {cvFile && !isUploadedFromFirebase && !isFirstCVForJobRoleLevel && !versionError && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                          Bắt buộc nhập để upload CV
                                        </p>
                                      )}
                                      {cv.jobRoleLevelId && cvsSameJobRoleLevel.length > 0 && !isUploadedFromFirebase && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                          Các version hiện có cho vị trí này: {cvsSameJobRoleLevel.map(c => c.version || 'N/A').join(', ')}
                                        </p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                  URL file CV <span className="text-red-500">*</span> {cv.cvFileUrl && <span className="text-green-600 text-xs">(✓ Đã có)</span>}
                                </label>

                                {/* Warning when URL is from Firebase */}
                                {cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl && (
                                  <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                                      <span className="font-semibold">🔒</span>
                                      <span>URL này đã được upload từ Firebase và đã bị khóa. Không thể chỉnh sửa trực tiếp. Để nhập URL thủ công, bạn PHẢI nhấn nút "Xóa" để xóa file trong Firebase trước.</span>
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    value={cv.cvFileUrl || ""}
                                    onChange={(e) => handleCVUrlChange(index, e.target.value)}
                                    placeholder="https://... hoặc upload từ file CV đã chọn"
                                    disabled={!!(cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl) || (uploadingCV && uploadingCVIndex === index)}
                                    className={`flex-1 py-2 px-4 border rounded-lg bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${cv.cvFileUrl && uploadedCVUrl === cv.cvFileUrl
                                        ? 'bg-gray-100 cursor-not-allowed opacity-75 border-gray-300'
                                        : isUploadedFromFirebase
                                          ? 'border-green-300 bg-green-50'
                                          : ''
                                      }`}
                                  />
                                  {cv.cvFileUrl && (
                                    <>
                                      <a
                                        href={cv.cvFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Xem
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCVFile(index)}
                                        disabled={uploadingCV && uploadingCVIndex === index}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={uploadedCVUrl === cv.cvFileUrl ? "Xóa URL và file trong Firebase" : "Xóa URL"}
                                      >
                                        <X className="w-4 h-4" />
                                        Xóa
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <button
                                  type="button"
                                  onClick={() => setShowCVSummary(prev => ({ ...prev, [index]: !prev[index] }))}
                                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-2"
                                >
                                  {showCVSummary[index] ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Ẩn mô tả/Tóm tắt
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Xem mô tả/Tóm tắt
                                    </>
                                  )}
                                </button>
                                {showCVSummary[index] && (
                                  <textarea
                                    value={cv.summary || ""}
                                    onChange={(e) => updateInitialCV(index, 'summary', e.target.value)}
                                    placeholder="Tóm tắt kinh nghiệm..."
                                    rows={3}
                                    className="w-full py-2 px-4 border rounded-lg bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>

                {/* Tab Navigation - Sticky */}
                <div className="sticky top-16 z-50 border-b border-neutral-200 bg-white shadow-sm">
                  <div className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <button
                      type="button"
                      onClick={() => setActiveTab("required")}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === "required"
                          ? "border-primary-500 text-primary-600 bg-white"
                          : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Thông tin cơ bản
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
                      onClick={() => setActiveTab("experience")}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === "experience"
                          ? "border-primary-500 text-primary-600 bg-white"
                          : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Kinh nghiệm
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
                      <FolderOpen className="w-4 h-4" />
                      Dự án
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
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Tab: Thông tin bắt buộc (gồm: Thông tin cơ bản, CV, Vị trí) */}
                    {activeTab === "required" && (
                      <>
                        {/* Họ tên */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-primary-500" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                        }`}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email + SĐT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="example@domain.com"
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                          }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        required
                        placeholder="0123456789"
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                          }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Ngày sinh + Chế độ làm việc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Ngày sinh
                    </label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ""}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 hover:shadow-soft transition-all ${errors.dateOfBirth ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                          }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Chế độ làm việc <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <select
                        name="workingMode"
                        value={formData.workingMode}
                        onChange={handleChange}
                        required
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 transition-all ${errors.workingMode ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                          }`}
                      >
                        <option value={WorkingMode.None}>Không xác định</option>
                        <option value={WorkingMode.Onsite}>Tại văn phòng</option>
                        <option value={WorkingMode.Remote}>Từ xa</option>
                        <option value={WorkingMode.Hybrid}>Kết hợp</option>
                        <option value={WorkingMode.Flexible}>Linh hoạt</option>
                      </select>
                    </div>
                    {errors.workingMode && (
                      <p className="mt-1 text-sm text-red-500">{errors.workingMode}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Khu vực làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <select
                      name="locationId"
                      value={formData.locationId ? String(formData.locationId) : ""}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 focus:ring-2 focus:ring-primary-500/20 transition-all ${errors.locationId ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                        }`}
                    >
                      <option value="">-- Chọn khu vực làm việc --</option>
                      {locations && locations.length > 0 ? (
                        locations.map((location) => (
                          <option key={location.id} value={String(location.id)}>
                            {location.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Đang tải dữ liệu...</option>
                      )}
                    </select>
                  </div>
                  {errors.locationId && (
                    <p className="mt-1 text-sm text-red-500">{errors.locationId}</p>
                  )}
                </div>

                {/* Partner */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Đối tác <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPartnerDropdownOpen(prev => !prev)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 border rounded-xl bg-white/50 text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${errors.currentPartnerId ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 focus:border-primary-500'
                        }`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Building2 className="w-5 h-5 text-neutral-400" />
                        <span>
                          {formData.currentPartnerId
                            ? partners.find(p => p.id === formData.currentPartnerId)?.companyName || "Chọn đối tác"
                            : "Chọn đối tác"}
                        </span>
                      </div>
                    </button>
                    {isPartnerDropdownOpen && (
                      <div 
                        className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                        onMouseLeave={() => {
                          setIsPartnerDropdownOpen(false);
                          setPartnerSearchQuery("");
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={partnerSearchQuery}
                              onChange={(e) => setPartnerSearchQuery(e.target.value)}
                              placeholder="Tìm đối tác..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            const filteredPartners = partnerSearchQuery
                              ? partners.filter(p =>
                                p.companyName?.toLowerCase().includes(partnerSearchQuery.toLowerCase())
                              )
                              : partners;

                            if (filteredPartners.length === 0) {
                              return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy đối tác nào</p>;
                            }

                            return filteredPartners.map((partner) => (
                              <button
                                type="button"
                                key={partner.id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, currentPartnerId: partner.id }));
                                  setIsPartnerDropdownOpen(false);
                                  setPartnerSearchQuery("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  formData.currentPartnerId === partner.id
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                {partner.companyName}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.currentPartnerId && (
                    <p className="mt-1 text-sm text-red-500">{errors.currentPartnerId}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full py-3.5 px-4 border rounded-xl bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  >
                    <option value="Available">Sẵn sàng làm việc</option>
                    <option value="Unavailable">Không sẵn sàng</option>
                  </select>
                </div>

                {/* Github + Portfolio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Github URL</label>
                    <div className="relative group">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="url"
                        name="githubUrl"
                        value={formData.githubUrl || ""}
                        onChange={handleChange}
                        placeholder="https://github.com/username"
                        className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Portfolio URL</label>
                    <div className="relative group">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl || ""}
                        onChange={handleChange}
                        placeholder="https://portfolio.com"
                        className="w-full pl-12 pr-4 py-3.5 border rounded-xl bg-white/50 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>
                </div>


                    {/* Phần Vị trí trong tab bắt buộc */}
                    <div className="pt-6 border-t border-neutral-200 mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-primary-600" />
                          <h3 className="text-lg font-semibold text-neutral-800">
                            Vị trí <span className="text-red-500">*</span>
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={addJobRoleLevel}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Thêm
                        </button>
                      </div>
                      {/* Job Role Levels Section - Bắt buộc */}
                      <div className="pt-6 border-t border-neutral-200">
                        {talentJobRoleLevels.map((jrl, index) => (
                          <div key={index} className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-neutral-700">Vị trí #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeJobRoleLevel(index)}
                                disabled={talentJobRoleLevels.length <= 1}
                                className={`text-red-600 hover:text-red-700 transition-colors ${talentJobRoleLevels.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={talentJobRoleLevels.length <= 1 ? 'Vị trí là bắt buộc. Phải có ít nhất 1 vị trí.' : 'Xóa vị trí'}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Dropdown 1: Chọn Vị trí (JobRoleLevel name) */}
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-neutral-700">
                                  Vị trí <span className="text-red-500">*</span>
                                </label>
                                
                                {/* Filter theo loại vị trí */}
                                <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsJobRoleFilterDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs border border-neutral-300 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-600 transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                                <span className="truncate">
                                  {selectedJobRoleFilterId[index]
                                    ? jobRoles.find(r => r.id === selectedJobRoleFilterId[index])?.name || "Loại vị trí"
                                    : "Tất cả loại vị trí"}
                                </span>
                              </div>
                            </button>
                            {isJobRoleFilterDropdownOpen[index] && (
                              <div 
                                className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                onMouseLeave={() => {
                                  setIsJobRoleFilterDropdownOpen(prev => ({ ...prev, [index]: false }));
                                  setJobRoleFilterSearch(prev => ({ ...prev, [index]: "" }));
                                }}
                              >
                                  <div className="p-3 border-b border-neutral-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={jobRoleFilterSearch[index] || ""}
                                        onChange={(e) => setJobRoleFilterSearch(prev => ({ ...prev, [index]: e.target.value }))}
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
                                        setSelectedJobRoleFilterId(prev => ({ ...prev, [index]: undefined }));
                                        setJobRoleFilterSearch(prev => ({ ...prev, [index]: "" }));
                                        setIsJobRoleFilterDropdownOpen(prev => ({ ...prev, [index]: false }));
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        !selectedJobRoleFilterId[index]
                                          ? "bg-primary-50 text-primary-700"
                                          : "hover:bg-neutral-50 text-neutral-700"
                                      }`}
                                    >
                                      Tất cả loại vị trí
                                    </button>
                                    {jobRoles
                                      .filter(role => !jobRoleFilterSearch[index] || role.name.toLowerCase().includes((jobRoleFilterSearch[index] || "").toLowerCase()))
                                      .map(role => (
                                        <button
                                          type="button"
                                          key={role.id}
                                          onClick={() => {
                                            setSelectedJobRoleFilterId(prev => ({ ...prev, [index]: role.id }));
                                            setJobRoleFilterSearch(prev => ({ ...prev, [index]: "" }));
                                            setIsJobRoleFilterDropdownOpen(prev => ({ ...prev, [index]: false }));
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            selectedJobRoleFilterId[index] === role.id
                                              ? "bg-primary-50 text-primary-700"
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
                            
                            <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setIsJobRoleLevelNameDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${errors[`jobrolelevel_${index}`] ? 'border-red-500 bg-red-50' : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                                    <Target className="w-4 h-4 text-neutral-500" />
                                    <span className={selectedJobRoleLevelName[index] ? "font-medium text-neutral-900" : "text-neutral-500"}>
                                      {selectedJobRoleLevelName[index] || "Chọn vị trí"}
                                    </span>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isJobRoleLevelNameDropdownOpen[index] ? 'rotate-180' : ''}`} />
                                </button>
                                {isJobRoleLevelNameDropdownOpen[index] && (
                                  <div 
                                    className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                    onMouseLeave={() => {
                                      setIsJobRoleLevelNameDropdownOpen(prev => ({ ...prev, [index]: false }));
                                      setJobRoleLevelNameSearch(prev => ({ ...prev, [index]: "" }));
                                    }}
                                  >
                                    <div className="p-3 border-b border-neutral-100">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                        <input
                                          type="text"
                                          value={jobRoleLevelNameSearch[index] || ""}
                                          onChange={(e) => setJobRoleLevelNameSearch(prev => ({ ...prev, [index]: e.target.value }))}
                                          onClick={(e) => e.stopPropagation()}
                                          placeholder="Tìm vị trí..."
                                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                      {(() => {
                                        // Lấy danh sách unique names từ jobRoleLevels, có thể filter theo jobRole
                                        let uniqueNames = Array.from(new Set(jobRoleLevels.map(jrl => jrl.name)));
                                        // Filter theo loại vị trí nếu có
                                        if (selectedJobRoleFilterId[index]) {
                                          const filteredByJobRole = jobRoleLevels.filter(l => l.jobRoleId === selectedJobRoleFilterId[index]);
                                          uniqueNames = Array.from(new Set(filteredByJobRole.map(jrl => jrl.name)));
                                        }
                                        const filtered = (jobRoleLevelNameSearch[index] || "")
                                          ? uniqueNames.filter(name => name.toLowerCase().includes((jobRoleLevelNameSearch[index] || "").toLowerCase()))
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
                                              setSelectedJobRoleLevelName(prev => ({ ...prev, [index]: name }));
                                              setIsJobRoleLevelNameDropdownOpen(prev => ({ ...prev, [index]: false }));
                                              setJobRoleLevelNameSearch(prev => ({ ...prev, [index]: "" }));
                                              // Reset level và jobRoleLevelId khi chọn name mới
                                              updateJobRoleLevel(index, 'jobRoleLevelId', 0);
                                              const newErrors = { ...errors };
                                              delete newErrors[`jobrolelevel_${index}`];
                                              setErrors(newErrors);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                              selectedJobRoleLevelName[index] === name
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
                                    if (selectedJobRoleLevelName[index]) {
                                      setIsLevelDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }));
                                    }
                                  }}
                                  disabled={!selectedJobRoleLevelName[index]}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                                    errors[`jobrolelevel_${index}`] ? 'border-red-500 bg-red-50' : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                                  } ${!selectedJobRoleLevelName[index] ? 'opacity-50 cursor-not-allowed bg-neutral-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2 text-sm">
                                    <Target className="w-4 h-4 text-neutral-500" />
                                    <span className={(() => {
                                      if (!selectedJobRoleLevelName[index]) {
                                        return "text-neutral-400";
                                      }
                                      const selectedJRL = jobRoleLevels.find(l => l.id === jrl.jobRoleLevelId);
                                      return selectedJRL ? "font-medium text-neutral-900" : "text-neutral-500";
                                    })()}>
                                      {(() => {
                                        if (!selectedJobRoleLevelName[index]) {
                                          return "Chọn vị trí trước";
                                        }
                                        const selectedJRL = jobRoleLevels.find(l => l.id === jrl.jobRoleLevelId);
                                        return selectedJRL ? getLevelText(selectedJRL.level) : "Chọn cấp độ";
                                      })()}
                                    </span>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isLevelDropdownOpen[index] ? 'rotate-180' : ''}`} />
                                </button>
                                {isLevelDropdownOpen[index] && selectedJobRoleLevelName[index] && (
                                  <div 
                                    className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                    onMouseLeave={() => {
                                      setIsLevelDropdownOpen(prev => ({ ...prev, [index]: false }));
                                    }}
                                  >
                                    <div className="max-h-56 overflow-y-auto">
                                      {(() => {
                                        // Lấy các level có sẵn cho name đã chọn
                                        const availableLevels = jobRoleLevels
                                          .filter(jrl => jrl.name === selectedJobRoleLevelName[index])
                                          .map(jrl => jrl.level)
                                          .filter((level, idx, self) => self.indexOf(level) === idx); // Unique levels
                                        
                                        if (availableLevels.length === 0) {
                                          return <p className="px-4 py-3 text-sm text-neutral-500">Không có cấp độ nào cho vị trí này</p>;
                                        }
                                        
                                        const selectedJobRoleLevelIds = talentJobRoleLevels
                                          .filter((_, i) => i !== index)
                                          .map(jrl => jrl.jobRoleLevelId)
                                          .filter(id => id > 0);

                                        return availableLevels.map((level) => {
                                          // Tìm JobRoleLevel có name và level tương ứng
                                          const matchingJRL = jobRoleLevels.find(jrl => 
                                            jrl.name === selectedJobRoleLevelName[index] && jrl.level === level
                                          );
                                          const isDisabled = matchingJRL ? selectedJobRoleLevelIds.includes(matchingJRL.id) : false;
                                          
                                          return (
                                            <button
                                              type="button"
                                              key={level}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (matchingJRL && !isDisabled) {
                                                  updateJobRoleLevel(index, 'jobRoleLevelId', matchingJRL.id);
                                                  setIsLevelDropdownOpen(prev => ({ ...prev, [index]: false }));
                                                  const newErrors = { ...errors };
                                                  delete newErrors[`jobrolelevel_${index}`];
                                                  setErrors(newErrors);
                                                  // Tự động điền vào ô lọc loại vị trí
                                                  setSelectedJobRoleFilterId(prev => ({ ...prev, [index]: matchingJRL.jobRoleId }));
                                                }
                                              }}
                                              disabled={isDisabled || !matchingJRL}
                                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                                matchingJRL && jrl.jobRoleLevelId === matchingJRL.id
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
                              {!selectedJobRoleLevelName[index] && (
                                <p className="text-xs text-neutral-400 mt-1">Vui lòng chọn vị trí trước</p>
                              )}
                              {errors[`jobrolelevel_${index}`] && (
                                <p className="text-xs text-red-500 mt-1">{errors[`jobrolelevel_${index}`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    </div>
                      </>
                    )}

                    {/* Tab: Dự án */}
                    {activeTab === "projects" && (
                      <>
                        {/* Projects Section */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-neutral-800">Dự Án</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addProject}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  </div>
                  {talentProjects.map((project, index) => (
                    <div key={index} className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-neutral-700">Dự án #{index + 1}</span>
                        <button type="button" onClick={() => removeProject(index)} className="text-red-600 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Tên dự án <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={project.projectName}
                              onChange={(e) => {
                                updateProject(index, 'projectName', e.target.value);
                                // Xóa lỗi khi người dùng nhập
                                if (e.target.value.trim() !== '') {
                                  const newErrors = { ...errors };
                                  delete newErrors[`project_name_${index}`];
                                  setErrors(newErrors);
                                }
                              }}
                              className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`project_name_${index}`] ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            />
                            {errors[`project_name_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`project_name_${index}`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Vị trí trong dự án <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={project.position}
                              onChange={(e) => {
                                updateProject(index, 'position', e.target.value);
                                // Xóa lỗi khi người dùng nhập
                                if (e.target.value.trim() !== '') {
                                  const newErrors = { ...errors };
                                  delete newErrors[`project_position_${index}`];
                                  setErrors(newErrors);
                                }
                              }}
                              className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`project_position_${index}`] ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            />
                            {errors[`project_position_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`project_position_${index}`]}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">Công nghệ sử dụng</label>
                          <input
                            type="text"
                            value={project.technologies}
                            onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                            placeholder="React, Node.js, MongoDB..."
                            className="w-full py-2 px-3 border rounded-lg bg-white border-neutral-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">Mô tả dự án</label>
                          <textarea
                            value={project.description}
                            onChange={(e) => updateProject(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full py-2 px-3 border rounded-lg bg-white border-neutral-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                      </>
                    )}

                    {/* Tab: Kỹ năng */}
                    {activeTab === "skills" && (
                      <>
                        {/* Skills Section */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-neutral-800">Kỹ Năng</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  </div>

                  {/* Skill Filter - Chỉ hiển thị khi đã có ít nhất 1 kỹ năng được thêm */}
                  {talentSkills.length > 0 && skills && skills.length > 0 && skillGroups && skillGroups.length > 0 && (
                    <div className="mb-4">
                      {/* Lọc theo nhóm kỹ năng - Popover */}
                      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                        <label className="block text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5" />
                          Lọc danh sách kỹ năng theo nhóm
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsSkillGroupDropdownOpen(prev => !prev)}
                            className="w-full flex items-center justify-between px-3 py-1.5 border rounded-lg bg-white text-left focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-all border-neutral-300"
                          >
                            <div className="flex items-center gap-2 text-xs text-neutral-700">
                              <Filter className="w-3.5 h-3.5 text-neutral-400" />
                              <span>
                                {selectedSkillGroupId
                                  ? skillGroups.find(g => g.id === selectedSkillGroupId)?.name || "Nhóm kỹ năng"
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
                                    ? skillGroups.filter(g =>
                                      g.name.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()) ||
                                      (g.description && g.description.toLowerCase().includes(skillGroupSearchQuery.toLowerCase()))
                                    )
                                    : skillGroups;
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

                  {talentSkills.map((skill, index) => (
                    <div key={index} className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-neutral-700">Kỹ năng #{index + 1}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSkill(index)} 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-neutral-700">
                            Kỹ năng <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsSkillDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                              className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${errors[`skill_${index}`] ? 'border-red-500 bg-red-50' : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                                }`}
                            >
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Star className="w-4 h-4 text-neutral-500" />
                                <span className={skill.skillId ? "font-medium text-neutral-900" : "text-neutral-500"}>
                                  {skill.skillId
                                    ? skills.find(s => s.id === skill.skillId)?.name || "Chọn kỹ năng"
                                    : "Chọn kỹ năng"}
                                </span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isSkillDropdownOpen[index] ? 'rotate-180' : ''}`} />
                            </button>
                            {isSkillDropdownOpen[index] && (
                              <div 
                                className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                                onMouseLeave={() => {
                                  setIsSkillDropdownOpen(prev => ({ ...prev, [index]: false }));
                                  setSkillSearchQuery(prev => ({ ...prev, [index]: "" }));
                                }}
                              >
                                <div className="p-3 border-b border-neutral-100">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                    <input
                                      type="text"
                                      value={skillSearchQuery[index] || ""}
                                      onChange={(e) => setSkillSearchQuery(prev => ({ ...prev, [index]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="Tìm kỹ năng..."
                                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {(() => {
                                    // Filter skills theo search query và skill group
                                    const filteredSkills = skills.filter((s) => {
                                      const matchesSearch = !skillSearchQuery[index] ||
                                        s.name.toLowerCase().includes((skillSearchQuery[index] || "").toLowerCase()) ||
                                        (s.description && s.description.toLowerCase().includes((skillSearchQuery[index] || "").toLowerCase()));
                                      const matchesGroup = !selectedSkillGroupId || s.skillGroupId === selectedSkillGroupId;
                                      return matchesSearch && matchesGroup;
                                    });

                                    if (filteredSkills.length === 0) {
                                      return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy kỹ năng nào</p>;
                                    }

                                    const selectedSkillIds = talentSkills
                                      .filter((_, i) => i !== index)
                                      .map(skill => skill.skillId)
                                      .filter(id => id > 0);

                                    return filteredSkills.map((s) => {
                                      const isDisabled = selectedSkillIds.includes(s.id);
                                      return (
                                        <button
                                          type="button"
                                          key={s.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!isDisabled) {
                                              updateSkill(index, 'skillId', s.id);
                                              // Tự động set nhóm kỹ năng theo skill đã chọn
                                              if (s.skillGroupId) {
                                                setSelectedSkillGroupId(s.skillGroupId);
                                              }
                                              setIsSkillDropdownOpen(prev => ({ ...prev, [index]: false }));
                                              setSkillSearchQuery(prev => ({ ...prev, [index]: "" }));
                                              const newErrors = { ...errors };
                                              delete newErrors[`skill_${index}`];
                                              setErrors(newErrors);
                                            }
                                          }}
                                          disabled={isDisabled}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            skill.skillId === s.id
                                              ? "bg-primary-50 text-primary-700"
                                              : isDisabled
                                                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed italic"
                                                : "hover:bg-neutral-50 text-neutral-700"
                                          }`}
                                        >
                                          {s.name}{isDisabled ? ' (đã chọn)' : ''}
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          {errors[`skill_${index}`] && (
                            <p className="text-xs text-red-500 mt-1">{errors[`skill_${index}`]}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-neutral-700">Cấp độ</label>
                          <div className="relative">
                            <select
                              value={skill.level}
                              onChange={(e) => updateSkill(index, 'level', e.target.value)}
                              className="w-full px-3 py-2.5 border rounded-lg bg-white text-sm text-neutral-700 border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-primary-300 transition-all appearance-none cursor-pointer"
                            >
                              <option value="Beginner">Mới bắt đầu</option>
                              <option value="Intermediate">Trung bình</option>
                              <option value="Advanced">Nâng cao</option>
                              <option value="Expert">Chuyên gia</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                      </>
                    )}

                    {/* Tab: Chứng chỉ */}
                    {activeTab === "certificates" && (
                      <>
                        {/* Certificates Section */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-neutral-800">Chứng Chỉ</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addCertificate}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  </div>
                  {talentCertificates.map((cert, index) => (
                    <div key={index} className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-neutral-700">Chứng chỉ #{index + 1}</span>
                        <button type="button" onClick={() => removeCertificate(index)} className="text-red-600 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Loại chứng chỉ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsCertificateTypeDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                                className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${errors[`certificate_${index}`] ? 'border-red-500' : 'border-neutral-300 focus:border-primary-500'
                                  }`}
                              >
                                <div className="flex items-center gap-2 text-sm text-neutral-700">
                                  <Award className="w-4 h-4 text-neutral-400" />
                                  <span>
                                    {cert.certificateTypeId
                                      ? certificateTypes.find(t => t.id === cert.certificateTypeId)?.name || "Chọn loại chứng chỉ"
                                      : "Chọn loại chứng chỉ"}
                                  </span>
                                </div>
                              </button>
                              {isCertificateTypeDropdownOpen[index] && (
                                <div 
                                  className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                  onMouseLeave={() => {
                                    setIsCertificateTypeDropdownOpen(prev => ({ ...prev, [index]: false }));
                                    setCertificateTypeSearch(prev => ({ ...prev, [index]: "" }));
                                  }}
                                >
                                  <div className="p-3 border-b border-neutral-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={certificateTypeSearch[index] || ""}
                                        onChange={(e) => setCertificateTypeSearch(prev => ({ ...prev, [index]: e.target.value }))}
                                        placeholder="Tìm loại chứng chỉ..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto">
                                    {(() => {
                                      const filtered = (certificateTypeSearch[index] || "")
                                        ? certificateTypes.filter(t => t.name.toLowerCase().includes((certificateTypeSearch[index] || "").toLowerCase()))
                                        : certificateTypes;
                                      if (filtered.length === 0) {
                                        return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy loại chứng chỉ nào</p>;
                                      }
                                      return filtered.map((type) => {
                                        return (
                                          <button
                                            type="button"
                                            key={type.id}
                                            onClick={() => {
                                              updateCertificate(index, 'certificateTypeId', type.id);
                                              setIsCertificateTypeDropdownOpen(prev => ({ ...prev, [index]: false }));
                                              setCertificateTypeSearch(prev => ({ ...prev, [index]: "" }));
                                              const newErrors = { ...errors };
                                              delete newErrors[`certificate_${index}`];
                                              setErrors(newErrors);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                              cert.certificateTypeId === type.id
                                                ? "bg-primary-50 text-primary-700"
                                                : "hover:bg-neutral-50 text-neutral-700"
                                            }`}
                                          >
                                            {type.name}
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                            {errors[`certificate_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`certificate_${index}`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">Ngày cấp</label>
                            <input
                              type="date"
                              value={cert.issuedDate || ""}
                              onChange={(e) => updateCertificate(index, 'issuedDate', e.target.value || undefined)}
                              className="w-full py-2 px-3 border rounded-lg bg-white border-neutral-300"
                            />
                          </div>
                        </div>

                        {/* Tên chứng chỉ */}
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">
                            Tên chứng chỉ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={cert.certificateName || ""}
                            onChange={(e) => {
                              updateCertificate(index, 'certificateName', e.target.value);
                              // Xóa lỗi khi người dùng nhập
                              if (e.target.value.trim() !== '') {
                                const newErrors = { ...errors };
                                delete newErrors[`certificate_name_${index}`];
                                setErrors(newErrors);
                              }
                            }}
                            maxLength={255}
                            className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`certificate_name_${index}`] ? 'border-red-500' : 'border-neutral-300'
                              }`}
                            placeholder="Nhập tên chứng chỉ"
                          />
                          {errors[`certificate_name_${index}`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`certificate_name_${index}`]}</p>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            Tối đa 255 ký tự
                          </p>
                        </div>

                        {/* Mô tả chứng chỉ */}
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">
                            Mô tả chứng chỉ (tùy chọn)
                          </label>
                          <textarea
                            value={cert.certificateDescription || ""}
                            onChange={(e) => {
                              updateCertificate(index, 'certificateDescription', e.target.value);
                              // Xóa lỗi khi người dùng nhập
                              if (!e.target.value || e.target.value.length <= 1000) {
                                const newErrors = { ...errors };
                                delete newErrors[`certificate_description_${index}`];
                                setErrors(newErrors);
                              }
                            }}
                            maxLength={1000}
                            rows={3}
                            className={`w-full py-2 px-3 border rounded-lg bg-white resize-none ${errors[`certificate_description_${index}`] ? 'border-red-500' : 'border-neutral-300'
                              }`}
                            placeholder="Nhập mô tả về chứng chỉ..."
                          />
                          {errors[`certificate_description_${index}`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`certificate_description_${index}`]}</p>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            Tối đa 1000 ký tự
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm text-neutral-600 mb-2">
                            URL hình ảnh {cert.imageUrl && <span className="text-green-600 text-xs">(✓ Đã có)</span>}
                          </label>

                          {/* Upload Image Section */}
                          <div className="mb-3 p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Upload className="w-4 h-4 text-primary-600" />
                              <label className="block text-xs font-semibold text-neutral-700">
                                Upload ảnh chứng chỉ
                              </label>
                            </div>

                            <div className="space-y-2">
                              {/* File Input */}
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChangeCertificate(index, e)}
                                  disabled={uploadingCertificateIndex === index}
                                  className="w-full text-xs py-1.5 px-2 border rounded-lg bg-white border-neutral-300 focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {certificateImageFiles[index] && (
                                  <div className="flex items-center gap-2 text-xs text-neutral-600 mt-1">
                                    <FileText className="w-3 h-3" />
                                    <span>Đã chọn: <span className="font-medium">{certificateImageFiles[index].name}</span> ({(certificateImageFiles[index].size / 1024).toFixed(2)} KB)</span>
                                  </div>
                                )}
                              </div>

                              {/* Upload Progress */}
                              {uploadingCertificateIndex === index && (
                                <div className="space-y-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                                      style={{ width: `${certificateUploadProgress[index] || 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-center text-primary-700 font-medium">
                                    Đang upload... {certificateUploadProgress[index] || 0}%
                                  </p>
                                </div>
                              )}

                              {/* Upload Button */}
                              <button
                                type="button"
                                onClick={() => handleUploadCertificateImage(index)}
                                disabled={!certificateImageFiles[index] || uploadingCertificateIndex === index}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              >
                                {uploadingCertificateIndex === index ? (
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
                          </div>

                          {/* Manual URL Input */}
                          <div className="space-y-2">
                            {cert.imageUrl && uploadedCertificateUrls[index] === cert.imageUrl && (
                              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs text-orange-700 flex items-center gap-1.5">
                                  <span className="font-semibold">🔒</span>
                                  <span>URL này đã được upload từ Firebase và đã bị khóa. Không thể chỉnh sửa trực tiếp. Để nhập URL thủ công, bạn PHẢI nhấn nút "Xóa" để xóa file trong Firebase trước.</span>
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={cert.imageUrl || ""}
                                onChange={(e) => handleCertificateImageUrlChange(index, e.target.value)}
                                placeholder="https://... hoặc upload từ file ảnh đã chọn"
                                disabled={!!(cert.imageUrl && uploadedCertificateUrls[index] === cert.imageUrl)}
                                className={`flex-1 py-2 px-3 border rounded-lg bg-white border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm ${cert.imageUrl && uploadedCertificateUrls[index] === cert.imageUrl
                                    ? 'bg-gray-100 cursor-not-allowed opacity-75 border-gray-300'
                                    : ''
                                  }`}
                              />
                              {cert.imageUrl && (
                                <>
                                  <a
                                    href={cert.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all text-xs"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Xem
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCertificateImage(index)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs"
                                    title={uploadedCertificateUrls[index] === cert.imageUrl ? "Xóa URL và file trong Firebase" : "Xóa URL"}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">Đã xác thực?</label>
                          <select
                            value={cert.isVerified.toString()}
                            onChange={(e) => updateCertificate(index, 'isVerified', e.target.value === 'true')}
                            className="w-full py-2 px-3 border rounded-lg bg-white border-neutral-300"
                          >
                            <option value="false">Chưa xác thực</option>
                            <option value="true">Đã xác thực</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                      </>
                    )}

                    {/* Tab: Kinh nghiệm */}
                    {activeTab === "experience" && (
                      <>
                        {/* Work Experiences Section */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Workflow className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-neutral-800">Kinh Nghiệm</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addWorkExperience}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  </div>
                  {talentWorkExperiences.map((exp, index) => (
                    <div key={index} className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-neutral-700">Kinh nghiệm #{index + 1}</span>
                        <button type="button" onClick={() => removeWorkExperience(index)} className="text-red-600 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Công ty <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                updateWorkExperience(index, 'company', e.target.value);
                                // Xóa lỗi khi người dùng nhập
                                if (e.target.value.trim() !== '') {
                                  const newErrors = { ...errors };
                                  delete newErrors[`workexp_company_${index}`];
                                  setErrors(newErrors);
                                }
                              }}
                              className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`workexp_company_${index}`] ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            />
                            {errors[`workexp_company_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`workexp_company_${index}`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Vị trí <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsWorkExperiencePositionDropdownOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                                className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${errors[`workexp_position_${index}`] ? 'border-red-500' : 'border-neutral-300 focus:border-primary-500'
                                  }`}
                              >
                                <div className="flex items-center gap-2 text-sm text-neutral-700">
                                  <Target className="w-4 h-4 text-neutral-400" />
                                  <span className={exp.position ? "text-neutral-800" : "text-neutral-500"}>
                                    {exp.position || "Chọn vị trí"}
                                  </span>
                                </div>
                              </button>
                              {isWorkExperiencePositionDropdownOpen[index] && (
                                <div 
                                  className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-2xl"
                                  onMouseLeave={() => {
                                    setIsWorkExperiencePositionDropdownOpen(prev => ({ ...prev, [index]: false }));
                                    setWorkExperiencePositionSearch(prev => ({ ...prev, [index]: "" }));
                                  }}
                                >
                                  <div className="p-3 border-b border-neutral-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={workExperiencePositionSearch[index] || ""}
                                        onChange={(e) => setWorkExperiencePositionSearch(prev => ({ ...prev, [index]: e.target.value }))}
                                        placeholder="Tìm vị trí..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto">
                                    {(() => {
                                      const filtered = (workExperiencePositionSearch[index] || "")
                                        ? workExperiencePositions.filter(p => p.toLowerCase().includes((workExperiencePositionSearch[index] || "").toLowerCase()))
                                        : workExperiencePositions;
                                      if (filtered.length === 0) {
                                        return <p className="px-4 py-3 text-sm text-neutral-500">Không tìm thấy vị trí nào</p>;
                                      }
                                      return filtered.map((position) => (
                                        <button
                                          type="button"
                                          key={position}
                                          onClick={() => {
                                            updateWorkExperience(index, 'position', position);
                                            setIsWorkExperiencePositionDropdownOpen(prev => ({ ...prev, [index]: false }));
                                            setWorkExperiencePositionSearch(prev => ({ ...prev, [index]: "" }));
                                            const newErrors = { ...errors };
                                            delete newErrors[`workexp_position_${index}`];
                                            setErrors(newErrors);
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            exp.position === position
                                              ? "bg-primary-50 text-primary-700"
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
                            {errors[`workexp_position_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`workexp_position_${index}`]}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">
                              Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => {
                                updateWorkExperience(index, 'startDate', e.target.value);
                                // Validate và xóa lỗi khi người dùng chọn
                                const newErrors = { ...errors };
                                if (e.target.value.trim() !== '') {
                                  if (validateStartDate(e.target.value)) {
                                    delete newErrors[`workexp_startdate_${index}`];
                                    // Nếu có endDate, kiểm tra lại endDate
                                    if (exp.endDate) {
                                      const startDate = new Date(e.target.value);
                                      const endDate = new Date(exp.endDate);
                                      if (endDate >= startDate) {
                                        delete newErrors[`workexp_enddate_${index}`];
                                      }
                                    }
                                  } else {
                                    newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày bắt đầu không hợp lệ (không được sau ngày hiện tại)`;
                                  }
                                } else {
                                  delete newErrors[`workexp_startdate_${index}`];
                                }
                                setErrors(newErrors);
                              }}
                              className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`workexp_startdate_${index}`] ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            />
                            {errors[`workexp_startdate_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`workexp_startdate_${index}`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-neutral-600 mb-1">Ngày kết thúc (hoặc để trống nếu đang làm)</label>
                            <input
                              type="date"
                              value={exp.endDate || ""}
                              onChange={(e) => {
                                updateWorkExperience(index, 'endDate', e.target.value || undefined);
                                // Validate endDate phải sau startDate
                                const newErrors = { ...errors };
                                if (e.target.value.trim() !== '' && exp.startDate) {
                                  const startDate = new Date(exp.startDate);
                                  const endDate = new Date(e.target.value);
                                  if (endDate < startDate) {
                                    newErrors[`workexp_enddate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày kết thúc phải sau ngày bắt đầu`;
                                  } else {
                                    delete newErrors[`workexp_enddate_${index}`];
                                  }
                                } else {
                                  delete newErrors[`workexp_enddate_${index}`];
                                }
                                setErrors(newErrors);
                              }}
                              className={`w-full py-2 px-3 border rounded-lg bg-white ${errors[`workexp_enddate_${index}`] ? 'border-red-500' : 'border-neutral-300'
                                }`}
                            />
                            {errors[`workexp_enddate_${index}`] && (
                              <p className="mt-1 text-xs text-red-500">{errors[`workexp_enddate_${index}`]}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-neutral-600 mb-1">Mô tả</label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full py-2 px-3 border rounded-lg bg-white border-neutral-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                      </>
                    )}

                    {/* Submit Button - Hiển thị ở tất cả các tab */}
                    <div className="pt-6 border-t border-neutral-200 mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang tạo...</span>
                      </div>
                    ) : (
                      "Tạo nhân sự"
                    )}
                  </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Modal Trích xuất CV */}
              {showExtractCVModal && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
                  style={{ paddingTop: '10vh' }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowExtractCVModal(false);
                      setModalCVFile(null);
                      if (modalCVPreviewUrl) {
                        URL.revokeObjectURL(modalCVPreviewUrl);
                        setModalCVPreviewUrl(null);
                      }
                      if (!extractedData) {
                        setUseExtractCV(false);
                      }
                    }
                  }}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col mb-8" 
                    style={{ maxHeight: '80vh' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header - Sticky */}
                    <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900">Trích xuất thông tin từ CV</h3>
                          <p className="text-xs text-neutral-600 mt-0.5">Tải lên file PDF để tự động điền thông tin</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtractCVModal(false);
                          setModalCVFile(null);
                          if (modalCVPreviewUrl) {
                            URL.revokeObjectURL(modalCVPreviewUrl);
                            setModalCVPreviewUrl(null);
                          }
                          // Nếu chưa extract, uncheck checkbox
                          if (!extractedData) {
                            setUseExtractCV(false);
                          }
                        }}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {modalCVPreviewUrl ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column - Form */}
                          <div className="space-y-4">
                            {/* Upload CV */}
                            <div>
                              <label className="block mb-2 text-sm font-semibold text-neutral-700">Chọn file CV (PDF)</label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={handleModalFileChange}
                                className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              />
                              {modalCVFile && (
                                <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2">
                                  <FileText className="w-3 h-3" />
                                  <span>Đã chọn: <span className="font-medium text-neutral-900">{modalCVFile.name}</span></span>
                                </div>
                              )}
                            </div>

                            {/* Checkbox "Tạo CV luôn" */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={createCVFromExtract}
                                  onChange={(e) => setCreateCVFromExtract(e.target.checked)}
                                  className="w-5 h-5 mt-0.5 text-primary-600 border-2 border-primary-300 rounded focus:ring-2 focus:ring-primary-500/30"
                                />
                                <div>
                                  <span className="text-sm font-semibold text-blue-900 block">Tạo CV luôn</span>
                                  <p className="text-xs text-blue-700 mt-1">
                                    Tự động tạo CV mới cho nhân sự từ file CV đã upload. Nếu không chọn, chỉ lấy thông tin để điền vào form.
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Right Column - CV Preview (Gọn lại) */}
                          <div className="border-2 border-primary-200 rounded-xl overflow-hidden bg-white shadow-md flex flex-col">
                            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-2 flex items-center justify-between border-b border-primary-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <Eye className="w-3.5 h-3.5 text-primary-600" />
                                </div>
                                <span className="text-xs font-semibold text-primary-800">Xem trước CV</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => window.open(modalCVPreviewUrl, '_blank')}
                                className="px-2 py-1 text-xs text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-lg flex items-center gap-1 transition-all"
                              >
                                <Eye className="w-3 h-3" />
                                Mở toàn màn hình
                              </button>
                            </div>
                            <div className="flex-1 bg-white" style={{ height: '350px', minHeight: '350px' }}>
                              <iframe
                                src={modalCVPreviewUrl}
                                className="w-full h-full border-0"
                                title="CV Preview"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Upload CV */}
                          <div>
                            <label className="block mb-2 text-sm font-semibold text-neutral-700">Chọn file CV (PDF)</label>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleModalFileChange}
                              className="w-full px-4 py-3 text-sm border-2 border-neutral-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                            {modalCVFile && (
                              <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2">
                                <FileText className="w-3 h-3" />
                                <span>Đã chọn: <span className="font-medium text-neutral-900">{modalCVFile.name}</span></span>
                              </div>
                            )}
                          </div>

                          {/* Checkbox "Tạo CV luôn" */}
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={createCVFromExtract}
                                onChange={(e) => setCreateCVFromExtract(e.target.checked)}
                                className="w-5 h-5 mt-0.5 text-primary-600 border-2 border-primary-300 rounded focus:ring-2 focus:ring-primary-500/30"
                              />
                              <div>
                                <span className="text-sm font-semibold text-blue-900 block">Tạo CV luôn</span>
                                <p className="text-xs text-blue-700 mt-1">
                                  Tự động tạo CV mới cho nhân sự từ file CV đã upload. Nếu không chọn, chỉ lấy thông tin để điền vào form.
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer - Sticky */}
                    <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex gap-3 rounded-b-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtractCVModal(false);
                          setModalCVFile(null);
                          if (modalCVPreviewUrl) {
                            URL.revokeObjectURL(modalCVPreviewUrl);
                            setModalCVPreviewUrl(null);
                          }
                          // Nếu chưa extract, uncheck checkbox
                          if (!extractedData) {
                            setUseExtractCV(false);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all font-medium text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleExtractCVFromModal}
                        disabled={!modalCVFile || extractingCV}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        {extractingCV ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang trích xuất...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Xác nhận & Trích xuất
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Xem CV */}
              {showCVViewerModal && cvPreviewUrl && (
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowCVViewerModal(false);
                    }
                  }}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col"
                    style={{ maxHeight: '90vh' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900">Xem CV</h3>
                          <p className="text-xs text-neutral-600 mt-0.5">Đối chiếu CV với dữ liệu đã trích xuất</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCVViewerModal(false)}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content - CV Preview */}
                    <div className="flex-1 overflow-hidden p-6">
                      <div className="w-full h-full border-2 border-primary-200 rounded-xl overflow-hidden bg-white shadow-md">
                        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-5 py-3 flex items-center justify-between border-b border-primary-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm font-semibold text-primary-800">CV Preview</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open(cvPreviewUrl, '_blank')}
                            className="px-3 py-1.5 text-xs text-primary-700 hover:text-primary-900 hover:bg-primary-100 rounded-lg flex items-center gap-1.5 transition-all font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Mở toàn màn hình
                          </button>
                        </div>
                        <div className="w-full bg-white" style={{ height: 'calc(90vh - 200px)' }}>
                          <iframe
                            src={cvPreviewUrl}
                            className="w-full h-full border-0"
                            title="CV Preview"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Data Sidebar - Sticky với Tab Navigation Dọc */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-white rounded-2xl shadow-lg border border-neutral-200 max-h-[calc(100vh-1rem)] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">
                        Dữ Liệu Đã Trích Xuất
                      </h3>
                      <p className="text-xs text-neutral-600">Tham khảo khi điền form</p>
                    </div>
                  </div>
                </div>

                {/* CV Viewer Button - Mở popup xem CV */}
                {cvPreviewUrl && (
                  <div className="border-b border-neutral-200 bg-white">
                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => setShowCVViewerModal(true)}
                        className="w-full flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 hover:from-primary-100 hover:to-secondary-100 border border-primary-200 rounded-lg transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                            <Eye className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-sm font-semibold text-neutral-900">Xem CV</h4>
                            <p className="text-xs text-neutral-600">Đối chiếu CV với dữ liệu đã trích xuất</p>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-primary-600 group-hover:text-primary-700 transition-colors" />
                      </button>
                    </div>
                  </div>
                )}

                  {/* Layout với Content bên trái và Tab dọc bên phải */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* Tab Content - Scrollable bên trái */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                      {/* Tab: Tổng quan */}
                      {activeSidebarTab === "overview" && (
                        extractedData &&
                        (extractedData.fullName ||
                          extractedData.email ||
                          extractedData.phone ||
                          extractedData.locationName ||
                          extractedData.workingMode ||
                          extractedData.githubUrl ||
                          extractedData.portfolioUrl ||
                          extractedData.dateOfBirth) ? (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <div className="space-y-2.5">
                              {extractedData.fullName && (
                                <div className="flex items-start gap-2">
                                  <User className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Họ và tên</p>
                                    <p className="text-sm font-medium text-neutral-900 break-words">{extractedData.fullName}</p>
                                  </div>
                                </div>
                              )}
                              {extractedData.email && (
                                <div className="flex items-start gap-2">
                                  <Mail className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Email</p>
                                    <a
                                      href={`mailto:${extractedData.email}`}
                                      className="text-sm font-medium text-primary-600 hover:text-primary-700 break-all"
                                    >
                                      {extractedData.email}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {extractedData.phone && (
                                <div className="flex items-start gap-2">
                                  <Phone className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Số điện thoại</p>
                                    <p className="text-sm font-medium text-neutral-900">{extractedData.phone}</p>
                                  </div>
                                </div>
                              )}
                              {extractedData.dateOfBirth && (
                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Ngày sinh</p>
                                    <p className="text-sm font-medium text-neutral-900">{extractedData.dateOfBirth}</p>
                                  </div>
                                </div>
                              )}
                              {extractedData.locationName && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Khu vực làm việc</p>
                                    <p className="text-sm font-medium text-neutral-900">{extractedData.locationName}</p>
                                  </div>
                                </div>
                              )}
                              {extractedData.workingMode && (
                                <div className="flex items-start gap-2">
                                  <Globe className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Chế độ làm việc</p>
                                    <p className="text-sm font-medium text-neutral-900">
                                      {extractedData.workingMode === "Remote"
                                        ? "Từ xa"
                                        : extractedData.workingMode === "Onsite"
                                          ? "Tại văn phòng"
                                          : extractedData.workingMode === "Hybrid"
                                            ? "Kết hợp"
                                            : extractedData.workingMode === "Flexible"
                                              ? "Linh hoạt"
                                              : extractedData.workingMode}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {extractedData.githubUrl && (
                                <div className="flex items-start gap-2">
                                  <Github className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Github URL</p>
                                    <a
                                      href={extractedData.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-primary-600 hover:text-primary-700 break-all underline"
                                    >
                                      {extractedData.githubUrl}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {extractedData.portfolioUrl && (
                                <div className="flex items-start gap-2">
                                  <LinkIcon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-neutral-600 mb-0.5">Portfolio URL</p>
                                    <a
                                      href={extractedData.portfolioUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-primary-600 hover:text-primary-700 break-all underline"
                                    >
                                      {extractedData.portfolioUrl}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Kỹ năng */}
                      {activeSidebarTab === "skills" && (
                        extractedData && extractedData.skills && extractedData.skills.length > 0 ? (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="w-4 h-4 text-primary-600" />
                              <span className="text-sm font-semibold text-neutral-900">Kỹ năng ({extractedData.skills.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {extractedData.skills.map((skill, index: number) => {
                                const skillName = typeof skill === 'string' ? skill : skill.skillName;
                                const skillLevel = typeof skill === 'object' ? skill.level : null;
                                return (
                                  <div key={index} className="px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs font-medium text-neutral-900 shadow-sm">
                                    <span>{skillName}</span>
                                    {skillLevel && <span className="text-primary-600 ml-1">({skillLevel})</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Kinh nghiệm */}
                      {activeSidebarTab === "experience" && (
                        extractedData && extractedData.workExperiences && extractedData.workExperiences.length > 0 ? (
                          <div className="space-y-3">
                            {extractedData.workExperiences.map((exp, index: number) => (
                              <div key={index} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <Briefcase className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">{exp.position || 'N/A'}</p>
                                    <p className="text-xs text-neutral-600">{exp.company || 'N/A'}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{exp.startDate || 'N/A'} - {exp.endDate || 'Hiện tại'}</p>
                                    {exp.description && (
                                      <p className="text-xs text-neutral-700 mt-2 italic line-clamp-2">{exp.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Dự án */}
                      {activeSidebarTab === "projects" && (
                        extractedData && extractedData.projects && extractedData.projects.length > 0 ? (
                          <div className="space-y-3">
                            {extractedData.projects.map((project, index: number) => (
                              <div key={index} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <FolderOpen className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">{project.projectName || 'N/A'}</p>
                                    {project.technologies && (
                                      <p className="text-xs text-neutral-600 mt-1">Tech: {project.technologies}</p>
                                    )}
                                    {project.description && (
                                      <p className="text-xs text-neutral-700 mt-2 line-clamp-2">{project.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Chứng chỉ */}
                      {activeSidebarTab === "certificates" && (
                        extractedData && extractedData.certificates && extractedData.certificates.length > 0 ? (
                          <div className="space-y-3">
                            {extractedData.certificates.map((cert, index: number) => (
                              <div key={index} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <Award className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">{cert.certificateName || 'N/A'}</p>
                                    {cert.issuedDate && (
                                      <p className="text-xs text-neutral-600 mt-1">Ngày cấp: {cert.issuedDate}</p>
                                    )}
                                    {cert.certificateDescription && (
                                      <p className="text-xs text-neutral-700 mt-2 line-clamp-2">{cert.certificateDescription}</p>
                                    )}
                                    {cert.imageUrl && (
                                      <a href={cert.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 underline mt-1 inline-block">
                                        Xem hình ảnh →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Vị trí */}
                      {activeSidebarTab === "jobRole" && (
                        extractedData && extractedData.jobRoleLevels && extractedData.jobRoleLevels.length > 0 ? (
                          <div className="space-y-3">
                            {extractedData.jobRoleLevels.map((jrl, index: number) => (
                              <div key={index} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <Target className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900">{jrl.position || 'N/A'}</p>
                                    {jrl.level && (
                                      <p className="text-xs text-neutral-600 mt-1">Cấp độ: {jrl.level}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}

                      {/* Tab: Cảnh báo */}
                      {activeSidebarTab === "warnings" && (
                        (unmatchedData.location ||
                          (unmatchedData.skills && unmatchedData.skills.length > 0) ||
                          (unmatchedData.jobRoles && unmatchedData.jobRoles.length > 0) ||
                          (unmatchedData.certificateTypes && unmatchedData.certificateTypes.length > 0)) ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <X className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-semibold text-orange-700">⚠️ Hệ thống thiếu dữ liệu</span>
                            </div>
                          {unmatchedData.location && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">Khu vực làm việc</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion("location", "/admin/categories/locations/create")}
                                  disabled={suggestionLoading === "location" || isSuggestionPending("location")}
                                  className="text-xs text-orange-600 hover:text-orange-800 underline font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {suggestionLoading === "location"
                                    ? "Đang gửi..."
                                    : isSuggestionPending("location")
                                      ? "Đã gửi (chờ Admin)"
                                      : "Gửi đề xuất"}
                                </button>
                              </div>
                              <p className="text-sm text-orange-800 mb-1">
                                CV có: <span className="font-medium">"{unmatchedData.location}"</span>
                              </p>
                              <p className="text-xs text-orange-700 italic">
                                💡 Đề xuất: Thêm khu vực này vào hệ thống trước khi tạo nhân sự để tự động điền.
                              </p>
                            </div>
                          )}
                          {unmatchedData.jobRoles && unmatchedData.jobRoles.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">Vị trí công việc</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion("jobRole", "/admin/categories/job-roles/create")}
                                  disabled={suggestionLoading === "jobRole" || isSuggestionPending("jobRole")}
                                  className="text-xs text-orange-600 hover:text-orange-800 underline font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {suggestionLoading === "jobRole"
                                    ? "Đang gửi..."
                                    : isSuggestionPending("jobRole")
                                      ? "Đã gửi (chờ Admin)"
                                      : "Gửi đề xuất"}
                                </button>
                              </div>
                              <p className="text-sm text-orange-800 mb-2">
                                CV có {unmatchedData.jobRoles.length} vị trí công việc không tìm thấy trong hệ thống:
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {unmatchedData.jobRoles.map((jobRole, index) => (
                                  <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                    {jobRole}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-orange-700 italic">
                                💡 Đề xuất: Thêm các vị trí công việc này vào hệ thống trước khi tạo nhân sự để tự động điền.
                              </p>
                            </div>
                          )}
                          {unmatchedData.skills && unmatchedData.skills.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">Kỹ năng</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion("skill", "/admin/categories/skills/create")}
                                  disabled={suggestionLoading === "skill" || isSuggestionPending("skill")}
                                  className="text-xs text-orange-600 hover:text-orange-800 underline font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {suggestionLoading === "skill"
                                    ? "Đang gửi..."
                                    : isSuggestionPending("skill")
                                      ? "Đã gửi (chờ Admin)"
                                      : "Gửi đề xuất"}
                                </button>
                              </div>
                              <p className="text-sm text-orange-800 mb-2">
                                CV có {unmatchedData.skills.length} kỹ năng không tìm thấy trong hệ thống:
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {unmatchedData.skills.map((skill, index) => (
                                  <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-orange-700 italic">
                                💡 Đề xuất: Thêm các kỹ năng này vào hệ thống trước khi tạo nhân sự để tự động điền.
                              </p>
                            </div>
                          )}
                          {unmatchedData.certificateTypes && unmatchedData.certificateTypes.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-orange-700">Tên chứng chỉ</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion("certificateType", "/admin/categories/certificate-types/create")}
                                  disabled={suggestionLoading === "certificateType" || isSuggestionPending("certificateType")}
                                  className="text-xs text-orange-600 hover:text-orange-800 underline font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {suggestionLoading === "certificateType"
                                    ? "Đang gửi..."
                                    : isSuggestionPending("certificateType")
                                      ? "Đã gửi (chờ Admin)"
                                      : "Gửi đề xuất"}
                                </button>
                              </div>
                              <p className="text-sm text-orange-800 mb-2">
                                CV có {unmatchedData.certificateTypes.length} tên chứng chỉ có loại chứng chỉ không có trong hệ thống:
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {unmatchedData.certificateTypes.map((certName, index) => (
                                  <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                    {certName}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-orange-700 italic">
                                💡 Đề xuất: Các tên chứng chỉ này có loại chứng chỉ không có trong hệ thống. Vui lòng thêm loại chứng chỉ tương ứng vào hệ thống hoặc chọn loại chứng chỉ thủ công.
                              </p>
                            </div>
                          )}
                        </div>
                        ) : (
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                          </div>
                        )
                      )}
                    </div>
                    </div>

                    {/* Tab Navigation - Dọc bên phải */}
                    <div className="w-16 border-l border-neutral-200 bg-neutral-50/50 flex flex-col overflow-y-auto flex-shrink-0">
                      {extractedData && (extractedData.fullName || extractedData.email || extractedData.phone || extractedData.locationName || extractedData.workingMode || extractedData.githubUrl || extractedData.portfolioUrl || extractedData.dateOfBirth) && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("overview")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "overview"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Tổng quan"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Tổng quan</span>
                        </button>
                      )}
                      {extractedData && extractedData.skills && extractedData.skills.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("skills")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "skills"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Kỹ năng"
                        >
                          <Star className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Kỹ năng</span>
                        </button>
                      )}
                      {extractedData && extractedData.workExperiences && extractedData.workExperiences.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("experience")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "experience"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Kinh nghiệm"
                        >
                          <Briefcase className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Kinh nghiệm</span>
                        </button>
                      )}
                      {extractedData && extractedData.projects && extractedData.projects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("projects")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "projects"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Dự án"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Dự án</span>
                        </button>
                      )}
                      {extractedData && extractedData.certificates && extractedData.certificates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("certificates")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "certificates"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Chứng chỉ"
                        >
                          <Award className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Chứng chỉ</span>
                        </button>
                      )}
                      {extractedData && extractedData.jobRoleLevels && extractedData.jobRoleLevels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("jobRole")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "jobRole"
                              ? "border-primary-500 text-primary-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50"
                          }`}
                          title="Vị trí"
                        >
                          <Target className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Vị trí</span>
                        </button>
                      )}
                      {(unmatchedData.location || (unmatchedData.skills && unmatchedData.skills.length > 0) || (unmatchedData.jobRoles && unmatchedData.jobRoles.length > 0) || (unmatchedData.certificateTypes && unmatchedData.certificateTypes.length > 0)) && (
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab("warnings")}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium border-l-2 transition-all w-full ${
                            activeSidebarTab === "warnings"
                              ? "border-orange-500 text-orange-600 bg-white"
                              : "border-transparent text-neutral-600 hover:text-orange-600 hover:bg-neutral-100/50"
                          }`}
                          title="Cảnh báo"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-[10px] leading-tight text-center">Cảnh báo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}