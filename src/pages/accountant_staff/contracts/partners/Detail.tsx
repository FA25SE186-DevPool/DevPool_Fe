import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Briefcase,
  UserCheck,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  StickyNote,
  X,
  Calculator,
  CreditCard,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/accountant";
import {
  partnerContractPaymentService,
  type PartnerContractPaymentModel,
  type PartnerContractPaymentCalculateModel,
  type PartnerContractPaymentMarkAsPaidModel,
  type PartnerContractPaymentVerifyModel,
} from "../../../../services/PartnerContractPayment";
import { projectPeriodService, type ProjectPeriodModel } from "../../../../services/ProjectPeriod";
import { talentAssignmentService, type TalentAssignmentModel } from "../../../../services/TalentAssignment";
import { projectService } from "../../../../services/Project";
import { partnerService } from "../../../../services/Partner";
import { talentService } from "../../../../services/Talent";
import { partnerDocumentService, type PartnerDocument, type PartnerDocumentCreate } from "../../../../services/PartnerDocument";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import { uploadFile } from "../../../../utils/firebaseStorage";
import { formatNumberInput, parseNumberInput } from "../../../../utils/formatters";
import { useAuth } from "../../../../context/AuthContext";
import { decodeJWT } from "../../../../services/Auth";
import { getAccessToken } from "../../../../utils/storage";

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Helper function to get date range for a project period (first day to last day of the month)
const getPeriodDateRange = (period: ProjectPeriodModel | null): { minDate: string | null; maxDate: string | null } => {
  if (!period) {
    return { minDate: null, maxDate: null };
  }

  try {
    // Create date for the first day of the period month/year
    const firstDay = new Date(period.periodYear, period.periodMonth - 1, 1);
    const minDate = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;

    // Create date for the last day of the period month/year
    const lastDay = new Date(period.periodYear, period.periodMonth, 0); // Day 0 of next month = last day of current month
    const maxDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    return { minDate, maxDate };
  } catch (error) {
    console.error("❌ Lỗi tính toán khoảng ngày của chu kỳ:", error);
    return { minDate: null, maxDate: null };
  }
};

const contractStatusConfigMap: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: ReactNode;
  }
> = {
  Draft: {
    label: "Nháp",
    color: "text-gray-800",
    bgColor: "bg-gray-50 border border-gray-200",
    icon: <FileText className="w-4 h-4" />,
  },
  Verified: {
    label: "Đã xác minh",
    color: "text-purple-800",
    bgColor: "bg-purple-50 border border-purple-200",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  Approved: {
    label: "Đã duyệt",
    color: "text-green-800",
    bgColor: "bg-green-50 border border-green-200",
    icon: <CheckCircle className="w-4 h-4" />,
  },
};

const paymentStatusConfigMap: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  Pending: {
    label: "Chờ thanh toán",
    color: "text-gray-800",
    bgColor: "bg-gray-50 border border-gray-200",
  },
  Processing: {
    label: "Đang xử lý",
    color: "text-yellow-800",
    bgColor: "bg-yellow-50 border border-yellow-200",
  },
  Paid: {
    label: "Đã thanh toán",
    color: "text-green-800",
    bgColor: "bg-green-50 border border-green-200",
  },
};

const getContractStatusConfig = (status: string) => {
  return (
    contractStatusConfigMap[status] ?? {
      label: status,
      color: "text-neutral-700",
      bgColor: "bg-neutral-100 border border-neutral-200",
      icon: <AlertCircle className="w-4 h-4" />,
    }
  );
};

const getPaymentStatusConfig = (status: string) => {
  return (
    paymentStatusConfigMap[status] ?? {
      label: status,
      color: "text-neutral-700",
      bgColor: "bg-neutral-100 border border-neutral-200",
    }
  );
};

export default function PartnerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractPayment, setContractPayment] = useState<PartnerContractPaymentModel | null>(null);
  const [projectPeriod, setProjectPeriod] = useState<ProjectPeriodModel | null>(null);
  const [talentAssignment, setTalentAssignment] = useState<TalentAssignmentModel | null>(null);
  const [projectName, setProjectName] = useState<string>("—");
  const [partnerName, setPartnerName] = useState<string>("—");
  const [talentName, setTalentName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerDocuments, setPartnerDocuments] = useState<PartnerDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Map<number, DocumentType>>(new Map());
  const [activeDocumentTab, setActiveDocumentTab] = useState<number | "all">("all");
  const [activeMainTab, setActiveMainTab] = useState<string>("contract");

  // Modal states
  const [showVerifyContractModal, setShowVerifyContractModal] = useState(false);
  const [showStartBillingModal, setShowStartBillingModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);

  // Form states
  const [verifyForm, setVerifyForm] = useState<PartnerContractPaymentVerifyModel>({
    unitPriceForeignCurrency: 0,
    currencyCode: "USD",
    exchangeRate: 1,
    calculationMethod: "Percentage",
    percentageValue: null,
    fixedAmount: null,
    standardHours: 160,
    notes: null,
  });
  const [billingForm, setBillingForm] = useState<PartnerContractPaymentCalculateModel>({
    actualWorkHours: 0,
    notes: null,
  });
  
  // File states
  const [worksheetFile, setWorksheetFile] = useState<File | null>(null);
  const [sowFile, setSowFile] = useState<File | null>(null);
  
  const [markAsPaidForm, setMarkAsPaidForm] = useState<PartnerContractPaymentMarkAsPaidModel>({
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: null,
    paymentProofFileUrl: null,
    partnerReceiptFileUrl: null,
  });

  // File states
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [partnerReceiptFile, setPartnerReceiptFile] = useState<File | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current user
  const { user } = useAuth();

  // Helper function to get current user ID
  const getCurrentUserId = (): string | null => {
    const token = getAccessToken();
    if (!token) {
      // Fallback to user.id from context if token not available
      return user?.id || null;
    }
    const payload = decodeJWT(token);
    // Try multiple possible fields in JWT payload
    const userId = payload?.nameid || payload?.sub || payload?.userId || payload?.uid;
    // Fallback to user.id from context if JWT doesn't have userId
    return userId || user?.id || null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("ID hợp đồng không hợp lệ");
        setLoading(false);
        return;
      }

      // Fetch contract payment
      const paymentData = await partnerContractPaymentService.getById(Number(id));
      setContractPayment(paymentData);

      // Fetch related data in parallel
      const [periodData, assignmentData] = await Promise.all([
        projectPeriodService.getById(paymentData.projectPeriodId).catch(() => null),
        talentAssignmentService.getById(paymentData.talentAssignmentId).catch(() => null),
      ]);

      setProjectPeriod(periodData);
      setTalentAssignment(assignmentData);

      // Fetch project info
      if (assignmentData) {
        try {
          const project = await projectService.getById(assignmentData.projectId);
          setProjectName(project?.name || "—");
        } catch (err) {
          console.error("❌ Lỗi fetch project:", err);
          setProjectName("—");
        }

        // Fetch partner info - ưu tiên lấy từ assignment data
        if (assignmentData.partnerCompanyName || assignmentData.partnerName) {
          setPartnerName(assignmentData.partnerCompanyName || assignmentData.partnerName || "—");
        } else if (assignmentData.partnerId) {
          try {
            const response = await partnerService.getDetailedById(assignmentData.partnerId);
            // Handle response structure: { data: {...} } or direct data
            const partnerData = response?.data || response;
            setPartnerName(partnerData?.companyName || "—");
          } catch (err) {
            console.error("❌ Lỗi fetch partner với ID", assignmentData.partnerId, ":", err);
            setPartnerName("—");
          }
        } else {
          setPartnerName("—");
        }

        // Fetch talent info
        try {
          const talent = await talentService.getById(assignmentData.talentId);
          setTalentName(talent?.fullName || "—");
        } catch (err) {
          console.error("❌ Lỗi fetch talent:", err);
          setTalentName("—");
        }
      }
    } catch (err: unknown) {
      console.error("❌ Lỗi tải thông tin hợp đồng thanh toán đối tác:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin hợp đồng thanh toán đối tác"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Load document types
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const data = await documentTypeService.getAll({ excludeDeleted: true });
        const types = Array.isArray(data) ? data : (data?.items || []);
        const typesMap = new Map<number, DocumentType>();
        types.forEach((type: DocumentType) => {
          typesMap.set(type.id, type);
        });
        setDocumentTypes(typesMap);
      } catch (err: any) {
        console.error("❌ Lỗi tải loại tài liệu:", err);
      }
    };
    loadDocumentTypes();
  }, []);

  // Load partner documents
  useEffect(() => {
    const loadPartnerDocuments = async () => {
      if (!id) {
        setPartnerDocuments([]);
        return;
      }
      try {
        const data = await partnerDocumentService.getAll({
          partnerContractPaymentId: Number(id),
          excludeDeleted: true,
        });
        // Handle different response structures
        let documents: PartnerDocument[] = [];
        if (Array.isArray(data)) {
          documents = data;
        } else if (data?.items && Array.isArray(data.items)) {
          documents = data.items;
        } else if (data?.data && Array.isArray(data.data)) {
          documents = data.data;
        } else if (data?.data?.items && Array.isArray(data.data.items)) {
          documents = data.data.items;
        }
        setPartnerDocuments(documents);
      } catch (err: any) {
        console.error("❌ Lỗi tải tài liệu đối tác:", err);
        setPartnerDocuments([]);
      }
    };
    loadPartnerDocuments();
  }, [id, contractPayment?.id]);

  // Calculate PlannedAmountVND
  const calculatePlannedAmountVND = () => {
    if (verifyForm.calculationMethod === "Percentage") {
      if (verifyForm.percentageValue && verifyForm.unitPriceForeignCurrency && verifyForm.exchangeRate) {
        return (verifyForm.unitPriceForeignCurrency * verifyForm.exchangeRate) * (verifyForm.percentageValue / 100);
      }
      return null;
    } else if (verifyForm.calculationMethod === "Fixed") {
      if (verifyForm.fixedAmount && verifyForm.exchangeRate) {
        return verifyForm.fixedAmount * verifyForm.exchangeRate;
      }
      return null;
    }
    return null;
  };

  // Calculate billing preview
  const calculateBillingPreview = () => {
    if (!contractPayment || !billingForm.actualWorkHours || billingForm.actualWorkHours <= 0) {
      return null;
    }

    const actualWorkHours = billingForm.actualWorkHours;
    const unitPrice = contractPayment.unitPriceForeignCurrency;
    const exchangeRate = contractPayment.exchangeRate;
    const standardHours = contractPayment.standardHours || 160;
    const calculationMethod = contractPayment.calculationMethod;

    if (calculationMethod === "Fixed") {
      // Fixed: ActualAmountVND = PlannedAmountVND (không đổi)
      const plannedAmountVND = contractPayment.plannedAmountVND || 0;
      const manMonthCoefficient = actualWorkHours / standardHours;
      
      return {
        type: "Fixed",
        actualWorkHours,
        manMonthCoefficient,
        plannedAmountVND,
        actualAmountVND: plannedAmountVND,
      };
    } else if (calculationMethod === "Percentage") {
      // Percentage: Tính theo tier breakdown
      // Mỗi tier có 20h (trừ tier 1 có 160h)
      const baseRate = unitPrice / standardHours;
      const tiers = [
        { from: 0, to: 160, multiplier: 1.0 },      // Tier 1: 0-160h (160h)
        { from: 161, to: 180, multiplier: 1.0 },    // Tier 2: 161-180h (20h)
        { from: 181, to: 200, multiplier: 1.25 },   // Tier 3: 181-200h (20h)
        { from: 201, to: 220, multiplier: 1.5 },    // Tier 4: 201-220h (20h)
        { from: 221, to: 240, multiplier: 1.5 },    // Tier 5: 221-240h (20h)
        { from: 241, to: 260, multiplier: 1.75 },   // Tier 6: 241-260h (20h)
        { from: 261, to: Infinity, multiplier: 2.0 }, // Tier 7+: 261+h
      ];

      const tierBreakdown: Array<{
        tier: string;
        hours: number;
        rate: number;
        multiplier: number;
        amountUSD: number;
        amountVND: number;
      }> = [];

      let totalAmountUSD = 0;
      let remainingHours = actualWorkHours;

      for (const tier of tiers) {
        if (remainingHours <= 0) break;

        const tierStart = tier.from;
        const tierEnd = tier.to === Infinity ? Infinity : tier.to;
        
        // Tính số giờ trong tier này
        let tierHours = 0;
        if (tierStart === 0) {
          // Tier 1: 0-160h
          tierHours = Math.min(160, remainingHours);
        } else {
          // Các tier khác: mỗi tier 20h
          const tierSize = tierEnd === Infinity ? Infinity : (tierEnd - tierStart + 1);
          tierHours = Math.min(tierSize, remainingHours);
        }
        
        if (tierHours > 0) {
          const amountUSD = tierHours * baseRate * tier.multiplier;
          const amountVND = amountUSD * exchangeRate;
          
          let tierLabel = "";
          if (tierStart === 0) {
            tierLabel = `0-${Math.min(160, actualWorkHours)}h`;
          } else if (tierEnd === Infinity) {
            tierLabel = `${tierStart}+h`;
          } else {
            const actualEnd = Math.min(tierEnd, actualWorkHours);
            tierLabel = `${tierStart}-${actualEnd}h`;
          }
          
          tierBreakdown.push({
            tier: `Tier ${tierBreakdown.length + 1} (${tierLabel})`,
            hours: tierHours,
            rate: baseRate,
            multiplier: tier.multiplier,
            amountUSD,
            amountVND,
          });
          
          totalAmountUSD += amountUSD;
          remainingHours -= tierHours;
        }
      }

      const actualAmountVND = totalAmountUSD * exchangeRate;
      const effectiveCoefficient = totalAmountUSD / unitPrice;

      return {
        type: "Percentage",
        actualWorkHours,
        baseRate,
        tierBreakdown,
        totalAmountUSD,
        actualAmountVND,
        effectiveCoefficient,
      };
    }

    return null;
  };

  // Handlers
  const handleVerifyContract = async () => {
    if (!id || !contractPayment) return;

    // Validation
    if (!verifyForm.unitPriceForeignCurrency || verifyForm.unitPriceForeignCurrency <= 0) {
      alert("Vui lòng điền đầy đủ thông tin đơn giá và tỷ giá");
      return;
    }

    if (!verifyForm.exchangeRate || verifyForm.exchangeRate <= 0) {
      alert("Vui lòng điền đầy đủ thông tin đơn giá và tỷ giá");
      return;
    }

    if (!verifyForm.standardHours || verifyForm.standardHours <= 0) {
      alert("Vui lòng nhập số giờ tiêu chuẩn hợp lệ");
      return;
    }

    if (verifyForm.calculationMethod === "Percentage") {
      if (!verifyForm.percentageValue || verifyForm.percentageValue <= 0) {
        alert("Vui lòng nhập giá trị phần trăm hợp lệ");
        return;
      }
    } else if (verifyForm.calculationMethod === "Fixed") {
      if (!verifyForm.fixedAmount || verifyForm.fixedAmount <= 0) {
        alert("Vui lòng nhập số tiền cố định hợp lệ");
        return;
      }
      if (verifyForm.unitPriceForeignCurrency !== verifyForm.fixedAmount) {
        alert("Đơn giá ngoại tệ phải bằng số tiền cố định");
        return;
      }
    }

    // Validate SOW file
    if (!sowFile) {
      alert("Vui lòng upload file SOW");
      return;
    }

    // Find SOWExcel document type
    const sowType = Array.from(documentTypes.values()).find(
      (type) => type.typeName.toLowerCase() === "sowexcel"
    );

    if (!sowType) {
      alert("Không tìm thấy loại tài liệu SOWExcel. Vui lòng liên hệ quản trị viên.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Upload SOW file
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }

      const filePath = `partner-sow/${contractPayment.id}/sow_${Date.now()}.${sowFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(sowFile, filePath);

      // Create PartnerDocument for SOW
      const documentPayload: PartnerDocumentCreate = {
        partnerContractPaymentId: Number(id),
        documentTypeId: sowType.id,
        fileName: sowFile.name,
        filePath: fileUrl,
        uploadedByUserId: userId,
        description: "Statement of Work (SOW)",
        source: "Accountant",
      };
      await partnerDocumentService.create(documentPayload);

      const payload: PartnerContractPaymentVerifyModel = {
        unitPriceForeignCurrency: verifyForm.unitPriceForeignCurrency,
        currencyCode: verifyForm.currencyCode,
        exchangeRate: verifyForm.exchangeRate,
        calculationMethod: verifyForm.calculationMethod,
        percentageValue: verifyForm.calculationMethod === "Percentage" ? verifyForm.percentageValue : null,
        fixedAmount: verifyForm.calculationMethod === "Fixed" ? verifyForm.fixedAmount : null,
        standardHours: verifyForm.standardHours,
        notes: verifyForm.notes || null,
      };
      await partnerContractPaymentService.verifyContract(Number(id), payload);
      await fetchData();
      setShowVerifyContractModal(false);
      setVerifyForm({
        unitPriceForeignCurrency: 0,
        currencyCode: "USD",
        exchangeRate: 1,
        calculationMethod: "Percentage",
        percentageValue: null,
        fixedAmount: null,
        standardHours: contractPayment.standardHours || 160,
        notes: null,
      });
      setSowFile(null);
      alert("Xác minh hợp đồng thành công!");
    } catch (err: unknown) {
      console.error("❌ Lỗi xác minh hợp đồng:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể xác minh hợp đồng";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartBilling = async () => {
    if (!id || !contractPayment) return;

    if (!billingForm.actualWorkHours || billingForm.actualWorkHours <= 0) {
      alert("Vui lòng nhập số giờ làm việc thực tế");
      return;
    }
    
    // Validate worksheet file
    if (!worksheetFile) {
      alert("Vui lòng upload file Worksheet (bắt buộc)");
      return;
    }
    
    // Find Worksheet document type
    const worksheetType = Array.from(documentTypes.values()).find(
      (type) => type.typeName.toLowerCase() === "worksheet"
    );
    
    if (!worksheetType) {
      alert("Không tìm thấy loại tài liệu Worksheet. Vui lòng liên hệ quản trị viên.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Start billing
      await partnerContractPaymentService.startBilling(Number(id), billingForm);
      
      // Upload worksheet file and create document
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }
      
      const filePath = `partner-contracts/${contractPayment.id}/worksheet_${Date.now()}.${worksheetFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(worksheetFile, filePath);
      
      // Create worksheet document
      const documentData: PartnerDocumentCreate = {
        partnerContractPaymentId: Number(id),
        documentTypeId: worksheetType.id,
        fileName: worksheetFile.name,
        filePath: fileUrl,
        uploadedByUserId: userId,
        description: `Worksheet cho tính toán thanh toán - ${new Date().toLocaleDateString("vi-VN")}`,
        source: "Accountant",
      };
      await partnerDocumentService.create(documentData);
      
      await fetchData();
      setShowStartBillingModal(false);
      setBillingForm({ actualWorkHours: 0, notes: null });
      setWorksheetFile(null);
      alert("Bắt đầu tính toán thành công!");
    } catch (err: unknown) {
      console.error("❌ Lỗi bắt đầu tính toán:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể bắt đầu tính toán";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id || !contractPayment) return;

    // Validation: Số tiền đã thanh toán phải = số tiền thực tế
    if (!contractPayment.actualAmountVND || contractPayment.actualAmountVND <= 0) {
      alert("Hợp đồng chưa có số tiền thực tế. Vui lòng bắt đầu tính toán trước.");
      return;
    }

    if (!markAsPaidForm.paidAmount || markAsPaidForm.paidAmount <= 0) {
      alert("Vui lòng nhập số tiền đã thanh toán");
      return;
    }

    // Đảm bảo số tiền đã thanh toán = số tiền thực tế
    if (Math.abs(markAsPaidForm.paidAmount - contractPayment.actualAmountVND) > 0.01) {
      alert(`Số tiền đã thanh toán phải bằng số tiền thực tế (${formatCurrency(contractPayment.actualAmountVND)})`);
      return;
    }

    if (!markAsPaidForm.paymentDate) {
      alert("Vui lòng chọn ngày thanh toán");
      return;
    }

    // Validation: Ngày thanh toán phải nằm trong tháng của chu kỳ thanh toán
    if (projectPeriod) {
      const dateRange = getPeriodDateRange(projectPeriod);
      if (dateRange.minDate && dateRange.maxDate) {
        const paymentDate = markAsPaidForm.paymentDate.split('T')[0];
        if (paymentDate < dateRange.minDate || paymentDate > dateRange.maxDate) {
          alert(`Ngày thanh toán phải nằm trong tháng ${projectPeriod.periodMonth}/${projectPeriod.periodYear} (từ ${dateRange.minDate} đến ${dateRange.maxDate})`);
          return;
        }
      }
    }

    if (!paymentProofFile) {
      alert("Vui lòng chọn file chứng từ thanh toán");
      return;
    }

    if (!partnerReceiptFile) {
      alert("Vui lòng chọn file biên lai đối tác");
      return;
    }

    try {
      setIsProcessing(true);

      // Upload payment proof file (required)
      const paymentProofFilePath = `partner-payment-proofs/${contractPayment.id}/payment_proof_${Date.now()}.${paymentProofFile.name.split('.').pop()}`;
      const paymentProofFileUrl = await uploadFile(paymentProofFile, paymentProofFilePath);

      // Upload partner receipt file (required)
      const partnerReceiptFilePath = `partner-receipts/${contractPayment.id}/receipt_${Date.now()}.${partnerReceiptFile.name.split('.').pop()}`;
      const partnerReceiptFileUrl = await uploadFile(partnerReceiptFile, partnerReceiptFilePath);

      // Format paymentDate to ISO string if it's in YYYY-MM-DD format
      // Đảm bảo paidAmount = actualAmountVND
      const paymentPayload: PartnerContractPaymentMarkAsPaidModel = {
        paidAmount: contractPayment.actualAmountVND!,
        paymentDate: markAsPaidForm.paymentDate.includes('T')
          ? markAsPaidForm.paymentDate
          : new Date(markAsPaidForm.paymentDate + 'T00:00:00').toISOString(),
        notes: markAsPaidForm.notes || null,
        paymentProofFileUrl: paymentProofFileUrl,
        partnerReceiptFileUrl: partnerReceiptFileUrl,
      };

      await partnerContractPaymentService.markAsPaid(Number(id), paymentPayload);
      await fetchData();
      setShowMarkAsPaidModal(false);
      setMarkAsPaidForm({
        paidAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: null,
        paymentProofFileUrl: null,
        partnerReceiptFileUrl: null,
      });
      setPaymentProofFile(null);
      setPartnerReceiptFile(null);
      alert("Đánh dấu đã thanh toán thành công!");
    } catch (err: unknown) {
      console.error("❌ Lỗi đánh dấu đã thanh toán:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể đánh dấu đã thanh toán";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Accountant Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải thông tin hợp đồng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contractPayment) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Accountant Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium mb-2">
              {error || "Không tìm thấy hợp đồng"}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contractStatusConfig = getContractStatusConfig(contractPayment.contractStatus);
  const paymentStatusConfig = getPaymentStatusConfig(contractPayment.paymentStatus);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Accountant Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại</span>
            </button>
          </div>

          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hợp đồng #{contractPayment.contractNumber}
              </h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết hợp đồng thanh toán đối tác
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${contractStatusConfig.bgColor}`}
                >
                  {contractStatusConfig.icon}
                  <span className={`text-sm font-medium ${contractStatusConfig.color}`}>
                    {contractStatusConfig.label}
                  </span>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${paymentStatusConfig.bgColor}`}
                >
                  <span className={`text-sm font-medium ${paymentStatusConfig.color}`}>
                    {paymentStatusConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Action Buttons for Accountant */}
              {/* Verify Contract - Draft + Pending */}
              {contractPayment.contractStatus === "Draft" && contractPayment.paymentStatus === "Pending" && (
                <button
                  onClick={() => {
                    // Pre-fill form with contract payment data
                    const method = contractPayment.calculationMethod || "Percentage";
                    setVerifyForm({
                      unitPriceForeignCurrency: contractPayment.unitPriceForeignCurrency || 0,
                      currencyCode: contractPayment.currencyCode || "USD",
                      exchangeRate: contractPayment.exchangeRate || 1,
                      calculationMethod: method as "Percentage" | "Fixed",
                      percentageValue: method === "Percentage" ? (contractPayment.percentageValue ?? null) : null,
                      fixedAmount: method === "Fixed" ? (contractPayment.fixedAmount ?? contractPayment.unitPriceForeignCurrency ?? null) : null,
                      standardHours: contractPayment.standardHours || 160,
                      notes: contractPayment.notes ?? null,
                    });
                    setShowVerifyContractModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Xác minh hợp đồng
                </button>
              )}

              {/* Start Billing - Approved + Pending */}
              {contractPayment.contractStatus === "Approved" && contractPayment.paymentStatus === "Pending" && (
                <button
                  onClick={() => setShowStartBillingModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Ghi nhận giờ làm việc
                </button>
              )}

              {/* Mark as Paid - Processing */}
              {contractPayment.paymentStatus === "Processing" && (
                <button
                  onClick={() => {
                    setMarkAsPaidForm({
                      ...markAsPaidForm,
                      paidAmount: contractPayment.actualAmountVND || 0,
                    });
                    setShowMarkAsPaidModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Xác nhận đã thanh toán
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 animate-fade-in">
          {/* Tab Headers */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveMainTab("contract")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeMainTab === "contract"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Thông tin hợp đồng
              </button>
              <button
                onClick={() => setActiveMainTab("payment")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeMainTab === "payment"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Thanh toán
              </button>
              <button
                onClick={() => setActiveMainTab("documents")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeMainTab === "documents"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Tài liệu
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab: Thông tin hợp đồng */}
            {activeMainTab === "contract" && (
              <div className="space-y-6">
                {/* Thông tin hợp đồng */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Thông tin hợp đồng
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem
                  icon={<FileText className="w-4 h-4" />}
                  label="Số hợp đồng"
                  value={contractPayment.contractNumber}
                />
                <InfoItem
                  icon={<FileText className="w-4 h-4" />}
                  label="Trạng thái hợp đồng"
                  value={
                    <span className={`px-2 py-1 rounded text-xs font-medium ${contractStatusConfig.bgColor} ${contractStatusConfig.color}`}>
                      {contractStatusConfig.label}
                    </span>
                  }
                />
                <InfoItem
                  icon={<FileText className="w-4 h-4" />}
                  label="Trạng thái thanh toán"
                  value={
                    <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusConfig.bgColor} ${paymentStatusConfig.color}`}>
                      {paymentStatusConfig.label}
                    </span>
                  }
                />
                  </div>
                </div>

                {/* Thông tin chung */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Thông tin chung
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem
                      icon={<Building2 className="w-4 h-4" />}
                      label="Đối tác"
                      value={partnerName}
                    />
                    <InfoItem
                      icon={<Briefcase className="w-4 h-4" />}
                      label="Dự án"
                      value={projectName}
                    />
                    <InfoItem
                      icon={<UserCheck className="w-4 h-4" />}
                      label="Nhân sự"
                      value={talentName}
                    />
                    {projectPeriod && (
                      <InfoItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Chu kỳ thanh toán"
                        value={`Tháng ${projectPeriod.periodMonth}/${projectPeriod.periodYear}`}
                      />
                    )}
                    {talentAssignment && (
                      <>
                        <InfoItem
                          icon={<Calendar className="w-4 h-4" />}
                          label="Ngày bắt đầu assignment"
                          value={formatDate(talentAssignment.startDate)}
                        />
                        <InfoItem
                          icon={<Calendar className="w-4 h-4" />}
                          label="Ngày kết thúc assignment"
                          value={talentAssignment.endDate ? formatDate(talentAssignment.endDate) : "Đang hiệu lực"}
                        />
                      </>
                    )}
                    <InfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Ngày tạo"
                      value={formatDate(contractPayment.createdAt)}
                    />
                    {contractPayment.updatedAt && (
                      <InfoItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Ngày cập nhật"
                        value={formatDate(contractPayment.updatedAt)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Thanh toán */}
            {activeMainTab === "payment" && (
              <div className="space-y-6">
                {/* Thông tin tiền tệ và tỷ giá */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Thông tin tiền tệ và tỷ giá
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Đơn giá ngoại tệ"
                  value={`${formatCurrency(contractPayment.unitPriceForeignCurrency)} ${contractPayment.currencyCode}`}
                />
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Tỷ giá"
                  value={contractPayment.exchangeRate ? contractPayment.exchangeRate.toLocaleString("vi-VN") : "—"}
                />
                <InfoItem
                  icon={<FileText className="w-4 h-4" />}
                  label="Phương pháp tính"
                  value={contractPayment.calculationMethod === "Percentage" ? "Theo phần trăm" : contractPayment.calculationMethod === "Fixed" ? "Số tiền cố định" : "Số tiền cố định"}
                />
                {contractPayment.calculationMethod === "Percentage" && contractPayment.percentageValue !== null && contractPayment.percentageValue !== undefined && (
                  <InfoItem
                    icon={<FileText className="w-4 h-4" />}
                    label="Giá trị phần trăm"
                    value={`${contractPayment.percentageValue}%`}
                  />
                )}
                {contractPayment.calculationMethod === "Fixed" && contractPayment.fixedAmount !== null && contractPayment.fixedAmount !== undefined && (
                  <InfoItem
                    icon={<FileText className="w-4 h-4" />}
                    label="Số tiền cố định"
                    value={formatCurrency(contractPayment.fixedAmount)}
                  />
                )}
                <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Số giờ tiêu chuẩn"
                  value={`${contractPayment.standardHours} giờ`}
                />
                {contractPayment.plannedAmountVND !== null && contractPayment.plannedAmountVND !== undefined && (
                  <InfoItem
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Số tiền dự kiến (VND)"
                    value={formatCurrency(contractPayment.plannedAmountVND)}
                  />
                )}
                  </div>
                </div>

                {/* Thông tin thanh toán */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Thông tin thanh toán
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contractPayment.reportedHours !== null && contractPayment.reportedHours !== undefined && (
                  <InfoItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Số giờ đã báo cáo"
                    value={`${contractPayment.reportedHours} giờ`}
                  />
                )}
                {contractPayment.manMonthCoefficient !== null && contractPayment.manMonthCoefficient !== undefined && (
                  <InfoItem
                    icon={<FileText className="w-4 h-4" />}
                    label="Hệ số man-month"
                    value={parseFloat(contractPayment.manMonthCoefficient.toFixed(4)).toString()}
                  />
                )}
                {contractPayment.actualAmountVND !== null && contractPayment.actualAmountVND !== undefined && (
                  <InfoItem
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Số tiền thực tế (VND)"
                    value={formatCurrency(contractPayment.actualAmountVND)}
                  />
                )}
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Tổng đã thanh toán"
                  value={formatCurrency(contractPayment.totalPaidAmount)}
                />
                {contractPayment.paymentDate && (
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Ngày thanh toán"
                    value={formatDate(contractPayment.paymentDate)}
                  />
                )}
                  </div>

                  {contractPayment.rejectionReason && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <p className="text-sm font-medium text-red-600">Lý do từ chối</p>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{contractPayment.rejectionReason}</p>
                    </div>
                  )}

                  {contractPayment.notes && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <StickyNote className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm font-medium text-neutral-600">Ghi chú</p>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{contractPayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Tài liệu */}
            {activeMainTab === "documents" && (
              <div>
                {partnerDocuments.length > 0 ? (() => {
                  // Get unique document types from documents
                  const documentTypeIds = Array.from(new Set(partnerDocuments.map(doc => doc.documentTypeId)));
                  const availableTypes = documentTypeIds
                    .map(id => documentTypes.get(id))
                    .filter((type): type is DocumentType => type !== undefined);

                  // Filter documents by active tab
                  const filteredDocuments = activeDocumentTab === "all"
                    ? partnerDocuments
                    : partnerDocuments.filter(doc => doc.documentTypeId === activeDocumentTab);

                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm font-medium text-neutral-600">Tài liệu đối tác</p>
                      </div>
                      
                      {/* Tab Headers */}
                      <div className="border-b border-neutral-200 mb-4">
                        <div className="flex overflow-x-auto scrollbar-hide">
                          <button
                            onClick={() => setActiveDocumentTab("all")}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                              activeDocumentTab === "all"
                                ? "border-primary-600 text-primary-600 bg-primary-50"
                                : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                            }`}
                          >
                            Tất cả
                            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                              {partnerDocuments.length}
                            </span>
                          </button>
                          {availableTypes.map((type) => {
                            const count = partnerDocuments.filter(doc => doc.documentTypeId === type.id).length;
                            return (
                              <button
                                key={type.id}
                                onClick={() => setActiveDocumentTab(type.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                                  activeDocumentTab === type.id
                                    ? "border-primary-600 text-primary-600 bg-primary-50"
                                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                                }`}
                              >
                                {type.typeName}
                                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700">
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Documents List */}
                      <div className="space-y-3">
                        {filteredDocuments.length > 0 ? (
                          filteredDocuments.map((doc) => {
                            const docType = documentTypes.get(doc.documentTypeId);
                            return (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    {docType && (
                                      <span className="text-xs text-gray-500">
                                        Loại: {docType.typeName}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {formatDate(doc.uploadTimestamp)}
                                    </span>
                                  </div>
                                  {doc.description && (
                                    <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <a
                                    href={doc.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span className="text-sm font-medium">Xem</span>
                                  </a>
                                  <a
                                    href={doc.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span className="text-sm font-medium">Tải xuống</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Không có tài liệu nào trong loại này
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Chưa có tài liệu nào</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Verify Contract Modal */}
      {showVerifyContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Xác minh hợp đồng</h3>
              <button onClick={() => setShowVerifyContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Đơn giá ngoại tệ ({verifyForm.currencyCode}) <span className="text-red-500">*</span>
                    {verifyForm.calculationMethod === "Fixed" && (
                      <span className="ml-2 text-xs text-gray-500">(Phải bằng số tiền cố định)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(verifyForm.unitPriceForeignCurrency)}
                    onChange={(e) => {
                      const value = parseNumberInput(e.target.value);
                      if (verifyForm.calculationMethod === "Fixed") {
                        setVerifyForm({ ...verifyForm, unitPriceForeignCurrency: value, fixedAmount: value });
                      } else {
                        setVerifyForm({ ...verifyForm, unitPriceForeignCurrency: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Format lại khi blur
                      const value = parseNumberInput(e.target.value);
                      if (value !== verifyForm.unitPriceForeignCurrency) {
                        if (verifyForm.calculationMethod === "Fixed") {
                          setVerifyForm({ ...verifyForm, unitPriceForeignCurrency: value, fixedAmount: value });
                        } else {
                          setVerifyForm({ ...verifyForm, unitPriceForeignCurrency: value });
                        }
                      }
                    }}
                    maxLength={20}
                    className="w-full border rounded-lg p-2"
                    placeholder="Ví dụ: 30.000.000"
                    required
                    disabled={verifyForm.calculationMethod === "Fixed"}
                  />
                  {verifyForm.calculationMethod === "Fixed" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Đơn giá ngoại tệ sẽ tự động cập nhật khi nhập số tiền cố định
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mã tiền tệ</label>
                  <select
                    value={verifyForm.currencyCode}
                    onChange={(e) => setVerifyForm({ ...verifyForm, currencyCode: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="VND">VND</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tỷ giá <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={verifyForm.exchangeRate}
                    onChange={(e) => setVerifyForm({ ...verifyForm, exchangeRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phương pháp tính</label>
                  <select
                    value={verifyForm.calculationMethod}
                    onChange={(e) => {
                      const newMethod = e.target.value as "Percentage" | "Fixed";
                      if (newMethod === "Percentage") {
                        setVerifyForm({ 
                          ...verifyForm, 
                          calculationMethod: newMethod, 
                          fixedAmount: null,
                          unitPriceForeignCurrency: verifyForm.unitPriceForeignCurrency || 0
                        });
                      } else if (newMethod === "Fixed") {
                        setVerifyForm({ 
                          ...verifyForm, 
                          calculationMethod: newMethod, 
                          percentageValue: null,
                          fixedAmount: verifyForm.fixedAmount || verifyForm.unitPriceForeignCurrency || 0,
                          unitPriceForeignCurrency: verifyForm.fixedAmount || verifyForm.unitPriceForeignCurrency || 0
                        });
                      }
                    }}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Percentage">Theo phần trăm</option>
                    <option value="Fixed">Số tiền cố định</option>
                  </select>
                </div>
                {verifyForm.calculationMethod === "Percentage" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Giá trị phần trăm (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={verifyForm.percentageValue || ""}
                      onChange={(e) => setVerifyForm({ ...verifyForm, percentageValue: parseFloat(e.target.value) || null, fixedAmount: null })}
                      className="w-full border rounded-lg p-2"
                      placeholder="Ví dụ: 100 (full month), 120 (overtime)"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ví dụ: 100% (full month), 120% (overtime)
                    </p>
                  </div>
                )}
                {verifyForm.calculationMethod === "Fixed" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số tiền cố định ({verifyForm.currencyCode}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(verifyForm.fixedAmount)}
                      onChange={(e) => {
                        const fixedValue = parseNumberInput(e.target.value);
                        setVerifyForm({ 
                          ...verifyForm, 
                          fixedAmount: fixedValue || null,
                          unitPriceForeignCurrency: fixedValue || 0,
                          percentageValue: null
                        });
                      }}
                      onBlur={(e) => {
                        // Format lại khi blur
                        const fixedValue = parseNumberInput(e.target.value);
                        if (fixedValue !== (verifyForm.fixedAmount || 0)) {
                          setVerifyForm({ 
                            ...verifyForm, 
                            fixedAmount: fixedValue || null,
                            unitPriceForeignCurrency: fixedValue || 0,
                            percentageValue: null
                          });
                        }
                      }}
                      maxLength={20}
                      className="w-full border rounded-lg p-2"
                      placeholder="Ví dụ: 30.000.000"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Đơn giá ngoại tệ sẽ tự động cập nhật bằng số tiền cố định
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số giờ tiêu chuẩn (Standard Hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={verifyForm.standardHours}
                    onChange={(e) => setVerifyForm({ ...verifyForm, standardHours: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2"
                    placeholder="Ví dụ: 160 (full month), 132 (mid-month)"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ví dụ: 160 giờ (full month), 132 giờ (mid-month)
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File Excel SOW <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSowFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Vui lòng upload file Excel SOW (.xlsx, .xls)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={verifyForm.notes || ""}
                  onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Ví dụ: Standard full month contract"
                />
              </div>
              {/* Hiển thị tính toán PlannedAmountVND */}
              {verifyForm.calculationMethod === "Percentage" && verifyForm.unitPriceForeignCurrency && verifyForm.exchangeRate && verifyForm.percentageValue && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Tính toán PlannedAmountVND:</p>
                  <p className="text-sm text-blue-800">
                    PlannedAmountVND = {verifyForm.unitPriceForeignCurrency.toLocaleString("vi-VN")} × {verifyForm.exchangeRate.toLocaleString("vi-VN")} × ({verifyForm.percentageValue} / 100)
                  </p>
                  <p className="text-sm text-blue-800">
                    = {(verifyForm.unitPriceForeignCurrency * verifyForm.exchangeRate).toLocaleString("vi-VN")} × {(verifyForm.percentageValue / 100).toFixed(2)}
                  </p>
                  <p className="text-sm font-bold text-blue-900 mt-1">
                    = {calculatePlannedAmountVND()?.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              )}
              {verifyForm.calculationMethod === "Fixed" && verifyForm.fixedAmount && verifyForm.exchangeRate && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2">Tính toán PlannedAmountVND:</p>
                  <p className="text-sm text-green-800">
                    PlannedAmountVND = {verifyForm.fixedAmount.toLocaleString("vi-VN")} × {verifyForm.exchangeRate.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-sm font-bold text-green-900 mt-1">
                    = {calculatePlannedAmountVND()?.toLocaleString("vi-VN")} VND
                  </p>
                  <p className="text-xs text-green-700 mt-2 italic">
                    Lưu ý: Số tiền cố định không phụ thuộc vào số giờ làm việc
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowVerifyContractModal(false);
                  setVerifyForm({
                    unitPriceForeignCurrency: 0,
                    currencyCode: "USD",
                    exchangeRate: 1,
                    calculationMethod: "Percentage",
                    percentageValue: null,
                    fixedAmount: null,
                    standardHours: contractPayment?.standardHours || 160,
                    notes: null,
                  });
                  setSowFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleVerifyContract}
                disabled={
                  isProcessing || 
                  !sowFile ||
                  !verifyForm.unitPriceForeignCurrency || 
                  !verifyForm.exchangeRate || 
                  !verifyForm.standardHours ||
                  verifyForm.standardHours <= 0 ||
                  (verifyForm.calculationMethod === "Percentage" && (!verifyForm.percentageValue || verifyForm.percentageValue <= 0)) ||
                  (verifyForm.calculationMethod === "Fixed" && (!verifyForm.fixedAmount || verifyForm.fixedAmount <= 0))
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác minh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Billing Modal */}
      {showStartBillingModal && contractPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bắt đầu tính toán</h3>
              <button onClick={() => setShowStartBillingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số giờ làm việc thực tế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={billingForm.actualWorkHours || ""}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, actualWorkHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phương pháp tính</label>
                  <input
                    type="text"
                    value={contractPayment.calculationMethod === "Percentage" ? "Theo phần trăm" : contractPayment.calculationMethod === "Fixed" ? "Số tiền cố định" : contractPayment.calculationMethod}
                    className="w-full border rounded-lg p-2 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={billingForm.notes || ""}
                  onChange={(e) => setBillingForm({ ...billingForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Ví dụ: Timesheet: 160h đúng như dự kiến"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File Worksheet <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setWorksheetFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  accept=".xlsx,.xls,.csv"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng upload file Worksheet (Excel/CSV) cho việc tính toán thanh toán
                </p>
              </div>

              {/* Preview tính toán */}
              {billingForm.actualWorkHours > 0 && calculateBillingPreview() && (() => {
                const preview = calculateBillingPreview();
                if (!preview) return null;

                if (preview.type === "Fixed") {
                  return (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-900 mb-3">Tính toán (Fixed):</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-green-800">
                          <span className="font-medium">Actual Work Hours:</span> {preview.actualWorkHours}h
                        </p>
                        <p className="text-green-800">
                          <span className="font-medium">ManMonthCoefficient:</span> {preview.manMonthCoefficient?.toFixed(4) ?? '0.0000'} (chỉ để tracking)
                        </p>
                        <p className="text-green-800">
                          <span className="font-medium">PlannedAmountVND:</span> {preview.plannedAmountVND?.toLocaleString("vi-VN") ?? '0'} VND
                        </p>
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <p className="text-green-900 font-bold">
                            <span className="font-medium">ActualAmountVND:</span> {preview.actualAmountVND.toLocaleString("vi-VN")} VND
                          </p>
                          <p className="text-xs text-green-700 mt-2 italic">
                            Lưu ý: Contract Fixed nên ActualAmountVND = PlannedAmountVND (không thay đổi dù làm nhiều hay ít giờ)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (preview.type === "Percentage") {
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-3">Tính toán (Percentage):</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-800">
                          <span className="font-medium">BaseRate:</span> {preview.baseRate?.toFixed(4) ?? '0.0000'} {contractPayment.currencyCode}/giờ
                        </p>
                        <p className="text-blue-800">
                          <span className="font-medium">Actual Work Hours:</span> {preview.actualWorkHours}h
                        </p>
                        <div className="mt-3 pt-3 border-t border-blue-300">
                          <p className="text-blue-900 font-medium mb-2">Tier Breakdown:</p>
                          <div className="space-y-1">
                            {preview.tierBreakdown?.map((tier, idx) => (
                              <p key={idx} className="text-blue-800 text-xs">
                                {tier.tier}: {tier.hours}h × {tier.rate.toFixed(4)} × {tier.multiplier} = {tier.amountUSD.toFixed(2)} {contractPayment.currencyCode} = {tier.amountVND.toLocaleString("vi-VN")} VND
                              </p>
                            )) ?? []}
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <p className="text-blue-900 font-bold">
                              <span className="font-medium">TỔNG:</span> {preview.totalAmountUSD?.toFixed(2) ?? '0.00'} {contractPayment.currencyCode} = {preview.actualAmountVND?.toLocaleString("vi-VN") ?? '0'} VND
                            </p>
                            <p className="text-blue-800 mt-2">
                              <span className="font-medium">EffectiveCoefficient:</span> {preview.effectiveCoefficient?.toFixed(4) ?? '0.0000'} = {preview.totalAmountUSD?.toFixed(2) ?? '0.00'} / {contractPayment.unitPriceForeignCurrency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowStartBillingModal(false);
                  setBillingForm({ actualWorkHours: 0, notes: null });
                  setWorksheetFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleStartBilling}
                disabled={isProcessing || !billingForm.actualWorkHours || billingForm.actualWorkHours <= 0 || !worksheetFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tính toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkAsPaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Xác nhận đã thanh toán</h3>
              <button onClick={() => setShowMarkAsPaidModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Số tiền đã thanh toán <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(contractPayment?.actualAmountVND || markAsPaidForm.paidAmount || 0)}
                  readOnly
                  disabled
                  className="w-full border rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                  required
                />
                {contractPayment?.actualAmountVND && (
                  <p className="mt-1 text-xs text-gray-500">
                    Số tiền đã thanh toán phải bằng số tiền thực tế ({formatCurrency(contractPayment.actualAmountVND)})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ngày thanh toán <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={markAsPaidForm.paymentDate}
                  min={getPeriodDateRange(projectPeriod).minDate || undefined}
                  max={getPeriodDateRange(projectPeriod).maxDate || undefined}
                  onChange={(e) => setMarkAsPaidForm({ ...markAsPaidForm, paymentDate: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
                {projectPeriod && (
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ được chọn trong tháng {projectPeriod.periodMonth}/{projectPeriod.periodYear}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File chứng từ thanh toán <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  required
                />
                {paymentProofFile && (
                  <p className="text-sm text-gray-600 mt-1">Đã chọn: {paymentProofFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File biên lai đối tác <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setPartnerReceiptFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  required
                />
                {partnerReceiptFile && (
                  <p className="text-sm text-gray-600 mt-1">Đã chọn: {partnerReceiptFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={markAsPaidForm.notes || ""}
                  onChange={(e) => setMarkAsPaidForm({ ...markAsPaidForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowMarkAsPaidModal(false);
                  setMarkAsPaidForm({
                    paidAmount: 0,
                    paymentDate: new Date().toISOString().split('T')[0],
                    notes: null,
                    paymentProofFileUrl: null,
                    partnerReceiptFileUrl: null,
                  });
                  setPaymentProofFile(null);
                  setPartnerReceiptFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={
                  isProcessing ||
                  !contractPayment?.actualAmountVND ||
                  contractPayment.actualAmountVND <= 0 ||
                  !markAsPaidForm.paymentDate ||
                  !paymentProofFile ||
                  !partnerReceiptFile
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-neutral-400">{icon}</div>}
        <p className="text-neutral-500 text-sm font-medium">{label}</p>
      </div>
      {typeof value === "string" ? (
        <p className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
          {value || "—"}
        </p>
      ) : (
        <div className="text-gray-900 font-semibold group-hover:text-primary-700 transition-colors duration-300">
          {value}
        </div>
      )}
    </div>
  );
}


