import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, Star, Briefcase, FolderOpen, Award, FileText, ChevronDown, Upload } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/ta_staff';
import { useTalentCreate } from '../../../hooks/useTalentCreate';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { useCVExtraction } from '../../../hooks/useCVExtraction';
import { useTalentCreateHandlers } from '../../../hooks/useTalentCreateHandlers';
import { useTalentCreateCVModal } from '../../../hooks/useTalentCreateCVModal';
import { useTalentCreateFilters } from '../../../hooks/useTalentCreateFilters';
import { useTalentCreateEffects } from '../../../hooks/useTalentCreateEffects';
import { TalentBasicInfoForm } from '../../../components/ta_staff/talents/TalentBasicInfoForm';
import { TalentSkillsSection } from '../../../components/ta_staff/talents/TalentSkillsSection';
import { TalentWorkExperienceSection } from '../../../components/ta_staff/talents/TalentWorkExperienceSection';
import { TalentProjectsSection } from '../../../components/ta_staff/talents/TalentProjectsSection';
import { TalentCertificatesSection } from '../../../components/ta_staff/talents/TalentCertificatesSection';
import { TalentCVSection } from '../../../components/ta_staff/talents/TalentCVSection';
import { type TalentCVCreate } from '../../../services/TalentCV';
import { talentService } from '../../../services/Talent';
import { masterDataService } from '../../../services/MasterData';
// import { notificationService, NotificationPriority, NotificationType } from '../../../services/Notification'; // Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
// import { userService } from '../../../services/User'; // Tạm thời comment vì Extracted Data Sidebar đã bị ẩn

export default function CreateTalent() {
  const navigate = useNavigate();

  const [showModalCVPreview, setShowModalCVPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State để quản lý loading khi submit
  const [submittingMessage, setSubmittingMessage] = useState('Đang xử lý...'); // Message hiển thị khi đang submit
  const lastAutoSkillJobRoleLevelIdRef = useRef<number | null>(null);
  const didAutoOpenSkillFormRef = useRef(false);
  const [autoSkillToast, setAutoSkillToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const autoSkillToastTimerRef = useRef<number | null>(null);

  /**
   * Các tab có đánh dấu validation:
   * 🔴 Thông tin cơ bản (required):
   *    - Họ và tên, Email, Số điện thoại (bắt buộc)
   *    - Chế độ làm việc, Công ty đối tác (bắt buộc)
   *    - Khu vực làm việc (bắt buộc khi làm onsite)
   *    - Chọn file CV (bắt buộc)
   *    - CV và vị trí công việc (bắt buộc)
   *    - Cấp độ (bắt buộc khi đã chọn vị trí công việc)
   * 🔴 Kỹ năng (skills):
   *    - Mỗi kỹ năng phải chọn kỹ năng từ danh sách
   * 🔴 Kinh nghiệm (experience):
   *    - Mỗi kinh nghiệm phải có: Công ty, Vị trí, Ngày bắt đầu
   * 🔴 Dự án (projects):
   *    - Mỗi dự án phải có: Tên dự án, Vị trí trong dự án
   * 🔴 Vị trí (jobRoleLevels):
   *    - Phải có ít nhất 1 vị trí công việc
   * 🔴 Chứng chỉ (certificates):
   *    - Mỗi chứng chỉ phải có: Loại chứng chỉ, Tên chứng chỉ
   */

  // Tab validation status
  const [tabValidationStatus, setTabValidationStatus] = useState<Record<string, boolean>>({
    required: false,
    cvs: false,
    skills: false,
    projects: false,
    experience: false,
    jobRoleLevels: false,
    certificates: false,
  });

  // Trigger for updating validation status
  const [validationTrigger, setValidationTrigger] = useState(0);

  // Success overlay state
  const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean; type: 'loading' | 'success'; message: string }>({
    show: false,
    type: 'loading',
    message: '',
  });

  // Helper functions for overlay

  const showSuccessOverlay = (message: string) => {
    setLoadingOverlay({
      show: true,
      type: 'success',
      message,
    });
    // Auto hide after 2 seconds
    setTimeout(() => {
      setLoadingOverlay({ show: false, type: 'loading', message: '' });
    }, 2000);
  };
  
  // Filters states - Tách vào hook
  const filters = useTalentCreateFilters();

  // CV file state for early access
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Main hook for form management
  const {
    formData,
    talentSkills,
    talentWorkExperiences,
    talentProjects,
    talentCertificates,
    talentJobRoleLevels,
    initialCVs,
    partners,
    locations,
    skills,
    jobRoles,
    certificateTypes,
    jobRoleLevels,
    jobRoleLevelsForCV,
    loading,
    activeTab,
    setActiveTab,
    errors,
    performSubmit, // Hàm submit không có confirm dialog
    handleChange,
    updateBasicField,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    setInitialCVs,
    setErrors: setFormErrors,
    setFormError: _setFormError,
    validateAllFields,
    getTabValidationStatus,
  } = useTalentCreate(filters.selectedLevel, cvFile);

  // Related data management handlers - Tách vào hook
  const handlers = useTalentCreateHandlers({
    talentJobRoleLevels,
    setTalentJobRoleLevels,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
  });

  // Khi vào tab Kỹ năng, tự mở sẵn 1 dòng form kỹ năng (chỉ 1 lần, và không tạo trùng)
  useEffect(() => {
    if (activeTab !== 'skills') return;
    if (didAutoOpenSkillFormRef.current) return;
    if (talentSkills && talentSkills.length > 0) {
      didAutoOpenSkillFormRef.current = true;
      return;
    }
    handlers.addSkill();
    didAutoOpenSkillFormRef.current = true;
  }, [activeTab, talentSkills, handlers]);

  // Update tab validation status when form data changes
  useEffect(() => {
    const status = getTabValidationStatus();
    setTabValidationStatus(status);
  }, [
    formData,
    initialCVs,
    talentSkills,
    talentProjects,
    talentWorkExperiences,
    talentJobRoleLevels,
    filters.selectedLevel,
    cvFile,
    getTabValidationStatus,
    validationTrigger
  ]);

  // Function to trigger validation update
  const triggerValidationUpdate = useCallback(() => {
    setValidationTrigger(prev => prev + 1);
  }, []);

  // File upload management
  const {
    uploadingCV,
    uploadProgress,
    uploadingCVIndex,
    isUploadedFromFirebase,
    setIsUploadedFromFirebase,
    setUploadedCVUrl,
    uploadCV,
    deleteCVFile,
    certificateImageFiles,
    uploadingCertificateIndex,
    certificateUploadProgress,
    uploadedCertificateUrls,
    handleFileChangeCertificate,
    uploadCertificateImage,
    deleteCertificateImage,
  } = useFileUpload();

  // CV extraction
  const cvExtraction = useCVExtraction(
    locations,
    skills,
    certificateTypes,
    jobRoles,
    jobRoleLevels
  );

  // Admin users for notifications - Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
  // const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  // const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);
  // const [pendingSuggestionNotifications, setPendingSuggestionNotifications] = useState<
  //   Record<
  //     string,
  //     {
  //       ids: number[];
  //       readMap: Record<number, boolean>;
  //       category: 'location' | 'jobRole' | 'skill' | 'certificateType';
  //     }
  //   >
  // >({});

  // Load admin users - Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
  /*
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await userService.getAll({
          role: 'Admin',
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
            ? user.roles.some((role: string) => role?.toLowerCase().includes('admin'))
            : false
        );
        setAdminUserIds(admins.map((user: any) => user.id).filter(Boolean));
      } catch (error) {
        console.error('Không thể tải danh sách Admin để gửi thông báo:', error);
      }
    };
    fetchAdminUsers();
  }, []);
  */

  // Effects đã được tách vào hook useTalentCreateEffects

  // Check if suggestion is pending - Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
  /*
  const isSuggestionPending = useCallback(
    (key: string) => {
      if (!key) return false;
      const entry = pendingSuggestionNotifications[key];
      if (!entry) return false;
      return entry.ids.some((notificationId) => !entry.readMap[notificationId]);
    },
    [pendingSuggestionNotifications]
  );
  */

  // Handle send suggestion - Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
  /*
  const handleSendSuggestion = async (
    category: 'location' | 'jobRole' | 'skill' | 'certificateType',
    actionUrl?: string
  ) => {
    if (suggestionLoading) return;
    if (isSuggestionPending(category)) {
      alert('⚠️ Đã gửi đề xuất cho mục này. Vui lòng đợi admin xử lý.');
      return;
    }

    const unmatchedData = cvExtraction.unmatchedData;
    let dataToSuggest: string[] = [];
    let title = '';
    let message = '';

    switch (category) {
      case 'location':
        if (!unmatchedData.location) return;
        dataToSuggest = [unmatchedData.location];
        title = 'Đề xuất thêm khu vực làm việc';
        message = `Khu vực: ${unmatchedData.location}`;
        break;
      case 'jobRole':
        if (!unmatchedData.jobRoles || unmatchedData.jobRoles.length === 0) return;
        dataToSuggest = unmatchedData.jobRoles;
        title = 'Đề xuất thêm vị trí công việc';
        message = `Vị trí: ${unmatchedData.jobRoles.join(', ')}`;
        break;
      case 'skill':
        if (!unmatchedData.skills || unmatchedData.skills.length === 0) return;
        dataToSuggest = unmatchedData.skills;
        title = 'Đề xuất thêm kỹ năng';
        message = `Kỹ năng: ${unmatchedData.skills.join(', ')}`;
        break;
      case 'certificateType':
        if (!unmatchedData.certificateTypes || unmatchedData.certificateTypes.length === 0) return;
        dataToSuggest = unmatchedData.certificateTypes;
        title = 'Đề xuất thêm loại chứng chỉ';
        message = `Loại chứng chỉ: ${unmatchedData.certificateTypes.join(', ')}`;
        break;
    }

    if (dataToSuggest.length === 0) return;

    setSuggestionLoading(category);
    try {
      const notificationIds: number[] = [];
      for (const data of dataToSuggest) {
        const notification = await notificationService.create({
          title,
          message: `${message}\nDữ liệu: ${data}`,
          type: NotificationType.NewSkillDetectedFromCV,
          priority: NotificationPriority.Medium,
          userIds: adminUserIds,
          actionUrl: actionUrl || undefined,
        });
        const notificationArray = Array.isArray(notification) ? notification : [notification];
        notificationArray.forEach((notif) => {
          if (notif?.id) {
            notificationIds.push(notif.id);
          }
        });
      }

      if (notificationIds.length > 0) {
        setPendingSuggestionNotifications((prev) => ({
          ...prev,
          [category]: {
            ids: notificationIds,
            readMap: {},
            category,
          },
        }));
        showSuccessOverlay(`✅ Đã gửi ${notificationIds.length} đề xuất cho admin!`);
      }
    } catch (error) {
      console.error('Lỗi khi gửi đề xuất:', error);
      alert('❌ Không thể gửi đề xuất. Vui lòng thử lại.');
    } finally {
      setSuggestionLoading(null);
    }
  };
  */

  // Check notification statuses - Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
  /*
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
            if (notification?.isRead) {
              updates.push({ key, notificationId });
            }
          } catch (error: any) {
            const isNotFound = error?.response?.status === 404 || error?.status === 404;
            if (isNotFound) {
              updates.push({ key, notificationId });
            } else {
              console.error('Không thể kiểm tra trạng thái thông báo đề xuất:', error);
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
  */

  // CV extraction modal - Tách vào hook
  const cvModal = useTalentCreateCVModal({
    talentSkills,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    setInitialCVs,
    updateBasicField,
    cvExtraction,
    isUploadedFromFirebase,
    setIsUploadedFromFirebase,
    setUploadedCVUrl,
    initialCVs,
    deleteCVFile,
    onFileChange: (file) => {
      setCvFile(file);
      // Trigger validation update when CV file changes
      setTimeout(triggerValidationUpdate, 100);
    },
  });

  // Sync cvFile with cvModal.cvFile
  useEffect(() => {
    if (cvModal.cvFile !== cvFile) {
      setCvFile(cvModal.cvFile);
    }
  }, [cvModal.cvFile, cvFile]);

  // Effects - Tách vào hook
  useTalentCreateEffects({
    cvPreviewUrl: cvModal.cvPreviewUrl,
    modalCVPreviewUrl: cvModal.modalCVPreviewUrl,
    isUploadedFromFirebase,
  });

  // Memoize selectedLevel[0] để tránh thay đổi dependency array
  const selectedLevelValue = useMemo(() => filters.selectedLevel[0], [filters.selectedLevel]);

  // Tự động tạo jobRoleLevel từ CV khi chọn vị trí ở CV
  useEffect(() => {
    if (!initialCVs || initialCVs.length === 0) return;
    if (!jobRoleLevels || jobRoleLevels.length === 0) return;

    const cv = initialCVs[0];
    const cvJobRoleLevelId = cv.jobRoleLevelId;
    
    // Kiểm tra xem talentJobRoleLevels hiện tại có khớp với CV jobRoleLevelId không
    const currentJobRoleLevelId = talentJobRoleLevels[0]?.jobRoleLevelId;
    
    if (!cvJobRoleLevelId || cvJobRoleLevelId <= 0) {
      // Nếu CV chưa có vị trí và talentJobRoleLevels đang có vị trí, reset về trạng thái ban đầu
      if (currentJobRoleLevelId && currentJobRoleLevelId > 0) {
        setTalentJobRoleLevels([
          {
            jobRoleLevelId: 0,
            yearsOfExp: 0,
            ratePerMonth: undefined,
          },
        ]);
      }
      return;
    }

    // Kiểm tra xem user đã chọn cấp độ khác chưa (dựa vào selectedLevel)
    // Nếu user đã chọn cấp độ (selectedLevel có giá trị), không tự động set lại
    if (selectedLevelValue !== undefined && selectedLevelValue !== null) {
      // User đã chọn cấp độ, tìm jobRoleLevelId tương ứng với cấp độ đã chọn
      // Tìm jobRoleLevel có cùng jobRoleId với CV và có level = userSelectedLevel
      const cvJobRoleLevel = jobRoleLevels.find((jrl) => jrl.id === cvJobRoleLevelId);
      if (cvJobRoleLevel) {
        const selectedJobRoleLevel = jobRoleLevels.find((jrl) => 
          jrl.jobRoleId === cvJobRoleLevel.jobRoleId && jrl.level === selectedLevelValue
        );
        
        if (selectedJobRoleLevel && selectedJobRoleLevel.id && selectedJobRoleLevel.id > 0) {
          // Nếu jobRoleLevelId hiện tại đã đúng với cấp độ user chọn, không cần cập nhật
          if (currentJobRoleLevelId === selectedJobRoleLevel.id) return;
          
          // Cập nhật với jobRoleLevelId tương ứng với cấp độ user đã chọn
          setTalentJobRoleLevels([
            {
              jobRoleLevelId: selectedJobRoleLevel.id,
              yearsOfExp: 0,
              ratePerMonth: undefined,
            },
          ]);
          return;
        }
      }
    }

    // Nếu vị trí đã đúng rồi, không cần cập nhật
    if (currentJobRoleLevelId === cvJobRoleLevelId) return;

    // Tìm jobRoleLevel từ CV (mặc định là cấp độ đầu tiên của vị trí này)
    const cvJobRoleLevel = jobRoleLevels.find((jrl) => jrl.id === cvJobRoleLevelId);
    if (!cvJobRoleLevel) return;

    // Tự động tạo jobRoleLevel từ CV (chỉ khi user chưa chọn cấp độ)
    setTalentJobRoleLevels([
      {
        jobRoleLevelId: cvJobRoleLevelId,
        yearsOfExp: 0,
        ratePerMonth: undefined,
      },
    ]);
  }, [initialCVs?.[0]?.jobRoleLevelId, jobRoleLevels, talentJobRoleLevels, setTalentJobRoleLevels, selectedLevelValue]);

  // Update initial CV
  const updateInitialCV = (index: number, field: keyof TalentCVCreate, value: string | number | boolean | undefined) => {
    setInitialCVs((prev) => {
      const updated = prev.map((cv, i) => (i === index ? { ...cv, [field]: value } : cv));

      // Auto set version = 1 if this is first CV for jobRoleLevelId
      if (field === 'jobRoleLevelId' && value && typeof value === 'number') {
        const cvsSameJobRoleLevel = updated.filter((cv, i) => i !== index && cv.jobRoleLevelId === value);
        if (cvsSameJobRoleLevel.length === 0) {
          updated[index] = { ...updated[index], version: 1 };
        }
      }

      return updated;
    });
  };

  // Tự động cập nhật tên vị trí ở form hiện tại khi chọn vị trí ở CV Ban Đầu
  // Chỉ điền tên vị trí, không tự động điền cấp độ (để người dùng tự chọn)
  useEffect(() => {
    if (!initialCVs || initialCVs.length === 0) return;
    if (!jobRoleLevels || jobRoleLevels.length === 0) return;

    // Lấy jobRoleLevelId đầu tiên từ CV (nếu có)
    const firstCVJobRoleLevelId = initialCVs
      .find((cv) => cv.jobRoleLevelId && cv.jobRoleLevelId > 0)?.jobRoleLevelId;

    if (!firstCVJobRoleLevelId) return;

    // Tìm jobRoleLevel từ jobRoleLevelId để lấy tên vị trí
    const cvJobRoleLevel = jobRoleLevels.find((jrl) => jrl.id === firstCVJobRoleLevelId);
    if (!cvJobRoleLevel || !cvJobRoleLevel.name) return;

    // Kiểm tra xem vị trí này đã có trong talentJobRoleLevels chưa (theo jobRoleLevelId)
    const existingJobRoleLevel = talentJobRoleLevels.find(
      (jrl) => jrl.jobRoleLevelId === firstCVJobRoleLevelId && jrl.jobRoleLevelId > 0
    );

    // Nếu vị trí đã có rồi (từ trích xuất), không cần cập nhật nữa
    if (existingJobRoleLevel) return;

    // Tìm form đầu tiên chưa có tên vị trí được chọn
    const firstEmptyFormIndex = talentJobRoleLevels.findIndex(
      (_jrl, index) => !filters.selectedJobRoleLevelName[index] || filters.selectedJobRoleLevelName[index] === ''
    );

    if (firstEmptyFormIndex >= 0) {
      // Chỉ set tên vị trí, không set jobRoleLevelId (để không tự động điền cấp độ)
      filters.setSelectedJobRoleLevelName((prev) => ({
        ...prev,
        [firstEmptyFormIndex]: cvJobRoleLevel.name,
      }));
      
      // Set jobRoleFilterId để filter dropdown đúng loại vị trí
      filters.setSelectedJobRoleFilterId((prev) => ({
        ...prev,
        [firstEmptyFormIndex]: cvJobRoleLevel.jobRoleId,
      }));
    }
  }, [initialCVs, jobRoleLevels, talentJobRoleLevels, filters]);

  // Tự động thêm kỹ năng theo "Vị trí công việc" được chọn ở CV ban đầu (template skills từ BE)
  // - Chỉ "thêm" (merge), không xóa kỹ năng user đã chọn
  // - Không thêm trùng skillId
  useEffect(() => {
    const jobRoleLevelId = initialCVs?.[0]?.jobRoleLevelId ?? 0;
    if (!jobRoleLevelId || jobRoleLevelId <= 0) return;

    // Tránh chạy lặp cho cùng 1 lựa chọn (kể cả khi state khác thay đổi)
    if (lastAutoSkillJobRoleLevelIdRef.current === jobRoleLevelId) return;

    const hasExistingSkills = (talentSkills || []).some((s) => s.skillId && s.skillId > 0);
    const confirmed = window.confirm(
      hasExistingSkills
        ? 'Bạn muốn thêm kỹ năng gợi ý theo vị trí vào danh sách kỹ năng hiện có không?\n\n(Không tạo trùng kỹ năng, và không xóa kỹ năng đã có)'
        : 'Bạn muốn tự động thêm kỹ năng gợi ý theo vị trí không?'
    );
    if (!confirmed) {
      return;
    }

    // Chỉ set ref sau khi user đã xác nhận
    lastAutoSkillJobRoleLevelIdRef.current = jobRoleLevelId;

    let cancelled = false;

    (async () => {
      try {
        const resp = await masterDataService.getSkillsByJobRoleLevel(jobRoleLevelId);
        const skillIds = (resp?.data || [])
          .map((s: any) => s?.id)
          .filter((id: any): id is number => typeof id === 'number' && id > 0);

        if (cancelled) return;
        if (skillIds.length === 0) return;

        let addedCount = 0;
        setTalentSkills((prev) => {
          const existing = new Set((prev || []).map((x) => x.skillId));
          const toAdd = skillIds.filter((id) => !existing.has(id));
          addedCount = toAdd.length;
          if (toAdd.length === 0) return prev;
          return [
            ...toAdd.map((skillId) => ({ skillId, level: 'Beginner', yearsExp: 1 })),
            ...(prev || []),
          ];
        });

        if (!cancelled && addedCount > 0) {
          // Clear timer cũ nếu có
          if (autoSkillToastTimerRef.current) {
            window.clearTimeout(autoSkillToastTimerRef.current);
          }
          setAutoSkillToast({
            open: true,
            message: `Đã thêm ${addedCount} kỹ năng theo vị trí`,
          });
          autoSkillToastTimerRef.current = window.setTimeout(() => {
            setAutoSkillToast({ open: false, message: '' });
            autoSkillToastTimerRef.current = null;
          }, 2500);
        }
      } catch {
        // Best-effort: nếu API mapping lỗi thì không auto-add để tránh làm phiền user
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCVs, talentSkills, setTalentSkills]);

  // Ref cho tab navigation container để scroll đến tab active
  const tabNavRef = useRef<HTMLDivElement>(null);

  // Tự động scroll đến tab active khi chuyển tab
  useEffect(() => {
    if (tabNavRef.current) {
      const activeTabElement = tabNavRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
      if (activeTabElement) {
        // Scroll với smooth behavior
        activeTabElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="flex bg-gray-50 min-h-screen relative">
      {/* Toast: Auto-add skills */}
      {autoSkillToast.open && (
        <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm">{autoSkillToast.message}</span>
            <button
              type="button"
              onClick={() => setAutoSkillToast({ open: false, message: '' })}
              className="text-success-600 hover:text-success-800"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Loading Overlay ở giữa màn hình */}
      {(isSubmitting || loading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[300px]">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-lg font-semibold text-neutral-800">{submittingMessage}</p>
            <p className="text-sm text-neutral-500 text-center">Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      )}
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="border-b border-neutral-200 bg-white">
            <div className="px-6 py-4">
              {/* Không hiển thị formError ở đầu trang - chỉ hiển thị alert khi có lỗi */}
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <Link to="/ta/talents" className="text-primary-600 hover:text-primary-700 cursor-pointer transition-colors">
                  Nhân sự
                </Link>
                <span>/</span>
                <span className="text-neutral-900 font-semibold">Tạo nhân sự mới</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Tạo nhân sự mới</h1>
                  <p className="text-sm text-neutral-600">Thêm nhân sự (developer) mới vào hệ thống DevPool</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form with Extracted Data Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 px-2 lg:px-4 py-6">
            {/* Main Form */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Kiểm tra nếu đang submit thì không cho submit lại
                if (isSubmitting) {
                  return;
                }
                
                try {
                  // Bước 1: Validate tất cả các trường bắt buộc TRƯỚC KHI hiển thị loading overlay
                  const validationResult = validateAllFields();
                
                // Kiểm tra file CV: phải được chọn
                if (!cvModal.cvFile) {
                  validationResult.errors['cvFile'] = 'Vui lòng chọn file CV';
                  validationResult.isValid = false;
                }
                
                // Kiểm tra cấp độ: phải được chọn khi có vị trí công việc
                if (initialCVs[0]?.jobRoleLevelId && initialCVs[0].jobRoleLevelId > 0) {
                  const cvIndex = 0;
                  const selectedLevelValue = filters.selectedLevel[cvIndex];
                  if (selectedLevelValue === undefined || selectedLevelValue === null) {
                    validationResult.errors['level'] = 'Vui lòng chọn cấp độ cho vị trí công việc';
                    validationResult.isValid = false;
                  }
                }
                
                // Bước 1.5: Kiểm tra email đã tồn tại TRƯỚC KHI hiển thị loading overlay (QUAN TRỌNG)
                if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                  try {
                    const response = await talentService.getAll({ email: formData.email, excludeDeleted: true });
                    if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
                      validationResult.errors['email'] = 'Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.';
                      validationResult.isValid = false;
                    }
                  } catch (error: any) {
                    // Nếu lỗi là do email đã tồn tại, bắt lỗi này
                    const errorData = error?.response?.data || error?.message || '';
                    const errorText = (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)).toLowerCase();
                    if (errorText.includes('email already exists') || 
                        errorText.includes('email đã tồn tại') ||
                        (errorText.includes('already exists') && errorText.includes('email'))) {
                      validationResult.errors['email'] = 'Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.';
                      validationResult.isValid = false;
                    } else {
                      // Nếu là lỗi khác (network, server error), không chặn validation nhưng log lỗi
                      console.warn('⚠️ Không thể kiểm tra email đã tồn tại:', error);
                    }
                  }
                }
                
                // Nếu validation fail, KHÔNG hiển thị loading overlay và dừng lại
                if (!validationResult.isValid) {
                  // Hiển thị lỗi và scroll đến trường đầu tiên có lỗi
                  setFormErrors(validationResult.errors);
                  
                  // Tìm và scroll đến trường đầu tiên có lỗi
                  const firstErrorKey = Object.keys(validationResult.errors)[0];
                  if (firstErrorKey) {
                    // Thử tìm element theo name attribute
                    let errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
                    // Nếu không tìm thấy, thử tìm theo id hoặc data attribute
                    if (!errorElement) {
                      errorElement = document.querySelector(`#${firstErrorKey}`) || 
                                    document.querySelector(`[data-field="${firstErrorKey}"]`);
                    }
                    if (errorElement) {
                      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Focus vào element nếu có thể
                      if (errorElement instanceof HTMLElement && 'focus' in errorElement) {
                        (errorElement as HTMLElement).focus();
                      }
                    }
                  }
                  
                  // Hiển thị alert tổng hợp các lỗi
                  const errorMessages = Object.values(validationResult.errors).join('\n');
                  alert(`⚠️ Vui lòng điền đầy đủ thông tin bắt buộc:\n\n${errorMessages}`);
                  return; // Dừng lại, KHÔNG hiển thị loading overlay và KHÔNG upload CV
                }
                
                // CHỈ KHI validation pass, MỚI hiển thị loading overlay
                setIsSubmitting(true);
                setSubmittingMessage('Đang xử lý...');
                
                // Bước 2: Upload CV lên Firebase TRƯỚC KHI tạo nhân sự (QUAN TRỌNG)
                // Lưu CV URL vào biến local để đảm bảo có giá trị ngay sau khi upload
                let uploadedCVUrl: string | null = null;
                
                // Kiểm tra nếu có file CV nhưng chưa upload hoặc chưa có URL
                if (cvModal.cvFile && initialCVs[0]) {
                  const cv = initialCVs[0];
                  
                  // Kiểm tra nếu CV chưa được upload lên Firebase
                  if (!isUploadedFromFirebase || !cv.cvFileUrl || cv.cvFileUrl.trim() === '') {
                    // Kiểm tra vị trí công việc trước khi upload
                    if (!cv.jobRoleLevelId || cv.jobRoleLevelId <= 0) {
                      alert('⚠️ Vui lòng chọn vị trí công việc cho CV trước khi tạo nhân sự!');
                      setIsSubmitting(false);
                      return;
                    }
                    
                    // Tự động set version = 1 nếu chưa có
                    if (!cv.version || cv.version <= 0) {
                      updateInitialCV(0, 'version', 1);
                    }
                    
                    try {
                      setSubmittingMessage('Đang upload CV lên Firebase...');
                      const finalVersion = cv.version && cv.version > 0 ? cv.version : 1;
                      
                      // Upload CV lên Firebase
                      const url = await uploadCV(cvModal.cvFile, 0, finalVersion, cv.jobRoleLevelId);
                      
                      // Kiểm tra nếu user đã cancel
                      if (url === 'CANCELLED') {
                        setIsSubmitting(false);
                        return; // User đã cancel, không hiển thị lỗi
                      }
                      
                      if (url && url.trim() !== '') {
                        // Lưu URL vào biến local
                        uploadedCVUrl = url;
                        
                        // Cập nhật CV URL vào state
                        updateInitialCV(0, 'cvFileUrl', url);
                        // Đảm bảo version = 1
                        updateInitialCV(0, 'version', 1);
                        // Đánh dấu đã upload để không kiểm tra lại
                        setIsUploadedFromFirebase(true);
                        // Đợi một chút để state được cập nhật hoàn toàn
                        await new Promise(resolve => setTimeout(resolve, 500));
                      } else {
                        alert('⚠️ Không thể upload CV lên Firebase. Vui lòng thử lại.');
                        setIsSubmitting(false);
                        return;
                      }
                    } catch (error: any) {
                      // Chỉ hiển thị lỗi nếu không phải là cancel
                      if (error.message !== 'CANCELLED' && error !== 'CANCELLED') {
                        alert(`⚠️ Lỗi khi upload CV: ${error.message || 'Vui lòng thử lại.'}`);
                      }
                      setIsSubmitting(false);
                      return;
                    }
                  } else {
                    // CV đã được upload trước đó, sử dụng URL từ state
                    uploadedCVUrl = cv.cvFileUrl;
                  }
                }
                
                // Kiểm tra lại CV URL sau khi upload để đảm bảo đã có URL trước khi submit
                // Sử dụng biến local uploadedCVUrl thay vì state để tránh vấn đề async state update
                if (cvModal.cvFile && (!uploadedCVUrl || uploadedCVUrl.trim() === '')) {
                  // Nếu vẫn chưa có URL, kiểm tra lại từ state (fallback)
                  if (!initialCVs[0]?.cvFileUrl || initialCVs[0].cvFileUrl.trim() === '') {
                    alert('⚠️ Vui lòng upload CV lên Firebase trước khi tạo nhân sự!');
                    setIsSubmitting(false);
                    return;
                  }
                  uploadedCVUrl = initialCVs[0].cvFileUrl;
                }
                
                // Đảm bảo CV URL được cập nhật vào state trước khi submit (nếu có URL từ upload)
                if (uploadedCVUrl && initialCVs[0] && (!initialCVs[0].cvFileUrl || initialCVs[0].cvFileUrl.trim() === '')) {
                  updateInitialCV(0, 'cvFileUrl', uploadedCVUrl);
                  // Đợi một chút để state được cập nhật
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Đảm bảo CV URL được cập nhật vào state trước khi submit
                // Sử dụng setInitialCVs trực tiếp với functional update để đảm bảo state được cập nhật
                setSubmittingMessage('Đang chuẩn bị dữ liệu...');
                if (cvModal.cvFile && uploadedCVUrl && uploadedCVUrl.trim() !== '') {
                  // Cập nhật CV URL vào state bằng setInitialCVs với functional update
                  setInitialCVs((prev) => {
                    const updated = [...prev];
                    if (updated[0]) {
                      updated[0] = { ...updated[0], cvFileUrl: uploadedCVUrl };
                    }
                    return updated;
                  });
                  
                  // Đợi một chút để state được cập nhật (tăng thời gian đợi để đảm bảo state được cập nhật)
                  await new Promise(resolve => setTimeout(resolve, 1500));
                } else if (cvModal.cvFile && (!uploadedCVUrl || uploadedCVUrl.trim() === '')) {
                  // Nếu có file CV nhưng không có URL
                  setIsSubmitting(false);
                  alert('⚠️ Vui lòng upload CV lên Firebase trước khi tạo nhân sự!');
                  return;
                }
                
                // Đợi thêm một chút để đảm bảo tất cả state đã được cập nhật hoàn toàn
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Bước 3: Sau khi upload CV thành công và đảm bảo state đã được cập nhật, gọi performSubmit để submit form
                // Truyền uploadedCVUrl trực tiếp vào performSubmit để đảm bảo CV URL được sử dụng
                setSubmittingMessage('Đang tạo nhân sự...');
                const result = await performSubmit(uploadedCVUrl);

                // Success - hiển thị overlay và navigate
                showSuccessOverlay('✅ Tạo nhân sự thành công!');

                // Kiểm tra result trước khi navigate
                let talentId = null;

                // Handle different response formats
                if (result && typeof result === 'object') {
                  // Check for direct id field
                  if (result.id && typeof result.id === 'number') {
                    talentId = result.id;
                  }
                  // Check for nested data.id
                  else if (result.data && result.data.id && typeof result.data.id === 'number') {
                    talentId = result.data.id;
                  }
                  // Check for nested talent.id
                  else if (result.talent && result.talent.id && typeof result.talent.id === 'number') {
                    talentId = result.talent.id;
                  }
                }

                if (talentId) {
                  console.log('✅ Navigate to talent detail:', talentId);
                  setTimeout(() => {
                    navigate(`/ta/talents/${talentId}`);
                  }, 2000);
                } else {
                  console.error('❌ Không thể lấy ID từ result:', result);
                  alert('❌ Tạo nhân sự thành công nhưng không thể chuyển hướng. Vui lòng truy cập trang danh sách để xem nhân sự mới.');
                  setTimeout(() => {
                    navigate('/ta/talents');
                  }, 2000);
                }
                } catch (error: any) {
                  // Xử lý lỗi nếu có
                  console.error('❌ Lỗi khi xử lý form:', error);
                  setIsSubmitting(false);
                } finally {
                  // Đảm bảo luôn reset loading state
                  setIsSubmitting(false);
                }
              }}>
                {/* Checkbox "Trích xuất thông tin từ CV" */}
                <div className="p-6 border-b border-neutral-200">
                  <div className="bg-gradient-to-br from-primary-50 via-primary-50/80 to-secondary-50 rounded-2xl p-6 border border-primary-200/50 shadow-soft">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cvModal.useExtractCV}
                        onChange={async (e) => {
                          await cvModal.handleUseExtractCVChange(e.target.checked);
                        }}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        Trích xuất thông tin từ CV (Tự động điền form)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tab Navigation - Sticky */}
                <div className="sticky top-16 z-50 border-b border-neutral-200 bg-white shadow-sm relative">
                  {/* Scroll indicator - fade gradient ở cuối */}
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                  
                  <div 
                    ref={tabNavRef}
                    className="flex overflow-x-auto scrollbar-hide scroll-smooth" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <style>{`
                      .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <button
                      type="button"
                      data-tab="required"
                      onClick={() => setActiveTab('required')}
                      className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'required'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <div className="relative">
                        <User className="w-4 h-4 flex-shrink-0" />
                        {tabValidationStatus.required && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="hidden sm:inline">Thông tin cơ bản</span>
                      <span className="sm:hidden">Thông tin</span>
                    </button>
                    <button
                      type="button"
                      data-tab="skills"
                      onClick={() => setActiveTab('skills')}
                      className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'skills'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <div className="relative">
                        <Star className="w-4 h-4 flex-shrink-0" />
                        {tabValidationStatus.skills && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      Kỹ năng
                    </button>
                    <button
                      type="button"
                      data-tab="experience"
                      onClick={() => setActiveTab('experience')}
                      className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'experience'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <div className="relative">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        {tabValidationStatus.experience && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="hidden sm:inline">Kinh nghiệm</span>
                      <span className="sm:hidden">Kinh nghiệm</span>
                    </button>
                    <button
                      type="button"
                      data-tab="projects"
                      onClick={() => setActiveTab('projects')}
                      className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'projects'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <div className="relative">
                        <FolderOpen className="w-4 h-4 flex-shrink-0" />
                        {tabValidationStatus.projects && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      Dự án
                    </button>
                    <button
                      type="button"
                      data-tab="certificates"
                      onClick={() => setActiveTab('certificates')}
                      className={`flex items-center gap-2 px-4 md:px-5 lg:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'certificates'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <div className="relative">
                        <Award className="w-4 h-4 flex-shrink-0" />
                        {tabValidationStatus.certificates && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="hidden sm:inline">Chứng chỉ</span>
                      <span className="sm:hidden">Chứng chỉ</span>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Tab: Thông tin cơ bản */}
                    {activeTab === 'required' && (
                      <TalentBasicInfoForm
                        formData={formData}
                        partners={partners}
                        locations={locations}
                        errors={errors}
                        onChange={(e) => {
                          handleChange(e);
                          // Trigger validation update after a short delay to ensure state is updated
                          setTimeout(triggerValidationUpdate, 100);
                        }}
                        onPartnerChange={(partnerId) => {
                          updateBasicField('currentPartnerId', partnerId);
                          // Trigger validation update after a short delay to ensure state is updated
                          setTimeout(triggerValidationUpdate, 100);
                        }}
                      />
                    )}

                    {/* Tab: Kỹ năng */}
                    {activeTab === 'skills' && (
                      <>
                        <TalentSkillsSection
                          talentSkills={talentSkills}
                          skills={skills}
                          skillSearchQuery={filters.skillSearchQuery}
                          setSkillSearchQuery={filters.setSkillSearchQuery}
                          isSkillDropdownOpen={filters.isSkillDropdownOpen}
                          setIsSkillDropdownOpen={filters.setIsSkillDropdownOpen}
                          skillGroupSearchQuery={filters.skillGroupSearchQuery}
                          setSkillGroupSearchQuery={filters.setSkillGroupSearchQuery}
                          isSkillGroupDropdownOpen={filters.isSkillGroupDropdownOpen}
                          setIsSkillGroupDropdownOpen={filters.setIsSkillGroupDropdownOpen}
                          selectedSkillGroupId={filters.selectedSkillGroupId}
                          setSelectedSkillGroupId={filters.setSelectedSkillGroupId}
                          onAdd={handlers.addSkill}
                          onRemove={handlers.removeSkill}
                          onUpdate={(index, field, value) => {
                            handlers.updateSkill(index, field, value);
                            // Trigger validation update after a short delay to ensure state is updated
                            setTimeout(triggerValidationUpdate, 100);
                          }}
                          errors={errors}
                        />
                      </>
                    )}

                    {/* Tab: Kinh nghiệm */}
                    {activeTab === 'experience' && (
                      <>
                        <TalentWorkExperienceSection
                          talentWorkExperiences={talentWorkExperiences}
                          jobRoleLevels={jobRoleLevels}
                          initialCVs={initialCVs}
                          workExperiencePositionSearch={filters.workExperiencePositionSearch}
                          setWorkExperiencePositionSearch={filters.setWorkExperiencePositionSearch}
                          isWorkExperiencePositionDropdownOpen={filters.isWorkExperiencePositionDropdownOpen}
                          setIsWorkExperiencePositionDropdownOpen={filters.setIsWorkExperiencePositionDropdownOpen}
                          onAdd={handlers.addWorkExperience}
                          onRemove={handlers.removeWorkExperience}
                          onUpdate={(index, field, value) => {
                            handlers.updateWorkExperience(index, field, value);
                            // Trigger validation update after a short delay to ensure state is updated
                            setTimeout(triggerValidationUpdate, 100);
                          }}
                          errors={errors}
                        />
                      </>
                    )}

                    {/* Tab: Dự án */}
                    {activeTab === 'projects' && (
                      <>
                        <TalentProjectsSection
                          talentProjects={talentProjects}
                          jobRoleLevels={jobRoleLevels}
                          initialCVs={initialCVs}
                          projectPositionSearch={filters.projectPositionSearch}
                          setProjectPositionSearch={filters.setProjectPositionSearch}
                          isProjectPositionDropdownOpen={filters.isProjectPositionDropdownOpen}
                          setIsProjectPositionDropdownOpen={filters.setIsProjectPositionDropdownOpen}
                          onAdd={handlers.addProject}
                          onRemove={handlers.removeProject}
                          onUpdate={(index, field, value) => {
                            handlers.updateProject(index, field, value);
                            // Trigger validation update after a short delay to ensure state is updated
                            setTimeout(triggerValidationUpdate, 100);
                          }}
                          errors={errors}
                        />
                      </>
                    )}

                    {/* Tab: Chứng chỉ */}
                    {activeTab === 'certificates' && (
                      <>
                        <TalentCertificatesSection
                          talentCertificates={talentCertificates}
                          certificateTypes={certificateTypes}
                          certificateTypeSearch={filters.certificateTypeSearch}
                          setCertificateTypeSearch={filters.setCertificateTypeSearch}
                          isCertificateTypeDropdownOpen={filters.isCertificateTypeDropdownOpen}
                          setIsCertificateTypeDropdownOpen={filters.setIsCertificateTypeDropdownOpen}
                          certificateImageFiles={certificateImageFiles}
                          uploadingCertificateIndex={uploadingCertificateIndex}
                          certificateUploadProgress={certificateUploadProgress}
                          uploadedCertificateUrls={uploadedCertificateUrls}
                          onAdd={handlers.addCertificate}
                          onRemove={handlers.removeCertificate}
                          onUpdate={(index, field, value) => {
                            handlers.updateCertificate(index, field, value);
                            // Trigger validation update after a short delay to ensure state is updated
                            setTimeout(triggerValidationUpdate, 100);
                          }}
                          onFileChange={handleFileChangeCertificate}
                          onUploadImage={async (certIndex: number) => {
                            const url = await uploadCertificateImage(certIndex);
                            if (url) {
                              // Cập nhật imageUrl vào certificate sau khi upload thành công
                              handlers.updateCertificate(certIndex, 'imageUrl', url);
                            }
                          }}
                          onDeleteImage={async (certIndex: number, imageUrl: string) => {
                            const deleted = await deleteCertificateImage(certIndex, imageUrl);
                            if (deleted) {
                              // Reset file state và URL khi xóa thành công
                              const event = { target: { files: null, value: '' } } as any;
                              handleFileChangeCertificate(certIndex, event);
                              // Xóa URL khỏi certificate
                              handlers.updateCertificate(certIndex, 'imageUrl', '');
                            }
                          }}
                          errors={errors}
                        />
                      </>
                    )}

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-neutral-200 mt-8">
                    <button
                      type="submit"
                      disabled={loading || isSubmitting}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loading || isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{isSubmitting ? 'Đang xử lý...' : 'Đang tạo...'}</span>
                        </div>
                      ) : (
                        'Tạo nhân sự'
                      )}
                    </button>
                  </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Sidebar - CV, Vị trí, và Extracted Data */}
            <div className="lg:col-span-3 space-y-6">
              {/* CV Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
                <TalentCVSection
                  initialCVs={initialCVs}
                  jobRoleLevelsForCV={jobRoleLevelsForCV}
                  jobRoles={jobRoles}
                  cvFile={cvModal.cvFile}
                  cvPreviewUrl={cvModal.cvPreviewUrl}
                  jobRoleLevelSearch={filters.jobRoleLevelSearch}
                  setJobRoleLevelSearch={filters.setJobRoleLevelSearch}
                  isJobRoleLevelDropdownOpen={filters.isJobRoleLevelDropdownOpen}
                  setIsJobRoleLevelDropdownOpen={filters.setIsJobRoleLevelDropdownOpen}
                  selectedJobRoleFilterId={filters.selectedJobRoleFilterId}
                  setSelectedJobRoleFilterId={filters.setSelectedJobRoleFilterId}
                  jobRoleFilterSearch={filters.jobRoleFilterSearch}
                  setJobRoleFilterSearch={filters.setJobRoleFilterSearch}
                  isJobRoleFilterDropdownOpen={filters.isJobRoleFilterDropdownOpen}
                  setIsJobRoleFilterDropdownOpen={filters.setIsJobRoleFilterDropdownOpen}
                  showCVSummary={filters.showCVSummary}
                  setShowCVSummary={filters.setShowCVSummary}
                  uploadingCV={uploadingCV}
                  uploadingCVIndex={uploadingCVIndex}
                  uploadProgress={uploadProgress}
                  isUploadedFromFirebase={isUploadedFromFirebase}
                  errors={errors}
                  selectedLevel={filters.selectedLevel}
                  setSelectedLevel={(level) => {
                    filters.setSelectedLevel(level);
                    // Trigger validation update after a short delay to ensure state is updated
                    setTimeout(triggerValidationUpdate, 100);
                  }}
                  isLevelDropdownOpen={filters.isLevelDropdownOpen}
                  setIsLevelDropdownOpen={filters.setIsLevelDropdownOpen}
                  getLevelText={(level: number) => {
                    const levelMap: Record<number, string> = {
                      0: 'Junior',
                      1: 'Middle',
                      2: 'Senior',
                      3: 'Lead',
                    };
                    return levelMap[level] || `Level ${level}`;
                  }}
                  talentJobRoleLevels={talentJobRoleLevels}
                  jobRoleLevels={jobRoleLevels}
                  onUpdateTalentJobRoleLevel={(index, field, value) => {
                    setTalentJobRoleLevels((prev) => {
                      const updated = [...prev];
                      if (updated[index]) {
                        updated[index] = { ...updated[index], [field]: value };
                      }
                      return updated;
                    });
                  }}
                  onFileChange={async (file) => {
                    // Nếu checkbox "Trích xuất thông tin từ CV" đã được tích và người dùng chọn lại file
                    if (cvModal.useExtractCV) {
                      // Bỏ tích checkbox và xóa tất cả dữ liệu đã trích xuất
                      await cvModal.handleUseExtractCVChange(false);
                    }
                    // Set file mới (có thể là null nếu chọn lại)
                    cvModal.setCvFile(file);
                  }}
                  onUpdateCV={updateInitialCV}
                />
              </div>


              {/* Extracted Data Sidebar - Tạm thời ẩn đi */}
              {/* {cvExtraction.extractedData && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50 flex flex-col">
                {/* Sidebar Header */}
                {/* <div className="p-4 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900">Dữ liệu trích xuất</h3>
                  <p className="text-xs text-neutral-600 mt-1">Thông tin từ CV</p>
                </div> */}

                {/* Sidebar Tabs */}
                {/* <div className="flex border-b border-neutral-200 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Tổng quan', icon: '📋' },
                    { id: 'skills', label: 'Kỹ năng', icon: '⭐' },
                    { id: 'experience', label: 'Kinh nghiệm', icon: '💼' },
                    { id: 'projects', label: 'Dự án', icon: '📁' },
                    { id: 'certificates', label: 'Chứng chỉ', icon: '🏆' },
                    { id: 'jobRole', label: 'Vị trí', icon: '🎯' },
                    { id: 'warnings', label: 'Cảnh báo', icon: '⚠️' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSidebarTab(tab.id)}
                      className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeSidebarTab === tab.id
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div> */}

                {/* Sidebar Content */}
                {/* <div className="flex-1 overflow-y-auto p-4">
                  {activeSidebarTab === 'overview' && (
                    <div className="space-y-2.5">
                      {cvExtraction.extractedData.fullName && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-neutral-600">Họ và tên:</span>
                          <span className="text-sm text-neutral-900">{cvExtraction.extractedData.fullName}</span>
                        </div>
                      )}
                      {cvExtraction.extractedData.email && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-neutral-600">Email:</span>
                          <a
                            href={`mailto:${cvExtraction.extractedData.email}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {cvExtraction.extractedData.email}
                          </a>
                        </div>
                      )}
                      {cvExtraction.extractedData.phone && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-neutral-600">SĐT:</span>
                          <span className="text-sm text-neutral-900">{cvExtraction.extractedData.phone}</span>
                        </div>
                      )}
                      {cvExtraction.extractedData.locationName && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-neutral-600">Khu vực:</span>
                          <span className="text-sm text-neutral-900">{cvExtraction.extractedData.locationName}</span>
                        </div>
                      )}
                      {!cvExtraction.extractedData.fullName &&
                        !cvExtraction.extractedData.email &&
                        !cvExtraction.extractedData.phone &&
                        !cvExtraction.extractedData.locationName && (
                          <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                        )}
                    </div>
                  )}

                  {activeSidebarTab === 'skills' && (
                    <div>
                      {cvExtraction.extractedData.skills && cvExtraction.extractedData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {cvExtraction.extractedData.skills.map((skill, index) => {
                            const skillName = typeof skill === 'string' ? skill : skill.skillName;
                            const skillLevel = typeof skill === 'object' ? skill.level : null;
                            return (
                              <div
                                key={index}
                                className="px-2 py-1 bg-primary-50 border border-primary-200 rounded text-xs text-neutral-900"
                              >
                                {skillName}
                                {skillLevel && <span className="text-primary-600 ml-1">({skillLevel})</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                      )}
                    </div>
                  )}

                  {activeSidebarTab === 'experience' && (
                    <div className="space-y-2">
                      {cvExtraction.extractedData.workExperiences &&
                      cvExtraction.extractedData.workExperiences.length > 0 ? (
                        cvExtraction.extractedData.workExperiences.map((exp, index) => (
                          <div key={index} className="p-2 bg-neutral-50 rounded border border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-900">{exp.position || 'N/A'}</p>
                            <p className="text-xs text-neutral-600">{exp.company || 'N/A'}</p>
                            <p className="text-xs text-neutral-500">
                              {exp.startDate || 'N/A'} - {exp.endDate || 'Hiện tại'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                      )}
                    </div>
                  )}

                  {activeSidebarTab === 'projects' && (
                    <div className="space-y-2">
                      {cvExtraction.extractedData.projects && cvExtraction.extractedData.projects.length > 0 ? (
                        cvExtraction.extractedData.projects.map((project, index) => (
                          <div key={index} className="p-2 bg-neutral-50 rounded border border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-900">{project.projectName || 'N/A'}</p>
                            {project.technologies && (
                              <p className="text-xs text-neutral-600">Tech: {project.technologies}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                      )}
                    </div>
                  )}

                  {activeSidebarTab === 'certificates' && (
                    <div className="space-y-2">
                      {cvExtraction.extractedData.certificates &&
                      cvExtraction.extractedData.certificates.length > 0 ? (
                        cvExtraction.extractedData.certificates.map((cert, index) => (
                          <div key={index} className="p-2 bg-neutral-50 rounded border border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-900">{cert.certificateName || 'N/A'}</p>
                            {cert.issuedDate && <p className="text-xs text-neutral-600">Ngày: {cert.issuedDate}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                      )}
                    </div>
                  )}

                  {activeSidebarTab === 'jobRole' && (
                    <div className="space-y-2">
                      {cvExtraction.extractedData.jobRoleLevels &&
                      cvExtraction.extractedData.jobRoleLevels.length > 0 ? (
                        cvExtraction.extractedData.jobRoleLevels.map((jrl, index) => (
                          <div key={index} className="p-2 bg-neutral-50 rounded border border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-900">{jrl.position || 'N/A'}</p>
                            {jrl.level && <p className="text-xs text-neutral-600">Cấp độ: {jrl.level}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Chưa có thông tin</p>
                      )}
                    </div>
                  )}

                  {activeSidebarTab === 'warnings' && (
                    <div className="space-y-2">
                      {cvExtraction.unmatchedData.location ||
                      (cvExtraction.unmatchedData.skills && cvExtraction.unmatchedData.skills.length > 0) ||
                      (cvExtraction.unmatchedData.jobRoles && cvExtraction.unmatchedData.jobRoles.length > 0) ||
                      (cvExtraction.unmatchedData.certificateTypes &&
                        cvExtraction.unmatchedData.certificateTypes.length > 0) ? (
                        <>
                          {cvExtraction.unmatchedData.location && (
                            <div className="p-2 bg-orange-50 rounded border border-orange-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-orange-700">Khu vực: {cvExtraction.unmatchedData.location}</span>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion('location', '/admin/categories/locations/create')}
                                  disabled={suggestionLoading === 'location' || isSuggestionPending('location')}
                                  className="text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-60"
                                >
                                  {suggestionLoading === 'location' ? 'Đang gửi...' : isSuggestionPending('location') ? 'Đã gửi' : 'Gửi đề xuất'}
                                </button>
                              </div>
                            </div>
                          )}
                          {cvExtraction.unmatchedData.skills && cvExtraction.unmatchedData.skills.length > 0 && (
                            <div className="p-2 bg-orange-50 rounded border border-orange-200">
                              <span className="text-xs font-semibold text-orange-700">
                                Kỹ năng: {cvExtraction.unmatchedData.skills.join(', ')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendSuggestion('skill', '/admin/categories/skills/create')}
                                disabled={suggestionLoading === 'skill' || isSuggestionPending('skill')}
                                className="block mt-1 text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-60"
                              >
                                {suggestionLoading === 'skill' ? 'Đang gửi...' : isSuggestionPending('skill') ? 'Đã gửi' : 'Gửi đề xuất'}
                              </button>
                            </div>
                          )}
                          {cvExtraction.unmatchedData.jobRoles && cvExtraction.unmatchedData.jobRoles.length > 0 && (
                            <div className="p-2 bg-orange-50 rounded border border-orange-200">
                              <span className="text-xs font-semibold text-orange-700">
                                Vị trí: {cvExtraction.unmatchedData.jobRoles.join(', ')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendSuggestion('jobRole', '/admin/categories/job-roles/create')}
                                disabled={suggestionLoading === 'jobRole' || isSuggestionPending('jobRole')}
                                className="block mt-1 text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-60"
                              >
                                {suggestionLoading === 'jobRole' ? 'Đang gửi...' : isSuggestionPending('jobRole') ? 'Đã gửi' : 'Gửi đề xuất'}
                              </button>
                            </div>
                          )}
                          {cvExtraction.unmatchedData.certificateTypes &&
                            cvExtraction.unmatchedData.certificateTypes.length > 0 && (
                              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                                <span className="text-xs font-semibold text-orange-700">
                                  Chứng chỉ: {cvExtraction.unmatchedData.certificateTypes.join(', ')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSendSuggestion('certificateType', '/admin/categories/certificate-types/create')}
                                  disabled={suggestionLoading === 'certificateType' || isSuggestionPending('certificateType')}
                                  className="block mt-1 text-xs text-orange-600 hover:text-orange-800 underline disabled:opacity-60"
                                >
                                  {suggestionLoading === 'certificateType'
                                    ? 'Đang gửi...'
                                    : isSuggestionPending('certificateType')
                                      ? 'Đã gửi'
                                      : 'Gửi đề xuất'}
                                </button>
                              </div>
                            )}
                        </>
                      ) : (
                        <p className="text-sm text-neutral-500 text-center">Không có cảnh báo</p>
                      )}
                    </div>
                  )}
                </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Extract CV Modal */}
      {cvModal.showExtractCVModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cvModal.setShowExtractCVModal(false);
              cvModal.setUseExtractCV(false);
              cvModal.setModalCVFile(null);
              setShowModalCVPreview(false);
              if (cvModal.modalCVPreviewUrl) {
                URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                cvModal.setModalCVPreviewUrl(null);
              }
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-blue-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">Trích xuất thông tin từ CV</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  cvModal.setShowExtractCVModal(false);
                  cvModal.setUseExtractCV(false);
                  cvModal.setModalCVFile(null);
                  setShowModalCVPreview(false);
                  if (cvModal.modalCVPreviewUrl) {
                    URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                    cvModal.setModalCVPreviewUrl(null);
                  }
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* File Input */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Chọn file CV (PDF)
                </label>
                <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={cvModal.handleModalFileChange}
                    className="w-full px-4 py-2.5 text-sm border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/50 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer"
                />
                </div>
              </div>

              {/* File Info */}
              {cvModal.modalCVFile && (
                <div className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <FileText className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">
                      {cvModal.modalCVFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {(cvModal.modalCVFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {/* CV Preview - Collapsible */}
              {cvModal.modalCVPreviewUrl && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowModalCVPreview(!showModalCVPreview)}
                    className="flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-primary-600 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showModalCVPreview ? 'rotate-180' : ''}`} />
                    <span>{showModalCVPreview ? 'Ẩn xem trước CV' : 'Xem trước CV'}</span>
                  </button>
                  {showModalCVPreview && (
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                      <iframe
                        src={cvModal.modalCVPreviewUrl}
                        className="w-full h-80"
                        title="CV Preview"
                      />
                    </div>
                  )}
                </div>
              )}
              </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 flex gap-3 bg-neutral-50">
                <button
                  type="button"
                  onClick={cvModal.handleExtractCVFromModal}
                  disabled={!cvModal.modalCVFile || cvExtraction.extractingCV || cvModal.isExtracting}
                className="flex-1 bg-gradient-to-r from-primary-600 to-blue-600 text-white py-2.5 px-4 rounded-lg hover:from-primary-700 hover:to-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {cvExtraction.extractingCV || cvModal.isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang trích xuất...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Trích xuất thông tin</span>
                  </>
                )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cvModal.setShowExtractCVModal(false);
                    cvModal.setUseExtractCV(false);
                    cvModal.setModalCVFile(null);
                  setShowModalCVPreview(false);
                    if (cvModal.modalCVPreviewUrl) {
                      URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                      cvModal.setModalCVPreviewUrl(null);
                    }
                  }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-100 font-medium transition-colors text-neutral-700"
                >
                  Hủy
                </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Viewer Modal */}
      {cvModal.showCVViewerModal && cvModal.cvPreviewUrl && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => cvModal.setShowCVViewerModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Xem CV</h2>
              <button
                type="button"
                onClick={() => cvModal.setShowCVViewerModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <iframe src={cvModal.cvPreviewUrl} className="w-full h-[70vh] border border-neutral-300 rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Loading/Success Overlay ở giữa màn hình */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[350px] max-w-[500px]">
            {loadingOverlay.type === 'loading' ? (
              <>
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-700 mb-2">Đang xử lý...</p>
                  <p className="text-neutral-600">{loadingOverlay.message}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-success-200 border-t-success-600 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-success-700 mb-2">Thành công!</p>
                  <p className="text-neutral-600 whitespace-pre-line">{loadingOverlay.message}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

