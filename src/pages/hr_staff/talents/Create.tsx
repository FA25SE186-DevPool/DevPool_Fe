import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, User, Star, Briefcase, FolderOpen, Award } from 'lucide-react';
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
import { TalentJobRoleLevelsSection } from '../../../components/ta_staff/talents/TalentJobRoleLevelsSection';
import { TalentCVSection } from '../../../components/ta_staff/talents/TalentCVSection';
import { type TalentCVCreate } from '../../../services/TalentCV';
// import { notificationService, NotificationPriority, NotificationType } from '../../../services/Notification'; // Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
// import { userService } from '../../../services/User'; // Tạm thời comment vì Extracted Data Sidebar đã bị ẩn
import { WORK_EXPERIENCE_POSITIONS } from '../../../constants/WORK_EXPERIENCE_POSITIONS';

export default function CreateTalent() {
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
    skillGroups,
    jobRoles,
    certificateTypes,
    jobRoleLevels,
    jobRoleLevelsForCV,
    loading,
    activeTab,
    setActiveTab,
    errors,
    formError,
    handleChange,
    handleSubmit,
    updateBasicField,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    setInitialCVs,
    setErrors: _setErrors,
    setFormError: _setFormError,
  } = useTalentCreate();

  // Related data management handlers - Tách vào hook
  const handlers = useTalentCreateHandlers({
    talentJobRoleLevels,
    setTalentJobRoleLevels,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
  });

  // File upload management
  const {
    uploadingCV,
    uploadProgress,
    uploadingCVIndex,
    isUploadedFromFirebase,
    setIsUploadedFromFirebase,
    uploadedCVUrl,
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

  // Filters states - Tách vào hook
  const filters = useTalentCreateFilters();
  
  // Danh sách vị trí công việc cho Kinh Nghiệm - Đã move vào constants
  const workExperiencePositions = [...WORK_EXPERIENCE_POSITIONS] as string[];

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
        alert(`✅ Đã gửi ${notificationIds.length} đề xuất cho admin!`);
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
  });

  // Effects - Tách vào hook
  useTalentCreateEffects({
    cvPreviewUrl: cvModal.cvPreviewUrl,
    modalCVPreviewUrl: cvModal.modalCVPreviewUrl,
    isUploadedFromFirebase,
  });


  // Validate CV version
  const validateCVVersion = (
    version: number,
    jobRoleLevelId: number | undefined,
    cvIndex: number,
    allCVs: Partial<TalentCVCreate>[]
  ): string => {
    if (version <= 0) {
      return 'Version phải lớn hơn 0';
    }

    if (!jobRoleLevelId || jobRoleLevelId === 0) {
      return '';
    }

    const cvsSameJobRoleLevel = allCVs.filter(
      (cv, i) => i !== cvIndex && cv.jobRoleLevelId === jobRoleLevelId && cv.version && cv.version > 0
    );

    if (cvsSameJobRoleLevel.length === 0) {
      if (version !== 1) {
        return 'Chưa có CV nào cho vị trí công việc này. Vui lòng tạo version 1 trước.';
      }
      return '';
    }

    const maxVersion = Math.max(...cvsSameJobRoleLevel.map((cv) => cv.version || 0));
    const duplicateCV = cvsSameJobRoleLevel.find((cv) => cv.version === version);

    if (duplicateCV) {
      const suggestedVersion = maxVersion + 1;
      return `Version ${version} đã tồn tại cho vị trí công việc này. Vui lòng chọn version khác (ví dụ: ${suggestedVersion}).`;
    }

    if (version <= maxVersion) {
      const suggestedVersion = maxVersion + 1;
      return `Version ${version} không hợp lệ. Version phải lớn hơn version cao nhất hiện có (${maxVersion}). Vui lòng chọn version ${suggestedVersion} hoặc cao hơn.`;
    }

    return '';
  };

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

  // Tự động cập nhật vị trí ở form hiện tại khi chọn vị trí ở CV Ban Đầu
  // Không tạo form mới, chỉ cập nhật form đầu tiên (hoặc form có jobRoleLevelId = 0)
  // Chỉ chạy khi không phải từ trích xuất CV (vì trích xuất đã tự động thêm vị trí rồi)
  useEffect(() => {
    if (!initialCVs || initialCVs.length === 0) return;
    if (!jobRoleLevels || jobRoleLevels.length === 0) return;

    // Lấy jobRoleLevelId đầu tiên từ CV (nếu có)
    const firstCVJobRoleLevelId = initialCVs
      .find((cv) => cv.jobRoleLevelId && cv.jobRoleLevelId > 0)?.jobRoleLevelId;

    if (!firstCVJobRoleLevelId) return;

    // Kiểm tra xem vị trí này đã có trong talentJobRoleLevels chưa
    const existingJobRoleLevel = talentJobRoleLevels.find(
      (jrl) => jrl.jobRoleLevelId === firstCVJobRoleLevelId && jrl.jobRoleLevelId > 0
    );

    // Nếu vị trí đã có rồi (từ trích xuất), không cần cập nhật nữa
    if (existingJobRoleLevel) return;

    // Tìm form đầu tiên có jobRoleLevelId = 0 hoặc chưa có vị trí
    const firstEmptyFormIndex = talentJobRoleLevels.findIndex((jrl) => !jrl.jobRoleLevelId || jrl.jobRoleLevelId === 0);

    if (firstEmptyFormIndex >= 0) {
      // Cập nhật form đầu tiên với vị trí từ CV
      setTalentJobRoleLevels((prev) => {
        const updated = [...prev];
        updated[firstEmptyFormIndex] = {
          ...updated[firstEmptyFormIndex],
          jobRoleLevelId: firstCVJobRoleLevelId,
        };
        return updated;
      });
    } else if (talentJobRoleLevels.length > 0) {
      // Nếu không có form trống, cập nhật form đầu tiên
      setTalentJobRoleLevels((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          jobRoleLevelId: firstCVJobRoleLevelId,
        };
        return updated;
      });
    }
    // Note: selectedJobRoleLevelName sẽ được tự động set bởi useEffect trong TalentJobRoleLevelsSection
  }, [initialCVs, jobRoleLevels, talentJobRoleLevels, setTalentJobRoleLevels]);

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
                  <p className="text-sm text-neutral-600">Thêm nhân sự (developer) mới vào hệ thống DevPool</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form with Extracted Data Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 px-2 lg:px-4 py-6">
            {/* Main Form */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
              <form onSubmit={handleSubmit}>
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
                <div className="sticky top-16 z-50 border-b border-neutral-200 bg-white shadow-sm">
                  <div className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <button
                      type="button"
                      onClick={() => setActiveTab('required')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'required'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Thông tin cơ bản
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('skills')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'skills'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      Kỹ năng
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('experience')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'experience'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Kinh nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'projects'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      Dự án
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('certificates')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                        activeTab === 'certificates'
                          ? 'border-primary-500 text-primary-600 bg-white'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
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
                    {/* Tab: Thông tin cơ bản */}
                    {activeTab === 'required' && (
                      <TalentBasicInfoForm
                        formData={formData}
                        partners={partners}
                        locations={locations}
                        errors={errors}
                        onChange={handleChange}
                        onPartnerChange={(partnerId) => {
                          const syntheticEvent = {
                            target: {
                              name: 'currentPartnerId',
                              value: partnerId || '',
                            },
                          } as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
                          handleChange(syntheticEvent);
                        }}
                      />
                    )}

                    {/* Tab: Kỹ năng */}
                    {activeTab === 'skills' && (
                      <>
                        <TalentSkillsSection
                          talentSkills={talentSkills}
                          skills={skills}
                          skillGroups={skillGroups}
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
                          onUpdate={handlers.updateSkill}
                          errors={errors}
                        />
                      </>
                    )}

                    {/* Tab: Kinh nghiệm */}
                    {activeTab === 'experience' && (
                      <>
                        <TalentWorkExperienceSection
                          talentWorkExperiences={talentWorkExperiences}
                          workExperiencePositions={workExperiencePositions}
                          workExperiencePositionSearch={filters.workExperiencePositionSearch}
                          setWorkExperiencePositionSearch={filters.setWorkExperiencePositionSearch}
                          isWorkExperiencePositionDropdownOpen={filters.isWorkExperiencePositionDropdownOpen}
                          setIsWorkExperiencePositionDropdownOpen={filters.setIsWorkExperiencePositionDropdownOpen}
                          onAdd={handlers.addWorkExperience}
                          onRemove={handlers.removeWorkExperience}
                          onUpdate={handlers.updateWorkExperience}
                          errors={errors}
                        />
                      </>
                    )}

                    {/* Tab: Dự án */}
                    {activeTab === 'projects' && (
                      <>
                        <TalentProjectsSection
                          talentProjects={talentProjects}
                          onAdd={handlers.addProject}
                          onRemove={handlers.removeProject}
                          onUpdate={handlers.updateProject}
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
                          onUpdate={handlers.updateCertificate}
                          onFileChange={handleFileChangeCertificate}
                          onUploadImage={uploadCertificateImage}
                          onDeleteImage={deleteCertificateImage}
                          errors={errors}
                        />
                      </>
                    )}

                  {/* Submit Button */}
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
                  uploadedCVUrl={uploadedCVUrl}
                  errors={errors}
                  validateCVVersion={validateCVVersion}
                  onFileChange={(file) => cvModal.setCvFile(file)}
                  onUploadCV={async (cvIndex) => {
                    if (!cvModal.cvFile) {
                      alert('Vui lòng chọn file CV trước!');
                      return;
                    }
                    const cv = initialCVs[cvIndex];
                    if (!cv?.version || !cv?.jobRoleLevelId) {
                      alert('Vui lòng nhập version và chọn vị trí công việc trước!');
                      return;
                    }
                    const url = await uploadCV(cvModal.cvFile, cvIndex, cv.version, cv.jobRoleLevelId);
                    if (url) {
                      updateInitialCV(cvIndex, 'cvFileUrl', url);
                    }
                  }}
                  onDeleteCVFile={async (cvIndex: number) => {
                    const cv = initialCVs[cvIndex];
                    if (cv?.cvFileUrl) {
                      await deleteCVFile(cvIndex, cv.cvFileUrl);
                      updateInitialCV(cvIndex, 'cvFileUrl', '');
                    }
                  }}
                  onUpdateCV={updateInitialCV}
                  onCVUrlChange={(index: number, url: string) => {
                    updateInitialCV(index, 'cvFileUrl', url);
                  }}
                />
              </div>

              {/* Job Role Levels Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-neutral-200/50">
                <TalentJobRoleLevelsSection
                  talentJobRoleLevels={talentJobRoleLevels}
                  jobRoleLevels={jobRoleLevels}
                  selectedJobRoleFilterId={filters.selectedJobRoleFilterId}
                  setSelectedJobRoleFilterId={filters.setSelectedJobRoleFilterId}
                  selectedJobRoleLevelName={filters.selectedJobRoleLevelName}
                  setSelectedJobRoleLevelName={filters.setSelectedJobRoleLevelName}
                  jobRoleLevelNameSearch={filters.jobRoleLevelNameSearch}
                  setJobRoleLevelNameSearch={filters.setJobRoleLevelNameSearch}
                  isJobRoleLevelNameDropdownOpen={filters.isJobRoleLevelNameDropdownOpen}
                  setIsJobRoleLevelNameDropdownOpen={filters.setIsJobRoleLevelNameDropdownOpen}
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
                  onRemove={handlers.removeJobRoleLevel}
                  onUpdate={handlers.updateJobRoleLevel}
                  onSetErrors={_setErrors}
                  errors={errors}
                  initialCVs={initialCVs}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ paddingTop: '10vh' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cvModal.setShowExtractCVModal(false);
              cvModal.setUseExtractCV(false);
              cvModal.setModalCVFile(null);
              if (cvModal.modalCVPreviewUrl) {
                URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                cvModal.setModalCVPreviewUrl(null);
              }
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Trích xuất thông tin từ CV</h2>
              <button
                type="button"
                onClick={() => {
                  cvModal.setShowExtractCVModal(false);
                  cvModal.setUseExtractCV(false);
                  cvModal.setModalCVFile(null);
                  if (cvModal.modalCVPreviewUrl) {
                    URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                    cvModal.setModalCVPreviewUrl(null);
                  }
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Chọn file CV (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={cvModal.handleModalFileChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {cvModal.modalCVPreviewUrl && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Preview CV</label>
                  <iframe src={cvModal.modalCVPreviewUrl} className="w-full h-96 border border-neutral-300 rounded-lg" />
                </div>
              )}

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cvModal.createCVFromExtract}
                    onChange={(e) => cvModal.setCreateCVFromExtract(e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">Tạo CV luôn (upload lên Firebase)</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cvModal.handleExtractCVFromModal}
                  disabled={!cvModal.modalCVFile || cvExtraction.extractingCV || cvModal.isExtracting}
                  className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cvExtraction.extractingCV || cvModal.isExtracting ? 'Đang trích xuất...' : 'Trích xuất thông tin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cvModal.setShowExtractCVModal(false);
                    cvModal.setUseExtractCV(false);
                    cvModal.setModalCVFile(null);
                    if (cvModal.modalCVPreviewUrl) {
                      URL.revokeObjectURL(cvModal.modalCVPreviewUrl);
                      cvModal.setModalCVPreviewUrl(null);
                    }
                  }}
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
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
    </div>
  );
}

