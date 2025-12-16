import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sidebar/ta_staff';
import PageLoader from '../../../components/common/PageLoader';
import { TalentDetailProjectsSection } from '../../../components/ta_staff/talents/TalentDetailProjectsSection';
import { TalentDetailCVsSection } from '../../../components/ta_staff/talents/TalentDetailCVsSection';
import { TalentDetailSkillsSection } from '../../../components/ta_staff/talents/TalentDetailSkillsSection';
import { TalentDetailCertificatesSection } from '../../../components/ta_staff/talents/TalentDetailCertificatesSection';
import { TalentDetailExperiencesSection } from '../../../components/ta_staff/talents/TalentDetailExperiencesSection';
import { TalentDetailJobRoleLevelsSection } from '../../../components/ta_staff/talents/TalentDetailJobRoleLevelsSection';
import { TalentDetailAvailableTimesSection } from '../../../components/ta_staff/talents/TalentDetailAvailableTimesSection';
import { SkillGroupVerificationModal } from '../../../components/ta_staff/talents/SkillGroupVerificationModal';
import { SkillGroupHistoryModal } from '../../../components/ta_staff/talents/SkillGroupHistoryModal';
import { PartnerInfoModal } from '../../../components/ta_staff/talents/PartnerInfoModal';
import { partnerService, type PartnerDetailedModel } from '../../../services/Partner';
import { useTalentDetail } from '../../../hooks/useTalentDetail';
import { useTalentDetailOperations } from '../../../hooks/useTalentDetailOperations';
import { useTalentDetailCVAnalysis } from '../../../hooks/useTalentDetailCVAnalysis';
import { useTalentDetailSkillGroupVerification } from '../../../hooks/useTalentDetailSkillGroupVerification';
import { useTalentDetailPagination } from '../../../hooks/useTalentDetailPagination';
import { useTalentDetailSkillActions } from '../../../hooks/useTalentDetailSkillActions';
import { useTalentDetailCVForm } from '../../../hooks/useTalentDetailCVForm';
import { talentService } from '../../../services/Talent';
import { talentCVService, type TalentCV } from '../../../services/TalentCV';
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from '../../../services/JobRoleLevel';
import { talentJobRoleLevelService, type TalentJobRoleLevel } from '../../../services/TalentJobRoleLevel';
import { talentSkillService, type TalentSkill } from '../../../services/TalentSkill';
import { skillService, type Skill } from '../../../services/Skill';
import { WorkingMode } from '../../../constants/WORKING_MODE';
import { formatLinkDisplay as formatLinkDisplayUtil, getLevelTextForSkills, getTalentLevelName } from '../../../utils/talentHelpers';
import { validateIssuedDate, validateStartTime, validateEndTime } from '../../../utils/validators';
import { getStatusConfig } from '../../../utils/talentStatus';
import { TalentDetailHeader } from '../../../components/ta_staff/talents/TalentDetailHeader';
import { type TalentDetailTab } from '../../../components/ta_staff/talents/TalentDetailTabNavigation';
import { TalentDetailBasicInfoTabs } from '../../../components/ta_staff/talents/TalentDetailBasicInfoTabs';

// Mapping WorkingMode values to Vietnamese names
const workingModeLabels: Record<number, string> = {
  [WorkingMode.None]: 'Không xác định',
  [WorkingMode.Onsite]: 'Tại văn phòng',
  [WorkingMode.Remote]: 'Từ xa',
  [WorkingMode.Hybrid]: 'Kết hợp',
  [WorkingMode.Flexible]: 'Linh hoạt',
};

// Status configuration helper is now in utils/talentStatus.ts

export default function TalentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const locationState = location.state as {
    tab?: 'projects' | 'cvs' | 'jobRoleLevels' | 'skills' | 'availableTimes' | 'certificates' | 'experiences';
    defaultTab?: 'projects' | 'cvs' | 'jobRoleLevels' | 'skills' | 'availableTimes' | 'certificates' | 'experiences';
  } | null;
  const initialTab = locationState?.tab || locationState?.defaultTab;

  // ========== HOOKS - Logic được tách ra hooks ==========
  // Main data fetching
  const {
    talent,
    locationName,
    partnerName,
    loading,
    talentCVs,
    setTalentCVs,
    talentProjects,
    setTalentProjects,
    talentSkills,
    setTalentSkills,
    workExperiences,
    setWorkExperiences,
    jobRoleLevels,
    setJobRoleLevels,
    certificates,
    setCertificates,
    availableTimes,
    setAvailableTimes,
    blacklists,
    lookupSkills,
    lookupSkillGroups,
    lookupJobRoleLevelsForTalent,
    lookupCertificateTypes,
    jobRoles,
    canEdit,
    getLevelText,
  } = useTalentDetail();

  // Inline forms and operations
  const operations = useTalentDetailOperations();

  // CV Analysis
  const cvAnalysis = useTalentDetailCVAnalysis(
    lookupSkills,
    talentSkills,
    lookupJobRoleLevelsForTalent,
    jobRoleLevels,
    lookupCertificateTypes,
    certificates,
    talentCVs
  );

  // Skill Group Verification
  const skillGroupVerification = useTalentDetailSkillGroupVerification(talentSkills);

  // Pagination
  const pagination = useTalentDetailPagination();

  // ========== LOCAL STATES ==========
  const [activeTab, setActiveTab] = useState<TalentDetailTab | null>(initialTab || null);
  
  // Khi có initialTab từ location state, tự động set activeTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [collapsedInactiveCVGroups, setCollapsedInactiveCVGroups] = useState<Set<string>>(new Set());

  // Skills section states
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [selectedSkillGroupId, setSelectedSkillGroupId] = useState<number | undefined>(undefined);
  // Skill group dropdown states (separate from skill dropdown)
  const [isSkillGroupDropdownOpen, setIsSkillGroupDropdownOpen] = useState(false);
  const [skillGroupSearchQuery, setSkillGroupSearchQuery] = useState<string>('');
  const [skillListSearchQuery, setSkillListSearchQuery] = useState<string>('');
  const [skillGroupListSearchQuery, setSkillGroupListSearchQuery] = useState<string>('');
  const [isSkillGroupListDropdownOpen, setIsSkillGroupListDropdownOpen] = useState(false);
  const [selectedSkillGroupIdForList, setSelectedSkillGroupIdForList] = useState<number | undefined>(undefined);
  const [showOnlyUnverifiedSkills, setShowOnlyUnverifiedSkills] = useState<boolean>(false);
  const skillGroupsPerPage = 3;

  // Certificates section states
  const [certificateTypeSearch, setCertificateTypeSearch] = useState<string>('');
  const [isCertificateTypeDropdownOpen, setIsCertificateTypeDropdownOpen] = useState(false);
  // Certificate file upload states are now in useTalentDetailOperations hook

  // Experiences section states
  const [workExperiencePositionSearch, setWorkExperiencePositionSearch] = useState<string>('');
  const [isWorkExperiencePositionDropdownOpen, setIsWorkExperiencePositionDropdownOpen] = useState(false);
  
  // Projects section states
  const [projectPositionSearch, setProjectPositionSearch] = useState<string>('');
  const [isProjectPositionDropdownOpen, setIsProjectPositionDropdownOpen] = useState(false);

  // Partner modal states
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerDetailedModel | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Tính toán danh sách vị trí từ CVs đã được tạo
  const availablePositions = useMemo(() => {
    if (!talentCVs || talentCVs.length === 0 || !lookupJobRoleLevelsForTalent || lookupJobRoleLevelsForTalent.length === 0) {
      return [];
    }

    // Lấy các jobRoleLevelId từ CVs (chỉ lấy những CV có jobRoleLevelId hợp lệ)
    const cvJobRoleLevelIds = talentCVs
      .filter((cv) => cv.jobRoleLevelId && cv.jobRoleLevelId > 0)
      .map((cv) => cv.jobRoleLevelId!)
      .filter((id, index, self) => self.indexOf(id) === index);

    if (cvJobRoleLevelIds.length === 0) {
      return [];
    }

    // Lấy các jobRoleId từ các jobRoleLevel đã chọn trong CV
    const cvJobRoleIds = lookupJobRoleLevelsForTalent
      .filter((jrl) => cvJobRoleLevelIds.includes(jrl.id))
      .map((jrl) => jrl.jobRoleId)
      .filter((id, index, self) => self.indexOf(id) === index);

    // Lọc các jobRoleLevel có cùng jobRoleId với các CV đã chọn
    const filteredJobRoleLevels = lookupJobRoleLevelsForTalent.filter((jrl) =>
      cvJobRoleIds.includes(jrl.jobRoleId)
    );

    // Lấy unique names từ các jobRoleLevel đã lọc
    const uniqueNames = Array.from(
      new Set(filteredJobRoleLevels.map((jrl) => jrl.name).filter((name) => name && name.trim() !== ''))
    ).sort();

    return uniqueNames;
  }, [talentCVs, lookupJobRoleLevelsForTalent]);

  // Sử dụng availablePositions cho cả work experience và project
  const workExperiencePositions = availablePositions;
  const projectPositions = availablePositions;

  // Job Role Levels section states
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<string>('');
  const [jobRoleLevelNameSearch, setJobRoleLevelNameSearch] = useState<string>('');
  const [isJobRoleLevelNameDropdownOpen, setIsJobRoleLevelNameDropdownOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [selectedJobRoleFilterId, setSelectedJobRoleFilterId] = useState<number | undefined>(undefined);
  const [jobRoleFilterSearch, setJobRoleFilterSearch] = useState<string>('');
  const [isJobRoleFilterDropdownOpen, setIsJobRoleFilterDropdownOpen] = useState(false);

  // Skill actions (must be after state declarations)
  const skillActions = useTalentDetailSkillActions({
    setActiveTab,
    handleOpenInlineForm: operations.handleOpenInlineForm,
    setInlineSkillForm: operations.setInlineSkillForm,
    setSelectedSkillGroupId,
    setSkillSearchQuery,
    setIsSkillDropdownOpen,
    lookupSkills,
  });

  // CV Form hook - Handler để refresh CVs sau khi tạo CV mới
  const handleRefreshCVs = useCallback(async () => {
    if (!id) return;
    try {
      const cvsResponse = await talentCVService.getAll({ talentId: Number(id), excludeDeleted: true });
      // Normalize response to array
      const cvs = Array.isArray(cvsResponse) 
        ? cvsResponse 
        : (Array.isArray(cvsResponse?.items) 
          ? cvsResponse.items 
          : (Array.isArray(cvsResponse?.data) 
            ? cvsResponse.data 
            : []));
      console.log(`🔄 Refresh CVs - count: ${cvs.length}`, cvs);
      const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true });
      const jobRoleLevelsArray = Array.isArray(allJobRoleLevels) ? allJobRoleLevels : [];
      const cvsWithJobRoleLevelNames = cvs.map((cv: TalentCV) => {
        const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
        return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? 'Chưa xác định' };
      });
      const sortedCVs = cvsWithJobRoleLevelNames.sort((a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
        const nameA = a.jobRoleLevelName || '';
        const nameB = b.jobRoleLevelName || '';
        if (nameA !== nameB) {
          return nameA.localeCompare(nameB);
        }
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return (b.version || 0) - (a.version || 0);
      });
      console.log(`✅ Setting talentCVs - count: ${sortedCVs.length}`, sortedCVs);
      setTalentCVs(sortedCVs);
    } catch (err) {
      console.error('❌ Lỗi khi refresh CVs:', err);
    }
  }, [id, setTalentCVs]);

  const cvForm = useTalentDetailCVForm({
    inlineCVForm: operations.inlineCVForm,
    setInlineCVForm: operations.setInlineCVForm,
    cvFormErrors: operations.cvFormErrors,
    setCvFormErrors: operations.setCvFormErrors,
    cvVersionError: operations.cvVersionError,
    setCvVersionError: operations.setCvVersionError,
    isSubmitting: operations.isSubmitting,
    setIsSubmitting: operations.setIsSubmitting,
    lookupJobRoleLevels: lookupJobRoleLevelsForTalent,
    analysisResult: cvAnalysis.analysisResult,
    onRefreshCVs: handleRefreshCVs,
    onCloseForm: () => operations.handleCloseInlineForm(),
    canEdit,
    jobRoleLevelSystemMap: cvAnalysis.jobRoleLevelSystemMap,
    setAnalysisResult: cvAnalysis.setAnalysisResult,
    setAnalysisResultCVId: cvAnalysis.setAnalysisResultCVId,
    analysisResultStorageKey: cvAnalysis.ANALYSIS_RESULT_STORAGE_KEY,
  });

  // ========== HANDLERS ==========
  // Delete talent
  const handleDelete = useCallback(async () => {
    if (!id) return;
    const confirm = window.confirm('⚠️ Bạn có chắc muốn xóa nhân sự này?');
    if (!confirm) return;

    try {
      await talentService.deleteById(Number(id));
      alert('✅ Đã xóa nhân sự thành công!');
      navigate('/ta/developers');
    } catch (err) {
      console.error('❌ Lỗi khi xóa:', err);
      alert('Không thể xóa nhân sự!');
    }
  }, [id, navigate]);

  // Edit talent
  const handleEdit = useCallback(() => {
    navigate(`/ta/developers/edit/${id}`);
  }, [id, navigate]);

  // Format link display
  // Use formatLinkDisplay from utils
  const formatLinkDisplay = formatLinkDisplayUtil;

  // Submit inline project handler
  const handleSubmitInlineProject = useCallback(async () => {
    await operations.handleSubmitInlineProject(talentCVs, (projects) => {
      setTalentProjects(projects);
    });
  }, [operations, talentCVs, setTalentProjects]);

  // Submit inline skill handler
  const handleSubmitInlineSkill = useCallback(async () => {
    await operations.handleSubmitInlineSkill(
      (skills) => {
        setTalentSkills(skills);
      },
      (statuses) => {
        skillGroupVerification.setSkillGroupVerificationStatuses((prev) => ({
          ...prev,
          ...statuses,
        }));
      }
    );
  }, [operations, setTalentSkills, skillGroupVerification]);

  // Submit inline certificate handler
  const handleSubmitInlineCertificate = useCallback(async () => {
    await operations.handleSubmitInlineCertificate((certificates) => {
      setCertificates(certificates);
    });
  }, [operations, setCertificates]);

  // Submit inline experience handler
  const handleSubmitInlineExperience = useCallback(async () => {
    await operations.handleSubmitInlineExperience(talentCVs, (experiences) => {
      setWorkExperiences(experiences);
    });
  }, [operations, talentCVs, setWorkExperiences]);

  // Submit inline job role level handler
  const handleSubmitInlineJobRoleLevel = useCallback(async () => {
    await operations.handleSubmitInlineJobRoleLevel(lookupJobRoleLevelsForTalent, (jobRoleLevels) => {
      setJobRoleLevels(jobRoleLevels);
    });
  }, [operations, lookupJobRoleLevelsForTalent, setJobRoleLevels]);

  // Refresh job role levels after edit in modal
  const handleRefreshJobRoleLevels = useCallback(async () => {
    if (!id) return;
    try {
      const jobRoleLevelsData = await talentJobRoleLevelService.getAll({
        talentId: Number(id),
        excludeDeleted: true,
      });
      const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
      const levelMap: Record<number, string> = {
        [TalentLevel.Junior]: 'Junior',
        [TalentLevel.Middle]: 'Middle',
        [TalentLevel.Senior]: 'Senior',
        [TalentLevel.Lead]: 'Lead',
      };
      const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
        const jobRoleLevelInfo = allJobRoleLevels.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
        if (!jobRoleLevelInfo) {
          return { ...jrl, jobRoleLevelName: 'Unknown Level', jobRoleLevelLevel: '—' };
        }
        const levelText = levelMap[jobRoleLevelInfo.level] || 'Unknown';
        return { ...jrl, jobRoleLevelName: jobRoleLevelInfo.name || '—', jobRoleLevelLevel: levelText };
      });
      setJobRoleLevels(jobRoleLevelsWithNames);
    } catch (err) {
      console.error('❌ Lỗi khi refresh job role levels:', err);
    }
  }, [id, setJobRoleLevels]);

  // Refresh skills after edit in modal
  const handleRefreshSkills = useCallback(async () => {
    if (!id) return;
    try {
      const skillsData = await talentSkillService.getAll({
        talentId: Number(id),
        excludeDeleted: true,
      });
      const allSkills = await skillService.getAll({ excludeDeleted: true });
      const skillsArray = Array.isArray(skillsData) ? skillsData : [];
      const allSkillsArray = Array.isArray(allSkills) ? allSkills : [];
      const skillsWithNames = skillsArray.map((skill: TalentSkill) => {
        const skillInfo = allSkillsArray.find((s: Skill) => s.id === skill.skillId);
        return {
          ...skill,
          skillName: skillInfo?.name ?? 'Unknown Skill',
          skillGroupId: skillInfo?.skillGroupId,
        };
      });
      setTalentSkills(skillsWithNames);
    } catch (err) {
      console.error('❌ Lỗi khi refresh skills:', err);
    }
  }, [id, setTalentSkills]);

  // Quick create job role level handler
  const handleQuickCreateJobRoleLevel = useCallback(
    (jobRole: {
      jobRoleLevelId: number;
      position: string;
      level?: string;
      yearsOfExp?: number;
      ratePerMonth?: number;
    }) => {
      setActiveTab('jobRoleLevels');
      operations.handleOpenInlineForm('jobRoleLevel');

      setTimeout(() => {
        // Tìm job role level từ lookup
        const jobRoleLevel = lookupJobRoleLevelsForTalent.find((jrl) => jrl.id === jobRole.jobRoleLevelId);
        
        if (jobRoleLevel) {
          // Set tên vị trí
          setSelectedJobRoleLevelName(jobRoleLevel.name || '');
          
          // Set level từ CV nếu có, nếu không thì dùng level từ jobRoleLevel
          if (jobRole.level) {
            // Map CV level to system level
            const levelMap: Record<string, number> = {
              junior: 0,
              middle: 1,
              senior: 2,
              lead: 3,
            };
            const cvLevel = jobRole.level.toLowerCase();
            const mappedLevel = levelMap[cvLevel] !== undefined ? levelMap[cvLevel] : jobRoleLevel.level;
            setSelectedLevel(mappedLevel);
          } else {
            setSelectedLevel(jobRoleLevel.level);
          }

          // Set form data
          operations.setInlineJobRoleLevelForm({
            jobRoleLevelId: jobRole.jobRoleLevelId,
            yearsOfExp: jobRole.yearsOfExp || 1,
            ratePerMonth: jobRole.ratePerMonth,
          });

          // Set job role filter
          setSelectedJobRoleFilterId(jobRoleLevel.jobRoleId);
        }

        setIsJobRoleLevelNameDropdownOpen(false);
        setJobRoleLevelNameSearch('');
      }, 100);
    },
    [
      setActiveTab,
      operations,
      lookupJobRoleLevelsForTalent,
      setSelectedJobRoleLevelName,
      setSelectedLevel,
      setSelectedJobRoleFilterId,
      setIsJobRoleLevelNameDropdownOpen,
      setJobRoleLevelNameSearch,
    ]
  );

  // Quick create unmatched job role level handler (chưa có trong hệ thống)
  const handleQuickCreateUnmatchedJobRoleLevel = useCallback(
    (jobRole: {
      position: string;
      level?: string;
      yearsOfExp?: number;
      ratePerMonth?: number;
    }) => {
      setActiveTab('jobRoleLevels');
      operations.handleOpenInlineForm('jobRoleLevel');

      setTimeout(() => {
        // Tìm job role level tương tự từ lookup dựa trên position và level
        const levelMap: Record<string, number> = {
          junior: 0,
          middle: 1,
          senior: 2,
          lead: 3,
        };
        const cvLevel = jobRole.level ? levelMap[jobRole.level.toLowerCase()] : undefined;

        // Tìm job role level có tên tương tự
        const similarJobRoleLevel = lookupJobRoleLevelsForTalent.find((jrl) => {
          const nameMatch = jrl.name?.toLowerCase().includes(jobRole.position.toLowerCase()) ||
            jobRole.position.toLowerCase().includes(jrl.name?.toLowerCase() || '');
          const levelMatch = cvLevel !== undefined ? jrl.level === cvLevel : true;
          return nameMatch && levelMatch;
        });

        if (similarJobRoleLevel) {
          // Nếu tìm thấy job role level tương tự, set nó
          setSelectedJobRoleLevelName(similarJobRoleLevel.name || '');
          setSelectedLevel(similarJobRoleLevel.level);
          operations.setInlineJobRoleLevelForm({
            jobRoleLevelId: similarJobRoleLevel.id,
            yearsOfExp: jobRole.yearsOfExp || 1,
            ratePerMonth: jobRole.ratePerMonth,
          });
          setSelectedJobRoleFilterId(similarJobRoleLevel.jobRoleId);
        } else {
          // Nếu không tìm thấy, chỉ điền thông tin từ CV, để người dùng tự chọn
          setSelectedJobRoleLevelName('');
          setSelectedLevel(cvLevel);
          operations.setInlineJobRoleLevelForm({
            jobRoleLevelId: 0,
            yearsOfExp: jobRole.yearsOfExp || 1,
            ratePerMonth: jobRole.ratePerMonth,
          });
          
          // Set search query để gợi ý
          setJobRoleLevelNameSearch(jobRole.position);
        }

        setIsJobRoleLevelNameDropdownOpen(false);
      }, 100);
    },
    [
      setActiveTab,
      operations,
      lookupJobRoleLevelsForTalent,
      setSelectedJobRoleLevelName,
      setSelectedLevel,
      setSelectedJobRoleFilterId,
      setIsJobRoleLevelNameDropdownOpen,
      setJobRoleLevelNameSearch,
    ]
  );

  // Delete handlers
  const handleDeleteProjects = useCallback(async () => {
    await operations.handleDeleteProjects((projects) => {
      setTalentProjects(projects);
    });
  }, [operations, setTalentProjects]);

  const handleDeleteSkills = useCallback(async () => {
    await operations.handleDeleteSkills(
      (skills) => {
        setTalentSkills(skills);
      },
      (statuses) => {
        skillGroupVerification.setSkillGroupVerificationStatuses((prev) => ({
          ...prev,
          ...statuses,
        }));
      }
    );
  }, [operations, setTalentSkills, skillGroupVerification]);

  const handleDeleteExperiences = useCallback(async () => {
    await operations.handleDeleteExperiences((experiences) => {
      setWorkExperiences(experiences);
    });
  }, [operations, setWorkExperiences]);

  const handleDeleteJobRoleLevels = useCallback(async () => {
    await operations.handleDeleteJobRoleLevels((jobRoleLevels) => {
      setJobRoleLevels(jobRoleLevels);
    });
  }, [operations, setJobRoleLevels]);

  const handleDeleteCertificates = useCallback(async () => {
    await operations.handleDeleteCertificates((certificates) => {
      setCertificates(certificates);
    });
  }, [operations, setCertificates]);

  const handleDeleteAvailableTimes = useCallback(async () => {
    await operations.handleDeleteAvailableTimes((availableTimes) => {
      setAvailableTimes(availableTimes);
    });
  }, [operations, setAvailableTimes]);

  // Submit inline available time handler
  const handleSubmitInlineAvailableTime = useCallback(async () => {
    await operations.handleSubmitInlineAvailableTime((availableTimes) => {
      setAvailableTimes(availableTimes);
    });
  }, [operations, setAvailableTimes]);

  // Delete CVs handler
  const handleDeleteCVs = useCallback(async () => {
    await operations.handleDeleteCVs(talentCVs, (cvs) => {
      setTalentCVs(cvs);
    });
  }, [operations, talentCVs, setTalentCVs]);

  // Analyze CV from URL handler
  const handleAnalyzeCVFromUrl = useCallback(
    async (cv: (typeof talentCVs)[0]) => {
      await cvAnalysis.handleAnalyzeCVFromUrl(cv, canEdit);
    },
    [cvAnalysis, canEdit]
  );

  // Cancel analysis handler
  const handleCancelAnalysis = useCallback(async () => {
    const hasFirebaseFile = cvForm?.isCVUploadedFromFirebase || false;
    const uploadedCVUrl = cvForm?.uploadedCVUrl || null;
    
    await cvAnalysis.handleCancelAnalysis(
      canEdit,
      hasFirebaseFile,
      uploadedCVUrl,
      () => {
        // Luôn đóng form CV khi hủy phân tích
        operations.handleCloseInlineForm();
      }
    );
  }, [cvAnalysis, canEdit, operations, cvForm]);


  // Use getLevelTextForSkills from utils
  const getLevelTextForSkillsWrapper = useCallback(
    (level: string): string => {
      return getLevelTextForSkills(level, getLevelText);
    },
    [getLevelText]
  );

  // Helper function to check if values are different
  const isValueDifferent = useCallback((current: string | null | undefined, suggested: string | null | undefined): boolean => {
    const currentVal = (current ?? '').trim();
    const suggestedVal = (suggested ?? '').trim();
    return currentVal !== suggestedVal && suggestedVal !== '';
  }, []);

  // Helper function to get level label
  const getLevelLabel = useCallback((level: string | null | undefined): string => {
    const levelMap: { [key: string]: string } = {
      'Beginner': 'Mới bắt đầu',
      'Intermediate': 'Trung bình',
      'Advanced': 'Nâng cao',
      'Expert': 'Chuyên gia',
    };
    return levelMap[level || 'Beginner'] || 'Mới bắt đầu';
  }, []);

  // Skill actions are now in useTalentDetailSkillActions hook
  // Use handlers from skillActions hook

  // Certificate file upload handlers are now in useTalentDetailOperations hook

  // Use validation functions from utils
  // validateIssuedDate, validateStartTime, validateEndTime are imported from utils


  // Job Role Levels and Certificates computed values are now in useTalentDetailCVAnalysis hook
  // Use computed values from cvAnalysis hook

  // Auto-close inline form when switching tabs
  useEffect(() => {
    if (operations.isSubmitting) return;

    const formTabMap: Record<string, string> = {
      project: 'projects',
      skill: 'skills',
      certificate: 'certificates',
      experience: 'experiences',
      jobRoleLevel: 'jobRoleLevels',
      availableTime: 'availableTimes',
      cv: 'cvs',
    };

    if (operations.showInlineForm) {
      if (operations.showInlineForm === 'cv') {
        return; // Don't close CV form when switching tabs
      }

      const formTab = formTabMap[operations.showInlineForm];
      if (formTab && formTab !== activeTab) {
        operations.handleCloseInlineForm();
      }
    }
  }, [activeTab, operations.showInlineForm, operations.isSubmitting, operations]);

  // Reset pagination when data changes
  useEffect(() => {
    pagination.setPageCVs(1);
  }, [talentCVs.length, pagination]);

  useEffect(() => {
    pagination.setPageProjects(1);
  }, [talentProjects.length, pagination]);

  useEffect(() => {
    pagination.setPageSkills(1);
  }, [talentSkills.length, activeTab, pagination.setPageSkills]);

  useEffect(() => {
    pagination.setPageExperiences(1);
  }, [workExperiences.length, pagination]);

  useEffect(() => {
    pagination.setPageJobRoleLevels(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRoleLevels.length]);

  useEffect(() => {
    pagination.setPageCertificates(1);
  }, [certificates.length, pagination]);

  useEffect(() => {
    pagination.setPageAvailableTimes(1);
  }, [availableTimes.length, pagination]);

  // Reset job role level form states when form is closed
  useEffect(() => {
    if (operations.showInlineForm !== 'jobRoleLevel') {
      // Reset all job role level form related states
      setSelectedJobRoleLevelName('');
      setJobRoleLevelNameSearch('');
      setSelectedLevel(undefined);
      setIsJobRoleLevelNameDropdownOpen(false);
      setIsLevelDropdownOpen(false);
      setSelectedJobRoleFilterId(undefined);
      setJobRoleFilterSearch('');
      setIsJobRoleFilterDropdownOpen(false);
    }
  }, [operations.showInlineForm]);

  // Handler để mở modal và fetch partner info
  const handlePartnerClick = useCallback(async () => {
    if (!talent?.currentPartnerId) return;
    
    setIsPartnerModalOpen(true);
    setPartnerLoading(true);
    setPartnerInfo(null);
    
    try {
      const response = await partnerService.getDetailedById(talent.currentPartnerId);
      const partnerData = response?.data || response;
      setPartnerInfo(partnerData);
    } catch (err) {
      console.error('❌ Lỗi tải thông tin công ty:', err);
      setPartnerInfo(null);
    } finally {
      setPartnerLoading(false);
    }
  }, [talent?.currentPartnerId]);

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1">
          <PageLoader />
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
            <Link to="/ta/developers" className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block">
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(talent.status);
  const isDisabled = !canEdit || talent.status === 'Applying' || talent.status === 'Working';

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <TalentDetailHeader
          talent={talent}
          returnTo={returnTo}
          statusConfig={statusConfig}
          canEdit={canEdit}
          isDisabled={isDisabled}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Main Tabs: Thông tin cơ bản và các tab con (CV, Vị trí, Kỹ năng, v.v.) - cùng hàng */}
        <TalentDetailBasicInfoTabs
          talent={talent}
          locationName={locationName}
          partnerName={partnerName}
          blacklists={blacklists}
          workingModeLabels={workingModeLabels}
          formatLinkDisplay={formatLinkDisplay}
          onPartnerClick={handlePartnerClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabContent={
            <>
            {/* Tab: Projects */}
            {activeTab === 'projects' && (
              <TalentDetailProjectsSection
                talentProjects={talentProjects}
                selectedProjects={operations.selectedProjects}
                setSelectedProjects={operations.setSelectedProjects}
                pageProjects={pagination.pageProjects}
                setPageProjects={pagination.setPageProjects}
                itemsPerPage={pagination.itemsPerPage}
                projectPositions={projectPositions}
                projectPositionSearch={projectPositionSearch}
                setProjectPositionSearch={setProjectPositionSearch}
                isProjectPositionDropdownOpen={isProjectPositionDropdownOpen}
                setIsProjectPositionDropdownOpen={setIsProjectPositionDropdownOpen}
                showInlineForm={operations.showInlineForm === 'project'}
                inlineProjectForm={operations.inlineProjectForm}
                setInlineProjectForm={operations.setInlineProjectForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('project')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineProject}
                onDelete={handleDeleteProjects}
                canEdit={canEdit}
                analysisResult={cvAnalysis.analysisResult}
              />
            )}

            {/* Tab: CVs */}
            {activeTab === 'cvs' && (
              <TalentDetailCVsSection
                talentCVs={talentCVs}
                selectedCVs={operations.selectedCVs}
                setSelectedCVs={operations.setSelectedCVs}
                pageCVs={pagination.pageCVs}
                setPageCVs={pagination.setPageCVs}
                itemsPerPage={pagination.itemsPerPage}
                showInlineForm={operations.showInlineForm === 'cv'}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('cv')}
                onDelete={handleDeleteCVs}
                analysisResult={cvAnalysis.analysisResult}
                analysisResultCVId={cvAnalysis.analysisResultCVId}
                analysisLoadingId={cvAnalysis.analysisLoadingId}
                analysisError={cvAnalysis.analysisError}
                onAnalyzeCV={handleAnalyzeCVFromUrl}
                onCancelAnalysis={handleCancelAnalysis}
                canEdit={canEdit}
                collapsedInactiveCVGroups={collapsedInactiveCVGroups}
                setCollapsedInactiveCVGroups={setCollapsedInactiveCVGroups}
                cvForm={cvForm}
                expandedAnalysisDetail={cvAnalysis.expandedAnalysisDetail}
                setExpandedAnalysisDetail={cvAnalysis.setExpandedAnalysisDetail}
                expandedBasicInfo={cvAnalysis.expandedBasicInfo}
                setExpandedBasicInfo={cvAnalysis.setExpandedBasicInfo}
                matchedSkillsNotInProfile={cvAnalysis.matchedSkillsNotInProfile}
                unmatchedSkillSuggestions={cvAnalysis.unmatchedSkillSuggestions}
                jobRoleLevelsMatched={cvAnalysis.jobRoleLevelsMatched}
                matchedJobRoleLevelsNotInProfile={cvAnalysis.matchedJobRoleLevelsNotInProfile}
                jobRoleLevelsUnmatched={cvAnalysis.jobRoleLevelsUnmatched}
                onQuickCreateSkill={skillActions.handleQuickCreateSkill}
                getLevelLabel={getLevelLabel}
                getTalentLevelName={getTalentLevelName}
                isValueDifferent={isValueDifferent}
                jobRoles={jobRoles}
              />
            )}

            {/* Tab: Job Role Levels */}
            {activeTab === 'jobRoleLevels' && (
              <TalentDetailJobRoleLevelsSection
                jobRoleLevels={jobRoleLevels}
                selectedJobRoleLevels={operations.selectedJobRoleLevels}
                setSelectedJobRoleLevels={operations.setSelectedJobRoleLevels}
                pageJobRoleLevels={pagination.pageJobRoleLevels}
                setPageJobRoleLevels={pagination.setPageJobRoleLevels}
                itemsPerPage={4}
                jobRoles={jobRoles}
                lookupJobRoleLevelsForTalent={lookupJobRoleLevelsForTalent}
                showInlineForm={operations.showInlineForm === 'jobRoleLevel'}
                inlineJobRoleLevelForm={operations.inlineJobRoleLevelForm}
                setInlineJobRoleLevelForm={operations.setInlineJobRoleLevelForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('jobRoleLevel')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineJobRoleLevel}
                onDelete={handleDeleteJobRoleLevels}
                selectedJobRoleLevelName={selectedJobRoleLevelName}
                setSelectedJobRoleLevelName={setSelectedJobRoleLevelName}
                jobRoleLevelNameSearch={jobRoleLevelNameSearch}
                setJobRoleLevelNameSearch={setJobRoleLevelNameSearch}
                isJobRoleLevelNameDropdownOpen={isJobRoleLevelNameDropdownOpen}
                setIsJobRoleLevelNameDropdownOpen={setIsJobRoleLevelNameDropdownOpen}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                isLevelDropdownOpen={isLevelDropdownOpen}
                setIsLevelDropdownOpen={setIsLevelDropdownOpen}
                selectedJobRoleFilterId={selectedJobRoleFilterId}
                setSelectedJobRoleFilterId={setSelectedJobRoleFilterId}
                jobRoleFilterSearch={jobRoleFilterSearch}
                setJobRoleFilterSearch={setJobRoleFilterSearch}
                isJobRoleFilterDropdownOpen={isJobRoleFilterDropdownOpen}
                setIsJobRoleFilterDropdownOpen={setIsJobRoleFilterDropdownOpen}
                analysisResult={cvAnalysis.analysisResult}
                matchedJobRoleLevelsNotInProfile={cvAnalysis.matchedJobRoleLevelsNotInProfile}
                jobRoleLevelsUnmatched={cvAnalysis.jobRoleLevelsUnmatched}
                onQuickCreateJobRoleLevel={handleQuickCreateJobRoleLevel}
                onQuickCreateUnmatchedJobRoleLevel={handleQuickCreateUnmatchedJobRoleLevel}
                canEdit={canEdit}
                getLevelText={getLevelText}
                onRefreshJobRoleLevels={handleRefreshJobRoleLevels}
              />
            )}

            {/* Tab: Skills */}
            {activeTab === 'skills' && (
              <TalentDetailSkillsSection
                talentSkills={talentSkills}
                selectedSkills={operations.selectedSkills}
                setSelectedSkills={operations.setSelectedSkills}
                pageSkills={pagination.pageSkills}
                setPageSkills={pagination.setPageSkills}
                skillGroupsPerPage={skillGroupsPerPage}
                lookupSkills={lookupSkills}
                lookupSkillGroups={lookupSkillGroups}
                skillGroupVerificationStatuses={skillGroupVerification.skillGroupVerificationStatuses}
                showInlineForm={operations.showInlineForm === 'skill'}
                inlineSkillForm={operations.inlineSkillForm}
                setInlineSkillForm={operations.setInlineSkillForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('skill')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineSkill}
                onDelete={handleDeleteSkills}
                isSkillDropdownOpen={isSkillDropdownOpen}
                setIsSkillDropdownOpen={setIsSkillDropdownOpen}
                skillSearchQuery={skillSearchQuery}
                setSkillSearchQuery={setSkillSearchQuery}
                selectedSkillGroupId={selectedSkillGroupId}
                setSelectedSkillGroupId={setSelectedSkillGroupId}
                isSkillGroupDropdownOpen={isSkillGroupDropdownOpen}
                setIsSkillGroupDropdownOpen={setIsSkillGroupDropdownOpen}
                skillGroupSearchQuery={skillGroupSearchQuery}
                setSkillGroupSearchQuery={setSkillGroupSearchQuery}
                skillListSearchQuery={skillListSearchQuery}
                setSkillListSearchQuery={setSkillListSearchQuery}
                selectedSkillGroupIdForList={selectedSkillGroupIdForList}
                setSelectedSkillGroupIdForList={setSelectedSkillGroupIdForList}
                isSkillGroupListDropdownOpen={isSkillGroupListDropdownOpen}
                setIsSkillGroupListDropdownOpen={setIsSkillGroupListDropdownOpen}
                skillGroupListSearchQuery={skillGroupListSearchQuery}
                setSkillGroupListSearchQuery={setSkillGroupListSearchQuery}
                showOnlyUnverifiedSkills={showOnlyUnverifiedSkills}
                setShowOnlyUnverifiedSkills={setShowOnlyUnverifiedSkills}
                analysisResult={cvAnalysis.analysisResult}
                matchedSkillsNotInProfile={cvAnalysis.matchedSkillsNotInProfile}
                unmatchedSkillSuggestions={cvAnalysis.unmatchedSkillSuggestions}
                onQuickCreateSkill={skillActions.handleQuickCreateSkill}
                onSuggestionRequest={skillActions.handleSuggestionRequest}
                skillSuggestionRequestKey={cvAnalysis.skillSuggestionRequestKey}
                skillSuggestionDisplayItems={cvAnalysis.skillSuggestionDisplayItems}
                skillSuggestionDetailItems={cvAnalysis.skillSuggestionDetailItems}
                isSuggestionPending={skillActions.isSuggestionPending}
                onOpenVerifySkillGroup={(skillGroupId) =>
                  skillGroupVerification.handleOpenVerifySkillGroup(skillGroupId, canEdit, lookupSkillGroups)
                }
                onOpenHistorySkillGroup={skillGroupVerification.handleOpenHistorySkillGroup}
                onInvalidateSkillGroup={(skillGroupId) =>
                  skillGroupVerification.handleInvalidateSkillGroup(
                    skillGroupId,
                    canEdit,
                    talentSkills,
                    (statuses) => {
                      skillGroupVerification.setSkillGroupVerificationStatuses((prev) => ({
                        ...prev,
                        ...statuses,
                      }));
                    }
                  )
                }
                canEdit={canEdit}
                getLevelText={getLevelTextForSkillsWrapper}
                getLevelLabel={getLevelLabel}
                onRefreshSkills={handleRefreshSkills}
              />
            )}

            {/* Tab: Available Times */}
            {activeTab === 'availableTimes' && (
              <TalentDetailAvailableTimesSection
                availableTimes={availableTimes}
                selectedAvailableTimes={operations.selectedAvailableTimes}
                setSelectedAvailableTimes={operations.setSelectedAvailableTimes}
                pageAvailableTimes={pagination.pageAvailableTimes}
                setPageAvailableTimes={pagination.setPageAvailableTimes}
                itemsPerPage={pagination.itemsPerPage}
                showInlineForm={operations.showInlineForm === 'availableTime'}
                inlineAvailableTimeForm={operations.inlineAvailableTimeForm}
                setInlineAvailableTimeForm={operations.setInlineAvailableTimeForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('availableTime')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineAvailableTime}
                onDelete={handleDeleteAvailableTimes}
                availableTimeFormErrors={operations.availableTimeFormErrors}
                setAvailableTimeFormErrors={operations.setAvailableTimeFormErrors}
                validateStartTime={validateStartTime}
                validateEndTime={validateEndTime}
                canEdit={canEdit}
              />
            )}

            {/* Tab: Certificates */}
            {activeTab === 'certificates' && (
              <TalentDetailCertificatesSection
                certificates={certificates}
                selectedCertificates={operations.selectedCertificates}
                setSelectedCertificates={operations.setSelectedCertificates}
                pageCertificates={pagination.pageCertificates}
                setPageCertificates={pagination.setPageCertificates}
                itemsPerPage={pagination.itemsPerPage}
                lookupCertificateTypes={lookupCertificateTypes}
                showInlineForm={operations.showInlineForm === 'certificate'}
                inlineCertificateForm={operations.inlineCertificateForm}
                setInlineCertificateForm={operations.setInlineCertificateForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('certificate')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineCertificate}
                onDelete={handleDeleteCertificates}
                certificateFormErrors={operations.certificateFormErrors}
                setCertificateFormErrors={operations.setCertificateFormErrors}
                certificateTypeSearch={certificateTypeSearch}
                setCertificateTypeSearch={setCertificateTypeSearch}
                isCertificateTypeDropdownOpen={isCertificateTypeDropdownOpen}
                setIsCertificateTypeDropdownOpen={setIsCertificateTypeDropdownOpen}
                certificateImageFile={operations.certificateImageFile}
                setCertificateImageFile={operations.setCertificateImageFile}
                uploadingCertificateImage={operations.uploadingCertificateImage}
                certificateUploadProgress={operations.certificateUploadProgress}
                uploadedCertificateUrl={operations.uploadedCertificateUrl}
                onFileChange={operations.handleCertificateImageFileChange}
                onUploadImage={operations.handleUploadCertificateImage}
                onDeleteImage={operations.handleDeleteCertificateImage}
                analysisResult={cvAnalysis.analysisResult}
                certificatesRecognized={cvAnalysis.certificatesRecognized}
                certificatesUnmatched={cvAnalysis.certificatesUnmatched}
                canEdit={canEdit}
                validateIssuedDate={validateIssuedDate}
              />
            )}

            {/* Tab: Experiences */}
            {activeTab === 'experiences' && (
              <TalentDetailExperiencesSection
                workExperiences={workExperiences}
                selectedExperiences={operations.selectedExperiences}
                setSelectedExperiences={operations.setSelectedExperiences}
                pageExperiences={pagination.pageExperiences}
                setPageExperiences={pagination.setPageExperiences}
                itemsPerPage={pagination.itemsPerPage}
                workExperiencePositions={workExperiencePositions}
                showInlineForm={operations.showInlineForm === 'experience'}
                inlineExperienceForm={operations.inlineExperienceForm}
                setInlineExperienceForm={operations.setInlineExperienceForm}
                isSubmitting={operations.isSubmitting}
                onOpenForm={() => operations.handleOpenInlineForm('experience')}
                onCloseForm={operations.handleCloseInlineForm}
                onSubmit={handleSubmitInlineExperience}
                onDelete={handleDeleteExperiences}
                workExperiencePositionSearch={workExperiencePositionSearch}
                setWorkExperiencePositionSearch={setWorkExperiencePositionSearch}
                isWorkExperiencePositionDropdownOpen={isWorkExperiencePositionDropdownOpen}
                setIsWorkExperiencePositionDropdownOpen={setIsWorkExperiencePositionDropdownOpen}
                analysisResult={cvAnalysis.analysisResult}
                canEdit={canEdit}
              />
            )}
            </>
          }
        />
      </div>

      {/* Skill Group Verification Modal */}
      <SkillGroupVerificationModal
        isOpen={skillGroupVerification.skillGroupVerifyModal.isOpen}
        skillGroupId={skillGroupVerification.skillGroupVerifyModal.skillGroupId}
        skillGroupName={skillGroupVerification.skillGroupVerifyModal.skillGroupName}
        talentSkills={talentSkills}
        verifyResult={skillGroupVerification.verifyResult}
        setVerifyResult={skillGroupVerification.setVerifyResult}
        verifyNote={skillGroupVerification.verifyNote}
        setVerifyNote={skillGroupVerification.setVerifyNote}
        expertsForSkillGroup={skillGroupVerification.expertsForSkillGroup.map((ex) => ({
          id: ex.id,
          name: ex.name,
          specialization: ex.specialization ?? undefined,
        }))}
        expertsForSkillGroupLoading={skillGroupVerification.expertsForSkillGroupLoading}
        selectedExpertId={skillGroupVerification.selectedExpertId}
        setSelectedExpertId={skillGroupVerification.setSelectedExpertId}
        verifyExpertName={skillGroupVerification.verifyExpertName}
        setVerifyExpertName={skillGroupVerification.setVerifyExpertName}
        skillSnapshotEnabled={skillGroupVerification.skillSnapshotEnabled}
        setSkillSnapshotEnabled={skillGroupVerification.setSkillSnapshotEnabled}
        showAllSkillsInVerifyModal={skillGroupVerification.showAllSkillsInVerifyModal}
        setShowAllSkillsInVerifyModal={skillGroupVerification.setShowAllSkillsInVerifyModal}
        isVerifyingSkillGroup={skillGroupVerification.isVerifyingSkillGroup}
        getLevelLabel={getLevelTextForSkillsWrapper}
        onClose={skillGroupVerification.handleCloseVerifySkillGroupModal}
        onSubmit={() =>
          skillGroupVerification.handleSubmitVerifySkillGroup(
            talentSkills,
            lookupSkills,
            lookupSkillGroups,
            (statuses) => {
              skillGroupVerification.setSkillGroupVerificationStatuses((prev) => ({
                ...prev,
                ...statuses,
              }));
            }
          )
        }
      />

      {/* Skill Group History Modal */}
      <SkillGroupHistoryModal
        isOpen={skillGroupVerification.historyModal.isOpen}
        skillGroupName={skillGroupVerification.historyModal.skillGroupName}
        items={skillGroupVerification.historyModal.items}
        loading={skillGroupVerification.historyModal.loading}
        onClose={skillGroupVerification.handleCloseHistoryModal}
      />

      {/* Partner Info Modal */}
      <PartnerInfoModal
        isOpen={isPartnerModalOpen}
        partner={partnerInfo}
        loading={partnerLoading}
        onClose={() => setIsPartnerModalOpen(false)}
      />
    </div>
  );
}

