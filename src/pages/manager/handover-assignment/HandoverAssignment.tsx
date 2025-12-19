import { useEffect, useState, useMemo } from "react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/manager";
import { talentService, type Talent, type HandoverTalentRequest } from "../../../services/Talent";
import { userService, type User } from "../../../services/User";
import { talentStaffAssignmentService, type TalentStaffAssignment, AssignmentResponsibility } from "../../../services/TalentStaffAssignment";
import { jobRequestService, type OwnershipTransferModel, type JobRequest } from "../../../services/JobRequest";
import { talentApplicationService, type TalentApplication, type BulkApplicationOwnershipTransferModel } from "../../../services/TalentApplication";
import { talentCVService } from "../../../services/TalentCV";
import { jobRoleLevelService } from "../../../services/JobRoleLevel";
import {
  Search,
  UserCog,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  Users,
  X,
  ArrowRightLeft,
  FileText,
  FileUser,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function HandoverAssignmentPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [taStaff, setTaStaff] = useState<User[]>([]);
  const [salesStaff, setSalesStaff] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TalentStaffAssignment[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTaId, setFilterTaId] = useState<string>(""); // Filter by TA

  // Form state
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [selectedToUserId, setSelectedToUserId] = useState<string>("");
  const [note, setNote] = useState("");

  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Talent selection popup
  const [isTalentPopupOpen, setIsTalentPopupOpen] = useState(false);

  // Job Request selection popup
  const [isJobRequestPopupOpen, setIsJobRequestPopupOpen] = useState(false);

  // Talent Application selection popup
  const [isTalentApplicationPopupOpen, setIsTalentApplicationPopupOpen] = useState(false);
  const [tempSelectedTalentApplicationIds, setTempSelectedTalentApplicationIds] = useState<number[]>([]);

  // Tab system
  const [activeTab, setActiveTab] = useState<string>("talent");

  // Yêu cầu tuyển dụng transfer states
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [filteredJobRequests, setFilteredJobRequests] = useState<JobRequest[]>([]);
  const [selectedJobRequestId, setSelectedJobRequestId] = useState<number | null>(null);
  const [transferToUserId, setTransferToUserId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [jobRequestSearchTerm, setJobRequestSearchTerm] = useState("");

  // Sales dropdown states
  const [salesSearch, setSalesSearch] = useState("");
  const [isSalesDropdownOpen, setIsSalesDropdownOpen] = useState(false);

  // TA dropdown states (for talent handover)
  const [taSearch, setTaSearch] = useState("");
  const [isTaDropdownOpen, setIsTaDropdownOpen] = useState(false);

  // TA dropdown states (for talent application handover)
  const [applicationTaSearch, setApplicationTaSearch] = useState("");
  const [isApplicationTaDropdownOpen, setIsApplicationTaDropdownOpen] = useState(false);
  const [jobRequestStatusFilter, setJobRequestStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "closed">("all");

  // Hồ sơ ứng tuyển transfer states
  const [talentApplications, setTalentApplications] = useState<TalentApplication[]>([]);
  const [filteredTalentApplications, setFilteredTalentApplications] = useState<TalentApplication[]>([]);
  const [selectedTalentApplicationIds, setSelectedTalentApplicationIds] = useState<number[]>([]);
  const [applicationTransferToUserId, setApplicationTransferToUserId] = useState<string>("");
  const [applicationTransferReason, setApplicationTransferReason] = useState<string>("");
  const [applicationTransferLoading, setApplicationTransferLoading] = useState(false);
  const [selectedJobRequestFilter, setSelectedJobRequestFilter] = useState<string>("");
  const [jobRequestFilterSearch, setJobRequestFilterSearch] = useState<string>("");
  const [isJobRequestDropdownOpen, setIsJobRequestDropdownOpen] = useState<boolean>(false);

  // Cache for submittedBy names (userId -> userName)
  const [submittedByNames, setSubmittedByNames] = useState<Record<string, string>>({});

  // Cache for job request names (jobRequestId -> jobRequestTitle)
  const [jobRequestNames, setJobRequestNames] = useState<Record<number, string>>({});

  // Cache for CV job role level names (cvId -> jobRoleLevelName)
  const [cvJobRoleNames, setCvJobRoleNames] = useState<Record<number, string>>({});

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch talents, TA staff, assignments, yêu cầu tuyển dụng, and hồ sơ ứng tuyển in parallel
        const [talentsData, usersData, assignmentsData, jobRequestsData, applicationsData] = await Promise.all([
          talentService.getAll({ excludeDeleted: true }),
          userService.getAll({ excludeDeleted: true, isActive: true }),
          talentStaffAssignmentService.getAll({ 
            isActive: true, 
            responsibility: AssignmentResponsibility.HrManagement,
            excludeDeleted: true 
          }),
          jobRequestService.getAll({ excludeDeleted: false }),
          talentApplicationService.getAll({ excludeDeleted: true }),
        ]);

        // Ensure all data are arrays - handle PagedResult with Items/items or direct array
        const talentsArray = ensureArray<Talent>(talentsData);
        const usersArray = ensureArray<User>(usersData);
        const assignmentsArray = ensureArray<TalentStaffAssignment>(assignmentsData);
        const jobRequestsArray = ensureArray<JobRequest>(jobRequestsData);
        const applicationsArray = ensureArray<TalentApplication>(applicationsData);

        // Data processing

        // Filter TA staff (role = "TA") for talent handover
        const taStaffList = usersArray.filter(
          (user: User) => user.roles.includes("TA")
        );

        // Filter Sales staff (role = "Sale") for job request handover
        const salesStaffList = usersArray.filter(
          (user: User) => user.roles.includes("Sale")
        );

        // Use API data
        const finalJobRequests = jobRequestsArray;

        setTalents(talentsArray);
        setTaStaff(taStaffList);
        setSalesStaff(salesStaffList);
        setAssignments(assignmentsArray);
        setFilteredTalents(talentsArray);
        setJobRequests(finalJobRequests);
        setFilteredJobRequests(finalJobRequests);
        console.log('Talent Applications loaded:', applicationsArray);
        setTalentApplications(applicationsArray);
        setFilteredTalentApplications(applicationsArray);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải dữ liệu:", err);
        setErrorMessage(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map talentId -> TA userId (current manager)
  const talentToTaMap = useMemo(() => {
    const map = new Map<number, string>();
    assignments.forEach((assignment) => {
      if (assignment.isActive && assignment.talentId) {
        map.set(assignment.talentId, assignment.userId);
      }
    });
    return map;
  }, [assignments]);

  // Map userId -> User object for quick lookup (TA staff for talent handover)
  const taUserMap = useMemo(() => {
    const map = new Map<string, User>();
    taStaff.forEach((ta) => {
      map.set(ta.id, ta);
    });
    return map;
  }, [taStaff]);

  // Filter talents by search term and TA filter
  useEffect(() => {
    let filtered = talents;

    // Filter by TA
    if (filterTaId) {
      filtered = filtered.filter((talent) => {
        const taUserId = talentToTaMap.get(talent.id);
        return taUserId === filterTaId;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (talent) =>
          talent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          talent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          talent.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTalents(filtered);
  }, [searchTerm, filterTaId, talents, talentToTaMap]);

  // Filter job requests by status and search term
  useEffect(() => {
    let filtered = jobRequests;

    // Filter by status
    if (jobRequestStatusFilter === "pending") {
      filtered = filtered.filter(jobRequest => jobRequest.status === 0); // Pending
    } else if (jobRequestStatusFilter === "approved") {
      filtered = filtered.filter(jobRequest => jobRequest.status === 1); // Approved
    } else if (jobRequestStatusFilter === "rejected") {
      filtered = filtered.filter(jobRequest => jobRequest.status === 3); // Rejected
    } else if (jobRequestStatusFilter === "closed") {
      filtered = filtered.filter(jobRequest => jobRequest.status === 2); // Closed
    }
    // If "all", show all job requests (pending, approved, rejected, closed)

    // Filter by search term
    if (jobRequestSearchTerm.trim()) {
      filtered = filtered.filter(
        (jobRequest) =>
          jobRequest.title.toLowerCase().includes(jobRequestSearchTerm.toLowerCase()) ||
          jobRequest.code.toLowerCase().includes(jobRequestSearchTerm.toLowerCase())
      );
    }

    setFilteredJobRequests(filtered);
  }, [jobRequestSearchTerm, jobRequests, jobRequestStatusFilter]);

  // Filter talent applications by status, job request, and search term
  useEffect(() => {
    let filtered = talentApplications;
    console.log('Filtering talent applications:', {
      totalApplications: talentApplications.length,
      selectedJobRequestFilter,
      originalApplications: talentApplications
    });

    // Show all applications for now to debug (temporarily remove status filter)
    // filtered = filtered.filter(application => application.status === 'Submitted');
    console.log('All status values:', [...new Set(talentApplications.map(app => app.status))]);
    console.log('After status filter (all for now):', filtered.length);

    // Filter by selected job request
    if (selectedJobRequestFilter) {
      filtered = filtered.filter(application => application.jobRequestId.toString() === selectedJobRequestFilter);
      console.log('After job request filter:', filtered.length, 'jobRequestId:', selectedJobRequestFilter);
    }

    console.log('Final filtered applications:', filtered);
    setFilteredTalentApplications(filtered);
  }, [selectedJobRequestFilter, talentApplications]);

  // Fetch names when talent applications change
  useEffect(() => {
    const fetchNames = async () => {
      // Fetch submittedBy names
      const uniqueUserIds = [...new Set(talentApplications.map(app => app.submittedBy).filter(Boolean))];
      for (const userId of uniqueUserIds) {
        if (!submittedByNames[userId]) {
          await getUserNameById(userId);
        }
      }

      // Fetch job request names
      const uniqueJobRequestIds = [...new Set(talentApplications.map(app => app.jobRequestId))];
      for (const jobRequestId of uniqueJobRequestIds) {
        if (!jobRequestNames[jobRequestId]) {
          await getJobRequestNameById(jobRequestId);
        }
      }

      // Fetch CV job role names
      const uniqueCvIds = [...new Set(talentApplications.map(app => app.cvId))];
      for (const cvId of uniqueCvIds) {
        if (!cvJobRoleNames[cvId]) {
          await getCvJobRoleNameById(cvId);
        }
      }
    };

    if (talentApplications.length > 0) {
      fetchNames();
    }
  }, [talentApplications]);

  // Reset states when switching tabs
  useEffect(() => {
    if (activeTab === "talent") {
      setSelectedJobRequestId(null);
      setTransferToUserId("");
      setTransferReason("");
      setIsJobRequestPopupOpen(false);
      setSelectedTalentApplicationIds([]);
      setApplicationTransferToUserId("");
      setApplicationTransferReason("");
      setIsTalentApplicationPopupOpen(false);
    } else if (activeTab === "jobrequest") {
      setSelectedTalentId(null);
      setSelectedToUserId("");
      setNote("");
      setIsTalentPopupOpen(false);
      setSelectedTalentApplicationIds([]);
      setApplicationTransferToUserId("");
      setApplicationTransferReason("");
      setIsTalentApplicationPopupOpen(false);
      // Reset job request status filter to "all" when switching to job request tab
      setJobRequestStatusFilter("all");
    } else if (activeTab === "talentapplication") {
      setSelectedTalentId(null);
      setSelectedToUserId("");
      setNote("");
      setIsTalentPopupOpen(false);
      setSelectedJobRequestId(null);
      setTransferToUserId("");
      setTransferReason("");
      setIsJobRequestPopupOpen(false);
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTalentId || !selectedToUserId) {
      setErrorMessage("Vui lòng chọn nhân sự và TA nhận quyền quản lý");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload: HandoverTalentRequest = {
        toUserId: selectedToUserId,
        note: note.trim() || null,
      };
      await talentService.handoverAssignment(selectedTalentId, payload);

      // Lưu ý: Backend đã đổi role từ HR sang TA
      // Nếu backend có gửi notification sau khi handover, đảm bảo backend tìm user theo role "TA" (không phải "HR")
      // Notification sẽ được gửi đến TA nhận quyền quản lý (selectedToUserId)

      setSuccessMessage(`Bàn giao quản lý nhân sự thành công!`);

      // Auto-close success message after 1 second
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);
      
      // Reset form
      setSelectedTalentId(null);
      setSelectedToUserId("");
      setNote("");
      
      // Refresh cả nhân sự và assignments để cập nhật thông tin TA quản lý
      const [talentsData, assignmentsData] = await Promise.all([
        talentService.getAll({ excludeDeleted: true }),
        talentStaffAssignmentService.getAll({ 
          isActive: true, 
          responsibility: AssignmentResponsibility.HrManagement,
          excludeDeleted: true 
        }),
      ]);
      
      // Ensure all data are arrays - handle PagedResult with Items/items or direct array
      const talentsArray = ensureArray<Talent>(talentsData);
      const assignmentsArray = ensureArray<TalentStaffAssignment>(assignmentsData);
      
      setTalents(talentsArray);
      setFilteredTalents(talentsArray);
      setAssignments(assignmentsArray);
    } catch (err: any) {
      console.error("❌ Lỗi khi chuyển nhượng:", err);
      setErrorMessage(err.message || "Không thể chuyển nhượng quản lý nhân sự");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJobRequestTransfer = async () => {
    if (!selectedJobRequestId || !transferToUserId) {
      setErrorMessage("Vui lòng chọn yêu cầu tuyển dụng và người nhận quyền quản lý");
      return;
    }

    try {
      setTransferLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload: OwnershipTransferModel = {
        newOwnerId: transferToUserId,
        reason: transferReason.trim() || undefined,
      };
      
      await jobRequestService.transferOwnership(selectedJobRequestId, payload);

      setSuccessMessage(`Bàn giao quản lý yêu cầu tuyển dụng thành công!`);

      // Auto-close success message after 1 second
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);

      // Reset form
      setSelectedJobRequestId(null);
      setTransferToUserId("");
      setTransferReason("");

      // Refresh yêu cầu tuyển dụng
      const jobRequestsData = await jobRequestService.getAll({ excludeDeleted: true });
      const jobRequestsArray = ensureArray<JobRequest>(jobRequestsData);
      setJobRequests(jobRequestsArray);
    } catch (err: any) {
      console.error("❌ Lỗi khi chuyển nhượng:", err);
      setErrorMessage(err.message || "Không thể chuyển nhượng quản lý yêu cầu tuyển dụng");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleTalentApplicationTransfer = async () => {
    if (selectedTalentApplicationIds.length === 0 || !applicationTransferToUserId) {
      setErrorMessage("Vui lòng chọn hồ sơ ứng tuyển và TA nhận quyền quản lý");
      return;
    }

    try {
      setApplicationTransferLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload: BulkApplicationOwnershipTransferModel = {
        applicationIds: selectedTalentApplicationIds,
        newRecruiterId: applicationTransferToUserId,
        reason: applicationTransferReason.trim() || undefined,
      };

      await talentApplicationService.bulkTransferOwnership(payload);

      setSuccessMessage(`Bàn giao quản lý ${selectedTalentApplicationIds.length} hồ sơ ứng tuyển thành công!`);

      // Auto-close success message after 1 second
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1000);

      // Reset form
      setSelectedTalentApplicationIds([]);
      setApplicationTransferToUserId("");
      setApplicationTransferReason("");

      // Refresh talent applications
      const applicationsData = await talentApplicationService.getAll({ excludeDeleted: true });
      const applicationsArray = ensureArray<TalentApplication>(applicationsData);
      setTalentApplications(applicationsArray);
    } catch (err: any) {
      console.error("❌ Lỗi khi chuyển nhượng:", err);
      setErrorMessage(err.message || "Không thể chuyển nhượng quản lý hồ sơ ứng tuyển");
    } finally {
      setApplicationTransferLoading(false);
    }
  };

  // Status mapping for Vietnamese
  const getTalentApplicationStatusText = (status: string) => {
    const statusMapping: Record<string, string> = {
      'Submitted': 'Đã nộp hồ sơ',
      'Interviewing': 'Đang phỏng vấn',
      'Hired': 'Đã tuyển dụng',
      'Rejected': 'Đã từ chối',
      'Withdrawn': 'Đã rút hồ sơ',
      'Pending': 'Chờ xử lý',
      'Reviewed': 'Đã xem xét',
      'Shortlisted': 'Ứng viên tiềm năng'
    };
    return statusMapping[status] || status;
  };

  const selectedTalent = talents.find((t) => t.id === selectedTalentId);
  const selectedTa = taStaff.find((ta) => ta.id === selectedToUserId);

  // Filtered and sorted job requests for dropdown (only approved ones)
  const filteredJobRequestsForDropdown = jobRequests
    .filter(jobRequest => jobRequest.status === 1) // Only approved
    .filter(jobRequest =>
      jobRequest.title.toLowerCase().includes(jobRequestFilterSearch.toLowerCase()) ||
      jobRequest.code.toLowerCase().includes(jobRequestFilterSearch.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically

  // Get display text for selected job request
  const getJobRequestDisplayText = () => {
    if (!selectedJobRequestFilter) return "Tất cả yêu cầu tuyển dụng";

    const selectedJobRequest = jobRequests.find(jr => jr.id.toString() === selectedJobRequestFilter);
    return selectedJobRequest ? `${selectedJobRequest.title} (#${selectedJobRequest.code})` : "Tất cả yêu cầu tuyển dụng";
  };

  // Get display text for selected sales
  const getSalesDisplayText = () => {
    if (!transferToUserId) return "Chọn Sales";

    const selectedSales = salesStaff.find(s => s.id === transferToUserId);
    return selectedSales ? `${selectedSales.fullName} (${selectedSales.email})` : "Chọn Sales";
  };

  // Get display text for selected TA
  const getTaDisplayText = () => {
    if (!selectedToUserId) return "Chọn TA";

    const selectedTa = taStaff.find(ta => ta.id === selectedToUserId);
    return selectedTa ? `${selectedTa.fullName} (${selectedTa.email})` : "Chọn TA";
  };

  // Get display text for selected TA (for application handover)
  const getApplicationTaDisplayText = () => {
    if (!applicationTransferToUserId) return "Chọn TA";

    const selectedTa = taStaff.find(ta => ta.id === applicationTransferToUserId);
    return selectedTa ? `${selectedTa.fullName} (${selectedTa.email})` : "Chọn TA";
  };

  // Function to get user name by ID
  const getUserNameById = async (userId: string) => {
    if (submittedByNames[userId]) {
      return submittedByNames[userId];
    }

    try {
      const user = await userService.getById(userId);
      const userName = user.fullName || user.email || userId;
      setSubmittedByNames(prev => ({ ...prev, [userId]: userName }));
      return userName;
    } catch (error) {
      console.error('Error fetching user name:', error);
      return userId; // Fallback to ID
    }
  };

  // Function to get job request name by ID
  const getJobRequestNameById = async (jobRequestId: number) => {
    if (jobRequestNames[jobRequestId]) {
      return jobRequestNames[jobRequestId];
    }

    try {
      const jobRequest = jobRequests.find(jr => jr.id === jobRequestId);
      if (jobRequest) {
        const jobRequestName = jobRequest.title || `Job Request ${jobRequestId}`;
        setJobRequestNames(prev => ({ ...prev, [jobRequestId]: jobRequestName }));
        return jobRequestName;
      }
      return `Job Request ${jobRequestId}`; // Fallback
    } catch (error) {
      console.error('Error getting job request name:', error);
      return `Job Request ${jobRequestId}`; // Fallback
    }
  };

  // Function to get CV job role level name by CV ID
  const getCvJobRoleNameById = async (cvId: number) => {
    if (cvJobRoleNames[cvId]) {
      return cvJobRoleNames[cvId];
    }

    try {
      // Get CV details first to get jobRoleLevelId
      const cv = await talentCVService.getById(cvId);
      if (cv.jobRoleLevelId) {
        // Then get job role level name
        const jobRoleLevel = await jobRoleLevelService.getById(cv.jobRoleLevelId);
        const roleName = jobRoleLevel.name || `Level ${jobRoleLevel.level}`;
        setCvJobRoleNames(prev => ({ ...prev, [cvId]: roleName }));
        return roleName;
      }

      return `CV ${cvId}`; // Fallback if no job role level
    } catch (error) {
      console.error('Error getting CV job role name:', error);
      return `CV ${cvId}`; // Fallback
    }
  };
  const currentTaUserId = selectedTalentId ? talentToTaMap.get(selectedTalentId) : null;
  const currentTa = currentTaUserId ? taUserMap.get(currentTaUserId) : null;
  
  // Filter out current TA from available TA list (for talent handover)
  const availableTaStaff = useMemo(() => {
    if (!selectedTalentId || !currentTaUserId) {
      return taStaff;
    }
    return taStaff.filter((ta) => ta.id !== currentTaUserId);
  }, [taStaff, selectedTalentId, currentTaUserId]);
  
  // Reset selectedToUserId if it's the current TA
  useEffect(() => {
    if (selectedTalentId && selectedToUserId === currentTaUserId) {
      setSelectedToUserId("");
    }
  }, [selectedTalentId, selectedToUserId, currentTaUserId]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={sidebarItems} title="Manager" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Bàn giao phân công
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Chuyển giao quyền quản lý nhân sự, yêu cầu tuyển dụng hoặc hồ sơ ứng tuyển cho người dùng khác
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-0 mt-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("talent")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                    activeTab === "talent"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  Bàn giao nhân sự
                </button>
                <button
                  onClick={() => setActiveTab("jobrequest")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                    activeTab === "jobrequest"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bàn giao yêu cầu tuyển dụng
                </button>
                <button
                  onClick={() => setActiveTab("talentapplication")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                    activeTab === "talentapplication"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FileUser className="w-4 h-4" />
                  Bàn giao hồ sơ ứng tuyển
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {/* Success Message - Hiển thị giữa màn hình cho cả 2 tab */}
                  {successMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Thành công!
                          </h3>
                          <p className="text-sm text-gray-600">
                            {successMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Content */}
                  {activeTab === "talent" && (
                <form 
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                  noValidate
                >
                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">
                          {errorMessage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Layout 2 cột: Bên trái - Chọn Talent, Bên phải - Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cột trái: Chọn Talent */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                              Chọn nhân sự
                        </h2>
                            <p className="text-sm text-gray-500">
                              Chọn nhân sự để bàn giao quản lý
                            </p>
                          </div>
                      </div>

                        {/* Talent Selection Button */}
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => setIsTalentPopupOpen(true)}
                            className={`w-full p-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
                              selectedTalentId
                                ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                                : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-3">
                              {selectedTalentId ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    <div className="text-left">
                                      <p className="font-medium text-gray-900">
                                        {selectedTalent?.fullName}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {selectedTalent?.email}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Users className="w-6 h-6 text-gray-400" />
                                  <div className="text-center">
                                    <p className="font-medium text-gray-700">
                                      Chọn nhân sự
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Click để mở danh sách
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </button>

                          {/* Selected Talent Info */}
                          {selectedTalentId && selectedTalent && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-xs text-blue-700 font-medium mb-1">
                                    Nhân sự đã chọn
                                  </p>
                                  <p className="font-medium text-blue-900">
                                    {selectedTalent.fullName}
                                  </p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {selectedTalent.code} • {selectedTalent.email}
                                  </p>
                                  {currentTa && (
                                    <p className="text-xs text-blue-600 mt-2">
                                      TA hiện tại: {currentTa.fullName}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTalentId(null)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Note - Only show when talent is selected */}
                      {selectedTalentId && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Ghi chú (tùy chọn)
                          </label>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            placeholder="Nhập lý do bàn giao (ví dụ: TA hiện tại nghỉ việc, tái phân công công việc...)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Cột phải: Form chuyển nhượng */}
                    <div className="space-y-6">
                      {selectedTalentId ? (
                        <>
                          {/* Preview Section - Nổi bật hơn */}
                          {selectedTalent && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <UserCog className="w-5 h-5 text-blue-600" />
                                </div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                  Xem trước bàn giao
                                </h3>
                              </div>

                              {/* Talent Info */}
                              <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
                                <p className="text-xs text-gray-500 mb-1">Nhân sự được bàn giao</p>
                                <p className="font-semibold text-gray-900">{selectedTalent.fullName}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedTalent.code} • {selectedTalent.email}</p>
                              </div>

                              {/* TA Transfer Flow */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  {/* From TA */}
                                  <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-2">Từ TA hiện tại</p>
                                    {currentTa ? (
                                      <>
                                        <p className="font-semibold text-gray-900">{currentTa.fullName}</p>
                                        <p className="text-xs text-gray-500 mt-1">{currentTa.email}</p>
                                      </>
                                    ) : (
                                      <p className="font-medium text-gray-400 text-sm">Chưa có TA quản lý</p>
                                    )}
                                  </div>

                                  {/* Arrow */}
                                  <ArrowRight className="w-6 h-6 text-blue-500 flex-shrink-0" />

                                  {/* To TA */}
                                  <div className="flex-1 p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                                    <p className="text-xs text-blue-700 mb-2 font-medium">Đến TA mới</p>
                                    {selectedTa ? (
                                      <>
                                        <p className="font-semibold text-blue-900">{selectedTa.fullName}</p>
                                        <p className="text-xs text-blue-700 mt-1">{selectedTa.email}</p>
                                      </>
                                    ) : (
                                      <p className="text-sm text-blue-600 font-medium">Chọn TA bên dưới</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TA Selection */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Chọn TA nhận quyền quản lý <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                              <button
                                type="button"
                                onClick={() => setIsTaDropdownOpen(!isTaDropdownOpen)}
                                className="w-full flex items-center justify-between pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg bg-white text-left hover:border-blue-300 transition-colors"
                              >
                                <span className="text-sm text-gray-700">{getTaDisplayText()}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTaDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isTaDropdownOpen && (
                                <div
                                  className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                                  onMouseLeave={() => {
                                    setIsTaDropdownOpen(false);
                                    setTaSearch("");
                                  }}
                                >
                                  <div className="p-3 border-b border-gray-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={taSearch}
                                        onChange={(e) => setTaSearch(e.target.value)}
                                        placeholder="Tìm tên hoặc email..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedToUserId("");
                                        setIsTaDropdownOpen(false);
                                        setTaSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        !selectedToUserId
                                          ? 'bg-blue-50 text-blue-700'
                                          : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      Chọn TA
                                    </button>
                                    {availableTaStaff
                                      .filter((ta) =>
                                        !taSearch ||
                                        ta.fullName.toLowerCase().includes(taSearch.toLowerCase()) ||
                                        ta.email.toLowerCase().includes(taSearch.toLowerCase())
                                      )
                                      .map((ta) => (
                                        <button
                                          key={ta.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedToUserId(ta.id);
                                            setIsTaDropdownOpen(false);
                                            setTaSearch("");
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            selectedToUserId === ta.id
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'hover:bg-gray-50 text-gray-700'
                                          }`}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{ta.fullName}</span>
                                            <span className="text-xs text-gray-500">{ta.email}</span>
                                          </div>
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {selectedTalentId && currentTa && availableTaStaff.length === 0 && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  ⚠️ Không có TA khác để chuyển nhượng (chỉ có TA hiện tại đang quản lý)
                                </p>
                              </div>
                            )}
                            {availableTaStaff.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Có {availableTaStaff.length} TA khả dụng
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Empty State khi chưa chọn Talent */
                        <div className="flex flex-col items-center justify-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <UserCog className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            Chọn nhân sự để bắt đầu
                          </p>
                          <p className="text-sm text-gray-500 text-center max-w-sm">
                            Vui lòng chọn một nhân sự từ danh sách bên trái để bắt đầu quá trình bàn giao quản lý
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Talent Selection Popup */}
                  {isTalentPopupOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Chọn nhân sự
                              </h3>
                              <p className="text-sm text-gray-500">
                                Chọn nhân sự để bàn giao quản lý
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsTalentPopupOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                          {/* Filters */}
                          <div className="space-y-4 mb-6">
                      {/* Filter by TA */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Filter className="w-4 h-4 inline mr-1" />
                          Lọc theo TA quản lý
                        </label>
                        <select
                          value={filterTaId}
                          onChange={(e) => setFilterTaId(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Tất cả TA --</option>
                          {taStaff.map((ta) => (
                            <option key={ta.id} value={ta.id}>
                              {ta.fullName} ({ta.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Search Talent */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Search className="w-4 h-4 inline mr-1" />
                                Tìm kiếm nhân sự
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                                  placeholder="Tên, email hoặc mã nhân sự..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                              </div>
                        </div>
                      </div>

                      {/* Talent List */}
                      <div className="space-y-2">
                            <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                                Danh sách nhân sự
                        </label>
                              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {filteredTalents.length} / {talents.length}
                              </span>
                            </div>
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {filteredTalents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                  <p className="text-sm">Không tìm thấy nhân sự nào</p>
                              <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {filteredTalents.map((talent) => {
                                const currentTaUserId = talentToTaMap.get(talent.id);
                                const currentTa = currentTaUserId ? taUserMap.get(currentTaUserId) : null;
                                const isSelected = selectedTalentId === talent.id;
                                
                                return (
                                  <button
                                    key={talent.id}
                                    type="button"
                                        onClick={() => {
                                          setSelectedTalentId(talent.id);
                                          setIsTalentPopupOpen(false);
                                        }}
                                    className={`w-full p-4 text-left hover:bg-blue-50 transition-all ${
                                      isSelected
                                        ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                                        : "hover:border-l-4 hover:border-blue-200"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900 truncate">
                                            {talent.fullName}
                                          </p>
                                          {isSelected && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate">
                                          {talent.email}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Mã: {talent.code}
                                        </p>
                                        {currentTa ? (
                                          <div className="mt-2 flex items-center gap-1">
                                            <p className="text-xs text-blue-600 font-medium">
                                              TA: {currentTa.fullName}
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-400 mt-2">
                                            Chưa có TA quản lý
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTalentPopupOpen(false)}
                          >
                            Đóng
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Submit Button - Chỉ hiển thị khi đã chọn talent */}
                  {selectedTalentId && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="px-8 py-3"
                        onClick={() => {
                          setSelectedTalentId(null);
                          setSelectedToUserId("");
                          setNote("");
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="px-8 py-3"
                        disabled={submitting || !selectedTalentId || !selectedToUserId}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                        "Bàn giao"
                      )}
                    </Button>
                    </div>
                  )}
                    </form>
                  )}

                  {/* Job Request Transfer Tab */}
                  {activeTab === "jobrequest" && (
                    <>
                      {/* Layout 2 cột: Bên trái - Chọn Job Request, Bên phải - Form */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cột trái: Chọn Job Request */}
                        <div className="space-y-4">
                          <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                  Chọn yêu cầu tuyển dụng
                                </h2>
                                <p className="text-sm text-gray-500">
                                  Chọn yêu cầu tuyển dụng để bàn giao quản lý
                                </p>
                              </div>
                            </div>

                            {/* Job Request Selection Button */}
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={() => setIsJobRequestPopupOpen(true)}
                                className={`w-full p-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
                                  selectedJobRequestId
                                    ? "border-green-300 bg-green-50 hover:bg-green-100"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-3">
                                  {selectedJobRequestId ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <div className="text-left">
                                          <p className="font-medium text-gray-900">
                                            {jobRequests.find(jr => jr.id === selectedJobRequestId)?.title}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {jobRequests.find(jr => jr.id === selectedJobRequestId)?.code}
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-6 h-6 text-gray-400" />
                                      <div className="text-center">
                                        <p className="font-medium text-gray-700">
                                          Chọn yêu cầu tuyển dụng
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Click để mở danh sách
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </button>

                              {/* Selected Job Request Info */}
                              {selectedJobRequestId && (() => {
                                const selectedJobRequest = jobRequests.find(jr => jr.id === selectedJobRequestId);
                                const currentOwner = selectedJobRequest?.ownerName;
                                return selectedJobRequest && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-xs text-green-700 font-medium mb-1">
                                          Yêu cầu tuyển dụng đã chọn
                                        </p>
                                        <p className="font-medium text-green-900">
                                          {selectedJobRequest.title}
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">
                                          {selectedJobRequest.code}
                                        </p>
                                        {currentOwner && (
                                          <p className="text-xs text-green-600 mt-2">
                                            Sales hiện tại: {currentOwner}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedJobRequestId(null)}
                                        className="text-green-600 hover:text-green-800 p-1"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Note - Only show when job request is selected */}
                          {selectedJobRequestId && (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Ghi chú (tùy chọn)
                              </label>
                              <textarea
                                value={transferReason}
                                onChange={(e) => setTransferReason(e.target.value)}
                                rows={4}
                                placeholder="Nhập lý do bàn giao (ví dụ: Sales hiện tại nghỉ việc, tái phân công công việc...)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Cột phải: Form bàn giao */}
                    <div className="space-y-6">
                          {selectedJobRequestId ? (
                            <>
                              {/* Preview Section */}
                              {(() => {
                                const selectedJobRequest = jobRequests.find(jr => jr.id === selectedJobRequestId);
                                const currentOwner = selectedJobRequest?.ownerName;
                                return selectedJobRequest && (
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                      <div className="p-2 bg-green-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                        Xem trước bàn giao
                                </h3>
                              </div>
                              
                                    {/* Job Request Info */}
                                    <div className="mb-4 p-3 bg-white rounded-lg border border-green-100">
                                      <p className="text-xs text-gray-500 mb-1">Yêu cầu tuyển dụng được bàn giao</p>
                                      <p className="font-semibold text-gray-900">{selectedJobRequest.title}</p>
                                      <p className="text-sm text-gray-600 mt-1">{selectedJobRequest.code}</p>
                              </div>

                                    {/* Transfer Flow */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                        {/* From Owner */}
                                  <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                                          <p className="text-xs text-gray-500 mb-2">Từ Sales hiện tại</p>
                                          {currentOwner ? (
                                      <>
                                              <p className="font-semibold text-gray-900">{currentOwner}</p>
                                              <p className="text-xs text-gray-500 mt-1">Owner</p>
                                      </>
                                    ) : (
                                            <p className="font-medium text-gray-400 text-sm">Chưa có Sales quản lý</p>
                                    )}
                                  </div>

                                  {/* Arrow */}
                                        <ArrowRight className="w-6 h-6 text-green-500 flex-shrink-0" />

                                        {/* To Owner */}
                                        <div className="flex-1 p-4 bg-green-100 rounded-lg border-2 border-green-300">
                                          <p className="text-xs text-green-700 mb-2 font-medium">Đến Sales mới</p>
                                          {transferToUserId ? (() => {
                                            const selectedUser = salesStaff.find(u => u.id === transferToUserId);
                                            return selectedUser ? (
                                              <>
                                                <p className="font-semibold text-green-900">{selectedUser.fullName}</p>
                                                <p className="text-xs text-green-700 mt-1">{selectedUser.email}</p>
                                              </>
                                            ) : null;
                                          })() : (
                                            <p className="text-sm text-green-600 font-medium">Chọn Sales bên dưới</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                                );
                              })()}

                              {/* User Selection */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                  Chọn Sales nhận quyền quản lý <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                              <button
                                type="button"
                                onClick={() => setIsSalesDropdownOpen(!isSalesDropdownOpen)}
                                className="w-full flex items-center justify-between pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg bg-white text-left hover:border-green-300 transition-colors"
                              >
                                <span className="text-sm text-gray-700">{getSalesDisplayText()}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSalesDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {isSalesDropdownOpen && (
                                <div
                                  className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                                  onMouseLeave={() => {
                                    setIsSalesDropdownOpen(false);
                                    setSalesSearch("");
                                  }}
                                >
                                  <div className="p-3 border-b border-gray-100">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        value={salesSearch}
                                        onChange={(e) => setSalesSearch(e.target.value)}
                                        placeholder="Tìm tên hoặc email..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-green-500 focus:ring-green-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTransferToUserId("");
                                        setIsSalesDropdownOpen(false);
                                        setSalesSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm ${
                                        !transferToUserId
                                          ? 'bg-green-50 text-green-700'
                                          : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      Chọn Sales
                                    </button>
                                    {(() => {
                                      const selectedJobRequest = jobRequests.find(jr => jr.id === selectedJobRequestId);
                                      console.log('Filter sales for transfer:', {
                                        selectedJobRequestId,
                                        selectedJobRequest: selectedJobRequest ? { id: selectedJobRequest.id, ownerId: selectedJobRequest.ownerId } : null,
                                        allSalesCount: salesStaff.length,
                                        filteredSales: salesStaff.filter((user) => {
                                          const shouldInclude = !selectedJobRequest || user.id !== selectedJobRequest.ownerId;
                                          return shouldInclude;
                                        })
                                      });
                                      return salesStaff
                                        .filter((user) => {
                                          // Loại trừ Sales hiện tại đang sở hữu jobrequest được chọn
                                          const selectedJobRequest = jobRequests.find(jr => jr.id === selectedJobRequestId);
                                          const shouldInclude = !selectedJobRequest || user.id !== selectedJobRequest.ownerId;
                                          // Filter theo search term
                                          const matchesSearch = !salesSearch ||
                                            user.fullName.toLowerCase().includes(salesSearch.toLowerCase()) ||
                                            user.email.toLowerCase().includes(salesSearch.toLowerCase());
                                          return shouldInclude && matchesSearch;
                                        })
                                        .map((user) => (
                                          <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                              setTransferToUserId(user.id);
                                              setIsSalesDropdownOpen(false);
                                              setSalesSearch("");
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                              transferToUserId === user.id
                                                ? 'bg-green-50 text-green-700'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                          >
                                            <div className="flex flex-col">
                                              <span className="font-medium">{user.fullName}</span>
                                              <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                          </button>
                                        ));
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Có {(() => {
                                  const selectedJobRequest = jobRequests.find(jr => jr.id === selectedJobRequestId);
                                  return salesStaff.filter((user) => {
                                    return !selectedJobRequest || user.id !== selectedJobRequest.ownerId;
                                  }).length;
                                })()} Sales khả dụng
                              </p>
                              </div>
                            </>
                          ) : (
                            /* Empty State khi chưa chọn Job Request */
                            <div className="flex flex-col items-center justify-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <FileText className="w-16 h-16 text-gray-400 mb-4" />
                              <p className="text-lg font-medium text-gray-700 mb-2">
                                Chọn yêu cầu tuyển dụng để bắt đầu
                              </p>
                              <p className="text-sm text-gray-500 text-center max-w-sm">
                                Vui lòng chọn một yêu cầu tuyển dụng từ danh sách bên trái để bắt đầu quá trình bàn giao quản lý
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Transfer Button - Chỉ hiển thị khi đã chọn job request (giống talent handover) */}
                      {selectedJobRequestId && (
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                          <Button
                            type="button"
                            variant="outline"
                            className="px-8 py-3"
                            onClick={() => {
                              setSelectedJobRequestId(null);
                              setTransferToUserId("");
                              setTransferReason("");
                            }}
                            disabled={transferLoading}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            className="px-8 py-3 bg-green-600 hover:bg-green-700"
                            onClick={handleJobRequestTransfer}
                            disabled={transferLoading || !selectedJobRequestId || !transferToUserId}
                          >
                            {transferLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang xử lý...
                              </>
                            ) : (
                              "Bàn giao"
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Job Request Selection Popup */}
                      {isJobRequestPopupOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" style={{ display: 'flex' }}>
                              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Chọn yêu cầu tuyển dụng
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    Chọn yêu cầu tuyển dụng để bàn giao quản lý
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsJobRequestPopupOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5 text-gray-400" />
                              </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-4">
                              {/* Search Job Request */}
                              <div className="space-y-2 mb-6">
                                <label className="block text-sm font-medium text-gray-700">
                                  <Search className="w-4 h-4 inline mr-1" />
                                  Tìm kiếm yêu cầu tuyển dụng
                                </label>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Tên hoặc mã yêu cầu tuyển dụng..."
                                    value={jobRequestSearchTerm}
                                    onChange={(e) => setJobRequestSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                              </div>

                              {/* Status Filter Tabs */}
                              <div className="mb-4">
                                <div className="flex gap-2 border-b border-gray-200">
                                  <button
                                    onClick={() => setJobRequestStatusFilter("all")}
                                    className={`px-4 py-2 font-medium text-sm transition-all duration-300 border-b-2 ${
                                      jobRequestStatusFilter === "all"
                                        ? "border-blue-600 text-blue-600 bg-blue-50"
                                        : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                  >
                                    Tất cả
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                                      {jobRequests.length}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => setJobRequestStatusFilter("pending")}
                                    className={`px-4 py-2 font-medium text-sm transition-all duration-300 border-b-2 ${
                                      jobRequestStatusFilter === "pending"
                                        ? "border-orange-600 text-orange-600 bg-orange-50"
                                        : "border-transparent text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                                    }`}
                                  >
                                    Chờ duyệt
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-orange-200 text-orange-700">
                                      {jobRequests.filter(jr => jr.status === 0).length}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => setJobRequestStatusFilter("approved")}
                                    className={`px-4 py-2 font-medium text-sm transition-all duration-300 border-b-2 ${
                                      jobRequestStatusFilter === "approved"
                                        ? "border-green-600 text-green-600 bg-green-50"
                                        : "border-transparent text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                  >
                                    Đã duyệt
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-200 text-green-700">
                                      {jobRequests.filter(jr => jr.status === 1).length}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => setJobRequestStatusFilter("rejected")}
                                    className={`px-4 py-2 font-medium text-sm transition-all duration-300 border-b-2 ${
                                      jobRequestStatusFilter === "rejected"
                                        ? "border-red-600 text-red-600 bg-red-50"
                                        : "border-transparent text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    Bị từ chối
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-200 text-red-700">
                                      {jobRequests.filter(jr => jr.status === 3).length}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => setJobRequestStatusFilter("closed")}
                                    className={`px-4 py-2 font-medium text-sm transition-all duration-300 border-b-2 ${
                                      jobRequestStatusFilter === "closed"
                                        ? "border-gray-600 text-gray-600 bg-gray-50"
                                        : "border-transparent text-gray-600 hover:text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    Đã đóng
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                                      {jobRequests.filter(jr => jr.status === 2).length}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Job Request List */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Danh sách yêu cầu tuyển dụng
                                  </label>
                                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {filteredJobRequests.length} / {jobRequests.length}
                                  </span>
                                </div>
                                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                  {filteredJobRequests.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                      <p className="text-sm">Không tìm thấy yêu cầu tuyển dụng nào</p>
                                      <p className="text-xs mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {filteredJobRequests.map((jobRequest) => {
                                        const isSelected = selectedJobRequestId === jobRequest.id;

                                        return (
                                          <button
                                            key={jobRequest.id}
                                            type="button"
                                            onClick={() => {
                                              setSelectedJobRequestId(jobRequest.id);
                                              setIsJobRequestPopupOpen(false);
                                            }}
                                            className={`w-full p-5 text-left cursor-pointer border border-gray-200 rounded-xl transition-all duration-200 ${
                                              isSelected
                                                ? "bg-green-50 border-green-500 shadow-sm ring-1 ring-green-100"
                                                : "hover:bg-green-50 hover:border-green-300 hover:shadow-sm"
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                      {jobRequest.title}
                                                    </p>
                                                    {isSelected && (
                                                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                    )}
                                                  </div>
                                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    jobRequest.status === 0 ? "bg-yellow-100 text-yellow-800" :
                                                    jobRequest.status === 1 ? "bg-green-100 text-green-800" :
                                                    jobRequest.status === 2 ? "bg-blue-100 text-blue-800" :
                                                    jobRequest.status === 3 ? "bg-red-100 text-red-800" :
                                                    "bg-gray-100 text-gray-800"
                                                  }`}>
                                                    {jobRequest.status === 0 ? "Nháp" :
                                                     jobRequest.status === 1 ? "Đã duyệt" :
                                                     jobRequest.status === 2 ? "Đã đóng" :
                                                     jobRequest.status === 3 ? "Đã hủy" : "Không xác định"}
                                                  </span>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                  <p className="text-sm text-gray-600 truncate">
                                                    Mã: {jobRequest.code}
                                                  </p>
                                                  {jobRequest.ownerName ? (
                                                    <div className="mt-2 flex items-center gap-1">
                                                      <p className="text-xs text-green-600 font-medium">
                                                        Sales: {jobRequest.ownerName}
                                                      </p>
                                                    </div>
                                                  ) : (
                                                    <p className="text-xs text-gray-400 mt-2">
                                                      Chưa có Sales quản lý
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                          </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsJobRequestPopupOpen(false)}
                              >
                                Đóng
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Talent Application Transfer Tab */}
                  {activeTab === "talentapplication" && (
                    <>
                      {/* Layout 2 cột: Bên trái - Chọn Talent Applications, Bên phải - Form */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cột trái: Chọn Talent Applications */}
                        <div className="space-y-4">
                          <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <FileUser className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                  Chọn hồ sơ ứng tuyển
                                </h2>
                                <p className="text-sm text-gray-500">
                                  Chọn hồ sơ ứng tuyển để bàn giao quản lý
                                </p>
                              </div>
                            </div>

                            {/* Talent Application Selection Button */}
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setTempSelectedTalentApplicationIds([...selectedTalentApplicationIds]);
                                  setIsTalentApplicationPopupOpen(true);
                                }}
                                className={`w-full p-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
                                  selectedTalentApplicationIds.length > 0
                                    ? "border-purple-300 bg-purple-50 hover:bg-purple-100"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-3">
                                  {selectedTalentApplicationIds.length > 0 ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                        <div className="text-left">
                                          <p className="font-medium text-gray-900">
                                            Đã chọn {selectedTalentApplicationIds.length} hồ sơ ứng tuyển
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            Click để thay đổi
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <FileUser className="w-6 h-6 text-gray-400" />
                                      <div className="text-center">
                                        <p className="font-medium text-gray-700">
                                          Chọn hồ sơ ứng tuyển
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Click để mở danh sách
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </button>

                              {/* Selected Talent Applications Info */}
                              {selectedTalentApplicationIds.length > 0 && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-xs text-purple-700 font-medium mb-1">
                                        Hồ sơ ứng tuyển đã chọn
                                      </p>
                                      <p className="font-medium text-purple-900">
                                        {selectedTalentApplicationIds.length} hồ sơ ứng tuyển
                                      </p>
                                      <p className="text-sm text-purple-700 mt-1">
                                        ID: {selectedTalentApplicationIds.join(', ')}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTalentApplicationIds([])}
                                      className="text-purple-600 hover:text-purple-800 p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Note - Only show when talent applications are selected */}
                          {selectedTalentApplicationIds.length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={applicationTransferReason}
                                onChange={(e) => setApplicationTransferReason(e.target.value)}
                              rows={4}
                                placeholder="Nhập lý do bàn giao (ví dụ: TA hiện tại nghỉ việc, tái phân công công việc...)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Cột phải: Form bàn giao */}
                        <div className="space-y-6">
                          {selectedTalentApplicationIds.length > 0 ? (
                            <>
                              {/* Preview Section */}
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileUser className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Xem trước bàn giao
                                  </h3>
                                </div>

                                {/* Transfer Summary */}
                                <div className="mb-4 p-3 bg-white rounded-lg border border-purple-100">
                                  <p className="text-xs text-gray-500 mb-1">Số hồ sơ được bàn giao</p>
                                  <p className="font-semibold text-gray-900">{selectedTalentApplicationIds.length} hồ sơ ứng tuyển</p>
                                </div>

                                {/* Transfer Flow */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    {/* From */}
                                    <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-500 mb-2">Từ TA hiện tại</p>
                                      <p className="font-medium text-gray-400 text-sm">Nhiều TA khác nhau</p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight className="w-6 h-6 text-purple-500 flex-shrink-0" />

                                    {/* To */}
                                    <div className="flex-1 p-4 bg-purple-100 rounded-lg border-2 border-purple-300">
                                      <p className="text-xs text-purple-700 mb-2 font-medium">Đến TA mới</p>
                                      {applicationTransferToUserId ? (() => {
                                        const selectedUser = taStaff.find(u => u.id === applicationTransferToUserId);
                                        return selectedUser ? (
                                          <>
                                            <p className="font-semibold text-purple-900">{selectedUser.fullName}</p>
                                            <p className="text-xs text-purple-700 mt-1">{selectedUser.email}</p>
                                          </>
                                        ) : null;
                                      })() : (
                                        <p className="text-sm text-purple-600 font-medium">Chọn TA bên dưới</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* TA Selection */}
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Chọn TA nhận quyền quản lý <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 z-10" />
                                  <button
                                    type="button"
                                    onClick={() => setIsApplicationTaDropdownOpen(!isApplicationTaDropdownOpen)}
                                    className="w-full flex items-center justify-between pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg bg-white text-left hover:border-purple-300 transition-colors"
                                  >
                                    <span className="text-sm text-gray-700">{getApplicationTaDisplayText()}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isApplicationTaDropdownOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {isApplicationTaDropdownOpen && (
                                    <div
                                      className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg"
                                      onMouseLeave={() => {
                                        setIsApplicationTaDropdownOpen(false);
                                        setApplicationTaSearch("");
                                      }}
                                    >
                                      <div className="p-3 border-b border-gray-100">
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                          <input
                                            type="text"
                                            value={applicationTaSearch}
                                            onChange={(e) => setApplicationTaSearch(e.target.value)}
                                            placeholder="Tìm tên hoặc email..."
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-56 overflow-y-auto">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setApplicationTransferToUserId("");
                                            setIsApplicationTaDropdownOpen(false);
                                            setApplicationTaSearch("");
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            !applicationTransferToUserId
                                              ? 'bg-purple-50 text-purple-700'
                                              : 'hover:bg-gray-50 text-gray-700'
                                          }`}
                                        >
                                          Chọn TA
                                        </button>
                                        {taStaff
                                          .filter((ta) =>
                                            !applicationTaSearch ||
                                            ta.fullName.toLowerCase().includes(applicationTaSearch.toLowerCase()) ||
                                            ta.email.toLowerCase().includes(applicationTaSearch.toLowerCase())
                                          )
                                          .map((ta) => (
                                            <button
                                              key={ta.id}
                                              type="button"
                                              onClick={() => {
                                                setApplicationTransferToUserId(ta.id);
                                                setIsApplicationTaDropdownOpen(false);
                                                setApplicationTaSearch("");
                                              }}
                                              className={`w-full text-left px-4 py-2.5 text-sm ${
                                                applicationTransferToUserId === ta.id
                                                  ? 'bg-purple-50 text-purple-700'
                                                  : 'hover:bg-gray-50 text-gray-700'
                                              }`}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{ta.fullName}</span>
                                                <span className="text-xs text-gray-500">{ta.email}</span>
                                              </div>
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Có {taStaff.length} TA khả dụng
                                </p>
                          </div>
                        </>
                      ) : (
                            /* Empty State khi chưa chọn talent applications */
                        <div className="flex flex-col items-center justify-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <FileUser className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">
                                Chọn hồ sơ ứng tuyển để bắt đầu
                          </p>
                          <p className="text-sm text-gray-500 text-center max-w-sm">
                                Vui lòng chọn ít nhất một hồ sơ ứng tuyển từ danh sách bên trái để bắt đầu quá trình bàn giao quản lý
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                      {/* Talent Application Selection Popup */}
                      {isTalentApplicationPopupOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in overflow-hidden border border-neutral-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-purple-50 flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="text-base font-semibold text-neutral-900">Chọn hồ sơ ứng tuyển</h3>
                                <p className="text-sm text-gray-500 mt-1">Chọn các hồ sơ ứng tuyển cần bàn giao quản lý</p>
                      </div>
                              <button type="button" onClick={() => {
                                setTempSelectedTalentApplicationIds([...selectedTalentApplicationIds]);
                                setIsTalentApplicationPopupOpen(false);
                              }} className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 hover:bg-neutral-100" aria-label="Đóng" title="Đóng">
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Filter by Job Request */}
                            <div className="px-6 py-4 border-b border-gray-200">
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  <Filter className="w-4 h-4 inline mr-1" />
                                  Lọc theo yêu cầu tuyển dụng (đã duyệt)
                                </label>

                                {/* Dropdown Button */}
                                <div className="relative">
                                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <button
                        type="button"
                                    onClick={() => setIsJobRequestDropdownOpen(!isJobRequestDropdownOpen)}
                                    className="w-full flex items-center justify-between pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-left hover:border-purple-300 transition-colors text-sm"
                      >
                                    <span className="text-gray-700">{getJobRequestDisplayText()}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isJobRequestDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                                  {/* Dropdown Popup */}
                                  {isJobRequestDropdownOpen && (
                                    <div
                                      className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
                                      onMouseLeave={() => {
                                        setIsJobRequestDropdownOpen(false);
                                        setJobRequestFilterSearch("");
                                      }}
                                    >
                                      {/* Search */}
                                      <div className="p-3 border-b border-gray-100">
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                          <input
                                            type="text"
                                            value={jobRequestFilterSearch}
                                            onChange={(e) => setJobRequestFilterSearch(e.target.value)}
                                            placeholder="Tìm yêu cầu tuyển dụng..."
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Options */}
                                      <div className="max-h-56 overflow-y-auto">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedJobRequestFilter("");
                                            setIsJobRequestDropdownOpen(false);
                                            setJobRequestFilterSearch("");
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm ${
                                            !selectedJobRequestFilter
                                              ? 'bg-purple-50 text-purple-700'
                                              : 'hover:bg-gray-50 text-gray-700'
                                          }`}
                                        >
                                          Tất cả yêu cầu tuyển dụng
                                        </button>

                                        {filteredJobRequestsForDropdown.map((jobRequest) => (
                                          <button
                                            key={jobRequest.id}
                                            type="button"
                                            onClick={() => {
                                              setSelectedJobRequestFilter(jobRequest.id.toString());
                                              setIsJobRequestDropdownOpen(false);
                                              setJobRequestFilterSearch("");
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                              selectedJobRequestFilter === jobRequest.id.toString()
                                                ? 'bg-purple-50 text-purple-700'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                          >
                                            <div>
                                              <div className="font-medium">{jobRequest.title}</div>
                                              <div className="text-xs text-gray-500">#{jobRequest.code}</div>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                    </div>
                  )}
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="max-h-96 overflow-y-auto">
                              {filteredTalentApplications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                  <p className="text-sm">Không tìm thấy hồ sơ ứng tuyển nào</p>
                                  <p className="text-xs mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-200">
                                  {filteredTalentApplications.map((application) => {
                                    const isSelected = selectedTalentApplicationIds.includes(application.id);

                                    return (
                                      <div
                                        key={application.id}
                                        className={`p-4 hover:bg-gray-50 ${
                                          isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="checkbox"
                                              checked={tempSelectedTalentApplicationIds.includes(application.id)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setTempSelectedTalentApplicationIds(prev => [...prev, application.id]);
                                                } else {
                                                  setTempSelectedTalentApplicationIds(prev => prev.filter(id => id !== application.id));
                                                }
                                              }}
                                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <div>
                                              <p className="font-medium text-gray-900">
                                                Hồ sơ #{application.id}
                                              </p>
                                              <p className="text-sm text-gray-500">
                                                Job Request: {jobRequestNames[application.jobRequestId] || `Job Request ${application.jobRequestId}`} | CV: {cvJobRoleNames[application.cvId] || `CV ${application.cvId}`}
                                              </p>
                                              <p className="text-xs text-gray-400 mt-1">
                                                Trạng thái: {getTalentApplicationStatusText(application.status)} | {new Date(application.createdAt).toLocaleDateString('vi-VN')}
                                              </p>
                                              {application.submittedBy && (
                                                <p className="text-xs text-purple-600 mt-1">
                                                  Người nộp: {submittedByNames[application.submittedBy] || application.submittedBy}
                                                </p>
                                              )}
                      </div>
                                          </div>
                                          {isSelected && (
                                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                              <Button
                        type="button"
                                variant="outline"
                                onClick={() => {
                                  setTempSelectedTalentApplicationIds([...selectedTalentApplicationIds]);
                                  setIsTalentApplicationPopupOpen(false);
                                }}
                              >
                                Đóng
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  setSelectedTalentApplicationIds([...tempSelectedTalentApplicationIds]);
                                  setIsTalentApplicationPopupOpen(false);
                                }}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Xác nhận ({tempSelectedTalentApplicationIds.length})
                              </Button>
                            </div>
                          </div>
                    </div>
                  )}

                      {/* Transfer Button - Hiển thị khi đã chọn talent applications */}
                      {selectedTalentApplicationIds.length > 0 && (
                  <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                            className="px-8 py-3"
                      onClick={() => {
                              setSelectedTalentApplicationIds([]);
                              setApplicationTransferToUserId("");
                              setApplicationTransferReason("");
                            }}
                            disabled={applicationTransferLoading}
                    >
                      Hủy
                    </Button>
                    <Button
                            type="button"
                      variant="primary"
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700"
                            onClick={handleTalentApplicationTransfer}
                            disabled={applicationTransferLoading}
                    >
                            {applicationTransferLoading ? (
                        <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                              <>
                                Bàn giao
                              </>
                      )}
                    </Button>
                  </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

