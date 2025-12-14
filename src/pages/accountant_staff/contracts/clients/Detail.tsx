import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Building2,
  Briefcase,
  User,
  FileText,
  DollarSign,
  FileCheck,
  StickyNote,
  XCircle,
  X,
  Calculator,
  Receipt,
  CreditCard,
  Ban,
  Loader2,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/accountant";
import {
  clientContractPaymentService,
  type ClientContractPaymentModel,
  type VerifyContractModel,
  type RejectContractModel,
  type ClientContractPaymentCalculateModel,
  type CreateInvoiceModel,
  type RecordPaymentModel,
  type RequestMoreInformationModel,
} from "../../../../services/ClientContractPayment";
import { projectPeriodService, type ProjectPeriodModel } from "../../../../services/ProjectPeriod";
import { talentAssignmentService, type TalentAssignmentModel } from "../../../../services/TalentAssignment";
import { projectService } from "../../../../services/Project";
import { clientCompanyService } from "../../../../services/ClientCompany";
import { partnerService } from "../../../../services/Partner";
import { talentService } from "../../../../services/Talent";
import { clientDocumentService, type ClientDocument, type ClientDocumentCreate } from "../../../../services/ClientDocument";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import {
  partnerContractPaymentService,
  type PartnerContractPaymentModel,
} from "../../../../services/PartnerContractPayment";
import { partnerDocumentService } from "../../../../services/PartnerDocument";
import { uploadFile } from "../../../../utils/firebaseStorage";
import { useAuth } from "../../../../context/AuthContext";
import { decodeJWT } from "../../../../services/Auth";
import { getAccessToken } from "../../../../utils/storage";
import { formatNumberInput, parseNumberInput } from "../../../../utils/formatters";

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

// Helper function to convert ISO date string to YYYY-MM-DD format for date input (handles timezone correctly)
const toDateInputValue = (dateStr?: string | null): string | undefined => {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) return undefined;
    // Format as YYYY-MM-DD using local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return undefined;
  }
};

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Tính khoảng ngày (YYYY-MM-DD) trong tháng của chu kỳ thanh toán
const getPeriodDateRange = (
  period: ProjectPeriodModel | null
): { minDate: string | null; maxDate: string | null } => {
  if (!period) return { minDate: null, maxDate: null };
  const year = period.periodYear;
  const monthIndex = period.periodMonth - 1; // JS month: 0-11

  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0); // ngày 0 của tháng sau = ngày cuối tháng hiện tại

  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return { minDate: toYmd(first), maxDate: toYmd(last) };
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
  NeedMoreInformation: {
    label: "Cần thêm thông tin",
    color: "text-yellow-800",
    bgColor: "bg-yellow-50 border border-yellow-200",
    icon: <Clock className="w-4 h-4" />,
  },
  Submitted: {
    label: "Chờ xác minh",
    color: "text-blue-800",
    bgColor: "bg-blue-50 border border-blue-200",
    icon: <FileCheck className="w-4 h-4" />,
  },
  Verified: {
    label: "Chờ duyệt",
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
  Rejected: {
    label: "Từ chối",
    color: "text-red-800",
    bgColor: "bg-red-50 border border-red-200",
    icon: <XCircle className="w-4 h-4" />,
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
  Invoiced: {
    label: "Đã xuất hóa đơn",
    color: "text-blue-800",
    bgColor: "bg-blue-50 border border-blue-200",
  },
  PartiallyPaid: {
    label: "Đã thanh toán một phần",
    color: "text-orange-800",
    bgColor: "bg-orange-50 border border-orange-200",
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

// Helper functions để format số bỏ số 0 thừa với format Việt Nam
// - Phần nguyên: dùng dấu chấm phân cách hàng nghìn (1000 -> 1.000, 1000000 -> 1.000.000)
// - Phần thập phân: xóa trailing zeros, dùng dấu phẩy (6.2500 -> 6,25, 1000.00 -> 1.000)
const formatNumberWithoutTrailingZeros = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) return "0";
  
  // Tách phần nguyên và phần thập phân
  const isInteger = Number.isInteger(num);
  
  if (isInteger) {
    // Nếu là số nguyên, format với dấu chấm phân cách hàng nghìn
    return num.toLocaleString("vi-VN");
  }
  
  // Nếu có phần thập phân, xử lý riêng
  // Dùng toFixed với độ chính xác cao để giữ lại tất cả chữ số
  let str = num.toFixed(15);
  
  // Tách phần nguyên và phần thập phân
  const parts = str.split('.');
  const integerPart = parseInt(parts[0], 10);
  let decimalPart = parts[1] || '';
  
  // Xóa trailing zeros trong phần thập phân
  decimalPart = decimalPart.replace(/0+$/, '');
  
  // Format phần nguyên với dấu chấm phân cách hàng nghìn
  const formattedInteger = integerPart.toLocaleString("vi-VN");
  
  // Nếu phần thập phân chỉ có số 0 hoặc rỗng, chỉ trả về phần nguyên
  if (!decimalPart || decimalPart === '') {
    return formattedInteger;
  }
  
  // Nếu có phần thập phân, kết hợp với dấu phẩy (format VN)
  return `${formattedInteger},${decimalPart}`;
};

// Helper function to format number with Vietnamese locale, removing trailing zeros
const formatNumberVi = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) return "0";
  // First remove trailing zeros by parsing
  const numWithoutZeros = parseFloat(num.toString());
  // If it's a whole number, format without decimals
  if (Number.isInteger(numWithoutZeros)) {
    return numWithoutZeros.toLocaleString("vi-VN");
  }
  // For decimal numbers, format with Vietnamese locale
  const formatted = numWithoutZeros.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  });
  // Remove trailing zeros if any remain after formatting
  return formatted.replace(/\.?0+$/, '');
};

// Helper function to map document type name to display name
const getDocumentTypeDisplayName = (typeName: string): string => {
  const normalizedName = typeName.toLowerCase().trim();
  switch (normalizedName) {
    case "statementofwork":
    case "statement of work":
      return "SOW";
    case "receipt":
      return "Biên lai";
    case "invoice":
      return "Hóa đơn";
    case "purchase order":
      return "PO";
    case "payment order":
      return "UNC";
    case "contract":
      return "Hợp đồng";
    case "timesheet":
      return "Timesheet";
    default:
      return typeName; // Return original if no mapping found
  }
};

export default function ClientContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractPayment, setContractPayment] = useState<ClientContractPaymentModel | null>(null);
  const [partnerContractPayment, setPartnerContractPayment] = useState<PartnerContractPaymentModel | null>(null);
  const [projectPeriod, setProjectPeriod] = useState<ProjectPeriodModel | null>(null);
  const [talentAssignment, setTalentAssignment] = useState<TalentAssignmentModel | null>(null);
  const [projectName, setProjectName] = useState<string>("—");
  const [clientCompanyName, setClientCompanyName] = useState<string>("—");
  const [partnerName, setPartnerName] = useState<string>("—");
  const [talentName, setTalentName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Map<number, DocumentType>>(new Map());
  const [activeDocumentTab, setActiveDocumentTab] = useState<number | "all">("all");
  const [activeMainTab, setActiveMainTab] = useState<string>("contract");

  // Modal states
  const [showRequestMoreInfoModal, setShowRequestMoreInfoModal] = useState(false);
  const [showVerifyContractModal, setShowVerifyContractModal] = useState(false);
  const [showRejectContractModal, setShowRejectContractModal] = useState(false);
  const [showStartBillingModal, setShowStartBillingModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  // Form states
  const [verifyForm, setVerifyForm] = useState<VerifyContractModel>({ notes: null });
  const [rejectForm, setRejectForm] = useState<RejectContractModel>({ rejectionReason: "" });
  const [requestMoreInfoForm, setRequestMoreInfoForm] = useState<RequestMoreInformationModel>({ notes: null });
  const [billingForm, setBillingForm] = useState<ClientContractPaymentCalculateModel>({ billableHours: 0, autoSyncToPartner: true, notes: null });
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceModel>({ invoiceNumber: "", invoiceDate: new Date().toISOString().split('T')[0], notes: null });
  const [paymentForm, setPaymentForm] = useState<RecordPaymentModel>({ receivedAmount: 0, paymentDate: new Date().toISOString().split('T')[0], notes: null });
  const [paymentDateError, setPaymentDateError] = useState<string | null>(null);
  const [paymentAmountError, setPaymentAmountError] = useState<string | null>(null);

  // File states
  const [verifyContractFile, setVerifyContractFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);

  // Loading states for actions
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current user
  const authContext = useAuth();
  const user = authContext?.user || null;
  
  // Helper to get current user ID from JWT
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

  useEffect(() => {
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
        const paymentData = await clientContractPaymentService.getById(Number(id));
        setContractPayment(paymentData);

        // Fetch related data in parallel
        const [periodData, assignmentData] = await Promise.all([
          projectPeriodService.getById(paymentData.projectPeriodId).catch(() => null),
          talentAssignmentService.getById(paymentData.talentAssignmentId).catch(() => null),
        ]);

        setProjectPeriod(periodData);
        setTalentAssignment(assignmentData);

        // Fetch corresponding partner contract payment
        try {
          const data = await partnerContractPaymentService.getAll({
            projectPeriodId: paymentData.projectPeriodId,
            talentAssignmentId: paymentData.talentAssignmentId,
            excludeDeleted: true,
          });
          // Xử lý format dữ liệu trả về (có thể là array hoặc object có items)
          const partnerPayments = Array.isArray(data) ? data : ((data as any)?.items || []);
          if (partnerPayments && partnerPayments.length > 0) {
            setPartnerContractPayment(partnerPayments[0]);
          } else {
            setPartnerContractPayment(null);
          }
        } catch (err) {
          console.error("❌ Lỗi tải hợp đồng đối tác tương ứng:", err);
          setPartnerContractPayment(null);
        }

        // Fetch project info
        if (assignmentData) {
          try {
            const project = await projectService.getById(assignmentData.projectId);
            setProjectName(project?.name || paymentData.projectName || "—");
          } catch {
            setProjectName(paymentData.projectName || "—");
          }

          // Fetch client company info
          try {
            const project = await projectService.getById(assignmentData.projectId);
            if (project?.clientCompanyId) {
              const company = await clientCompanyService.getById(project.clientCompanyId);
              setClientCompanyName(company?.name || paymentData.clientCompanyName || "—");
            } else {
              setClientCompanyName(paymentData.clientCompanyName || "—");
            }
          } catch {
            setClientCompanyName(paymentData.clientCompanyName || "—");
          }

          // Fetch partner info
          try {
            const partner = await partnerService.getDetailedById(assignmentData.partnerId);
            setPartnerName(partner?.companyName || paymentData.partnerName || "—");
          } catch {
            setPartnerName(paymentData.partnerName || "—");
          }

          // Fetch talent info
          try {
            const talent = await talentService.getById(assignmentData.talentId);
            setTalentName(talent?.fullName || paymentData.talentName || "—");
          } catch {
            setTalentName(paymentData.talentName || "—");
          }
        } else {
          // Fallback to navigation properties if assignment not found
          setProjectName(paymentData.projectName || "—");
          setClientCompanyName(paymentData.clientCompanyName || "—");
          setPartnerName(paymentData.partnerName || "—");
          setTalentName(paymentData.talentName || "—");
        }
      } catch (err: unknown) {
        console.error("❌ Lỗi tải thông tin hợp đồng thanh toán khách hàng:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin hợp đồng thanh toán khách hàng"
        );
      } finally {
        setLoading(false);
      }
    };

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

  // Load client documents
  useEffect(() => {
    const loadClientDocuments = async () => {
      if (!id) return;
      try {
        const data = await clientDocumentService.getAll({
          clientContractPaymentId: Number(id),
          excludeDeleted: true,
        });
        const documents = Array.isArray(data) ? data : (data?.items || []);
        setClientDocuments(documents);
      } catch (err: any) {
        console.error("❌ Lỗi tải tài liệu khách hàng:", err);
      }
    };
    loadClientDocuments();
  }, [id]);

  // Refresh contract payment data
  const refreshContractPayment = async () => {
    if (!id) return;
    try {
      const paymentData = await clientContractPaymentService.getById(Number(id));
      setContractPayment(paymentData);
      
      // Refresh partner contract payment nếu có
      if (paymentData.projectPeriodId && paymentData.talentAssignmentId) {
        try {
          const data = await partnerContractPaymentService.getAll({
            projectPeriodId: paymentData.projectPeriodId,
            talentAssignmentId: paymentData.talentAssignmentId,
            excludeDeleted: true,
          });
          const partnerPayments = Array.isArray(data) ? data : ((data as any)?.items || []);
          if (partnerPayments && partnerPayments.length > 0) {
            setPartnerContractPayment(partnerPayments[0]);
          } else {
            setPartnerContractPayment(null);
          }
        } catch (err) {
          console.error("❌ Lỗi refresh partner contract payment:", err);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi refresh hợp đồng:", err);
    }
  };

  // Handler: Request More Information
  const handleRequestMoreInformation = async () => {
    if (!id || !contractPayment) return;
    try {
      setIsProcessing(true);
      await clientContractPaymentService.requestMoreInformation(Number(id), requestMoreInfoForm);
      alert("Đã yêu cầu thêm thông tin thành công!");
      await refreshContractPayment();
      setShowRequestMoreInfoModal(false);
      setRequestMoreInfoForm({ notes: null });
    } catch (err: any) {
      alert(err?.message || "Lỗi khi yêu cầu thêm thông tin");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Verify Contract
  const handleVerifyContract = async () => {
    if (!id || !contractPayment || !verifyContractFile) {
      alert("Vui lòng upload file hợp đồng chuẩn");
      return;
    }
    try {
      setIsProcessing(true);
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }

      // Upload verified contract file
      const filePath = `client-contracts/${contractPayment.id}/verified-contract_${Date.now()}.${verifyContractFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(verifyContractFile, filePath);

      // Find Contract document type
      const contractType = Array.from(documentTypes.values()).find(
        (type) => type.typeName.toLowerCase() === "contract"
      );

      if (!contractType) {
        alert("Không tìm thấy loại tài liệu Hợp đồng. Vui lòng liên hệ quản trị viên.");
        return;
      }

      // Create ClientDocument for verified contract
      const documentPayload: ClientDocumentCreate = {
        clientContractPaymentId: Number(id),
        documentTypeId: contractType.id,
        fileName: verifyContractFile.name,
        filePath: fileUrl,
        uploadedByUserId: userId,
        description: "Hợp đồng đã xác minh",
        source: "Accountant",
      };
      await clientDocumentService.create(documentPayload);

      // Verify contract
      await clientContractPaymentService.verifyContract(Number(id), verifyForm);
      alert("Xác minh hợp đồng thành công!");
      await refreshContractPayment();
      setShowVerifyContractModal(false);
      setVerifyForm({ notes: null });
      setVerifyContractFile(null);
    } catch (err: any) {
      alert(err?.message || "Lỗi khi xác minh hợp đồng");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Reject Contract
  const handleRejectContract = async () => {
    if (!id || !contractPayment || !rejectForm.rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setIsProcessing(true);
      
      // Lưu contract status trước khi reject (không sử dụng nhưng giữ lại để tracking)
      // const previousStatus = contractPayment.contractStatus;
      
      // Reject contract (sẽ quay về Draft)
      await clientContractPaymentService.rejectContract(Number(id), rejectForm);
      
      // Khi contract về Draft, xóa tất cả client documents liên quan
      // Vì những tài liệu bị từ chối thì không còn hiệu lực nữa
      try {
        // Lấy tất cả client documents liên quan đến contract này
        const data = await clientDocumentService.getAll({
          clientContractPaymentId: Number(id),
          excludeDeleted: true,
        });
        
        // Xử lý format dữ liệu trả về (có thể là array hoặc object có items)
        const documents = Array.isArray(data) ? data : (data?.items || []);
        
        // Xóa từng document
        if (documents && documents.length > 0) {
          for (const doc of documents) {
            try {
              await clientDocumentService.delete(doc.id);
            } catch (docErr) {
              console.error(`❌ Lỗi khi xóa client document ${doc.id}:`, docErr);
              // Tiếp tục xóa các document khác dù có lỗi
            }
          }
        }
      } catch (docErr) {
        console.error("❌ Lỗi khi xóa client documents:", docErr);
        // Không throw error để không ảnh hưởng đến việc reject contract
      }
      
      // TH1: Reject Client Contract -> BẮT BUỘC kéo Partner Contract về Draft
      // Lý do: Nếu SOW/Giá với khách bị sai/bị từ chối -> Hợp đồng với Partner (dựa trên SOW đó) trở nên vô nghĩa
      if (partnerContractPayment && partnerContractPayment.id) {
        try {
          // Refresh partner contract để lấy trạng thái mới nhất (có thể backend đã tự động reject)
          const updatedPartnerContract = await partnerContractPaymentService.getById(partnerContractPayment.id);
          
          // Chỉ reject nếu partner contract chưa ở Draft
          // Nếu backend đã tự động reject về Draft, thì chỉ cần xóa documents
          if (updatedPartnerContract.contractStatus !== "Draft") {
            try {
              // Reject partner contract với cùng lý do từ chối
              await partnerContractPaymentService.rejectContract(
                partnerContractPayment.id,
                { rejectionReason: rejectForm.rejectionReason }
              );
              console.log(`✅ Đã từ chối partner contract ${partnerContractPayment.id} khi từ chối client contract ${id}`);
            } catch (rejectErr: unknown) {
              // Nếu lỗi là do contract đã ở Draft (backend đã tự động reject), thì bỏ qua
              const errorMessage = rejectErr instanceof Error ? rejectErr.message : String(rejectErr);
              if (errorMessage.includes("Draft") || errorMessage.includes("must be in Verified")) {
                console.log(`ℹ️ Partner contract ${partnerContractPayment.id} đã được backend tự động reject về Draft`);
              } else {
                throw rejectErr; // Ném lại lỗi khác
              }
            }
          } else {
            console.log(`ℹ️ Partner contract ${partnerContractPayment.id} đã ở trạng thái Draft, không cần reject`);
          }
          
          // Khi partner contract về Draft, xóa tất cả partner documents liên quan
          // Vì những tài liệu bị từ chối thì không còn hiệu lực nữa
          try {
            // Lấy tất cả partner documents liên quan đến partner contract này
            const partnerData = await partnerDocumentService.getAll({
              partnerContractPaymentId: partnerContractPayment.id,
              excludeDeleted: true,
            });
            
            // Xử lý format dữ liệu trả về (có thể là array hoặc object có items)
            const partnerDocuments = Array.isArray(partnerData) ? partnerData : (partnerData?.items || []);
            
            // Xóa từng document
            if (partnerDocuments && partnerDocuments.length > 0) {
              for (const doc of partnerDocuments) {
                try {
                  await partnerDocumentService.delete(doc.id);
                } catch (docErr) {
                  console.error(`❌ Lỗi khi xóa partner document ${doc.id}:`, docErr);
                  // Tiếp tục xóa các document khác dù có lỗi
                }
              }
            }
          } catch (partnerDocErr) {
            console.error("❌ Lỗi khi xóa partner documents:", partnerDocErr);
            // Không throw error để không ảnh hưởng đến việc reject contract
          }
        } catch (partnerErr: unknown) {
          console.error("❌ Lỗi khi xử lý partner contract:", partnerErr);
          // Không throw error để không ảnh hưởng đến việc reject client contract
          // Nhưng vẫn hiển thị cảnh báo nếu không phải lỗi do contract đã ở Draft
          const errorMessage = partnerErr instanceof Error ? partnerErr.message : String(partnerErr);
          if (!errorMessage.includes("Draft") && !errorMessage.includes("must be in Verified")) {
            alert("Đã từ chối hợp đồng khách hàng, nhưng có lỗi khi xử lý hợp đồng đối tác tương ứng. Vui lòng kiểm tra lại.");
          }
        }
      }
      
      alert("Đã từ chối hợp đồng thành công!");
      await refreshContractPayment();
      setShowRejectContractModal(false);
      setRejectForm({ rejectionReason: "" });
    } catch (err: any) {
      alert(err?.message || "Lỗi khi từ chối hợp đồng");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate billing preview
  const calculateBillingPreview = () => {
    if (!contractPayment || !billingForm.billableHours || billingForm.billableHours <= 0) {
      return null;
    }

    const billableHours = billingForm.billableHours;
    const unitPrice = contractPayment.unitPriceForeignCurrency;
    const exchangeRate = contractPayment.exchangeRate;
    const standardHours = contractPayment.standardHours || 160;
    const calculationMethod = contractPayment.calculationMethod;

    if (calculationMethod === "FixedAmount") {
      // FixedAmount: ActualAmountVND = PlannedAmountVND (không đổi)
      const plannedAmountVND = contractPayment.plannedAmountVND || 0;
      const manMonthCoefficient = billableHours / standardHours;
      
      return {
        type: "FixedAmount",
        billableHours,
        manMonthCoefficient,
        plannedAmountVND,
        actualAmountVND: plannedAmountVND,
      };
    } else if (calculationMethod === "Percentage") {
      // Percentage: Tính theo tier breakdown
      // Mỗi tier có 20h (trừ tier 1 có 160h)
      // Normalize baseRate to remove floating point precision issues
      const baseRate = parseFloat((unitPrice / standardHours).toFixed(15));
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
      let remainingHours = billableHours;

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
          // Normalize all calculated values to remove floating point precision issues
          const amountUSD = parseFloat((tierHours * baseRate * tier.multiplier).toFixed(15));
          const amountVND = parseFloat((amountUSD * exchangeRate).toFixed(15));
          
          let tierLabel = "";
          if (tierStart === 0) {
            tierLabel = `0-${Math.min(160, billableHours)}h`;
          } else if (tierEnd === Infinity) {
            tierLabel = `${tierStart}+h`;
          } else {
            const actualEnd = Math.min(tierEnd, billableHours);
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

      // Normalize calculated values to remove floating point precision issues
      const normalizedTotalAmountUSD = parseFloat(totalAmountUSD.toFixed(15));
      const actualAmountVND = parseFloat((normalizedTotalAmountUSD * exchangeRate).toFixed(15));
      const effectiveCoefficient = parseFloat((normalizedTotalAmountUSD / unitPrice).toFixed(15));

      return {
        type: "Percentage",
        billableHours,
        baseRate,
        tierBreakdown,
        totalAmountUSD: normalizedTotalAmountUSD,
        actualAmountVND,
        effectiveCoefficient,
      };
    }

    return null;
  };

  // Handler: Start Billing
  const handleStartBilling = async () => {
    if (!id || !contractPayment || billingForm.billableHours <= 0) {
      alert("Vui lòng nhập số giờ billable hợp lệ");
      return;
    }
    
    // Validate timesheet file
    if (!timesheetFile) {
      alert("Vui lòng upload file Timesheet (bắt buộc)");
      return;
    }
    
    // Find Timesheet document type
    const timesheetType = Array.from(documentTypes.values()).find(
      (type) => type.typeName.toLowerCase() === "timesheet"
    );
    
    if (!timesheetType) {
      alert("Không tìm thấy loại tài liệu Timesheet. Vui lòng liên hệ quản trị viên.");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Upload timesheet file first to get URL
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }
      
      const filePath = `client-contracts/${contractPayment.id}/timesheet_${Date.now()}.${timesheetFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(timesheetFile, filePath);
      
      // Start billing with timesheetFileUrl
      const billingPayload = {
        ...billingForm,
        timesheetFileUrl: fileUrl,
      };
      await clientContractPaymentService.startBilling(Number(id), billingPayload);
      
      // Create Timesheet document
      const documentData: ClientDocumentCreate = {
        clientContractPaymentId: Number(id),
        documentTypeId: timesheetType.id,
        fileName: timesheetFile.name,
        filePath: fileUrl,
        uploadedByUserId: userId,
        description: `Timesheet cho ghi nhận giờ làm việc - ${new Date().toLocaleDateString("vi-VN")}`,
        source: "Accountant",
      };
      await clientDocumentService.create(documentData);
      
      alert("Ghi nhận giờ làm việc thành công!");
      await refreshContractPayment();
      setShowStartBillingModal(false);
      setBillingForm({ billableHours: 0, autoSyncToPartner: true, notes: null });
      setTimesheetFile(null);
    } catch (err: any) {
      alert(err?.message || "Lỗi khi ghi nhận giờ làm việc");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Create Invoice
  const handleCreateInvoice = async () => {
    if (!id || !contractPayment || !invoiceFile || !invoiceForm.invoiceNumber.trim()) {
      alert("Vui lòng điền đầy đủ thông tin và upload file hóa đơn");
      return;
    }
    
    try {
      setIsProcessing(true);
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }

      // Upload invoice file trước (chỉ upload một lần)
      const filePath = `client-invoices/${contractPayment.id}/invoice_${Date.now()}.${invoiceFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(invoiceFile, filePath);

      // Format invoiceDate to ISO string if it's in YYYY-MM-DD format
      // Backend expects full ISO string with time: "2025-11-29T08:33:28.063Z"
      const invoicePayload: CreateInvoiceModel = {
        invoiceNumber: invoiceForm.invoiceNumber.trim(),
        invoiceDate: invoiceForm.invoiceDate.includes('T') 
          ? invoiceForm.invoiceDate 
          : new Date(invoiceForm.invoiceDate + 'T00:00:00').toISOString(),
        notes: invoiceForm.notes || null
      };

      // Retry logic cho việc tạo invoice (tối đa 3 lần)
      const maxRetries = 3;
      let retryCount = 0;
      let invoiceCreated = false;

      while (retryCount < maxRetries && !invoiceCreated) {
        try {
          // Refresh contract payment trước mỗi lần thử (trừ lần đầu)
          if (retryCount > 0) {
            const latestContractPayment = await clientContractPaymentService.getById(Number(id));
            setContractPayment(latestContractPayment);
            // Đợi một chút trước khi retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }

          // Create invoice
          await clientContractPaymentService.createInvoice(Number(id), invoicePayload);
          invoiceCreated = true;
        } catch (err: unknown) {
          retryCount++;
          const errorMessage = (err as { message?: string; response?: { data?: { message?: string } } })?.message || 
                              (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "";
          const isTransactionError = errorMessage.toLowerCase().includes("transaction") && 
                                   errorMessage.toLowerCase().includes("not current");
          
          if (isTransactionError && retryCount < maxRetries) {
            continue; // Thử lại
          } else {
            // Nếu không phải lỗi transaction hoặc đã hết retry, throw error
            throw err;
          }
        }
      }

      if (!invoiceCreated) {
        throw new Error("Không thể tạo hóa đơn sau nhiều lần thử. Vui lòng thử lại sau.");
      }

      // Sau khi tạo invoice thành công, mới tạo document
      // Find Invoice document type
      const invoiceType = Array.from(documentTypes.values()).find(
        (type) => type.typeName.toLowerCase() === "invoice"
      );

      if (!invoiceType) {
        alert("Không tìm thấy loại tài liệu Hóa đơn. Vui lòng liên hệ quản trị viên.");
        return;
      }

      const documentPayload: ClientDocumentCreate = {
        clientContractPaymentId: Number(id),
        documentTypeId: invoiceType.id,
        fileName: invoiceFile.name,
        filePath: fileUrl,
        uploadedByUserId: userId,
        description: `Hóa đơn số ${invoiceForm.invoiceNumber}`,
        source: "Accountant",
      };
      await clientDocumentService.create(documentPayload);

      alert("Tạo hóa đơn thành công!");
      await refreshContractPayment();
      setShowCreateInvoiceModal(false);
      setInvoiceForm({ invoiceNumber: "", invoiceDate: new Date().toISOString().split('T')[0], notes: null });
      setInvoiceFile(null);
    } catch (err: unknown) {
      console.error("❌ Lỗi khi tạo hóa đơn:", err);
      const errorMessage = (err as { message?: string; response?: { data?: { message?: string } } })?.message || 
                          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 
                          "Lỗi khi tạo hóa đơn";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Record Payment
  const handleRecordPayment = async () => {
    if (!id || !contractPayment || paymentForm.receivedAmount <= 0) {
      alert("Vui lòng nhập số tiền nhận được hợp lệ");
      return;
    }

    // Validation: File biên lai là bắt buộc
    if (!receiptFile) {
      alert("Vui lòng upload file biên lai");
      return;
    }

    // Validation: Ngày thanh toán phải >= ngày hóa đơn
    setPaymentDateError(null);
    if (contractPayment.invoiceDate && paymentForm.paymentDate) {
      const invoiceDate = new Date(contractPayment.invoiceDate);
      const paymentDate = new Date(paymentForm.paymentDate);
      invoiceDate.setHours(0, 0, 0, 0);
      paymentDate.setHours(0, 0, 0, 0);
      
      if (paymentDate < invoiceDate) {
        setPaymentDateError(`Ngày thanh toán phải lớn hơn hoặc bằng ngày hóa đơn (${formatDate(contractPayment.invoiceDate)})`);
        return;
      }
    }

    // Validation: Số tiền thanh toán
    setPaymentAmountError(null);
    const actualAmountVND = contractPayment.actualAmountVND || 0;
    const totalPaidAmount = contractPayment.totalPaidAmount || 0;

    if (contractPayment.paymentStatus === "Invoiced") {
      // Invoiced: số tiền không được vượt quá actualAmountVND
      if (paymentForm.receivedAmount > actualAmountVND) {
        setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền thực tế (${formatCurrency(actualAmountVND)})`);
        return;
      }
    } else if (contractPayment.paymentStatus === "PartiallyPaid") {
      // PartiallyPaid: số tiền nhận được phải <= (actualAmountVND - totalPaidAmount)
      const remainingAmount = actualAmountVND - totalPaidAmount;
      if (paymentForm.receivedAmount > remainingAmount) {
        setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền còn lại (${formatCurrency(remainingAmount)})`);
        return;
      }
    }

    try {
      setIsProcessing(true);
      
      // Upload receipt file (required)
      const filePath = `client-receipts/${contractPayment.id}/receipt_${Date.now()}.${receiptFile.name.split('.').pop()}`;
      const receiptFileUrl = await uploadFile(receiptFile, filePath);

      // Format paymentDate to ISO string if it's in YYYY-MM-DD format
      // Không gửi clientReceiptFileUrl vì không required ở BE
      // Thay vào đó sẽ tạo ClientDocument riêng với document type Receipt
      const paymentPayload: RecordPaymentModel = {
        receivedAmount: paymentForm.receivedAmount,
        paymentDate: paymentForm.paymentDate.includes('T') 
          ? paymentForm.paymentDate 
          : new Date(paymentForm.paymentDate + 'T00:00:00').toISOString(),
        notes: paymentForm.notes || null,
      };

      await clientContractPaymentService.recordPayment(Number(id), paymentPayload);
      
      // Create Receipt document after recording payment
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Không thể lấy thông tin người dùng");
        return;
      }

      // Find Receipt document type
      const receiptType = Array.from(documentTypes.values()).find(
        (type) => type.typeName.toLowerCase() === "receipt"
      );

      if (!receiptType) {
        alert("Không tìm thấy loại tài liệu Biên lai. Vui lòng liên hệ quản trị viên.");
        return;
      }

      const documentPayload: ClientDocumentCreate = {
        clientContractPaymentId: Number(id),
        documentTypeId: receiptType.id,
        fileName: receiptFile.name,
        filePath: receiptFileUrl,
        uploadedByUserId: userId,
        description: `Biên lai thanh toán - ${new Date().toLocaleDateString("vi-VN")}`,
        source: "Accountant",
      };
      await clientDocumentService.create(documentPayload);
      
      alert("Ghi nhận thanh toán thành công!");
      await refreshContractPayment();
      setShowRecordPaymentModal(false);
      setPaymentForm({ receivedAmount: 0, paymentDate: new Date().toISOString().split('T')[0], notes: null });
      setReceiptFile(null);
      setPaymentDateError(null);
      setPaymentAmountError(null);
    } catch (err: unknown) {
      console.error("❌ Lỗi khi ghi nhận thanh toán:", err);
      const errorMessage = (err as { message?: string; response?: { data?: { message?: string } } })?.message || 
                          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 
                          "Lỗi khi ghi nhận thanh toán";
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
                Thông tin chi tiết hợp đồng thanh toán khách hàng
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
                {contractPayment.isFinished && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Đã hoàn thành</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Action Buttons for Accountant */}
              {user?.role === "Staff Accountant" && (
                <>
                  {/* Request More Information - Draft + Pending */}
                  {contractPayment.contractStatus === "Draft" && contractPayment.paymentStatus === "Pending" && (
                    <button
                      onClick={() => setShowRequestMoreInfoModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Yêu cầu thêm thông tin
                    </button>
                  )}

                  {/* Verify Contract - Submitted */}
                  {contractPayment.contractStatus === "Submitted" && (
                    <>
                      <button
                        onClick={() => setShowVerifyContractModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Ghi nhận và Xác minh hợp đồng
                      </button>
                      <button
                        onClick={() => setShowRejectContractModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        Từ chối
                      </button>
                    </>
                  )}

                  {/* Start Billing - Approved + Pending */}
                  {/* Chỉ hiển thị khi cả client contract và partner contract đều đã được duyệt */}
                  {contractPayment.contractStatus === "Approved" && 
                   contractPayment.paymentStatus === "Pending" &&
                   partnerContractPayment &&
                   partnerContractPayment.contractStatus === "Approved" && (
                    <button
                      onClick={() => setShowStartBillingModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Calculator className="w-4 h-4" />
                      Ghi nhận giờ làm việc
                    </button>
                  )}

                  {/* Create Invoice - Processing */}
                  {contractPayment.paymentStatus === "Processing" && (
                    <button
                      onClick={() => setShowCreateInvoiceModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      Ghi nhận hóa đơn
                    </button>
                  )}

                  {/* Record Payment - Invoiced or PartiallyPaid */}
                  {(contractPayment.paymentStatus === "Invoiced" || contractPayment.paymentStatus === "PartiallyPaid") && (
                    <button
                      onClick={() => setShowRecordPaymentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Ghi nhận thanh toán
                    </button>
                  )}
                </>
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
                {contractPayment.isFinished && (
                  <InfoItem
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Trạng thái hoàn thành"
                    value={
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                        Đã hoàn thành
                      </span>
                    }
                  />
                )}
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Ngày bắt đầu hợp đồng"
                  value={formatDate(contractPayment.contractStartDate)}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Ngày kết thúc hợp đồng"
                  value={formatDate(contractPayment.contractEndDate)}
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
                  label="Công ty khách hàng"
                  value={clientCompanyName}
                />
                <InfoItem
                  icon={<Briefcase className="w-4 h-4" />}
                  label="Dự án"
                  value={projectName}
                />
                <InfoItem
                  icon={<User className="w-4 h-4" />}
                  label="Nhân sự"
                  value={talentName}
                />
                <InfoItem
                  icon={<Building2 className="w-4 h-4" />}
                  label="Đối tác"
                  value={partnerName}
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
                  value={`${contractPayment.unitPriceForeignCurrency.toLocaleString("vi-VN")} ${contractPayment.currencyCode}`}
                />
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Tỷ giá"
                  value={contractPayment.exchangeRate.toLocaleString("vi-VN")}
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
                {contractPayment.billableHours !== null && contractPayment.billableHours !== undefined && (
                  <InfoItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Số giờ có thể thanh toán"
                    value={`${contractPayment.billableHours} giờ`}
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
                {contractPayment.invoiceNumber && (
                  <InfoItem
                    icon={<FileCheck className="w-4 h-4" />}
                    label="Số hóa đơn"
                    value={contractPayment.invoiceNumber}
                  />
                )}
                {contractPayment.invoiceDate && (
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Ngày hóa đơn"
                    value={formatDate(contractPayment.invoiceDate)}
                  />
                )}
                {contractPayment.lastPaymentDate && (
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Ngày thanh toán gần nhất"
                    value={formatDate(contractPayment.lastPaymentDate)}
                  />
                )}
                  </div>

                  {contractPayment.sowDescription && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm font-medium text-neutral-600">Mô tả SOW</p>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{contractPayment.sowDescription}</p>
                    </div>
                  )}

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
                {clientDocuments.length > 0 ? (() => {
                  // Get unique document types from documents
                  const documentTypeIds = Array.from(new Set(clientDocuments.map(doc => doc.documentTypeId)));
                  const availableTypes = documentTypeIds
                    .map(id => documentTypes.get(id))
                    .filter((type): type is DocumentType => type !== undefined);

                  // Filter documents by active tab
                  const filteredDocuments = activeDocumentTab === "all"
                    ? clientDocuments
                    : clientDocuments.filter(doc => doc.documentTypeId === activeDocumentTab);

                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <p className="text-sm font-medium text-neutral-600">Tài liệu khách hàng</p>
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
                              {clientDocuments.length}
                            </span>
                          </button>
                          {availableTypes.map((type) => {
                            const count = clientDocuments.filter(doc => doc.documentTypeId === type.id).length;
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
                                {getDocumentTypeDisplayName(type.typeName)}
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
                                        Loại: {getDocumentTypeDisplayName(docType.typeName)}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {formatDate(doc.uploadTimestamp)}
                                    </span>
                                  </div>
                                  {doc.description && (
                                    <p className="text-xs text-gray-600 mt-1">Mô tả: {doc.description}</p>
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
      {/* Request More Information Modal */}
      {showRequestMoreInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Yêu cầu thêm thông tin</h3>
              <button onClick={() => setShowRequestMoreInfoModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Bạn có chắc chắn muốn yêu cầu thêm thông tin cho hợp đồng này?</p>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  value={requestMoreInfoForm.notes || ""}
                  onChange={(e) => setRequestMoreInfoForm({ ...requestMoreInfoForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Nhập ghi chú nếu có..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRequestMoreInfoModal(false);
                  setRequestMoreInfoForm({ notes: null });
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleRequestMoreInformation}
                disabled={isProcessing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Contract Modal */}
      {showVerifyContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Xác minh hợp đồng</h3>
              <button onClick={() => setShowVerifyContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">File hợp đồng chuẩn <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setVerifyContractFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={verifyForm.notes || ""}
                  onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowVerifyContractModal(false);
                  setVerifyForm({ notes: null });
                  setVerifyContractFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleVerifyContract}
                disabled={isProcessing || !verifyContractFile}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác minh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Contract Modal */}
      {showRejectContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Từ chối hợp đồng</h3>
              <button onClick={() => setShowRejectContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lý do từ chối <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectForm.rejectionReason}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejectionReason: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRejectContractModal(false);
                  setRejectForm({ rejectionReason: "" });
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectContract}
                disabled={isProcessing || !rejectForm.rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Từ chối"}
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
              <h3 className="text-lg font-semibold">Ghi nhận giờ làm việc</h3>
              <button 
                onClick={() => {
                  setShowStartBillingModal(false);
                  setShowCalculationDetails(false);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Số giờ billable <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={billingForm.billableHours}
                    onChange={(e) => {
                      setBillingForm({ ...billingForm, billableHours: parseFloat(e.target.value) || 0 });
                      // Reset calculation details khi thay đổi số giờ
                      setShowCalculationDetails(false);
                    }}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phương pháp tính</label>
                  <input
                    type="text"
                    value={contractPayment.calculationMethod === "Percentage" ? "Theo phần trăm" : contractPayment.calculationMethod === "FixedAmount" ? "Số tiền cố định" : contractPayment.calculationMethod}
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingForm.autoSyncToPartner ?? true}
                    onChange={(e) => setBillingForm({ ...billingForm, autoSyncToPartner: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Tự động đồng bộ đến hợp đồng đối tác</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Khi bật, file timesheet sẽ được upload tự động đến hợp đồng đối tác tương ứng
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File Timesheet <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setTimesheetFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  accept=".xlsx,.xls,.csv"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng upload file Timesheet (Excel/CSV) cho việc tính toán thanh toán
                </p>
              </div>

              {/* Preview tính toán */}
              {billingForm.billableHours > 0 && calculateBillingPreview() && (() => {
                const preview = calculateBillingPreview();
                if (!preview) return null;

                if (preview.type === "FixedAmount") {
                  return (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <button
                        onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-green-900 mb-3 hover:text-green-700 transition-colors"
                      >
                        <span>Tính toán (FixedAmount)</span>
                        {showCalculationDetails ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showCalculationDetails && (
                        <div className="space-y-2 text-sm">
                          <p className="text-green-800">
                            <span className="font-medium">Billable Hours:</span> {formatNumberWithoutTrailingZeros(preview.billableHours)}h
                          </p>
                          <p className="text-green-800">
                            <span className="font-medium">ManMonthCoefficient:</span> {formatNumberWithoutTrailingZeros(preview.manMonthCoefficient ?? 0)} (chỉ để tracking)
                          </p>
                          <p className="text-green-800">
                            <span className="font-medium">PlannedAmountVND:</span> {formatNumberVi(preview.plannedAmountVND ?? 0)} VND
                          </p>
                          <div className="mt-3 pt-3 border-t border-green-300">
                            <p className="text-green-900 font-bold">
                              <span className="font-medium">ActualAmountVND:</span> {formatNumberVi(preview.actualAmountVND)} VND
                            </p>
                            <p className="text-xs text-green-700 mt-2 italic">
                              Lưu ý: Contract Fixed nên ActualAmountVND = PlannedAmountVND (không thay đổi dù làm nhiều hay ít giờ)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (preview.type === "Percentage") {
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <button
                        onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-blue-900 mb-3 hover:text-blue-700 transition-colors"
                      >
                        <span>Tính toán (Percentage)</span>
                        {showCalculationDetails ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showCalculationDetails && (
                        <div className="space-y-2 text-sm">
                          <p className="text-blue-800">
                            <span className="font-medium">Trung bình mỗi giờ:</span> {formatNumberWithoutTrailingZeros(preview.baseRate ?? 0)} {contractPayment.currencyCode}/giờ
                          </p>
                          <p className="text-blue-800">
                            <span className="font-medium">Giờ làm việc thực tế:</span> {formatNumberWithoutTrailingZeros(preview.billableHours)}h
                          </p>
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <p className="text-blue-900 font-medium mb-2">Tier Breakdown:</p>
                            <div className="space-y-1">
                              {preview.tierBreakdown?.map((tier, idx) => (
                                <p key={idx} className="text-blue-800 text-xs">
                                  {tier.tier}: {formatNumberWithoutTrailingZeros(tier.hours)}h × {formatNumberWithoutTrailingZeros(tier.rate)} × {formatNumberWithoutTrailingZeros(tier.multiplier)} = {formatNumberWithoutTrailingZeros(tier.amountUSD)} {contractPayment.currencyCode} = {formatNumberVi(tier.amountVND)} VND
                                </p>
                              )) ?? []}
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-300">
                              <p className="text-blue-900 font-bold">
                                <span className="font-medium">TỔNG:</span> {formatNumberWithoutTrailingZeros(preview.totalAmountUSD ?? 0)} {contractPayment.currencyCode} = {formatNumberVi(preview.actualAmountVND ?? 0)} VND
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
                  setBillingForm({ billableHours: 0, autoSyncToPartner: true, notes: null });
                  setTimesheetFile(null);
                  setShowCalculationDetails(false);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleStartBilling}
                disabled={isProcessing || billingForm.billableHours <= 0 || !timesheetFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ghi nhận giờ làm việc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tạo hóa đơn</h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Số hóa đơn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ngày hóa đơn <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                  min={getPeriodDateRange(projectPeriod).minDate || undefined}
                  max={getPeriodDateRange(projectPeriod).maxDate || undefined}
                />
                {projectPeriod && (
                  <p className="mt-1 text-xs text-gray-500">
                    Chỉ được chọn trong tháng {projectPeriod.periodMonth}/{projectPeriod.periodYear}.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File hóa đơn <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={invoiceForm.notes || ""}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateInvoiceModal(false);
                  setInvoiceForm({ invoiceNumber: "", invoiceDate: new Date().toISOString().split('T')[0], notes: null });
                  setInvoiceFile(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={isProcessing || !invoiceFile || !invoiceForm.invoiceNumber.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo hóa đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ghi nhận thanh toán</h3>
              <button 
                onClick={() => {
                  setShowRecordPaymentModal(false);
                  setPaymentDateError(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Hiển thị thông tin số tiền */}
              {contractPayment && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Số tiền thực tế (ActualAmountVND):</span> {formatCurrency(contractPayment.actualAmountVND)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Tổng đã thanh toán:</span> {formatCurrency(contractPayment.totalPaidAmount)}
                    </p>
                    {contractPayment.paymentStatus === "PartiallyPaid" && (
                      <p className="text-gray-700">
                        <span className="font-medium">Số tiền còn lại:</span> {formatCurrency((contractPayment.actualAmountVND || 0) - (contractPayment.totalPaidAmount || 0))}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Số tiền nhận được (VND) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(paymentForm.receivedAmount)}
                  onChange={(e) => {
                    const parsedValue = parseNumberInput(e.target.value);
                    setPaymentForm({ ...paymentForm, receivedAmount: parsedValue });
                    
                    // Validate real-time khi người dùng nhập
                    if (contractPayment && parsedValue > 0) {
                      const actualAmountVND = contractPayment.actualAmountVND || 0;
                      const totalPaidAmount = contractPayment.totalPaidAmount || 0;
                      
                      if (contractPayment.paymentStatus === "Invoiced") {
                        // Invoiced: số tiền không được vượt quá actualAmountVND
                        if (parsedValue > actualAmountVND) {
                          setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền thực tế (${formatCurrency(actualAmountVND)})`);
                        } else {
                          setPaymentAmountError(null);
                        }
                      } else if (contractPayment.paymentStatus === "PartiallyPaid") {
                        // PartiallyPaid: số tiền nhận được phải <= (actualAmountVND - totalPaidAmount)
                        const remainingAmount = actualAmountVND - totalPaidAmount;
                        if (parsedValue > remainingAmount) {
                          setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền còn lại (${formatCurrency(remainingAmount)})`);
                        } else {
                          setPaymentAmountError(null);
                        }
                      } else {
                        setPaymentAmountError(null);
                      }
                    } else {
                      setPaymentAmountError(null);
                    }
                  }}
                  onBlur={(e) => {
                    // Format lại khi blur để đảm bảo hiển thị đẹp
                    const parsedValue = parseNumberInput(e.target.value);
                    if (parsedValue !== paymentForm.receivedAmount) {
                      setPaymentForm({ ...paymentForm, receivedAmount: parsedValue });
                    }
                    
                    // Validate lại khi blur
                    if (contractPayment && parsedValue > 0) {
                      const actualAmountVND = contractPayment.actualAmountVND || 0;
                      const totalPaidAmount = contractPayment.totalPaidAmount || 0;
                      
                      if (contractPayment.paymentStatus === "Invoiced") {
                        if (parsedValue > actualAmountVND) {
                          setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền thực tế (${formatCurrency(actualAmountVND)})`);
                        } else {
                          setPaymentAmountError(null);
                        }
                      } else if (contractPayment.paymentStatus === "PartiallyPaid") {
                        const remainingAmount = actualAmountVND - totalPaidAmount;
                        if (parsedValue > remainingAmount) {
                          setPaymentAmountError(`Số tiền nhận được không được vượt quá số tiền còn lại (${formatCurrency(remainingAmount)})`);
                        } else {
                          setPaymentAmountError(null);
                        }
                      }
                    }
                  }}
                  maxLength={20}
                  className={`w-full border rounded-lg p-2 ${paymentAmountError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  placeholder="Ví dụ: 30.000.000"
                  required
                />
                {paymentAmountError && (
                  <p className="mt-1 text-sm text-red-500">{paymentAmountError}</p>
                )}
                {contractPayment && !paymentAmountError && (
                  <p className="mt-1 text-xs text-gray-500">
                    {contractPayment.paymentStatus === "Invoiced" 
                      ? `Tối đa: ${formatCurrency(contractPayment.actualAmountVND)}`
                      : contractPayment.paymentStatus === "PartiallyPaid"
                      ? `Tối đa: ${formatCurrency((contractPayment.actualAmountVND || 0) - (contractPayment.totalPaidAmount || 0))}`
                      : ""
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ngày thanh toán <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  min={toDateInputValue(contractPayment?.invoiceDate)}
                  onChange={(e) => {
                    setPaymentForm({ ...paymentForm, paymentDate: e.target.value });
                    // Clear error when user changes value
                    if (paymentDateError) {
                      setPaymentDateError(null);
                    }
                  }}
                  className={`w-full border rounded-lg p-2 ${paymentDateError ? 'border-red-500' : ''}`}
                  required
                />
                {paymentDateError && (
                  <p className="mt-1 text-sm text-red-500">{paymentDateError}</p>
                )}
                {contractPayment?.invoiceDate && !paymentDateError && (
                  <p className="mt-1 text-xs text-gray-500">
                    Ngày thanh toán phải lớn hơn hoặc bằng ngày hóa đơn ({formatDate(contractPayment.invoiceDate)})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  File biên lai <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                  required
                />
                {receiptFile && (
                  <p className="text-sm text-gray-600 mt-1">Đã chọn: {receiptFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRecordPaymentModal(false);
                  setPaymentForm({ receivedAmount: 0, paymentDate: new Date().toISOString().split('T')[0], notes: null });
                  setReceiptFile(null);
                  setPaymentDateError(null);
                  setPaymentAmountError(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={
                  isProcessing || 
                  paymentForm.receivedAmount <= 0 || 
                  !receiptFile ||
                  (contractPayment?.paymentStatus === "Invoiced" && paymentForm.receivedAmount > (contractPayment.actualAmountVND || 0)) ||
                  (contractPayment?.paymentStatus === "PartiallyPaid" && paymentForm.receivedAmount > ((contractPayment.actualAmountVND || 0) - (contractPayment.totalPaidAmount || 0)))
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ghi nhận"}
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
