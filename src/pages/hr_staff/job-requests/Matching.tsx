import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { talentCVService, type TalentCVMatchResult, type TalentCV } from "../../../services/TalentCV";
import { jobRequestService, type JobRequest } from "../../../services/JobRequest";
import { talentService, type Talent } from "../../../services/Talent";
import { jobRoleLevelService, type JobRoleLevel } from "../../../services/JobRoleLevel";
import { locationService, type Location } from "../../../services/location";
import { skillService, type Skill } from "../../../services/Skill";
import { applyService } from "../../../services/Apply";
import { talentApplicationService, TalentApplicationStatusConstants, type TalentApplication } from "../../../services/TalentApplication";
import { talentAvailableTimeService, type TalentAvailableTime } from "../../../services/TalentAvailableTime";
import { projectService } from "../../../services/Project";
import { decodeJWT } from "../../../services/Auth";
import { useAuth } from "../../../context/AuthContext";
import { talentSkillGroupAssessmentService, type TalentSkillGroupAssessment } from "../../../services/TalentSkillGroupAssessment";
import {
    Sparkles,
    Target,
    CheckCircle2,
    Award,
    Eye,
    FileText,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Code,
    Clock,
    Filter,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    User,
    Mail,
    ChevronDown,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { WorkingMode } from "../../../constants/WORKING_MODE";

interface EnrichedMatchResult extends TalentCVMatchResult {
    talentInfo?: Talent;
    jobRoleLevelName?: string; // Tên vị trí tuyển dụng của CV
    hasFailedApplication?: boolean;
    failedApplicationStatus?: string | null;
    failedApplicationId?: number | null;
    areSkillsVerified?: boolean; // Trạng thái verification của skills
}

interface EnrichedCVWithoutScore {
    talentCV: TalentCV;
    talentInfo?: Talent;
    matchScore?: number; // undefined nếu không có điểm số
    matchedSkills?: string[];
    missingSkills?: string[];
    levelMatch?: boolean;
    jobRoleLevelName?: string; // Tên vị trí tuyển dụng của CV
}

const WORKING_MODE_OPTIONS = [
    { value: WorkingMode.Onsite, label: "(Tại văn phòng)" },
    { value: WorkingMode.Remote, label: "(từ xa)" },
    { value: WorkingMode.Hybrid, label: "(Kết hợp)" },
    { value: WorkingMode.Flexible, label: "(Linh hoạt)" },
];

interface JobSkillItem {
    id?: number;
    jobRequestId?: number;
    skillsId?: number;
    skillName?: string;
}

const statusLabels: Record<string, { label: string; badgeClass: string }> = {
    Available: {
        label: 'Sẵn sàng',
        badgeClass: 'bg-green-100 text-green-800',
    },
    Busy: {
        label: 'Đang bận',
        badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    Working: {
        label: 'Đang làm việc',
        badgeClass: 'bg-blue-100 text-blue-800',
    },
    Applying: {
        label: 'Đang ứng tuyển',
        badgeClass: 'bg-purple-100 text-purple-800',
    },
    Unavailable: {
        label: 'Tạm ngưng',
        badgeClass: 'bg-gray-100 text-gray-700',
    },
};

const getStatusInfo = (status: string) => {
    return statusLabels[status] || { label: status, badgeClass: 'bg-gray-100 text-gray-800' };
};

const formatWorkingMode = (mode?: number) => {
    if (!mode || mode === WorkingMode.None) return "";
    const labels = WORKING_MODE_OPTIONS
        .filter((option) => (mode & option.value) !== 0)
        .map((option) => option.label);
    return labels.join(", ");
};

const formatLevel = (level?: number) => {
    const levelMap: Record<number, string> = {
        0: "Junior",
        1: "Middle",
        2: "Senior",
        3: "Lead"
    };
    return level !== undefined ? levelMap[level] || "N/A" : "N/A";
};

// Hàm tính điểm matching chi tiết cho CV không có trong kết quả backend

// Helper function to format availability times for display
const formatAvailabilityTimes = (talentId: number, talentAvailableTimes: TalentAvailableTime[]): string => {
    const talentTimes = talentAvailableTimes.filter(at => at.talentId === talentId);
    if (!talentTimes.length) return "Không có thông tin";

    // Sort by start time
    const sortedTimes = talentTimes.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Show first 2 time ranges
    const timeStrings = sortedTimes.slice(0, 2).map(time => {
        const start = new Date(time.startTime).toLocaleDateString('vi-VN');
        const end = time.endTime ? new Date(time.endTime).toLocaleDateString('vi-VN') : 'Đến khi có cập nhật';
        return `${start} - ${end}`;
    });

    const result = timeStrings.join(', ');
    return sortedTimes.length > 2 ? `${result}...` : result;
};

// Helper function to check if required skills are verified for a talent
const checkSkillsVerification = async (
    talentId: number,
    requiredSkillIds: number[]
): Promise<boolean> => {
    if (!requiredSkillIds.length) return true; // No skills required = verified

    try {
        // Get all skill group assessments for this talent
        const assessments = await talentSkillGroupAssessmentService.getAll({
            talentId: talentId,
            excludeDeleted: true
        });

        // If there are no assessments at all, consider as not verified
        if (!assessments || assessments.length === 0) return false;

        // Check if talent has any verified skill groups
        // For now, if they have at least one verified assessment, consider skills verified
        // This is a simplified approach since we can't easily map skills to skill groups
        const hasVerifiedAssessment = assessments.some((assessment: TalentSkillGroupAssessment) => assessment.isVerified === true);

        return hasVerifiedAssessment;
    } catch (error) {
        console.warn("⚠️ Failed to check skill verification:", error);
        return false; // Assume not verified if check fails
    }
};


export default function CVMatchingPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const jobRequestId = searchParams.get("jobRequestId");

    const [allCVs, setAllCVs] = useState<(EnrichedMatchResult | EnrichedCVWithoutScore)[]>([]);
    const [filteredCVs, setFilteredCVs] = useState<(EnrichedMatchResult | EnrichedCVWithoutScore)[]>([]);
    const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
    const [jobRoleLevel, setJobRoleLevel] = useState<JobRoleLevel | null>(null);
    const [jobLocation, setJobLocation] = useState<Location | null>(null);
    const [jobRoleLevelObjectMap, setJobRoleLevelObjectMap] = useState<Map<number, JobRoleLevel>>(new Map());
    const [projectData, setProjectData] = useState<{ startDate?: string; endDate?: string } | null>(null);
    const [talentAvailableTimes, setTalentAvailableTimes] = useState<TalentAvailableTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showMatchingDetails, setShowMatchingDetails] = useState<{[key: string]: boolean}>({});
    const [isTalentPopupOpen, setIsTalentPopupOpen] = useState(false);
    const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
    const [talentPopupLoading, setTalentPopupLoading] = useState(false);

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
    
    // Filter states
    const [minScore, setMinScore] = useState(0);
    const [showMissingSkillsOnly, setShowMissingSkillsOnly] = useState(false);
    const [hideLowScore, setHideLowScore] = useState(false);
    
    // Search and pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    const currentMatchingPath = `${location.pathname}${location.search}`;

    useEffect(() => {
        const fetchData = async () => {
            if (!jobRequestId) {
                navigate("/ta/job-requests");
                return;
            }

            try {
                setLoading(true);
                
                // Fetch job request details
                const jobReq = await jobRequestService.getById(Number(jobRequestId));
                setJobRequest(jobReq);

                // Fetch job role level to get level information
                let level: JobRoleLevel | null = null;
                try {
                    level = await jobRoleLevelService.getById(jobReq.jobRoleLevelId);
                    setJobRoleLevel(level);
                } catch (err) {
                    console.warn("⚠️ Không thể tải thông tin JobRoleLevel:", err);
                    throw new Error("Không thể tải thông tin JobRoleLevel");
                }

                // Fetch job location if exists
                if (jobReq.locationId) {
                    try {
                        const location = await locationService.getById(jobReq.locationId);
                        setJobLocation(location);
                    } catch (err) {
                        console.warn("⚠️ Không thể tải thông tin Location:", err);
                    }
                }

                // Fetch project data for availability calculation
                if (jobReq.projectId) {
                    try {
                        const project = await projectService.getById(jobReq.projectId);
                        setProjectData({
                            startDate: project.startDate,
                            endDate: project.endDate
                        });
                    } catch (err) {
                        console.warn("⚠️ Không thể tải thông tin Project:", err);
                        setProjectData(null);
                    }
                }


                // Lấy danh sách đơn ứng tuyển đã tồn tại cho job request này để loại bỏ các CV đã nộp
                const existingApplicationsData = await talentApplicationService.getAll({
                    jobRequestId: Number(jobRequestId),
                    excludeDeleted: true,
                });
                const existingApplications = ensureArray<TalentApplication>(existingApplicationsData);
                const excludedStatuses = new Set<string>([
                    TalentApplicationStatusConstants.Hired,
                ]);
                const excludedCvIds = new Set(
                    existingApplications
                        .filter((app) => excludedStatuses.has(app.status))
                        .map((app) => app.cvId)
                );

                // Fetch matching CVs từ BE (đã được filter và có điểm số)
                // BE đã filter theo: JobRole, Level, Blacklist, Status, Skills
                const matches = await talentCVService.getMatchesForJobRequest({
                    jobRequestId: Number(jobRequestId),
                    excludeDeleted: true,
                });

                // Lọc bỏ CV đã hired từ kết quả BE (BE không filter hired vì quantity limit đã được remove)
                const filteredMatches = matches.filter((match: TalentCVMatchResult) => {
                    const isExcluded = excludedCvIds.has(match.talentCV.id);
                    return !isExcluded;
                });

                // Fetch skillMap một lần để dùng cho tất cả CV
                const allSkillsData = await skillService.getAll({ excludeDeleted: true });
                const allSkills = ensureArray<Skill>(allSkillsData);
                const skillMap = new Map<number, string>();
                allSkills.forEach(skill => {
                    skillMap.set(skill.id, skill.name);
                });

                // Fetch jobRoleLevelMap một lần để dùng cho tất cả CV
                const allJobRoleLevelsData = await jobRoleLevelService.getAll({ excludeDeleted: true });
                const allJobRoleLevels = ensureArray<JobRoleLevel>(allJobRoleLevelsData);
                const jobRoleLevelMap = new Map<number, string>();
                const jobRoleLevelObjectMapTemp = new Map<number, JobRoleLevel>();
                allJobRoleLevels.forEach(jrl => {
                    jobRoleLevelMap.set(jrl.id, jrl.name);
                    jobRoleLevelObjectMapTemp.set(jrl.id, jrl);
                });
                setJobRoleLevelObjectMap(jobRoleLevelObjectMapTemp);

                // Get required skills IDs for verification check
                const requiredSkillIds = jobReq.jobSkills?.map((js: JobSkillItem) => js.skillsId).filter(Boolean) || [];

                // Enrich CHỈ CV đã được BE filter với talent information
                const enrichedCVs = await Promise.all(
                    filteredMatches.map(async (match: TalentCVMatchResult): Promise<EnrichedMatchResult | null> => {
                        try {
                            const talent = await talentService.getById(match.talentCV.talentId);

                            // Double-check talent status (BE đã filter nhưng kiểm tra lại để đảm bảo)
                            if (talent.status === "Applying" || talent.status === "Working") {
                                return null;
                            }

                            let talentLocationName: string | null = null;
                            if (talent.locationId) {
                                try {
                                    const loc = await locationService.getById(talent.locationId);
                                    talentLocationName = loc.name;
                                } catch (err) {
                                    console.warn("⚠️ Failed to load location for talent:", err);
                                }
                            }

                            const talentInfo = { ...talent, locationName: talentLocationName } as Talent & { locationName?: string | null };

                            // Check skill verification status
                            const areSkillsVerified = await checkSkillsVerification(match.talentCV.talentId, requiredSkillIds);

                            // Lấy tên vị trí tuyển dụng của CV
                            const jobRoleLevelName = jobRoleLevelMap.get(match.talentCV.jobRoleLevelId) || "—";

                            // Tính toán lại missingSkills từ jobReq.jobSkills và matchedSkills
                            const matchedSkills = match.matchedSkills || [];
                            let missingSkills: string[] = [];

                            // Luôn tính toán lại missingSkills từ jobReq.jobSkills để đảm bảo đầy đủ
                            if (jobReq.jobSkills && jobReq.jobSkills.length > 0) {
                                // jobReq.jobSkills có cấu trúc {id, jobRequestId, skillsId}
                                const requiredSkillNames = jobReq.jobSkills.map((js: JobSkillItem) => {
                                    if (js.skillName) {
                                        return js.skillName;
                                    } else if (js.skillsId) {
                                        return skillMap.get(js.skillsId) || "";
                                    }
                                    return "";
                                }).filter(Boolean);

                                // So sánh case-insensitive để đảm bảo chính xác
                                const matchedSkillsLower = matchedSkills.map(s => s.toLowerCase().trim());
                                missingSkills = requiredSkillNames.filter((skillName: string) => {
                                    const skillNameLower = skillName.toLowerCase().trim();
                                    return !matchedSkillsLower.includes(skillNameLower);
                                });
                            } else {
                                // Nếu không có jobSkills, dùng missingSkills từ backend
                                missingSkills = match.missingSkills || [];
                            }

                            return {
                                ...match,
                                talentInfo: talentInfo,
                                matchedSkills: matchedSkills,
                                missingSkills: missingSkills,
                                jobRoleLevelName: jobRoleLevelName,
                                areSkillsVerified: areSkillsVerified,
                            };
                        } catch (err) {
                            console.warn("⚠️ Failed to load talent info for ID:", match.talentCV.talentId, err);
                            return null;
                        }
                    })
                );

                // Lọc bỏ các CV null (talent có trạng thái không phù hợp)
                const filteredEnrichedCVsLocal = enrichedCVs.filter((cv): cv is EnrichedMatchResult => cv !== null);

                // HARD FILTER: Lọc bỏ CV có skills không được verified
                const skillVerifiedCVsLocal = filteredEnrichedCVsLocal.filter(cv => cv.areSkillsVerified !== false);

                // Fetch TalentAvailableTime cho tất cả talents để tính availability bonus chính xác
                const talentIds = skillVerifiedCVsLocal.map(cv => cv.talentCV.talentId).filter((id, index, arr) => arr.indexOf(id) === index); // unique
                try {
                    // Fetch available times cho từng talent (vì API chỉ support single talentId)
                    const allAvailableTimes: TalentAvailableTime[] = [];
                    for (const talentId of talentIds) {
                        try {
                            const availableTimesData = await talentAvailableTimeService.getAll({
                                talentId: talentId,
                                excludeDeleted: true
                            });
                            const availableTimes = ensureArray<TalentAvailableTime>(availableTimesData);
                            allAvailableTimes.push(...availableTimes);
                        } catch (talentErr) {
                            console.warn(`⚠️ Không thể tải TalentAvailableTime cho talent ${talentId}:`, talentErr);
                        }
                    }
                    setTalentAvailableTimes(allAvailableTimes);
                } catch (err) {
                    console.warn("⚠️ Không thể tải TalentAvailableTime:", err);
                    setTalentAvailableTimes([]);
                }

                // Sắp xếp theo BE logic: failed applications xuống cuối, sau đó theo điểm từ cao xuống thấp
                const sortedCVs = skillVerifiedCVsLocal.sort((a, b) => {
                    // Failed applications (Rejected/Withdrawn) xuống cuối
                    if (a.hasFailedApplication && !b.hasFailedApplication) return 1;
                    if (!a.hasFailedApplication && b.hasFailedApplication) return -1;

                    // Sau đó sort theo điểm từ cao xuống thấp
                    const scoreA = a.matchScore ?? 0;
                    const scoreB = b.matchScore ?? 0;
                    return scoreB - scoreA;
                });

                
                setAllCVs(sortedCVs);
                setFilteredCVs(sortedCVs);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách CV matching:", err);
                alert(`❌ Lỗi: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [jobRequestId, navigate]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100 border-green-200";
        if (score >= 60) return "text-blue-600 bg-blue-100 border-blue-200";
        if (score >= 40) return "text-yellow-600 bg-yellow-100 border-yellow-200";
        return "text-red-600 bg-red-100 border-red-200";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Xuất sắc";
        if (score >= 60) return "Tốt";
        if (score >= 40) return "Trung bình";
        return "Thấp";
    };

    // Apply filters, search and pagination
    useEffect(() => {
        let filtered = [...allCVs];
        
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(cv => {
                const talentName = cv.talentInfo?.fullName?.toLowerCase() || "";
                const email = cv.talentInfo?.email?.toLowerCase() || "";
                const phone = cv.talentInfo?.phone?.toLowerCase() || "";
                const cvVersion = `v${cv.talentCV.version}`.toLowerCase();
                
                return talentName.includes(query) || 
                       email.includes(query) || 
                       phone.includes(query) ||
                       cvVersion.includes(query);
            });
        }
        
        // Filter by min score (chỉ áp dụng cho CV có điểm số)
        filtered = filtered.filter(cv => {
            if (cv.matchScore === undefined) return true; // CV không có điểm số luôn pass
            return cv.matchScore >= minScore;
        });
        
        // Filter by hiding low score
        if (hideLowScore) {
            filtered = filtered.filter(cv => {
                if (cv.matchScore === undefined) return true; // CV không có điểm số luôn pass
                return cv.matchScore >= 60;
            });
        }
        
        // Filter by missing skills only (chỉ áp dụng cho CV có điểm số)
        if (showMissingSkillsOnly) {
            filtered = filtered.filter(cv => {
                if (cv.matchScore === undefined) return true; // CV không có điểm số luôn pass
                return cv.missingSkills?.length === 0;
            });
        }
        
        setFilteredCVs(filtered);
        setCurrentPage(1); // Reset về trang đầu khi filter thay đổi
    }, [searchQuery, minScore, showMissingSkillsOnly, hideLowScore, allCVs]);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredCVs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCVs = filteredCVs.slice(startIndex, endIndex);

    const resetFilters = () => {
        setMinScore(0);
        setShowMissingSkillsOnly(false);
        setHideLowScore(false);
    };

    const openTalentPopup = async (talentId: number) => {
        setIsTalentPopupOpen(true);
        setTalentPopupLoading(true);

        try {
            const talent = await talentService.getById(talentId);
            setSelectedTalent(talent);
        } catch (error) {
            console.error("Failed to load talent info:", error);
            setSelectedTalent(null);
        } finally {
            setTalentPopupLoading(false);
        }
    };

    const closeTalentPopup = () => {
        setIsTalentPopupOpen(false);
        setSelectedTalent(null);
    };


    const handleCreateApplication = async (match: EnrichedMatchResult) => {
        if (!jobRequestId) return;

        // Tính lại điểm cho confirmation (đơn giản hóa)
        const confirm = window.confirm(
            `⚠️ Bạn có chắc muốn tạo hồ sơ ứng tuyển cho ${match.talentInfo?.fullName || 'talent này'}?\n\n` +
            `Điểm khớp: ${match.matchScore}%\n` +
            `CV: v${match.talentCV.version}`
        );
        
        if (!confirm) return;

        try {
            // Lấy userId từ token hoặc user context
            let submittedBy: string | null = null;
            
            // Thử lấy từ user context trước
            if (user?.id) {
                submittedBy = user.id;
            } else {
                // Nếu không có, lấy từ token
                const token = localStorage.getItem('accessToken');
                if (token) {
                    try {
                        const decoded = decodeJWT(token);
                        if (decoded) {
                            // JWT payload có nameid là userId
                            submittedBy = decoded.nameid || decoded.sub || decoded.userId || decoded.uid || null;
                        }
                    } catch (error) {
                        console.error('Error decoding JWT:', error);
                    }
                }
            }
            
            if (!submittedBy) {
                throw new Error('Không xác định được người dùng (submittedBy). Vui lòng đăng nhập lại.');
            }
            
            const createdApply = await applyService.create({
                jobRequestId: Number(jobRequestId),
                cvId: match.talentCV.id,
                submittedBy: submittedBy,
                note: `Điểm khớp: ${match.matchScore}%`,
            });

      // Cập nhật trạng thái nhân sự sang Applying
      try {
        await talentService.changeStatus(match.talentCV.talentId, {
          newStatus: "Applying",
          notes: "Tự động chuyển trạng thái khi tạo hồ sơ ứng tuyển",
        });
      } catch (statusErr) {
        console.error("⚠️ Không thể cập nhật trạng thái nhân sự sang Applying:", statusErr);
      }

            showSuccessOverlay("Đã tạo hồ sơ ứng tuyển thành công!");
            navigate(`/ta/applications/${createdApply.id}`);
        } catch (err) {
            console.error("❌ Lỗi tạo hồ sơ ứng tuyển:", err);
            alert("Không thể tạo hồ sơ ứng tuyển!");
        }
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="TA Staff" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang phân tích và matching CV...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex bg-gray-50 min-h-screen">
            <Sidebar items={sidebarItems} title="TA Staff" />

            <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8 animate-slide-up">
                    <Breadcrumb
                        items={[
                            { label: "Yêu cầu tuyển dụng", to: "/ta/job-requests" },
                            { label: jobRequest?.title || "Đang tải...", to: `/ta/job-requests/${jobRequestId}` },
                            { label: "Matching CV" }
                        ]}
                    />

                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-purple-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    CV Matching Results{jobRequest?.title ? ` - ${jobRequest.title}` : ""}
                                </h1>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 mt-4">
                                <Target className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">
                                    {filteredCVs.length} CVs trong hệ thống (yêu cầu: {jobRequest?.quantity || 0} vị trí)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-6 animate-fade-in">
                    <div className="p-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm CV theo tên, email, số điện thoại hoặc phiên bản CV..."
                                    className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 bg-neutral-50 focus:bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="group flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
                            >
                                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                <span className="font-medium">{showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}</span>
                                {(minScore > 0 || hideLowScore || showMissingSkillsOnly) && (
                                    <span className="ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-700 text-white shadow-sm">
                                        {[minScore > 0, hideLowScore, showMissingSkillsOnly].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            {(minScore > 0 || hideLowScore || showMissingSkillsOnly) && (
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center gap-2 px-6 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 bg-white"
                                >
                                    <X className="w-5 h-5" />
                                    <span className="font-medium">Xóa bộ lọc</span>
                                </button>
                            )}
                        </div>

                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-neutral-200">
                                {/* Min Score Slider */}
                                <div className="bg-gradient-to-r from-primary-50 to-purple-50 p-5 rounded-xl border border-primary-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-primary-600" />
                                            <label className="text-sm font-semibold text-gray-900">
                                                Điểm khớp tối thiểu
                                            </label>
                                        </div>
                                        <div className="px-3 py-1.5 bg-white rounded-lg border border-primary-200 shadow-soft">
                                            <span className="text-lg font-bold text-primary-600">{minScore}%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={minScore}
                                        onChange={(e) => setMinScore(Number(e.target.value))}
                                        className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-600"
                                        style={{
                                            background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${minScore}%, rgb(229 231 235) ${minScore}%, rgb(229 231 235) 100%)`,
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-neutral-500 mt-2">
                                        <span>0%</span>
                                        <span>25%</span>
                                        <span>50%</span>
                                        <span>75%</span>
                                        <span>100%</span>
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-primary-50 border-2 border-transparent hover:border-primary-200 rounded-xl cursor-pointer transition-all duration-300">
                                        <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${hideLowScore ? "bg-primary-600" : "bg-neutral-300"}`}>
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                                    hideLowScore ? "translate-x-6" : ""
                                                }`}
                                            ></span>
                                            <input
                                                type="checkbox"
                                                checked={hideLowScore}
                                                onChange={(e) => setHideLowScore(e.target.checked)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900 block">Ẩn CV điểm thấp</span>
                                            <span className="text-xs text-neutral-600">Loại bỏ CV có điểm khớp &lt; 60%</span>
                                        </div>
                                    </label>

                                    <label className="group flex items-center gap-3 p-4 bg-neutral-50 hover:bg-primary-50 border-2 border-transparent hover:border-primary-200 rounded-xl cursor-pointer transition-all duration-300">
                                        <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${showMissingSkillsOnly ? "bg-primary-600" : "bg-neutral-300"}`}>
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                                    showMissingSkillsOnly ? "translate-x-6" : ""
                                                }`}
                                            ></span>
                                            <input
                                                type="checkbox"
                                                checked={showMissingSkillsOnly}
                                                onChange={(e) => setShowMissingSkillsOnly(e.target.checked)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900 block">Chỉ hiện CV đủ kỹ năng</span>
                                            <span className="text-xs text-neutral-600">Ẩn các CV còn thiếu kỹ năng</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {/* CV List */}
                <div className="space-y-6 animate-fade-in">
                    {paginatedCVs.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-12">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy CV phù hợp</h3>
                                <p className="text-neutral-600 mb-6">Không có CV nào khớp với yêu cầu tuyển dụng này</p>
                            </div>
                                                      
                        </div>
                    ) : (
                        paginatedCVs.map((cv, index) => {
                            // Kiểm tra xem CV có điểm số hay không
                            const hasScore = cv.matchScore !== undefined;
                            const match = hasScore ? cv as EnrichedMatchResult : null;
                            
                            // Tính toán index thực tế trong danh sách đã filter
                            const actualIndex = startIndex + index;

                            const toggleMatchingDetails = (cvId: number) => {
                                setShowMatchingDetails(prev => ({
                                    ...prev,
                                    [cvId]: !prev[cvId]
                                }));
                            };
                            
                            // Nếu CV không có điểm số (undefined), hiển thị đơn giản
                            // CV có điểm 0 vẫn hiển thị đầy đủ thông tin phân tích
                            if (!hasScore && cv.matchScore === undefined) {
                                return (
                                    <div
                                        key={cv.talentCV.id}
                                        className="group bg-white rounded-2xl shadow-soft hover:shadow-medium border border-neutral-100 hover:border-primary-200 p-6 transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start gap-6">
                                            {/* Rank Badge */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-neutral-100 text-neutral-600">
                                                    #{actualIndex + 1}
                                                </div>
                                            </div>

                                            {/* CV Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">
                                                            {cv.talentInfo?.fullName || `Talent #${cv.talentCV.talentId}`}
                                                        </h3>
                                            <div className="flex items-center gap-3 mb-2">
                                                <button
                                                    onClick={() => window.open(cv.talentCV.cvFileUrl, '_blank')}
                                                    className="text-neutral-500 text-sm font-medium hover:underline transition-colors"
                                                >
                                                    Phiên bản CV: v{cv.talentCV.version}
                                                </button>
                                                {cv.jobRoleLevelName && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg border border-primary-200">
                                                        <Briefcase className="w-3 h-3" />
                                                        {cv.jobRoleLevelName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                {cv.talentInfo?.email && (
                                                    <button
                                                        onClick={() => openTalentPopup(cv.talentCV.talentId)}
                                                        className="flex items-center gap-1 text-neutral-500 hover:text-primary-600 hover:underline transition-colors"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        {cv.talentInfo.email}
                                                    </button>
                                                )}
                                            </div>
                                                    </div>

                                                    {/* No Score Badge */}
                                                    <div className="text-right">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg border-2 ${getScoreColor(0)}`}>
                                                            0
                                                            <span className="text-sm font-medium">/100</span>
                                                        </div>
                                                        <p className="text-xs text-neutral-500 mt-1">Không khớp</p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-start mt-4 pt-4 border-t border-neutral-200">
                                                    {/* Primary: Create Application */}
                                                    <Button
                                                        onClick={() => handleCreateApplication(cv as EnrichedMatchResult)}
                                                        className="group flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transform hover:scale-105 shadow-lg hover:shadow-xl"
                                                    >
                                                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                                        Tạo hồ sơ ứng tuyển
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // CV có điểm số - hiển thị đầy đủ thông tin
                            if (!match) return null; // Safety check
                            
                            const totalRequiredSkills = (match.matchedSkills?.length || 0) + (match.missingSkills?.length || 0);
                            const skillMatchPercent = totalRequiredSkills > 0
                                ? Math.round(((match.matchedSkills?.length || 0) / totalRequiredSkills) * 100)
                                : 100;

                            const jobWorkingMode = jobRequest?.workingMode ?? WorkingMode.None;
                            const talentWorkingMode = match.talentInfo?.workingMode ?? WorkingMode.None;
                            const workingModeRequired = jobWorkingMode !== WorkingMode.None;
                            const workingModeMatch = workingModeRequired
                                ? (talentWorkingMode !== WorkingMode.None && (talentWorkingMode & jobWorkingMode) !== 0)
                                : true;
                            const isRemoteOrFlexible = workingModeRequired && (jobWorkingMode & (WorkingMode.Remote | WorkingMode.Hybrid)) !== 0;

                            const locationRequired = !!jobRequest?.locationId;
                            const talentLocationId = match.talentInfo?.locationId ?? null;
                            const locationMatch = locationRequired ? talentLocationId === jobRequest?.locationId : true;

                            const workingModeRequirementText = workingModeRequired ? formatWorkingMode(jobWorkingMode) : "";
                            const talentWorkingModeText = talentWorkingMode !== WorkingMode.None ? formatWorkingMode(talentWorkingMode) : "";

                            // Parse matchSummary từ BE để lấy thông tin chi tiết điểm số
                            const parseMatchSummary = (summary: string) => {
                                const skillsMatch = summary.match(/Skills: (\d+)\/(\d+)/);
                                const workingModeMatch = summary.match(/WorkingMode: (Match|Not Match|Not Required)/);
                                const locationMatch = summary.match(/Location: (Match|Not Match|Not Required)/);
                                const availabilityMatch = summary.match(/Availability: (Available \(\+5\)|\+5|Not Available \(-5\)|Unknown \(0\))/);
                                const levelMatch = summary.match(/Level: (.+)/);

                                return {
                                    skills: skillsMatch ? `${skillsMatch[1]}/${skillsMatch[2]}` : '0/0',
                                    workingMode: workingModeMatch ? workingModeMatch[1] : 'Not Required',
                                    location: locationMatch ? locationMatch[1] : 'Not Required',
                                    availability: availabilityMatch ? availabilityMatch[1] : 'Unknown (0)',
                                    level: levelMatch ? levelMatch[1] : 'Unknown'
                                };
                            };

                            const matchDetails = parseMatchSummary(match.matchSummary || '');

                            // Tính điểm từ matchSummary (giữ nguyên logic hiển thị)
                            const skillsMatch = matchDetails.skills.split('/');
                            const matchedSkillsCount = parseInt(skillsMatch[0] || '0');
                            const totalSkillsCount = parseInt(skillsMatch[1] || '0');
                            const skillPoints = totalSkillsCount > 0 ? Math.round((50.0 / totalSkillsCount) * matchedSkillsCount) : 50;

                            const levelPoints = match.levelMatch ? 20 : 0;
                            const workingModePoints = matchDetails.workingMode === 'Match' || matchDetails.workingMode === 'Not Required' ? 10 : 0;
                            const locationPoints = matchDetails.location === 'Match' || matchDetails.location === 'Not Required' ? 15 : 0;
                            const availabilityBonus = matchDetails.availability.includes('+5') ? 5 : matchDetails.availability.includes('-5') ? -5 : 0;

                            // Sử dụng điểm số từ BE thay vì tính lại
                            const calculatedScore = match.matchScore;
                            
                            // Xác định tiêu chí phù hợp - rút gọn
                            // Lấy cấp độ của Talent
                            const talentJobRoleLevel = jobRoleLevelObjectMap.get(match.talentCV.jobRoleLevelId);

                            // Tách riêng so sánh tên vị trí và cấp độ
                            const talentPositionName = talentJobRoleLevel?.name || "—";
                            const talentLevelOnly = talentJobRoleLevel ? `(${formatLevel(talentJobRoleLevel.level)})` : "(—)";
                            const jobLevelOnly = jobRoleLevel ? `(${formatLevel(jobRoleLevel.level)})` : "(N/A)";

                            const positionMatchReason = `Vị trí: ${talentPositionName}`;

                            const levelOnlyMatchReason = match.levelMatch
                                ? `✅ Khớp: Talent ${talentLevelOnly} ↔ Job ${jobLevelOnly}`
                                : `❌ Không khớp: Talent ${talentLevelOnly} ↔ Job ${jobLevelOnly}`;
                            
                            const workingModeMatchReason = workingModeRequired
                                ? workingModeMatch
                                    ? `✅ Khớp: Talent ${talentWorkingModeText || "chưa cập nhật"} ↔ Job ${workingModeRequirementText}`
                                    : `❌ Không khớp: Talent ${talentWorkingModeText || "chưa cập nhật"} ↔ Job ${workingModeRequirementText}`
                                : "✅ Không yêu cầu: Job chấp nhận mọi chế độ làm việc";
                            
                            const talentLocationName = (match.talentInfo as Talent & { locationName?: string | null })?.locationName || null;
                            const locationMatchReason = isRemoteOrFlexible
                                ? "✅ Job cho phép làm việc từ xa nên không yêu cầu địa điểm cố định"
                                : locationRequired
                                    ? talentLocationId
                                        ? locationMatch
                                            ? `✅ Khớp: Talent (${(talentLocationName) || "N/A"}) ↔ Job (${(jobLocation?.name) || "N/A"})`
                                            : `❌ Khác địa điểm: Talent (${(talentLocationName) || "N/A"}) ↔ Job (${(jobLocation?.name) || "N/A"})`
                                        : "❌ Talent (Chưa cập nhật) ↔ Job (Yêu cầu địa điểm cụ thể)"
                                    : "✅ Job Không yêu cầu địa điểm cụ thể";
                            
                            const skillMatchReason = totalRequiredSkills > 0
                                ? `${match.matchedSkills?.length || 0}/${totalRequiredSkills} kỹ năng (${skillMatchPercent}%)`
                                : "Không yêu cầu kỹ năng cụ thể";

                            return (
                            <div
                                key={match.talentCV.id}
                                className="group bg-white rounded-2xl shadow-soft hover:shadow-medium border border-neutral-100 hover:border-primary-200 p-6 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-start gap-6">
                                    {/* Rank Badge */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                            actualIndex === 0 ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-300' :
                                            actualIndex === 1 ? 'bg-gray-100 text-gray-600 border-2 border-gray-300' :
                                            actualIndex === 2 ? 'bg-orange-100 text-orange-600 border-2 border-orange-300' :
                                            'bg-neutral-100 text-neutral-600'
                                        }`}>
                                            #{actualIndex + 1}
                                        </div>
                                    </div>

                                    {/* CV Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">
                                                    {match.talentInfo?.fullName || `Talent #${match.talentCV.talentId}`}
                                                </h3>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <button
                                                        onClick={() => window.open(match.talentCV.cvFileUrl, '_blank')}
                                                        className="text-neutral-500 text-sm font-medium hover:underline transition-colors"
                                                    >
                                                        Phiên bản CV: v{match.talentCV.version}
                                                    </button>
                                                    {match.jobRoleLevelName && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg border border-primary-200">
                                                            <Briefcase className="w-3 h-3" />
                                                            {match.jobRoleLevelName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                    {match.talentInfo?.email && (
                                                        <button
                                                            onClick={() => openTalentPopup(match.talentCV.talentId)}
                                                            className="flex items-center gap-1 text-neutral-500 hover:text-primary-600 hover:underline transition-colors"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                            {match.talentInfo.email}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Match Score */}
                                            <div className="text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-2xl border-2 ${getScoreColor(calculatedScore)}`}>
                                                    {calculatedScore}
                                                    <span className="text-sm font-medium">/100</span>
                                                </div>
                                                <p className="text-xs text-neutral-500 mt-1">{getScoreLabel(calculatedScore)}</p>
                                                {match.hasFailedApplication && match.failedApplicationStatus && (
                                                    <p className="text-xs text-red-600 mt-1 font-medium">
                                                        Đã {match.failedApplicationStatus === 'Rejected' ? 'bị từ chối' : 'rút hồ sơ'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-xs text-neutral-600 mb-2">
                                                <span>Độ phù hợp</span>
                                                <span>{calculatedScore}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        calculatedScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                                        calculatedScore >= 60 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                        calculatedScore >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                        'bg-gradient-to-r from-red-500 to-red-600'
                                                    }`}
                                                    style={{ width: `${calculatedScore}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Match Summary */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Target className="w-5 h-5 text-primary-600" />
                                                    <h4 className="text-lg font-bold text-gray-900">Phân tích mức độ phù hợp</h4>
                                                </div>
                                                <button
                                                    onClick={() => toggleMatchingDetails(match.talentCV.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-300"
                                                >
                                                    {showMatchingDetails[match.talentCV.id] ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />
                                                            Thu gọn
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            Xem chi tiết
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Score Cards Grid */}
                                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ${showMatchingDetails[match.talentCV.id] ? '' : 'hidden'}`}>
                                                {/* Availability Bonus/Penalty */}
                                                <div className={`col-span-1 md:col-span-2 p-4 rounded-xl border-2 mb-4 ${
                                                    availabilityBonus > 0
                                                        ? 'bg-purple-50 border-purple-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${
                                                                availabilityBonus > 0 ? 'bg-purple-100' : 'bg-red-100'
                                                            }`}>
                                                                <Clock className={`w-4 h-4 ${
                                                                    availabilityBonus > 0 ? 'text-purple-600' : 'text-red-600'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">Thời gian rảnh</p>
                                                                <p className="text-xs text-gray-600">Tối đa 5 điểm</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-bold ${
                                                                availabilityBonus > 0 ? 'text-purple-600' : 'text-red-600'
                                                            }`}>
                                                                {availabilityBonus > 0 ? availabilityBonus : 0}
                                                            </p>
                                                            <p className="text-xs text-gray-500">/5</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm mt-2 font-medium ${
                                                        availabilityBonus > 0 ? 'text-purple-700' : 'text-red-700'
                                                    }`}>
                                                        {availabilityBonus > 0
                                                            ? 'Thời gian rảnh khớp với dự án'
                                                            : talentAvailableTimes.some(at => at.talentId === match.talentCV.talentId)
                                                                ? `Thời gian rảnh không khớp với dự án`
                                                                : 'Không có thông tin thời gian rảnh'
                                                        }
                                                    </p>
                                                    {talentAvailableTimes.some(at => at.talentId === match.talentCV.talentId) && (
                                                        <>
                                                            <p className="text-xs text-gray-600 mt-1 font-medium">
                                                                Dự án: {projectData?.startDate ? new Date(projectData.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                                                {projectData?.endDate ? ` - ${new Date(projectData.endDate).toLocaleDateString('vi-VN')}` : ' - Đến khi có cập nhật'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Thời gian rảnh: {formatAvailabilityTimes(match.talentCV.talentId, talentAvailableTimes)}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Cấp độ/Kinh nghiệm */}
                                                <div className={`p-4 rounded-xl border-2 ${
                                                    match.levelMatch 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${
                                                                match.levelMatch ? 'bg-green-100' : 'bg-red-100'
                                                            }`}>
                                                                <GraduationCap className={`w-4 h-4 ${
                                                                    match.levelMatch ? 'text-green-600' : 'text-red-600'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">Cấp độ/Kinh nghiệm</p>
                                                                <p className="text-xs text-gray-600">Tối đa 20 điểm</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-bold ${
                                                                match.levelMatch ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {levelPoints}
                                                            </p>
                                                            <p className="text-xs text-gray-500">/20</p>
                                                        </div>
                                                    </div>
                                                    <div className={`text-sm mt-2 font-medium space-y-1 ${
                                                        match.levelMatch ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        <p>{positionMatchReason}</p>
                                                        <p>{levelOnlyMatchReason}</p>
                                                    </div>
                                                </div>

                                                {/* Chế độ làm việc */}
                                                <div className={`p-4 rounded-xl border-2 ${
                                                    workingModePoints === 10
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${
                                                                workingModePoints === 10 ? 'bg-green-100' : 'bg-red-100'
                                                            }`}>
                                                                <Briefcase className={`w-4 h-4 ${
                                                                    workingModePoints === 10 ? 'text-green-600' : 'text-red-600'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">Chế độ làm việc</p>
                                                                <p className="text-xs text-gray-600">Tối đa 10 điểm</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-bold ${
                                                                workingModePoints === 10 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {workingModePoints}
                                                            </p>
                                                            <p className="text-xs text-gray-500">/10</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm mt-2 font-medium ${
                                                        workingModePoints === 10 ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        {workingModeMatchReason}
                                                    </p>
                                                </div>

                                                {/* Địa điểm */}
                                                <div className={`p-4 rounded-xl border-2 ${
                                                    locationPoints === 15
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${
                                                                locationPoints === 15 ? 'bg-green-100' : 'bg-red-100'
                                                            }`}>
                                                                <MapPin className={`w-4 h-4 ${
                                                                    locationPoints === 15 ? 'text-green-600' : 'text-red-600'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">Địa điểm</p>
                                                                <p className="text-xs text-gray-600">Tối đa 15 điểm</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-bold ${
                                                                locationPoints === 15 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {locationPoints}
                                                            </p>
                                                            <p className="text-xs text-gray-500">/15</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm mt-2 font-medium ${
                                                        locationPoints === 15 ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        {locationMatchReason}
                                                    </p>
                                                </div>

                                                {/* Kỹ năng */}
                                                <div className={`p-4 rounded-xl border-2 ${
                                                    skillPoints >= 40
                                                        ? 'bg-green-50 border-green-200' 
                                                        : skillPoints >= 25
                                                        ? 'bg-yellow-50 border-yellow-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-lg ${
                                                                skillPoints >= 40 ? 'bg-green-100' : skillPoints >= 25 ? 'bg-yellow-100' : 'bg-red-100'
                                                            }`}>
                                                                <Code className={`w-4 h-4 ${
                                                                    skillPoints >= 40 ? 'text-green-600' : skillPoints >= 25 ? 'text-yellow-600' : 'text-red-600'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">Kỹ năng</p>
                                                                <p className="text-xs text-gray-600">Tối đa 50 điểm</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-bold ${
                                                                skillPoints >= 40 ? 'text-green-600' : skillPoints >= 25 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                                {skillPoints}
                                                            </p>
                                                            <p className="text-xs text-gray-500">/50</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                                            {skillMatchReason}
                                                        </p>
                                                        {match.matchedSkills.length > 0 && (
                                                            <div className="mb-2">
                                                                <p className="text-xs font-medium text-green-600 mb-1">Kỹ năng Talent có:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {match.matchedSkills.slice(0, 5).map((skill, idx) => (
                                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {match.matchedSkills.length > 5 && (
                                                                        <span className="text-xs text-gray-500">+{match.matchedSkills.length - 5} kỹ năng khác</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {match.missingSkills && 
                                                         Array.isArray(match.missingSkills) && 
                                                         match.missingSkills.length > 0 && (
                                                            <div className="pt-2 border-t border-gray-200">
                                                                <p className="text-xs font-medium text-red-600 mb-1">❌ Còn thiếu:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {match.missingSkills
                                                                        .filter((skill: string) => skill && typeof skill === 'string' && skill.trim().length > 0)
                                                                        .slice(0, 5)
                                                                        .map((skill: string, idx: number) => (
                                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {match.missingSkills.filter((skill: string) => skill && typeof skill === 'string' && skill.trim().length > 0).length > 5 && (
                                                                        <span className="text-xs text-gray-500">+{match.missingSkills.filter((skill: string) => skill && typeof skill === 'string' && skill.trim().length > 0).length - 5} kỹ năng khác</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Total Score Summary */}
                                            <div className={`col-span-1 md:col-span-2 mt-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 ${showMatchingDetails[match.talentCV.id] ? '' : 'hidden'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary-100">
                                                            <Award className="w-5 h-5 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">Tổng điểm phù hợp</p>
                                                            <p className="text-sm text-gray-600">Tổng hợp tất cả các tiêu chí</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-4xl font-bold ${
                                                            calculatedScore >= 80 ? 'text-green-600' :
                                                            calculatedScore >= 60 ? 'text-blue-600' :
                                                            calculatedScore >= 40 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {calculatedScore}
                                                        </p>
                                                        <p className="text-sm text-gray-500">/100 điểm</p>
                                                        <p className={`text-xs font-medium mt-1 ${
                                                            calculatedScore >= 80 ? 'text-green-600' :
                                                            calculatedScore >= 60 ? 'text-blue-600' :
                                                            calculatedScore >= 40 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {getScoreLabel(calculatedScore)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div className="space-y-3">
                                            {/* Skill Verification Status */}
                                            <div className="flex items-center gap-2 mb-2">
                                                {match.areSkillsVerified ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-semibold text-green-700">
                                                            Kỹ năng đã được xác minh
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="w-4 h-4 text-yellow-600" />
                                                        <span className="text-sm font-semibold text-yellow-700">
                                                            Kỹ năng chưa được xác minh
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Matched Skills */}
                                            {(match.matchedSkills?.length || 0) > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            Kỹ năng phù hợp ({match.matchedSkills?.length || 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(match.matchedSkills || []).map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-start mt-4 pt-4 border-t border-neutral-200">
                                            {/* Primary: Create Application */}
                                            <Button
                                                onClick={() => handleCreateApplication(match)}
                                                className="group flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transform hover:scale-105 shadow-lg hover:shadow-xl"
                                            >
                                                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                                Tạo hồ sơ ứng tuyển
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-neutral-600">
                                Hiển thị <span className="font-semibold text-gray-900">{startIndex + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredCVs.length)}</span> trong tổng số <span className="font-semibold text-gray-900">{filteredCVs.length}</span> CV
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-50 border border-primary-200 hover:bg-primary-100 text-black hover:text-green disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Trước
                                </Button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all duration-300 ${
                                                    currentPage === pageNum
                                                        ? 'bg-primary-600 text-white shadow-md'
                                                        : 'bg-white border border-neutral-200 text-gray-700 hover:bg-neutral-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-50 border border-primary-200 hover:bg-primary-100 text-black hover:text-green disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400"
                                >
                                    Sau
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
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
        </div>

        {/* Talent Info Popup */}
        {isTalentPopupOpen && (
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeTalentPopup();
                }}
            >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden border border-neutral-200">
                    <div className="p-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-neutral-900">Thông tin Talent</h3>
                            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                                {selectedTalent?.fullName || "Đang tải..."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeTalentPopup}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100"
                            aria-label="Đóng"
                            title="Đóng"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5">
                        {talentPopupLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : selectedTalent ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Họ tên:</span>
                                        </div>
                                        <p className="text-sm text-neutral-900 ml-6">{selectedTalent.fullName || "—"}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Email:</span>
                                        </div>
                                        <p className="text-sm text-neutral-900 ml-6">{selectedTalent.email || "—"}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Số điện thoại:</span>
                                        </div>
                                        <p className="text-sm text-neutral-900 ml-6">{selectedTalent.phone || "—"}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Chế độ làm việc:</span>
                                        </div>
                                        <p className="text-sm text-neutral-900 ml-6">{formatWorkingMode(selectedTalent.workingMode)}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Khu vực làm việc:</span>
                                        </div>
                                        <p className="text-sm text-neutral-900 ml-6">{(selectedTalent as Talent & { locationName?: string | null }).locationName || "—"}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-700">Trạng thái:</span>
                                        </div>
                                        <div className="ml-6">
                                            {selectedTalent.status ? (
                                                (() => {
                                                    const statusInfo = getStatusInfo(selectedTalent.status);
                                                    return (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-sm text-neutral-500">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-200">
                                    <button
                                        onClick={() => {
                                            navigate(`/ta/talents/${selectedTalent.id}`, {
                                                state: { returnTo: currentMatchingPath },
                                            });
                                            closeTalentPopup();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Xem chi tiết Talent
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-neutral-600">Không thể tải thông tin talent.</p>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

