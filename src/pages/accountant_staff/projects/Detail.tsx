import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/accountant";
import { projectService, type ProjectDetailedModel } from "../../../services/Project";
import { clientCompanyService, type ClientCompany } from "../../../services/ClientCompany";
import { projectPeriodService, type ProjectPeriodModel, type ProjectPeriodCreateModel } from "../../../services/ProjectPeriod";
import { talentAssignmentService, type TalentAssignmentModel } from "../../../services/TalentAssignment";
import { talentService, type Talent, type CreateDeveloperAccountModel } from "../../../services/Talent";
import { partnerService, type Partner } from "../../../services/Partner";
import { useTalents } from "../../../hooks/useTalents";
import { formatNumberInput } from "../../../utils/formatters";
import { clientContractPaymentService, type ClientContractPaymentModel } from "../../../services/ClientContractPayment";
import { partnerContractPaymentService, type PartnerContractPaymentModel } from "../../../services/PartnerContractPayment";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Layers,
  Building2,
  FileCheck,
  Clock,
  FileText,
  CalendarDays,
  Globe2,
  Factory,
  ChevronDown,
  ChevronUp,
  Hash,
  UserCheck,
  ExternalLink,
  Download,
  User,
  UserPlus,
  MapPin,
  Mail,
  Phone
} from "lucide-react";

export default function AccountantProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createDeveloperAccount } = useTalents();
  const [project, setProject] = useState<ProjectDetailedModel | null>(null);
  const [company, setCompany] = useState<ClientCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showIndustryInfo, setShowIndustryInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('info');
  
  // ProjectPeriod states
  const [projectPeriods, setProjectPeriods] = useState<ProjectPeriodModel[]>([]);
  const [filteredPeriods, setFilteredPeriods] = useState<ProjectPeriodModel[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [showClosedPeriods, setShowClosedPeriods] = useState<boolean>(false);
  const [previewPeriods, setPreviewPeriods] = useState<Array<{ month: number; year: number }>>([]);

  // Contract Payments states
  const [clientContractPayments, setClientContractPayments] = useState<ClientContractPaymentModel[]>([]);
  const [partnerContractPayments, setPartnerContractPayments] = useState<PartnerContractPaymentModel[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [talentNamesMap, setTalentNamesMap] = useState<Record<number, string>>({});

  // Talent Assignment states (read-only)
  const [talentAssignments, setTalentAssignments] = useState<TalentAssignmentModel[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showDetailAssignmentModal, setShowDetailAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TalentAssignmentModel | null>(null);
  const [isProcessingAccountCreation, setIsProcessingAccountCreation] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [selectedTalentForAccount, setSelectedTalentForAccount] = useState<Talent | null>(null);
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  // ========== Email validation ==========
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setAccountEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Email không hợp lệ");
    } else {
      setEmailError("");
    }
  };

  // ========== Handle create developer account ==========
  const handleCreateAccountWithEmailUpdate = async () => {
    if (!selectedTalentForAccount) return;

    const talent = selectedTalentForAccount;
    if (!accountEmail.trim()) {
      alert("Email không được để trống");
      return;
    }

    if (!validateEmail(accountEmail)) {
      alert("Email không hợp lệ. Vui lòng nhập email đúng định dạng.");
      return;
    }

    const confirmCreate = window.confirm(
      `Bạn có chắc muốn cấp tài khoản cho ${talent.fullName}?\n\nEmail: ${accountEmail}\nMật khẩu sẽ được gửi qua email.`
    );

    if (!confirmCreate) return;

    setIsProcessingAccountCreation(true);
    try {
      // 1. Cập nhật email của partner nếu email thay đổi
      if (accountEmail !== talent.email) {
        const partner = partners.find(p => p.id === talent.currentPartnerId);
        if (partner) {
          await partnerService.update(partner.id, {
            ...partner,
            email: accountEmail
          });
          console.log(`✅ Đã cập nhật email của partner ${partner.companyName} thành ${accountEmail}`);
        }
      }

      // 2. Tạo tài khoản developer
      const payload: CreateDeveloperAccountModel = { email: accountEmail };
      const success = await createDeveloperAccount(talent.id, payload);

      if (success) {
        // Cập nhật state talents để reflect tài khoản mới được tạo
        setTalents(prevTalents =>
          prevTalents.map(t =>
            t.id === talent.id ? { ...t, userId: "new_user_id" } : t
          )
        );

        alert(`Đã cấp tài khoản thành công cho ${talent.fullName}.\nEmail: ${accountEmail}\nMật khẩu đã được gửi qua email.`);
        setShowCreateAccountModal(false);
        setSelectedTalentForAccount(null);
        setAccountEmail("");
      } else {
        alert("Không thể cấp tài khoản. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi cấp tài khoản:", err);
      const errorMessage = err?.message || err?.response?.data?.message || "Không thể cấp tài khoản. Vui lòng thử lại.";
      alert(errorMessage);
    } finally {
      setIsProcessingAccountCreation(false);
    }
  };
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [assignmentPage, setAssignmentPage] = useState(1);

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
      if (!id) return;
      try {
        setLoading(true);
        // Reset states khi chuyển dự án
        setProjectPeriods([]);
        setFilteredPeriods([]);
        setSelectedPeriodId(null);
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        
        const projectId = Number(id);
        const [projectData, periodsData] = await Promise.all([
          projectService.getDetailedById(projectId),
          projectPeriodService.getAll({ projectId, excludeDeleted: true }),
        ]);

        setProject(projectData);
        
        // Fetch client company if available
        if (projectData?.clientCompanyId) {
          try {
            const companyData = await clientCompanyService.getById(projectData.clientCompanyId);
            setCompany(companyData);
          } catch (err) {
            console.error("❌ Lỗi tải thông tin công ty:", err);
          }
        }

        // Fetch talent assignments for this project
        try {
          const assignments = await talentAssignmentService.getAll({ projectId: projectId });
          const filteredAssignments = assignments.filter(a => a.projectId === projectId);
          setTalentAssignments(filteredAssignments);
        } catch (err) {
          console.error("❌ Lỗi tải danh sách phân công nhân sự:", err);
        }

        // Fetch talents and partners for display
        try {
          const [allTalentsData, allPartnersData] = await Promise.all([
            talentService.getAll({ excludeDeleted: true }),
            partnerService.getAll()
          ]);
          const allTalents = ensureArray<Talent>(allTalentsData);
          const allPartners = ensureArray<Partner>(allPartnersData);
          setTalents(allTalents);
          setPartners(allPartners);
        } catch (err) {
          console.error("❌ Lỗi tải danh sách talents/partners:", err);
          // Set empty arrays on error to prevent find() errors
          setTalents([]);
          setPartners([]);
        }
        
        // Filter client-side để đảm bảo chỉ lấy periods của dự án này
        const filteredByProject = periodsData.filter(p => p.projectId === projectId);
        
        const sortedPeriods = [...filteredByProject].sort((a, b) => {
          if (a.periodYear !== b.periodYear) {
            return a.periodYear - b.periodYear; // Năm tăng dần
          }
          return a.periodMonth - b.periodMonth; // Tháng tăng dần
        });
        setProjectPeriods(sortedPeriods);
        setFilteredPeriods(sortedPeriods);

        // Tự động chọn chu kỳ của tháng hiện tại, nếu không có thì chọn chu kỳ mới nhất
        if (sortedPeriods.length > 0) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // getMonth() trả về 0-11, cần +1 để có 1-12
          const currentYear = now.getFullYear();
          
          // Tìm chu kỳ của tháng hiện tại
          const currentPeriod = sortedPeriods.find(
            p => p.periodMonth === currentMonth && p.periodYear === currentYear
          );
          
          if (currentPeriod) {
            setSelectedPeriodId(currentPeriod.id);
          } else {
            // Fallback về chu kỳ mới nhất nếu không tìm thấy chu kỳ tháng hiện tại
            setSelectedPeriodId(sortedPeriods[sortedPeriods.length - 1].id);
          }
        }

      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu dự án:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);


  // Filter periods by year and status
  useEffect(() => {
    let filtered = projectPeriods;
    
    // Filter by year
    if (yearFilter !== null) {
      filtered = filtered.filter(p => p.periodYear === yearFilter);
    }
    
    // Filter by status (hide closed periods by default)
    if (!showClosedPeriods) {
      filtered = filtered.filter(p => p.status !== "Closed");
    }
    
    setFilteredPeriods(filtered);
  }, [yearFilter, projectPeriods, showClosedPeriods]);

  // Reset selected period if it's not in filtered list
  useEffect(() => {
    if (selectedPeriodId && !filteredPeriods.find(p => p.id === selectedPeriodId)) {
      if (filteredPeriods.length > 0) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentPeriod = filteredPeriods.find(
          p => p.periodMonth === currentMonth && p.periodYear === currentYear
        );
        setSelectedPeriodId(currentPeriod ? currentPeriod.id : filteredPeriods[filteredPeriods.length - 1].id);
      } else {
        setSelectedPeriodId(null);
      }
    }
  }, [filteredPeriods, selectedPeriodId]);

  // Fetch contract payments when a period is selected
  useEffect(() => {
    const fetchContractPayments = async () => {
      if (!selectedPeriodId || !id) {
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        return;
      }

      // Đảm bảo period được chọn thuộc về dự án hiện tại
      const selectedPeriod = projectPeriods.find(p => p.id === selectedPeriodId);
      if (!selectedPeriod || selectedPeriod.projectId !== Number(id)) {
        setClientContractPayments([]);
        setPartnerContractPayments([]);
        return;
      }

      try {
        setLoadingPayments(true);
        const [clientPayments, partnerPayments] = await Promise.all([
          clientContractPaymentService.getAll({ 
            projectPeriodId: selectedPeriodId, 
            excludeDeleted: true 
          }),
          partnerContractPaymentService.getAll({ 
            projectPeriodId: selectedPeriodId, 
            excludeDeleted: true 
          })
        ]);

        // Đảm bảo chỉ lấy payments của period này (double-check)
        const filteredClientPayments = Array.isArray(clientPayments) 
          ? clientPayments.filter(p => p.projectPeriodId === selectedPeriodId)
          : [];
        const filteredPartnerPayments = Array.isArray(partnerPayments) 
          ? partnerPayments.filter(p => p.projectPeriodId === selectedPeriodId)
          : [];

        setClientContractPayments(filteredClientPayments);
        setPartnerContractPayments(filteredPartnerPayments);

        // Fetch talent names for all unique talentAssignmentIds
        const allTalentAssignmentIds = [
          ...new Set([
            ...filteredClientPayments.map(p => p.talentAssignmentId),
            ...filteredPartnerPayments.map(p => p.talentAssignmentId)
          ])
        ];

        if (allTalentAssignmentIds.length > 0) {
          const assignments = await Promise.all(
            allTalentAssignmentIds.map(id => 
              talentAssignmentService.getById(id).catch(() => null)
            )
          );

          const talentIds = assignments
            .filter((a): a is TalentAssignmentModel => a !== null)
            .map(a => a.talentId);

          if (talentIds.length > 0) {
            const talents = await Promise.all(
              talentIds.map(id => 
                talentService.getById(id).catch(() => null)
              )
            );

            const newTalentNamesMap: Record<number, string> = {};
            assignments.forEach((assignment) => {
              if (assignment) {
                const talent = talents.find(t => t && t.id === assignment.talentId);
                if (talent) {
                  newTalentNamesMap[assignment.id] = talent.fullName || "—";
                }
              }
            });

            setTalentNamesMap(prev => ({ ...prev, ...newTalentNamesMap }));
          }
        }
      } catch (err) {
        console.error("❌ Lỗi tải hợp đồng thanh toán:", err);
        setClientContractPayments([]);
        setPartnerContractPayments([]);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchContractPayments();
  }, [selectedPeriodId, id, projectPeriods]);


  // Tính toán các tháng cần tạo dựa trên TalentAssignment Active
  const calculatePeriodsToCreate = async () => {
    if (!id) return [];

    try {
      // Lấy tất cả TalentAssignment có Status = "Active"
      const assignments = await talentAssignmentService.getAll({
        projectId: Number(id),
        status: "Active",
        excludeDeleted: true,
      });

      // Filter client-side để đảm bảo chỉ lấy assignments của dự án này
      const filteredAssignments = assignments.filter(a => a.projectId === Number(id));

      if (filteredAssignments.length === 0) {
        return [];
      }

      // Tập hợp các tháng cần tạo (dạng "YYYY-MM")
      const periodsSet = new Set<string>();

      // Removed unused variables

      filteredAssignments.forEach((assignment: { startDate: string; endDate?: string | null }) => {
        if (!assignment.startDate) return;

        const startDate = new Date(assignment.startDate);
        const endDate = assignment.endDate ? new Date(assignment.endDate) : null;

        // Nếu endDate là null, không tạo chu kỳ (cần có endDate để biết phạm vi)
        if (!endDate) return;

        // Duyệt qua tất cả các tháng từ startDate đến endDate
        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        while (currentDate <= finalDate) {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;
          
          // Chỉ thêm các tháng trong khoảng thời gian của assignment
          periodsSet.add(`${year}-${month}`);
          
          // Chuyển sang tháng tiếp theo
          currentDate = new Date(year, month, 1);
        }
      });

      // Chuyển đổi Set thành mảng và sắp xếp
      const periods = Array.from(periodsSet)
        .map(key => {
          const [year, month] = key.split('-').map(Number);
          return { month, year };
        })
        .sort((a, b) => {
          if (a.year !== b.year) {
            return a.year - b.year;
          }
          return a.month - b.month;
        });

      return periods;
    } catch (err) {
      console.error("❌ Lỗi tính toán chu kỳ:", err);
      return [];
    }
  };

  const handleCreatePeriod = async () => {
    if (!id || !project) return;

    try {
      setCreatingPeriod(true);

      // Bước 1: Kiểm tra và tạo contract payments cho các talent assignment còn thiếu trong các chu kỳ đã tồn tại
      try {
        // Lấy tất cả project periods đang mở
        const allPeriods = await projectPeriodService.getAll({
          projectId: Number(id),
          excludeDeleted: true,
        });
        const openPeriods = allPeriods.filter(p => p.projectId === Number(id) && (p.status === "Open" || p.status === "Processing"));

        if (openPeriods.length > 0) {
          // Lấy tất cả talent assignments active
          const assignments = await talentAssignmentService.getAll({
            projectId: Number(id),
            status: "Active",
            excludeDeleted: true,
          });
          
          // Filter client-side để đảm bảo chỉ lấy assignments của dự án này
          const filteredAssignments = assignments.filter(a => a.projectId === Number(id));
          
          // Lấy project startDate và endDate để validate contract dates
          const projectStartDate = project.startDate ? new Date(project.startDate) : null;
          const projectEndDate = project.endDate ? new Date(project.endDate) : null;

          let createdPaymentsCount = 0;

          // Với mỗi period, kiểm tra và tạo contract payments cho các talent assignments overlap
          for (const period of openPeriods) {
            // Tìm các talent assignments overlap với period này
            const periodStart = new Date(period.periodYear, period.periodMonth - 1, 1);
            const periodEnd = new Date(period.periodYear, period.periodMonth, 0, 23, 59, 59, 999);

            const overlappingAssignments = filteredAssignments.filter(assignment => {
              if (!assignment.startDate) return false;
              const assignmentStartDate = new Date(assignment.startDate);
              const assignmentEndDate = assignment.endDate ? new Date(assignment.endDate) : null;

              if (assignmentEndDate) {
                return assignmentStartDate <= periodEnd && assignmentEndDate >= periodStart;
              } else {
                return assignmentStartDate >= periodStart && assignmentStartDate <= periodEnd;
              }
            });

            // Kiểm tra contract payments cho mỗi talent assignment
            for (const assignment of overlappingAssignments) {
              try {
                // Kiểm tra xem đã có contract payments chưa
                const [existingClientPayments, existingPartnerPayments] = await Promise.all([
                  clientContractPaymentService.getAll({
                    projectPeriodId: period.id,
                    talentAssignmentId: assignment.id,
                    excludeDeleted: true,
                  }),
                  partnerContractPaymentService.getAll({
                    projectPeriodId: period.id,
                    talentAssignmentId: assignment.id,
                    excludeDeleted: true,
                  }),
                ]);

                // Nếu chưa có contract payments, tạo mới với các giá trị mặc định
                const hasClientPayment = existingClientPayments && existingClientPayments.length > 0;
                const hasPartnerPayment = existingPartnerPayments && existingPartnerPayments.length > 0;

                if (!hasClientPayment || !hasPartnerPayment) {
                  // Tạo contract number dựa trên period và assignment
                  const contractNumberSuffix = `${period.periodYear}${String(period.periodMonth).padStart(2, '0')}`;
                  
                  // Lấy thông tin từ assignment để tạo contract payments
                  if (!assignment.startDate) {
                    console.warn(`⚠️ Talent assignment ${assignment.id} không có startDate, bỏ qua`);
                    continue;
                  }
                  
                  const assignmentStartDate = new Date(assignment.startDate);
                  const assignmentEndDate = assignment.endDate ? new Date(assignment.endDate) : null;
                  
                  // Validate dates
                  if (isNaN(assignmentStartDate.getTime())) {
                    console.warn(`⚠️ Talent assignment ${assignment.id} có startDate không hợp lệ, bỏ qua`);
                    continue;
                  }
                  
                  if (assignmentEndDate && isNaN(assignmentEndDate.getTime())) {
                    console.warn(`⚠️ Talent assignment ${assignment.id} có endDate không hợp lệ, bỏ qua`);
                    continue;
                  }
                  
                  // Tính contract dates (overlap giữa period và assignment, và phải nằm trong project dates)
                  let contractStartDate: Date;
                  let contractEndDate: Date;
                  
                  // Contract start date: max của period start, assignment start, và project start
                  const startDates = [
                    periodStart.getTime(),
                    assignmentStartDate.getTime()
                  ];
                  if (projectStartDate) {
                    startDates.push(projectStartDate.getTime());
                  }
                  contractStartDate = new Date(Math.max(...startDates));
                  
                  // Contract end date: min của period end, assignment end (nếu có), và project end (nếu có)
                  const endDates = [periodEnd.getTime()];
                  if (assignmentEndDate) {
                    endDates.push(assignmentEndDate.getTime());
                  }
                  if (projectEndDate) {
                    endDates.push(projectEndDate.getTime());
                  }
                  contractEndDate = new Date(Math.min(...endDates));
                  
                  // Validate: contractStartDate phải <= contractEndDate
                  if (contractStartDate > contractEndDate) {
                    console.warn(`⚠️ Contract dates không hợp lệ cho talent assignment ${assignment.id} trong period ${period.periodMonth}/${period.periodYear}, bỏ qua`);
                    continue;
                  }
                  
                  // Validate: contract dates phải hợp lệ và không phải Invalid Date
                  if (isNaN(contractStartDate.getTime()) || isNaN(contractEndDate.getTime())) {
                    console.warn(`⚠️ Contract dates không hợp lệ cho talent assignment ${assignment.id}, bỏ qua`);
                    continue;
                  }
                  
                  // Validate: contractStartDate phải >= project startDate (nếu có)
                  if (projectStartDate && contractStartDate < projectStartDate) {
                    contractStartDate = new Date(projectStartDate);
                  }
                  
                  // Validate: contractEndDate phải <= project endDate (nếu có)
                  if (projectEndDate && contractEndDate > projectEndDate) {
                    contractEndDate = new Date(projectEndDate);
                  }
                  
                  // Final validate: contractStartDate phải <= contractEndDate sau khi adjust
                  if (contractStartDate > contractEndDate) {
                    console.warn(`⚠️ Contract dates không hợp lệ sau khi adjust cho talent assignment ${assignment.id}, bỏ qua`);
                    continue;
                  }

                  // Tạo Client Contract Payment nếu chưa có
                  if (!hasClientPayment) {
                    try {
                      const clientContractNumber = `SOW-${contractNumberSuffix}-CLIENT-${String(assignment.id).padStart(3, '0')}`;
                      const clientPayload: any = {
                        projectPeriodId: period.id,
                        talentAssignmentId: assignment.id,
                        contractNumber: clientContractNumber,
                        unitPriceForeignCurrency: assignment.estimatedClientRate || 0,
                        currencyCode: assignment.currencyCode || "VND",
                        exchangeRate: 1,
                        calculationMethod: "Percentage",
                        percentageValue: 100, // Giá trị mặc định: 100% (full month)
                        fixedAmount: null,
                        standardHours: 160,
                        contractStartDate: contractStartDate.toISOString(),
                        contractEndDate: contractEndDate.toISOString(),
                        contractStatus: "Draft",
                        totalPaidAmount: 0,
                        paymentStatus: "Pending",
                        notes: null,
                      };
                      await clientContractPaymentService.create(clientPayload);
                      createdPaymentsCount++;
                      console.log(`✅ Đã tạo client contract payment cho talent assignment ${assignment.id} trong project period ${period.periodMonth}/${period.periodYear}`);
                    } catch (err) {
                      console.error(`❌ Lỗi khi tạo client contract payment cho talent assignment ${assignment.id}:`, err);
                    }
                  }

                  // Tạo Partner Contract Payment nếu chưa có
                  if (!hasPartnerPayment) {
                    try {
                      const partnerContractNumber = `SOW-${contractNumberSuffix}-PARTNER-${String(assignment.id).padStart(3, '0')}`;
                      const partnerPayload: any = {
                        projectPeriodId: period.id,
                        talentAssignmentId: assignment.id,
                        contractNumber: partnerContractNumber,
                        unitPriceForeignCurrency: assignment.estimatedPartnerRate || 0,
                        currencyCode: assignment.currencyCode || "VND",
                        exchangeRate: 1,
                        calculationMethod: "Percentage" as const,
                        percentageValue: 100, // Giá trị mặc định: 100% (full month)
                        fixedAmount: null,
                        standardHours: 160,
                        contractStartDate: contractStartDate.toISOString(),
                        contractEndDate: contractEndDate.toISOString(),
                        contractStatus: "Draft",
                        totalPaidAmount: 0,
                        paymentStatus: "Pending",
                        notes: null,
                      };
                      await partnerContractPaymentService.create(partnerPayload);
                      createdPaymentsCount++;
                      console.log(`✅ Đã tạo partner contract payment cho talent assignment ${assignment.id} trong project period ${period.periodMonth}/${period.periodYear}`);
                    } catch (err) {
                      console.error(`❌ Lỗi khi tạo partner contract payment cho talent assignment ${assignment.id}:`, err);
                    }
                  }
                }
              } catch (err) {
                console.error(`❌ Lỗi khi kiểm tra/tạo contract payments cho talent assignment ${assignment.id} trong project period ${period.id}:`, err);
                // Tiếp tục với các assignment khác
              }
            }
          }

          if (createdPaymentsCount > 0) {
            console.log(`✅ Đã tạo ${createdPaymentsCount} contract payment(s) cho các talent assignment còn thiếu trong các chu kỳ đã tồn tại.`);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi kiểm tra và tạo contract payments cho các chu kỳ đã tồn tại:", err);
        // Tiếp tục với việc tạo chu kỳ mới
      }

      // Lưu số lượng contract payments đã tạo để hiển thị thông báo
      let totalCreatedPayments = 0;
      try {
        // Lấy lại danh sách periods để đếm contract payments đã tạo
        const allPeriods = await projectPeriodService.getAll({
          projectId: Number(id),
          excludeDeleted: true,
        });
        const openPeriods = allPeriods.filter(p => p.projectId === Number(id) && (p.status === "Open" || p.status === "Processing"));

        if (openPeriods.length > 0) {
          const assignments = await talentAssignmentService.getAll({
            projectId: Number(id),
            status: "Active",
            excludeDeleted: true,
          });

          // Filter client-side để đảm bảo chỉ lấy assignments của dự án này
          const filteredAssignments = assignments.filter(a => a.projectId === Number(id));

          for (const period of openPeriods) {
            const periodStart = new Date(period.periodYear, period.periodMonth - 1, 1);
            const periodEnd = new Date(period.periodYear, period.periodMonth, 0, 23, 59, 59, 999);

            const overlappingAssignments = filteredAssignments.filter(assignment => {
              if (!assignment.startDate) return false;
              const assignmentStartDate = new Date(assignment.startDate);
              const assignmentEndDate = assignment.endDate ? new Date(assignment.endDate) : null;

              if (assignmentEndDate) {
                return assignmentStartDate <= periodEnd && assignmentEndDate >= periodStart;
              } else {
                return assignmentStartDate >= periodStart && assignmentStartDate <= periodEnd;
              }
            });

            for (const assignment of overlappingAssignments) {
              const [clientPayments, partnerPayments] = await Promise.all([
                clientContractPaymentService.getAll({
                  projectPeriodId: period.id,
                  talentAssignmentId: assignment.id,
                  excludeDeleted: true,
                }),
                partnerContractPaymentService.getAll({
                  projectPeriodId: period.id,
                  talentAssignmentId: assignment.id,
                  excludeDeleted: true,
                }),
              ]);

              if ((clientPayments && clientPayments.length > 0) || (partnerPayments && partnerPayments.length > 0)) {
                totalCreatedPayments++;
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi đếm contract payments:", err);
      }

      // Bước 2: Kiểm tra và tạo chu kỳ tháng hiện tại nếu chưa có
      // Lấy tháng hiện tại theo giờ Việt Nam
      const now = new Date();
      const vietnamTimeString = now.toLocaleString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [currentMonth, , currentYear] = vietnamTimeString.split('/').map(Number);
      const currentPeriod = { year: currentYear, month: currentMonth };

      // Refresh lại danh sách periods để đảm bảo có dữ liệu mới nhất
      const refreshedPeriods = await projectPeriodService.getAll({
        projectId: Number(id),
        excludeDeleted: true,
      });
      const filteredByProject = refreshedPeriods.filter(p => p.projectId === Number(id));
      const sortedPeriods = [...filteredByProject].sort((a, b) => {
        if (a.periodYear !== b.periodYear) {
          return a.periodYear - b.periodYear;
        }
        return a.periodMonth - b.periodMonth;
      });
      setProjectPeriods(sortedPeriods);
      setFilteredPeriods(sortedPeriods);

      // Kiểm tra xem đã có chu kỳ của tháng hiện tại chưa
      const currentPeriodKey = `${currentPeriod.year}-${currentPeriod.month}`;
      const existingPeriod = sortedPeriods.find(
        p => `${p.periodYear}-${p.periodMonth}` === currentPeriodKey
      );

      if (existingPeriod) {
        // Chu kỳ đã tồn tại, chỉ cần thông báo thành công (đã tạo contract payments ở bước 1)
        alert(`Chu kỳ thanh toán của tháng ${currentPeriod.month}/${currentPeriod.year} đã tồn tại.\n\nĐã kiểm tra và tạo hợp đồng cho các nhân sự tham gia còn thiếu trong chu kỳ này.`);
        setSelectedPeriodId(existingPeriod.id);
        setCreatingPeriod(false);
        return;
      }

      // Tính toán các chu kỳ cần tạo
      const periodsToCreate = await calculatePeriodsToCreate();

      if (periodsToCreate.length === 0) {
        alert("Không có chu kỳ thanh toán nào cần được tạo và không có hợp đồng nào mới cần tạo trong dự án này.\n\nLý do: Không có nhân sự tham gia nào đang hoạt động.");
        setCreatingPeriod(false);
        return;
      }

      // Lọc ra chu kỳ của tháng hiện tại (chỉ 1 chu kỳ)
      const newPeriods = periodsToCreate.filter(
        p => p.year === currentPeriod.year && p.month === currentPeriod.month
      );

      // Các chu kỳ không được phép tạo (ngoài tháng hiện tại)
      const disallowedPeriods = periodsToCreate.filter(
        p => !(p.year === currentPeriod.year && p.month === currentPeriod.month)
      );

      if (newPeriods.length === 0) {
        if (disallowedPeriods.length > 0) {
          alert(`Không thể tạo chu kỳ thanh toán. Backend chỉ cho phép tạo chu kỳ cho tháng hiện tại (${currentPeriod.month}/${currentPeriod.year}).\n\nCác chu kỳ không được phép tạo:\n${disallowedPeriods.map(p => `- ${p.month}/${p.year}`).join('\n')}`);
        } else {
          alert(`Không thể tạo chu kỳ thanh toán. Backend chỉ cho phép tạo chu kỳ cho tháng hiện tại (${currentPeriod.month}/${currentPeriod.year}).\n\nTháng hiện tại không nằm trong phạm vi của các nhân sự tham gia đang hoạt động.`);
        }
        setCreatingPeriod(false);
        return;
      }

      // Tạo chu kỳ mới (chỉ 1 chu kỳ của tháng hiện tại)
      const createdPeriods: ProjectPeriodModel[] = [];
      
      // Chỉ tạo chu kỳ đầu tiên (tháng hiện tại)
      const period = newPeriods[0];

      const payload: ProjectPeriodCreateModel = {
        projectId: Number(id),
        periodMonth: period.month,
        periodYear: period.year,
        status: "Open", // Default status
        autoCreatePayments: true, // Auto-create ClientContractPayment and PartnerContractPayment for active assignments
      };

      try {
        // Kiểm tra xem chu kỳ đã tồn tại chưa (double-check)
        const existingPeriod = projectPeriods.find(
          p => p.projectId === Number(id) && 
               p.periodMonth === period.month && 
               p.periodYear === period.year
        );
        
        if (existingPeriod) {
          alert(`Chu kỳ thanh toán của tháng ${period.month}/${period.year} đã tồn tại.\n\nBackend chỉ cho phép tạo 1 chu kỳ trong 1 tháng và chỉ có thể tạo chu kỳ của tháng hiện tại.`);
          setCreatingPeriod(false);
          return;
        }

        const newPeriod = await projectPeriodService.create(payload);
        createdPeriods.push(newPeriod);
        console.log(`✅ Tạo thành công chu kỳ ${period.month}/${period.year}`);
      } catch (err: unknown) {
        const error = err as { message?: string; errors?: Record<string, string[]>; innerException?: string };
        const errorMessage = error.message || error.errors ? JSON.stringify(error, null, 2) : String(err);
        console.error(`❌ Lỗi tạo chu kỳ ${period.month}/${period.year}:`, errorMessage);
        console.error("Payload gửi đi:", payload);
        
        // Kiểm tra xem có phải lỗi duplicate không
        if (errorMessage.includes("duplicate") || errorMessage.includes("already exists") || errorMessage.includes("unique constraint")) {
          alert(`Chu kỳ thanh toán của tháng ${period.month}/${period.year} đã tồn tại.\n\nBackend chỉ cho phép tạo 1 chu kỳ trong 1 tháng và chỉ có thể tạo chu kỳ của tháng hiện tại.`);
        } else {
          throw err; // Re-throw để xử lý ở catch bên ngoài
        }
      }

      // Refresh lại danh sách periods từ server để đảm bảo đồng bộ
      try {
        const refreshedPeriods = await projectPeriodService.getAll({
          projectId: Number(id),
          excludeDeleted: true,
        });
        
        // Filter client-side để đảm bảo chỉ lấy periods của dự án này
        const filteredByProject = refreshedPeriods.filter(p => p.projectId === Number(id));
        
        const sortedPeriods = [...filteredByProject].sort((a, b) => {
          if (a.periodYear !== b.periodYear) {
            return a.periodYear - b.periodYear; // Năm tăng dần
          }
          return a.periodMonth - b.periodMonth; // Tháng tăng dần
        });
        
        setProjectPeriods(sortedPeriods);
        setFilteredPeriods(sortedPeriods);
      } catch (refreshErr) {
        console.error("❌ Lỗi refresh danh sách periods:", refreshErr);
        // Nếu refresh thất bại, vẫn cập nhật với periods đã tạo thành công (chỉ của dự án này)
        if (createdPeriods.length > 0) {
          const updatedPeriods = [...projectPeriods.filter(p => p.projectId === Number(id)), ...createdPeriods].sort((a, b) => {
            if (a.periodYear !== b.periodYear) {
              return a.periodYear - b.periodYear;
            }
            return a.periodMonth - b.periodMonth;
          });
          setProjectPeriods(updatedPeriods);
          setFilteredPeriods(updatedPeriods);
        }
      }

      if (createdPeriods.length === 0) {
        alert(`Không thể tạo chu kỳ thanh toán. Có thể do:\n- Lỗi khi tạo các hợp đồng thanh toán tự động\n- Hoặc chu kỳ đã tồn tại trong database\n\nVui lòng kiểm tra console để biết chi tiết lỗi hoặc liên hệ quản trị viên.`);
        setCreatingPeriod(false);
        return;
      }

      // Tự động chọn chu kỳ mới được tạo
      if (createdPeriods.length > 0) {
        const newPeriod = createdPeriods[0];
        setSelectedPeriodId(newPeriod.id);
        
        // Hiển thị thông báo thành công
        alert(`Tạo thành công chu kỳ thanh toán tháng ${newPeriod.periodMonth}/${newPeriod.periodYear}!\n\nHệ thống đã tự động tạo các hợp đồng cho các nhân sự tham gia đang hoạt động trong chu kỳ này.`);
      }
    } catch (err: unknown) {
      console.error("❌ Lỗi tạo chu kỳ thanh toán:", err);
      const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : "Không thể tạo chu kỳ thanh toán";
      alert(errorMessage);
    } finally {
      setCreatingPeriod(false);
    }
  };

  const handlePreviewPeriods = async () => {
    if (!id) return;

    // Lấy tháng hiện tại theo giờ Việt Nam
    const now = new Date();
    const vietnamTimeString = now.toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [currentMonth, , currentYear] = vietnamTimeString.split('/').map(Number);
    const currentPeriod = { year: currentYear, month: currentMonth };

    // Tính toán các chu kỳ cần tạo
    const periodsToCreate = await calculatePeriodsToCreate();

    if (periodsToCreate.length === 0) {
      alert("Không có chu kỳ thanh toán nào cần được tạo.\n\nLý do: Không có TalentAssignment nào có Status = 'Active' hoặc các TalentAssignment không có endDate.");
      setPreviewPeriods([]);
      return;
    }

    // Lấy danh sách các chu kỳ đã tồn tại
    const existingPeriods = projectPeriods.map(p => `${p.periodYear}-${p.periodMonth}`);
    
    // Kiểm tra xem đã có chu kỳ của tháng hiện tại chưa
    const currentPeriodKey = `${currentPeriod.year}-${currentPeriod.month}`;
    if (existingPeriods.includes(currentPeriodKey)) {
      alert(`Chu kỳ thanh toán của tháng ${currentPeriod.month}/${currentPeriod.year} đã tồn tại.\n\nBackend chỉ cho phép tạo 1 chu kỳ trong 1 tháng và chỉ có thể tạo chu kỳ của tháng hiện tại.`);
      setPreviewPeriods([]);
      return;
    }

    // Lọc ra chu kỳ của tháng hiện tại (chỉ 1 chu kỳ)
    const newPeriods = periodsToCreate.filter(
      p => p.year === currentPeriod.year && p.month === currentPeriod.month
    );

    if (newPeriods.length === 0) {
      alert(`Không thể tạo chu kỳ thanh toán. Backend chỉ cho phép tạo chu kỳ cho tháng hiện tại (${currentPeriod.month}/${currentPeriod.year}).\n\nTháng hiện tại không nằm trong phạm vi của các nhân sự tham gia đang hoạt động.`);
      setPreviewPeriods([]);
      return;
    }

    setPreviewPeriods(newPeriods);
  };

  const formatViDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatViDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
        return "—";
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "—";
    }
  };

  const assignmentStatusLabels: Record<string, string> = {
    Active: "Đang hoạt động",
    Completed: "Đã hoàn thành",
    Terminated: "Đã chấm dứt",
    Inactive: "Không hoạt động",
    Draft: "Nháp",
  };

  // Pagination cho danh sách nhân sự tham gia
  const assignmentItemsPerPage = 6;

  const filteredAssignmentsForTable = [...talentAssignments]
    .filter(a => a.projectId === Number(id))
    .filter(a =>
      showAllAssignments
        ? true
        : a.status === "Draft" || a.status === "Active"
    )
    .sort((a, b) => {
      // Sắp xếp theo ngày cập nhật gần nhất (mới nhất trước)
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
    });

  const totalAssignmentsForTable = filteredAssignmentsForTable.length;
  const totalAssignmentPages = totalAssignmentsForTable > 0
    ? Math.ceil(totalAssignmentsForTable / assignmentItemsPerPage)
    : 1;
  const currentAssignmentPage = Math.min(assignmentPage, totalAssignmentPages);

  const paginatedAssignmentsForTable = filteredAssignmentsForTable.slice(
    (currentAssignmentPage - 1) * assignmentItemsPerPage,
    currentAssignmentPage * assignmentItemsPerPage
  );

  const statusLabels: Record<string, string> = {
    Planned: "Đã lên kế hoạch",
    Ongoing: "Đang thực hiện",
    Completed: "Đã hoàn thành",
  };

  const contractStatusLabels: Record<string, string> = {
    Draft: "Nháp",
    NeedMoreInformation: "Cần thêm thông tin",
    Submitted: "Chờ xác minh",
    Verified: "Chờ duyệt",
    Approved: "Đã duyệt",
    Rejected: "Từ chối",
  };

  const paymentStatusLabels: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Processing: "Đang xử lý",
    Invoiced: "Đã xuất hóa đơn",
    PartiallyPaid: "Đã thanh toán một phần",
    Paid: "Đã thanh toán",
  };

  const contractStatusColors: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800",
    NeedMoreInformation: "bg-yellow-100 text-yellow-800",
    Submitted: "bg-blue-100 text-blue-800",
    Verified: "bg-purple-100 text-purple-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };

  const paymentStatusColors: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-800",
    Processing: "bg-yellow-100 text-yellow-800",
    Invoiced: "bg-blue-100 text-blue-800",
    PartiallyPaid: "bg-orange-100 text-orange-800",
    Paid: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Accountant Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Accountant Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy dự án</p>
            <Link 
              to="/accountant/projects"
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Accountant Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Dự án", to: "/accountant/projects" },
              { label: project ? project.name : "Chi tiết dự án" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết dự án khách hàng
              </p>
              
              {/* Status Badge */}
              {(() => {
                const getStatusColorClass = (status: string) => {
                  if (status === 'Ongoing') return 'bg-blue-100 text-blue-800 border-blue-200';
                  if (status === 'Planned') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  if (status === 'OnHold') return 'bg-purple-100 text-purple-800 border-purple-200';
                  if (status === 'Completed') return 'bg-green-100 text-green-800 border-green-200';
                  return 'bg-neutral-100 text-neutral-800 border-neutral-200';
                };
                const statusColorClass = project.status ? getStatusColorClass(project.status) : 'bg-green-100 text-green-800 border-green-200';
                const statusText = project.status ? (statusLabels[project.status] || "Không xác định") : "Đang hoạt động";
                const iconColor = project.status === 'Ongoing' ? 'text-blue-600' :
                                 project.status === 'Planned' ? 'text-yellow-600' :
                                 project.status === 'OnHold' ? 'text-purple-600' :
                                 project.status === 'Completed' ? 'text-green-600' :
                                 'text-green-600';
                return (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${statusColorClass}`}>
                    <CheckCircle className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-medium">
                      {statusText}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'info'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Thông tin dự án
                {activeTab === 'info' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'contracts'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Chu kỳ thanh toán
                {activeTab === 'contracts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-6 py-4 font-medium text-sm transition-all duration-300 relative ${
                  activeTab === 'staff'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Nhân sự tham gia
                {activeTab === 'staff' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: Thông tin dự án */}
            {activeTab === 'info' && (
              <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cột 1: Mã, Tên, Công ty khách hàng */}
                <div className="space-y-6">
                  <InfoItem
                    label="Mã dự án"
                    value={project.code || "—"}
                    icon={<Hash className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Tên dự án"
                    value={project.name}
                    icon={<FileText className="w-4 h-4" />}
                  />
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-neutral-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <p className="text-neutral-500 text-sm font-medium">
                        Công ty khách hàng
                      </p>
                    </div>
                    <button
                      onClick={() => company && setShowCompanyInfo(true)}
                      disabled={!company}
                      className={`text-left font-semibold ${
                        (project.clientCompanyName || company?.name)
                          ? "text-primary-700 hover:text-primary-800 cursor-pointer"
                          : "text-gray-900 cursor-default"
                      }`}
                    >
                      {project.clientCompanyName || company?.name || "—"}
                    </button>
                  </div>
                </div>

                {/* Cột 2: Thị trường, Lĩnh vực */}
                <div className="space-y-6">
                  <InfoItem
                    label="Thị trường"
                    value={project.marketName || "—"}
                    icon={<Globe2 className="w-4 h-4" />}
                  />
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-neutral-400">
                        <Factory className="w-4 h-4" />
                      </div>
                      <p className="text-neutral-500 text-sm font-medium">
                        Lĩnh vực
                      </p>
                    </div>
                    <button
                      onClick={() => project.industryNames && project.industryNames.length > 0 && setShowIndustryInfo(true)}
                      disabled={!project.industryNames || project.industryNames.length === 0}
                      className={`text-left font-semibold ${
                        project.industryNames && project.industryNames.length > 0
                          ? "text-primary-700 hover:text-primary-800 cursor-pointer"
                          : "text-gray-900 cursor-default"
                      }`}
                    >
                      {project.industryNames && project.industryNames.length > 0
                        ? `${project.industryNames.length} lĩnh vực`
                        : "—"}
                    </button>
                  </div>
                </div>

                {/* Cột 3: Ngày bắt đầu, Ngày kết thúc */}
                <div className="space-y-6">
                  <InfoItem
                    label="Ngày bắt đầu"
                    value={formatViDateTime(project.startDate)}
                    icon={<CalendarDays className="w-4 h-4" />}
                  />
                  <InfoItem
                    label="Ngày kết thúc"
                    value={project.endDate ? formatViDateTime(project.endDate) : "—"}
                    icon={<CalendarDays className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Mô tả với nút xem/ẩn */}
              {project.description && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-3"
                  >
                    {showDescription ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ẩn mô tả
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Xem mô tả
                      </>
                    )}
                  </button>
                  {showDescription && (
                    <div className="prose max-w-none text-neutral-700 bg-neutral-50 rounded-xl p-4">
                      <div dangerouslySetInnerHTML={{ __html: project.description }} />
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Tab: Hợp đồng */}
            {activeTab === 'contracts' && (
              <div className="space-y-6">
                {/* Header với nút tạo chu kỳ và filter năm */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Danh sách chu kỳ thanh toán</h2>
                  <div className="flex items-center gap-3">
                    {/* Checkbox hiển thị chu kỳ đã đóng */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showClosedPeriods}
                        onChange={(e) => setShowClosedPeriods(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">Hiển thị chu kỳ đã đóng</span>
                    </label>
                    {/* Filter theo năm */}
                    <select
                      value={yearFilter || ""}
                      onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : null)}
                      className="px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Tất cả các năm</option>
                      {Array.from(new Set(projectPeriods.map(p => p.periodYear)))
                        .sort((a, b) => b - a)
                        .map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button
                      onClick={async () => {
                        // Hiển thị thông báo xác nhận
                        const confirmed = window.confirm(
                          "Bạn có chắc chắn muốn tạo chu kỳ thanh toán cho tháng hiện tại?\n\n" +
                          "Hệ thống sẽ tự động tạo các hợp đồng cho các nhân sự tham gia đang hoạt động trong chu kỳ này."
                        );
                        if (confirmed) {
                          await handleCreatePeriod();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                      Tạo chu kỳ thanh toán
                    </button>
                  </div>
                </div>

                {/* Tabs ngang cho các chu kỳ */}
                {filteredPeriods.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-xl">
                    <Layers className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500">Chưa có chu kỳ thanh toán nào</p>
                    <p className="text-neutral-400 text-sm mt-1">Nhấn nút "Tạo chu kỳ thanh toán" để bắt đầu</p>
                  </div>
                ) : (
                  <div>
                    {/* Tab Navigation - Horizontal Scroll */}
                    <div className="border-b border-neutral-200 mb-6 overflow-x-auto">
                      <div className="flex space-x-1 min-w-max">
                        {filteredPeriods.map((period) => {
                          const statusLabels: Record<string, string> = {
                            "Open": "Mở",
                            "Closed": "Đã đóng",
                            "Pending": "Chờ xử lý",
                            "Processing": "Đang xử lý"
                          };
                          const statusColors: Record<string, string> = {
                            "Open": "bg-green-100 text-green-700",
                            "Closed": "bg-gray-100 text-gray-700",
                            "Pending": "bg-yellow-100 text-yellow-700",
                            "Processing": "bg-blue-100 text-blue-700"
                          };
                          const statusLabel = statusLabels[period.status] || period.status;
                          const statusColor = statusColors[period.status] || "bg-neutral-100 text-neutral-700";
                          
                          return (
                            <button
                              key={period.id}
                              onClick={() => setSelectedPeriodId(period.id)}
                              className={`px-6 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap relative flex flex-col items-center gap-1 ${
                                selectedPeriodId === period.id
                                  ? 'text-primary-600'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              <span>Tháng {period.periodMonth}/{period.periodYear}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
                                {statusLabel}
                              </span>
                              {selectedPeriodId === period.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content của chu kỳ được chọn */}
                    {selectedPeriodId && (
                      <div className="animate-fade-in">
                        {loadingPayments ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Đang tải hợp đồng...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Client Contract Payments */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <Building2 className="w-5 h-5 text-primary-600" />
                                  Hợp đồng khách hàng
                                </h3>
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                  {clientContractPayments.length} hợp đồng
                                </span>
                              </div>
                              {clientContractPayments.length === 0 ? (
                                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                                  <FileCheck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm text-neutral-500">Chưa có hợp đồng khách hàng</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Nhóm theo talentAssignmentId - Sắp xếp để đảm bảo thứ tự giống nhau giữa client và partner */}
                                  {(() => {
                                    // Lấy tất cả unique talentAssignmentIds từ cả client và partner
                                    const allTalentAssignmentIds = Array.from(new Set([
                                      ...clientContractPayments.map(p => p.talentAssignmentId),
                                      ...partnerContractPayments.map(p => p.talentAssignmentId)
                                    ]));
                                    
                                    // Sắp xếp theo tên nhân sự (nếu có) hoặc theo ID
                                    const sortedTalentAssignmentIds = allTalentAssignmentIds.sort((a, b) => {
                                      const nameA = talentNamesMap[a] || `Talent Assignment ${a}`;
                                      const nameB = talentNamesMap[b] || `Talent Assignment ${b}`;
                                      return nameA.localeCompare(nameB, 'vi', { numeric: true });
                                    });
                                    
                                    return sortedTalentAssignmentIds.map((talentAssignmentId) => {
                                      const clientPayments = clientContractPayments.filter(p => p.talentAssignmentId === talentAssignmentId);
                                      return (
                                      <div key={talentAssignmentId} className="border border-neutral-200 rounded-lg p-4">
                                        <div className="mb-3 pb-3 border-b border-neutral-200">
                                          <p className="text-sm font-medium text-neutral-600">
                                            {talentNamesMap[talentAssignmentId] || `Talent Assignment ID: ${talentAssignmentId}`}
                                          </p>
                                        </div>
                                        {clientPayments.map((payment) => (
                                          <div 
                                            key={payment.id} 
                                            onClick={() => navigate(`/accountant/contracts/clients/${payment.id}`)}
                                            className="mb-4 last:mb-0 border border-neutral-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                                          >
                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">{payment.contractNumber}</p>
                                                <p className="text-sm text-neutral-600">{payment.talentName || "—"}</p>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                {payment.isFinished ? (
                                                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Đã hoàn thành
                                                  </span>
                                                ) : (
                                                  <>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${contractStatusColors[payment.contractStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                      {contractStatusLabels[payment.contractStatus] || payment.contractStatus}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusColors[payment.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                      {paymentStatusLabels[payment.paymentStatus] || payment.paymentStatus}
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                  {payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? "Số tiền thực tế" : "Số tiền dự kiến"}
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  {formatCurrency(payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? payment.actualAmountVND : (payment.plannedAmountVND || 0))}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">Đã thanh toán</p>
                                                <p className="font-semibold text-gray-900">{formatCurrency(payment.totalPaidAmount)}</p>
                                              </div>
                                            </div>
                                            {payment.billableHours && (
                                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                  <Clock className="w-4 h-4" />
                                                  <span>Giờ billable: {payment.billableHours}h</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Partner Contract Payments */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <FileCheck className="w-5 h-5 text-secondary-600" />
                                  Hợp đồng đối tác
                                </h3>
                                <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                                  {partnerContractPayments.length} hợp đồng
                                </span>
                              </div>
                              {partnerContractPayments.length === 0 ? (
                                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
                                  <FileCheck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm text-neutral-500">Chưa có hợp đồng đối tác</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Nhóm theo talentAssignmentId - Sắp xếp để đảm bảo thứ tự giống nhau giữa client và partner */}
                                  {(() => {
                                    // Lấy tất cả unique talentAssignmentIds từ cả client và partner
                                    const allTalentAssignmentIds = Array.from(new Set([
                                      ...clientContractPayments.map(p => p.talentAssignmentId),
                                      ...partnerContractPayments.map(p => p.talentAssignmentId)
                                    ]));
                                    
                                    // Sắp xếp theo tên nhân sự (nếu có) hoặc theo ID
                                    const sortedTalentAssignmentIds = allTalentAssignmentIds.sort((a, b) => {
                                      const nameA = talentNamesMap[a] || `Talent Assignment ${a}`;
                                      const nameB = talentNamesMap[b] || `Talent Assignment ${b}`;
                                      return nameA.localeCompare(nameB, 'vi', { numeric: true });
                                    });
                                    
                                    return sortedTalentAssignmentIds.map((talentAssignmentId) => {
                                      const partnerPaymentsForTalent = partnerContractPayments.filter(p => p.talentAssignmentId === talentAssignmentId);
                                      return (
                                      <div key={talentAssignmentId} className="border border-neutral-200 rounded-lg p-4">
                                        <div className="mb-3 pb-3 border-b border-neutral-200">
                                          <p className="text-sm font-medium text-neutral-600">
                                            {talentNamesMap[talentAssignmentId] || `Talent Assignment ID: ${talentAssignmentId}`}
                                          </p>
                                        </div>
                                        {partnerPaymentsForTalent.map((payment: PartnerContractPaymentModel) => (
                                          <div 
                                            key={payment.id} 
                                            onClick={() => navigate(`/accountant/contracts/partners/${payment.id}`)}
                                            className="mb-4 last:mb-0 border border-neutral-200 rounded-lg p-4 hover:border-secondary-300 hover:shadow-sm transition-all cursor-pointer"
                                          >
                                            <div className="flex items-start justify-between mb-3">
                                              <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">{payment.contractNumber}</p>
                                                <p className="text-sm text-neutral-600">{talentNamesMap[payment.talentAssignmentId] || `Talent Assignment ID: ${payment.talentAssignmentId}`}</p>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                {payment.isFinished ? (
                                                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Đã hoàn thành
                                                  </span>
                                                ) : (
                                                  <>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                      payment.contractStatus === 'Approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : payment.contractStatus === 'Verified'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                      {contractStatusLabels[payment.contractStatus] || payment.contractStatus}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                      payment.paymentStatus === 'Paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : payment.paymentStatus === 'Processing'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                      {payment.paymentStatus === 'Paid' ? 'Đã thanh toán' : payment.paymentStatus === 'Processing' ? 'Đang xử lý' : 'Chờ thanh toán'}
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">
                                                  {payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? "Số tiền thực tế" : "Số tiền dự kiến"}
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  {formatCurrency(payment.actualAmountVND !== null && payment.actualAmountVND !== undefined ? payment.actualAmountVND : (payment.plannedAmountVND || 0))}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-neutral-600 mb-1">Đã thanh toán</p>
                                                <p className="font-semibold text-gray-900">{formatCurrency(payment.totalPaidAmount)}</p>
                                              </div>
                                            </div>
                                            {payment.reportedHours && (
                                              <div className="mt-3 pt-3 border-t border-neutral-100">
                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                  <Clock className="w-4 h-4" />
                                                  <span>Giờ làm việc: {payment.reportedHours}h</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Nhân sự tham gia */}
            {activeTab === 'staff' && (
              <div className="animate-fade-in">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Danh sách nhân sự tham gia</h3>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-sm text-neutral-500">
                        ({totalAssignmentsForTable} nhân sự)
                      </span>
                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={showAllAssignments}
                          onChange={(e) => {
                            setShowAllAssignments(e.target.checked);
                            setAssignmentPage(1);
                          }}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        Hiện tất cả nhân sự tham gia
                      </label>
                    </div>
                  </div>
                </div>
                {talentAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Nhân sự</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Vị trí công việc</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Đối tác</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày bắt đầu</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày kết thúc</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">File cam kết</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày cập nhật gần nhất</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssignmentsForTable.map((assignment) => {
                            const talent = talents.find(t => t.id === assignment.talentId);
                            const partner = partners.find(p => p.id === assignment.partnerId);
                            return (
                              <tr
                                key={assignment.id}
                                className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowDetailAssignmentModal(true);
                                }}
                              >
                                <td className="py-3 px-4 text-sm text-neutral-900 font-medium">
                                  {talent?.fullName || `Nhân sự #${assignment.talentId}`}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.jobRoleLevelName || "—"}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {partner?.companyName || `Đối tác #${assignment.partnerId}`}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.startDate ? formatViDate(assignment.startDate) : "—"}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.endDate ? formatViDate(assignment.endDate) : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                                    assignment.status === "Active" ? "bg-green-100 text-green-800" :
                                    assignment.status === "Completed" ? "bg-blue-100 text-blue-800" :
                                    assignment.status === "Terminated" ? "bg-red-100 text-red-800" :
                                    assignment.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                                    "bg-neutral-100 text-neutral-800"
                                  }`}>
                                    {assignment.status ? (assignmentStatusLabels[assignment.status] || "Không xác định") : "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {assignment.commitmentFileUrl ? (
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={assignment.commitmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Xem file trong tab mới"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Xem
                                      </a>
                                      <a
                                        href={assignment.commitmentFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-xs font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Tải file xuống"
                                      >
                                        <Download className="w-3 h-3" />
                                        Tải xuống
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-neutral-400">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm text-neutral-700">
                                  {assignment.updatedAt 
                                    ? formatViDateTime(assignment.updatedAt)
                                    : assignment.createdAt 
                                      ? formatViDateTime(assignment.createdAt)
                                      : "—"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Cấp tài khoản đối tác button */}
                                    {talent && talent.status === "Working" && !talent.userId && talent.email && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTalentForAccount(talent);
                                          setAccountEmail(talent.email || "");
                                          setShowCreateAccountModal(true);
                                        }}
                                        disabled={isProcessingAccountCreation}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
                                        title="Cấp tài khoản đối tác"
                                      >
                                        <>
                                          <UserPlus className="w-4 h-4 mr-1 flex-shrink-0" />
                                          <span className="text-xs font-medium">Cấp tài khoản</span>
                                        </>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {totalAssignmentsForTable > assignmentItemsPerPage && (
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-neutral-600">
                            Hiển thị{" "}
                            {Math.min(
                              assignmentItemsPerPage,
                              totalAssignmentsForTable - (currentAssignmentPage - 1) * assignmentItemsPerPage
                            )}{" "}
                            / {totalAssignmentsForTable} nhân sự
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAssignmentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentAssignmentPage === 1}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${
                                currentAssignmentPage === 1
                                  ? "text-neutral-400 border-neutral-200 cursor-not-allowed bg-neutral-50"
                                  : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              Trước
                            </button>
                            <span className="text-sm text-neutral-700">
                              Trang {currentAssignmentPage} / {totalAssignmentPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAssignmentPage((prev) => Math.min(totalAssignmentPages, prev + 1))}
                              disabled={currentAssignmentPage === totalAssignmentPages}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${
                                currentAssignmentPage === totalAssignmentPages
                                  ? "text-neutral-400 border-neutral-200 cursor-not-allowed bg-neutral-50"
                                  : "text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                    <p>Chưa có nhân sự nào được phân công</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Assignment Modal (Read-only) */}
      {showDetailAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailAssignmentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Chi tiết phân công nhân sự
              </h3>
              <button
                onClick={() => {
                  setShowDetailAssignmentModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Talent Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nhân sự</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {talents.find(t => t.id === selectedAssignment.talentId)?.fullName || `Nhân sự #${selectedAssignment.talentId}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vị trí công việc</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.jobRoleLevelName || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Đối tác</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {partners.find(p => p.id === selectedAssignment.partnerId)?.companyName || `Đối tác #${selectedAssignment.partnerId}`}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày bắt đầu</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.startDate ? formatViDate(selectedAssignment.startDate) : "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày kết thúc</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedAssignment.endDate ? formatViDate(selectedAssignment.endDate) : "—"}
                  </p>
                </div>
                {selectedAssignment.terminationDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày chấm dứt</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatViDate(selectedAssignment.terminationDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái</label>
                <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedAssignment.status === "Active" ? "bg-green-100 text-green-800" :
                  selectedAssignment.status === "Completed" ? "bg-blue-100 text-blue-800" :
                  selectedAssignment.status === "Terminated" ? "bg-red-100 text-red-800" :
                  selectedAssignment.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                  selectedAssignment.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                  "bg-neutral-100 text-neutral-800"
                }`}>
                  {selectedAssignment.status ? (assignmentStatusLabels[selectedAssignment.status] || "Không xác định") : "—"}
                </span>
              </div>

              {/* Commitment File */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">File cam kết</label>
                {selectedAssignment.commitmentFileUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedAssignment.commitmentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      title="Xem file trong tab mới"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Xem file
                    </a>
                    <a
                      href={selectedAssignment.commitmentFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                      title="Tải file xuống"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">Chưa có file</p>
                )}
              </div>

              {/* Termination Reason */}
              {selectedAssignment.terminationReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Lý do chấm dứt</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedAssignment.terminationReason}
                  </p>
                </div>
              )}

              {/* Estimated Rates */}
              {(selectedAssignment.estimatedClientRate || selectedAssignment.estimatedPartnerRate) && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Chi phí ước tính</label>
                  <div className="space-y-2">
                    {selectedAssignment.estimatedClientRate && (
                      <div>
                        <span className="text-xs text-neutral-500">Khách hàng: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumberInput(selectedAssignment.estimatedClientRate)} {selectedAssignment.currencyCode || "VND"}
                        </span>
                      </div>
                    )}
                    {selectedAssignment.estimatedPartnerRate && (
                      <div>
                        <span className="text-xs text-neutral-500">Đối tác: </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumberInput(selectedAssignment.estimatedPartnerRate)} {selectedAssignment.currencyCode || "VND"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ghi chú</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedAssignment.notes || "—"}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                  <p className="text-sm text-gray-600">
                    {selectedAssignment.createdAt ? formatViDateTime(selectedAssignment.createdAt) : "—"}
                  </p>
                </div>
                {selectedAssignment.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày cập nhật</label>
                    <p className="text-sm text-gray-600">
                      {formatViDateTime(selectedAssignment.updatedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setShowDetailAssignmentModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo ProjectPeriod */}
      {showCreatePeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Tạo chu kỳ thanh toán</h3>
                <button
                  onClick={() => setShowCreatePeriodModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Lưu ý:</strong> Hệ thống sẽ tự động:
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Tìm tất cả TalentAssignment có Status = "Active" (bỏ qua Draft)</li>
                  <li>Tính toán tất cả các tháng cần tạo dựa trên startDate và endDate của mỗi TalentAssignment</li>
                  <li>Tạo ProjectPeriod cho mỗi tháng cần thiết</li>
                  <li>Tự động tạo ClientContractPayment và PartnerContractPayment với ContractStatus = "Draft", PaymentStatus = "Pending"</li>
                </ul>
              </div> */}

              <div>
                <button
                  onClick={handlePreviewPeriods}
                  className="w-full px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors border border-primary-200"
                >
                  Xem trước các chu kỳ sẽ được tạo
                </button>
              </div>

              {previewPeriods.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Các chu kỳ sẽ được tạo ({previewPeriods.length} chu kỳ):
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {previewPeriods.map((p, idx) => (
                        <div key={idx} className="text-sm text-neutral-600 bg-white px-2 py-1 rounded border border-neutral-200">
                          Tháng {p.month}/{p.year}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreatePeriodModal(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePeriod}
                disabled={creatingPeriod}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPeriod ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && selectedTalentForAccount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateAccountModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                Cấp tài khoản đối tác
              </h3>
              <button
                onClick={() => {
                  setShowCreateAccountModal(false);
                  setSelectedTalentForAccount(null);
                  setAccountEmail("");
                  setEmailError("");
                  setEmailError("");
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Talent Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Thông tin nhân sự</h4>
                <p className="text-sm text-gray-600">
                  <strong>{selectedTalentForAccount.fullName}</strong>
                </p>
                {(() => {
                  const partner = partners.find(p => p.id === selectedTalentForAccount.currentPartnerId);
                  return partner ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Đối tác: <strong>{partner.companyName}</strong>
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Nhập email..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Mật khẩu sẽ được gửi về email này
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAccountModal(false);
                    setSelectedTalentForAccount(null);
                    setAccountEmail("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccountWithEmailUpdate}
                  disabled={isProcessingAccountCreation || !!emailError || !accountEmail.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cấp tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Account Creation */}
      {isProcessingAccountCreation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang cấp tài khoản</h3>
            <p className="text-sm text-gray-600 text-center">Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      )}

      {/* Company Info Popover */}
      {showCompanyInfo && company && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCompanyInfo(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Thông tin khách hàng</h3>
              </div>
              <button
                onClick={() => setShowCompanyInfo(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-500">Tên công ty</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{company.name || '—'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-500">Mã số thuế</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{company.taxCode || '—'}</p>
                  </div>

                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-500">Địa chỉ</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{company.address || '—'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-500">Email</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{company.email || '—'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-500">Số điện thoại</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{company.phone || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Industry Info Popover */}
      {showIndustryInfo && project && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowIndustryInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Factory className="w-5 h-5 text-primary-600" />
                Lĩnh vực
              </h3>
              <button
                onClick={() => setShowIndustryInfo(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {project.industryNames && project.industryNames.length > 0 ? (
                project.industryNames.map((industryName, index) => (
                  <div
                    key={index}
                    className="px-4 py-2.5 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <p className="text-gray-900 font-medium">{industryName}</p>
                  </div>
                ))
              ) : (
                <p className="text-neutral-500 text-center py-4">Không có lĩnh vực nào</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
        {value || "—"}
      </p>
    </div>
  );
}
