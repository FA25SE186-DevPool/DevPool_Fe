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
  Ban,
  Eye,
  Download,
} from "lucide-react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/manager";
import {
  partnerContractPaymentService,
  type PartnerContractPaymentModel,
  type PartnerContractPaymentRejectModel,
  type PartnerContractPaymentApproveModel,
} from "../../../../services/PartnerContractPayment";
import {
  clientContractPaymentService,
  type ClientContractPaymentModel,
} from "../../../../services/ClientContractPayment";
import { projectPeriodService, type ProjectPeriodModel } from "../../../../services/ProjectPeriod";
import { talentAssignmentService, type TalentAssignmentModel } from "../../../../services/TalentAssignment";
import { projectService } from "../../../../services/Project";
import { partnerService } from "../../../../services/Partner";
import { talentService } from "../../../../services/Talent";
import { partnerDocumentService, type PartnerDocument } from "../../../../services/PartnerDocument";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import { useAuth } from "../../../../context/AuthContext";
import { getErrorMessage } from "../../../../utils/helpers";

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

const getContractStatusConfig = (status: string, userRole?: string) => {
  // Nếu là Manager và status là Verified, hiển thị "Chờ duyệt"
  if (userRole === "Manager" && status === "Verified") {
    return {
      label: "Chờ duyệt",
      color: "text-purple-800",
      bgColor: "bg-purple-50 border border-purple-200",
      icon: <Clock className="w-4 h-4" />,
    };
  }
  
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
    case "purchaseorder":
      return "PO";
    case "paymentproof":
      return "UNC";
    case "contract":
      return "Hợp đồng";
    case "timesheet":
      return "Timesheet";
    default:
      return typeName; // Return original if no mapping found
  }
};

export default function PartnerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractPayment, setContractPayment] = useState<PartnerContractPaymentModel | null>(null);
  const [clientContractPayment, setClientContractPayment] = useState<ClientContractPaymentModel | null>(null);
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
  const [showApproveContractModal, setShowApproveContractModal] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showRejectContractModal, setShowRejectContractModal] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);

  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState<false | "approve" | "reject">(false);

  // Form states
  const [approveForm, setApproveForm] = useState<PartnerContractPaymentApproveModel>({ notes: null });
  const [rejectForm, setRejectForm] = useState<PartnerContractPaymentRejectModel>({ rejectionReason: "" });

  // Rejection reason templates for Manager
  const managerPartnerRejectionReasonTemplates = [
    "Giá trị hợp đồng quá cao so với thị trường",
    "Điều khoản thanh toán không phù hợp với chính sách công ty",
    "Thời hạn hợp đồng không hợp lý",
    "Thiếu thông tin về phạm vi công việc chi tiết",
    "Yêu cầu kỹ năng không phù hợp với khả năng cung cấp",
    "Hợp đồng vi phạm các quy định pháp lý",
    "Cần thêm thời gian để đánh giá và xem xét",
    "Không phù hợp với chiến lược kinh doanh hiện tại",
    "Thông tin đối tác chưa đầy đủ hoặc chưa được xác minh"
  ];

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current user
  const authContext = useAuth();
  const user = authContext?.user || null;

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

      // Fetch corresponding client contract payment
      try {
        const data = await clientContractPaymentService.getAll({
          projectPeriodId: paymentData.projectPeriodId,
          talentAssignmentId: paymentData.talentAssignmentId,
          excludeDeleted: true,
        });
        // Xử lý format dữ liệu trả về (có thể là array hoặc object có items)
        const clientPayments = Array.isArray(data) ? data : ((data as any)?.items || []);
        if (clientPayments && clientPayments.length > 0) {
          setClientContractPayment(clientPayments[0]);
        } else {
          setClientContractPayment(null);
        }
      } catch (err) {
        console.error("❌ Lỗi tải hợp đồng khách hàng tương ứng:", err);
        setClientContractPayment(null);
      }

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
        const documents = Array.isArray(data) ? data : (data?.items || []);
        setPartnerDocuments(documents);
      } catch (err: any) {
        console.error("❌ Lỗi tải tài liệu đối tác:", err);
        setPartnerDocuments([]);
      }
    };
    loadPartnerDocuments();
  }, [id]);

  // Handlers
  const handleApproveContract = async () => {
    if (!id || !contractPayment) return;

    try {
      setIsProcessing(true);
      const payload: PartnerContractPaymentApproveModel = {
        notes: approveForm.notes || null,
      };
      await partnerContractPaymentService.approveContract(Number(id), payload);

      // Hiển thị success message và tự động ẩn sau 3 giây
      setShowSuccessMessage("approve");
      setTimeout(() => setShowSuccessMessage(false), 3000);

      await fetchData();
      setShowApproveContractModal(false);
      setShowApproveConfirmation(false);
    } catch (err: unknown) {
      // Xử lý lỗi từ backend
      let errorMessage = "Không thể duyệt hợp đồng";
      
      // Service throw error.response?.data (object { isSuccess: false, message: "..." })
      if (err && typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        // Lấy message từ object (backend trả về { isSuccess: false, message: "..." })
        if (errorObj.message && typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        } else if (errorObj.error && typeof errorObj.error === 'string') {
          errorMessage = errorObj.error;
        } else {
          // Fallback: sử dụng helper function
          errorMessage = getErrorMessage(err) || errorMessage;
        }
      } else {
        // Fallback: sử dụng helper function
        errorMessage = getErrorMessage(err) || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectContract = async () => {
    if (!id || !contractPayment) return;

    if (!rejectForm.rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Lưu contract status trước khi reject (không sử dụng nhưng giữ lại để tracking)
      // const previousStatus = contractPayment.contractStatus;
      
      // Reject contract (sẽ quay về Draft)
      await partnerContractPaymentService.rejectContract(Number(id), rejectForm);
      
      // Khi contract về Draft, xóa tất cả partner documents liên quan
      // Vì những tài liệu bị từ chối thì không còn hiệu lực nữa
      try {
        // Lấy tất cả partner documents liên quan đến contract này
        const data = await partnerDocumentService.getAll({
          partnerContractPaymentId: Number(id),
          excludeDeleted: true,
        });
        
        // Xử lý format dữ liệu trả về (có thể là array hoặc object có items)
        const documents = Array.isArray(data) ? data : (data?.items || []);
        
        // Xóa từng document
        if (documents && documents.length > 0) {
          for (const doc of documents) {
            try {
              await partnerDocumentService.delete(doc.id);
            } catch (docErr) {
              console.error(`❌ Lỗi khi xóa partner document ${doc.id}:`, docErr);
              // Tiếp tục xóa các document khác dù có lỗi
            }
          }
        }
      } catch (docErr) {
        console.error("❌ Lỗi khi xóa partner documents:", docErr);
        // Không throw error để không ảnh hưởng đến việc reject contract
      }
      
      // Hiển thị success message và tự động ẩn sau 3 giây
      setShowSuccessMessage("reject");
      setTimeout(() => setShowSuccessMessage(false), 3000);

      await fetchData();
      setShowRejectContractModal(false);
      setShowRejectConfirmation(false);
    } catch (err: unknown) {
      console.error("❌ Lỗi từ chối hợp đồng:", err);
      const errorMessage = err instanceof Error ? err.message : "Không thể từ chối hợp đồng";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Manager" />
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
        <Sidebar items={sidebarItems} title="Manager" />
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

  const contractStatusConfig = getContractStatusConfig(contractPayment.contractStatus, user?.role);
  const paymentStatusConfig = getPaymentStatusConfig(contractPayment.paymentStatus);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Manager" />

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
            <div className="flex flex-col items-end gap-3">
              {/* Warning message if client contract payment is not Approved */}
              {user?.role === "Manager" && 
               contractPayment.contractStatus === "Verified" && 
               (!clientContractPayment || clientContractPayment.contractStatus !== "Approved") && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Không thể duyệt: Hợp đồng khách hàng tương ứng chưa được duyệt (Approved)
                  </span>
                </div>
              )}
              {/* Action Buttons for Manager */}
              {/* Chỉ hiển thị nút khi client contract đã được duyệt (Approved) */}
              {user?.role === "Manager" && 
               contractPayment.contractStatus === "Verified" && 
               clientContractPayment && 
               clientContractPayment.contractStatus === "Approved" && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowApproveContractModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Duyệt hợp đồng
                  </button>
                  <button
                    onClick={() => setShowRejectContractModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Từ chối
                  </button>
                </div>
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
              <button
                onClick={() => setActiveMainTab("notes")}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                  activeMainTab === "notes"
                    ? "border-primary-600 text-primary-600 bg-primary-50"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <StickyNote className="w-4 h-4" />
                Ghi chú
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

            {/* Tab: Ghi chú */}
            {activeMainTab === "notes" && (
              <div className="space-y-6">
                {/* Ghi chú hợp đồng */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <StickyNote className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Ghi chú hợp đồng</h3>
                  </div>

                  {contractPayment.notes ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{contractPayment.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Không có ghi chú nào</p>
                    </div>
                  )}
                </div>

                {/* Lý do từ chối (nếu có) */}
                {contractPayment.rejectionReason && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Lý do từ chối</h3>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{contractPayment.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Approve Contract Modal */}
      {showApproveContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Duyệt hợp đồng</h3>
              <button onClick={() => setShowApproveContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Bạn có chắc chắn muốn duyệt hợp đồng này?</p>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  value={approveForm.notes || ""}
                  onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Nhập ghi chú nếu có..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowApproveContractModal(false);
                  setApproveForm({ notes: null });
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowApproveConfirmation(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận duyệt hợp đồng</h3>
              <button
                onClick={() => setShowApproveConfirmation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Bạn có chắc chắn muốn duyệt hợp đồng đối tác này?
                    </p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Hợp đồng sẽ chuyển sang trạng thái "Đã duyệt"</p>
                      <p>• Hợp đồng sẽ sẵn sàng để bắt đầu thanh toán</p>
                      <p>• Không thể hoàn tác hành động này</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Hợp đồng đã được kiểm tra kỹ lưỡng và sẵn sàng để triển khai.
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowApproveConfirmation(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowApproveConfirmation(false);
                  handleApproveContract();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận từ chối hợp đồng</h3>
              <button
                onClick={() => setShowRejectConfirmation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Bạn có chắc chắn muốn từ chối hợp đồng này?
                    </p>
                    <div className="text-sm text-red-700 space-y-1">
                      <p>• Hợp đồng sẽ quay về trạng thái "Nháp"</p>
                      <p>• Tất cả tài liệu liên quan sẽ bị xóa</p>
                      <p>• Lý do từ chối: <span className="font-medium">{rejectForm.rejectionReason}</span></p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Hành động này không thể hoàn tác. Hợp đồng sẽ cần được chỉnh sửa và gửi lại.
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowRejectConfirmation(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowRejectConfirmation(false);
                  handleRejectContract();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Contract Modal */}
      {showRejectContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Từ chối hợp đồng</h3>
              <button onClick={() => setShowRejectContractModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Chọn lý do mẫu (click để điền tự động):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {managerPartnerRejectionReasonTemplates.map((reason, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setRejectForm({ ...rejectForm, rejectionReason: reason })}
                        className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border transition-colors text-left"
                        title={reason}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
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
                onClick={() => setShowRejectConfirmation(true)}
                disabled={isProcessing || !rejectForm.rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm transform transition-all duration-300 ease-in-out">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {showSuccessMessage === "approve" ? "Duyệt hợp đồng thành công!" :
                   showSuccessMessage === "reject" ? "Đã từ chối hợp đồng thành công!" :
                   "Thao tác thành công!"}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {showSuccessMessage === "approve"
                    ? "Hợp đồng đã được duyệt và chuyển sang trạng thái tiếp theo."
                    : showSuccessMessage === "reject"
                    ? "Hợp đồng đã được từ chối và quay về trạng thái nháp."
                    : "Thao tác đã được thực hiện thành công."
                  }
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-4 h-4" />
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
