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
  Send,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Sidebar from "../../../../components/common/Sidebar";
import { sidebarItems } from "../../../../components/sidebar/sales";
import {
  clientContractPaymentService,
  type ClientContractPaymentModel,
  type SubmitContractModel,
} from "../../../../services/ClientContractPayment";
import { projectPeriodService, type ProjectPeriodModel } from "../../../../services/ProjectPeriod";
import { clientDocumentService, type ClientDocument } from "../../../../services/ClientDocument";
import { documentTypeService, type DocumentType } from "../../../../services/DocumentType";
import { exchangeRateService, AVAILABLE_CURRENCIES, type CurrencyCode } from "../../../../services/ExchangeRate";
import { uploadFile } from "../../../../utils/firebaseStorage";
import { formatNumberInput, parseNumberInput } from "../../../../utils/formatters";
import { useAuth } from "../../../../context/AuthContext";
import ConfirmModal from "../../../../components/ui/confirm-modal";
import { SuccessToast } from "../../../../components/ui/success-toast";

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
    case "acceptance":
      return "Biên bản nghiệm thu";
    default:
      return typeName; // Return original if no mapping found
  }
};

export default function ClientContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractPayment, setContractPayment] = useState<ClientContractPaymentModel | null>(null);
  const [projectPeriod, setProjectPeriod] = useState<ProjectPeriodModel | null>(null);
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
  const [showSubmitContractModal, setShowSubmitContractModal] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Form states
  const [submitForm, setSubmitForm] = useState<Omit<SubmitContractModel, 'sowExcelFileUrl'>>({
    unitPriceForeignCurrency: 0,
    currencyCode: "USD",
    exchangeRate: 1,
    calculationMethod: "Percentage",
    percentageValue: 100,
    fixedAmount: null,
    plannedAmountVND: null,
    standardHours: 160, // Always 160, not editable
    notes: null,
  });

  // File states
  const [sowExcelFile, setSowExcelFile] = useState<File | null>(null);
  const [sowFileError, setSowFileError] = useState<string | null>(null);

  // UI states
  const [showCostCalculation, setShowCostCalculation] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Exchange rate states
  const [exchangeRateData, setExchangeRateData] = useState<{
    transferRate: number | null;
    buyRate: number | null;
    sellRate: number | null;
    date: string | null;
    source: string | null;
    note: string | null;
  } | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);

  // Get current user
  const authContext = useAuth();
  const user = authContext?.user || null;

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
        const periodData = await projectPeriodService.getById(paymentData.projectPeriodId).catch(() => null);

        setProjectPeriod(periodData);

        // Set names from paymentData
        setProjectName(paymentData.projectName || "—");
        setClientCompanyName(paymentData.clientCompanyName || "—");
        setPartnerName(paymentData.partnerName || "—");
        setTalentName(paymentData.talentName || "—");
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
      } catch (err: unknown) {
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
      } catch (err: unknown) {
        console.error("❌ Lỗi tải tài liệu khách hàng:", err);
      }
    };
    loadClientDocuments();
  }, [id]);

  // Refresh client documents
  const refreshClientDocuments = async () => {
    if (!id) return;
    try {
      const data = await clientDocumentService.getAll({
        clientContractPaymentId: Number(id),
        excludeDeleted: true,
      });
      const documents = Array.isArray(data) ? data : (data?.items || []);
      setClientDocuments(documents);
    } catch (err: unknown) {
      console.error("❌ Lỗi tải lại tài liệu khách hàng:", err);
    }
  };

  // Refresh contract payment data
  const refreshContractPayment = async () => {
    if (!id) return;
    try {
      const paymentData = await clientContractPaymentService.getById(Number(id));
      setContractPayment(paymentData);
    } catch (err) {
      console.error("❌ Lỗi refresh hợp đồng:", err);
    }
  };

  // Helper function to format number without trailing zeros
  const formatNumberWithoutTrailingZeros = (num: number): string => {
    // Convert to string and remove trailing zeros after decimal point
    const str = num.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Helper function to format number with Vietnamese locale, removing trailing zeros
  const formatNumberVi = (num: number): string => {
    // If it's a whole number, format without decimals
    if (Number.isInteger(num)) {
      return num.toLocaleString("vi-VN");
    }
    // For decimal numbers, format and remove trailing zeros
    const formatted = num.toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    });
    return formatted;
  };

  // Calculate PlannedAmountVND
  const calculatePlannedAmountVND = () => {
    if (submitForm.calculationMethod === "Percentage") {
      if (submitForm.percentageValue && submitForm.unitPriceForeignCurrency && submitForm.exchangeRate) {
        return (submitForm.unitPriceForeignCurrency * submitForm.exchangeRate) * (submitForm.percentageValue / 100);
      }
      return null;
    } else if (submitForm.calculationMethod === "FixedAmount") {
      if (submitForm.fixedAmount && submitForm.exchangeRate) {
        return submitForm.fixedAmount * submitForm.exchangeRate;
      }
      return null;
    }
    return null;
  };

  // Handler: Show Submit Confirmation
  const handleSubmitContract = () => {
    setShowSubmitConfirmation(true);
  };

  // Handler: Confirm and Submit Contract
  const handleSubmitContractConfirm = async () => {
    if (!id || !contractPayment || !sowExcelFile) {
      alert("Vui lòng upload file Statement of Work");
      return;
    }
    if (sowFileError) {
      alert("Vui lòng chọn file Statement of Work hợp lệ");
      return;
    }
    if (!submitForm.unitPriceForeignCurrency || !submitForm.exchangeRate) {
      alert("Vui lòng điền đầy đủ thông tin đơn giá và tỷ giá");
      return;
    }
    // standardHours is always 160 and not editable
    if (submitForm.calculationMethod === "Percentage") {
      if (!submitForm.percentageValue || submitForm.percentageValue <= 0) {
        alert("Vui lòng nhập giá trị phần trăm hợp lệ");
        return;
      }
    } else if (submitForm.calculationMethod === "FixedAmount") {
      if (!submitForm.fixedAmount || submitForm.fixedAmount <= 0) {
        alert("Vui lòng nhập số tiền cố định hợp lệ");
        return;
      }
      if (submitForm.unitPriceForeignCurrency !== submitForm.fixedAmount) {
        alert("Đơn giá ngoại tệ phải bằng số tiền cố định");
        return;
      }
    }
    try {
      setIsProcessing(true);

      // Upload Statement of Work file first
      const filePath = `client-sow/${contractPayment.id}/sow_${Date.now()}.${sowExcelFile.name.split('.').pop()}`;
      const fileUrl = await uploadFile(sowExcelFile, filePath);

      // Prepare submit payload with all required fields
      const submitPayload: SubmitContractModel = {
        unitPriceForeignCurrency: submitForm.unitPriceForeignCurrency,
        currencyCode: submitForm.currencyCode,
        exchangeRate: submitForm.exchangeRate,
        calculationMethod: submitForm.calculationMethod,
        percentageValue: submitForm.calculationMethod === "Percentage" ? (submitForm.percentageValue ?? 0) : 0,
        fixedAmount: submitForm.calculationMethod === "FixedAmount" ? (submitForm.fixedAmount ?? 0) : 0,
        plannedAmountVND: calculatePlannedAmountVND() ?? 0,
        sowExcelFileUrl: fileUrl, // URL của file đã upload
        standardHours: submitForm.standardHours,
        notes: submitForm.notes ?? "",
      };

      // Submit contract với sowExcelFileUrl
      // Backend sẽ tự động tạo document từ sowExcelFileUrl, không cần tạo thủ công
      await clientContractPaymentService.submitContract(Number(id), submitPayload);

      // Hiển thị success message và tự động ẩn sau 3 giây
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      await refreshContractPayment();
      await refreshClientDocuments();
      
      setShowSubmitContractModal(false);
      setShowSubmitConfirmation(false);
                  setSubmitForm({
                    unitPriceForeignCurrency: 0,
                    currencyCode: "USD",
                    exchangeRate: 1,
                    calculationMethod: "Percentage",
                    percentageValue: 100,
                    fixedAmount: null,
                    plannedAmountVND: null,
                    standardHours: 160, // Always 160, not editable
                    notes: null,
                  });
                  setSowExcelFile(null);
                  setSowFileError(null);
                  setExchangeRateData(null);
                  setExchangeRateError(null);
                  setExchangeRateData(null);
                  setExchangeRateError(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi khi ghi nhận thông tin");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
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
        <Sidebar items={sidebarItems} title="Sales Staff" />
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
      <Sidebar items={sidebarItems} title="Sales Staff" />

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
                Tập hồ sơ #{contractPayment.contractNumber}
              </h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết tập hồ sơ khách hàng
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {contractPayment.isFinished ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Đã hoàn thành</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Action Buttons for Sales */}
              {/* Cho phép gửi hợp đồng khi ở trạng thái Draft hoặc NeedMoreInformation */}
              {user?.role === "Staff Sales" && 
               contractPayment && 
               (contractPayment.contractStatus === "Draft" || contractPayment.contractStatus === "NeedMoreInformation") && (
                <button
                  onClick={() => {
                    // Pre-fill form with contract payment data
                    const method = contractPayment.calculationMethod || "Percentage";
                    setSubmitForm({
                      unitPriceForeignCurrency: contractPayment.unitPriceForeignCurrency || 0,
                      currencyCode: contractPayment.currencyCode || "USD",
                      exchangeRate: contractPayment.exchangeRate || 1,
                      calculationMethod: method,
                      percentageValue: method === "Percentage" ? (contractPayment.percentageValue ?? 100) : null,
                      fixedAmount: method === "FixedAmount" ? (contractPayment.fixedAmount ?? contractPayment.unitPriceForeignCurrency ?? null) : null,
                      plannedAmountVND: contractPayment.plannedAmountVND ?? null,
                      standardHours: 160, // Always 160, not editable
                      notes: contractPayment.notes ?? null,
                    });
                    setShowSubmitContractModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Ghi nhận thông tin
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
                Thông tin
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
                {contractPayment.isFinished ? (
                  <InfoItem
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Trạng thái"
                    value={
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                        Đã hoàn thành
                      </span>
                    }
                  />
                ) : (
                  <>
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
                  </>
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
                    value={contractPayment.manMonthCoefficient.toFixed(4)}
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

      {/* Submit Contract Modal */}
      {showSubmitContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ghi nhận thông tin</h3>
              <button
                onClick={() => {
                  setShowSubmitContractModal(false);
                  setShowSubmitConfirmation(false);
                  setShowSuccessMessage(false);
                  setExchangeRateData(null);
                  setExchangeRateError(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Đơn giá ngoại tệ ({submitForm.currencyCode}) <span className="text-red-500">*</span>
                    {submitForm.calculationMethod === "FixedAmount" && (
                      <span className="ml-2 text-xs text-gray-500">(Phải bằng số tiền cố định)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(submitForm.unitPriceForeignCurrency)}
                    onChange={(e) => {
                      const value = parseNumberInput(e.target.value);
                      if (submitForm.calculationMethod === "FixedAmount") {
                        setSubmitForm({ ...submitForm, unitPriceForeignCurrency: value, fixedAmount: value });
                      } else {
                        setSubmitForm({ ...submitForm, unitPriceForeignCurrency: value });
                      }
                    }}
                    onBlur={(e) => {
                      // Format lại khi blur
                      const value = parseNumberInput(e.target.value);
                      if (value !== submitForm.unitPriceForeignCurrency) {
                        if (submitForm.calculationMethod === "FixedAmount") {
                          setSubmitForm({ ...submitForm, unitPriceForeignCurrency: value, fixedAmount: value });
                        } else {
                          setSubmitForm({ ...submitForm, unitPriceForeignCurrency: value });
                        }
                      }
                    }}
                    maxLength={20}
                    className="w-full border rounded-lg p-2"
                    placeholder="Ví dụ: 30.000.000"
                    required
                    disabled={submitForm.calculationMethod === "FixedAmount"}
                  />
                  {submitForm.calculationMethod === "FixedAmount" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Đơn giá ngoại tệ sẽ tự động cập nhật khi nhập số tiền cố định
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mã tiền tệ</label>
                  <select
                    value={submitForm.currencyCode}
                    onChange={(e) => {
                      const newCurrencyCode = e.target.value;
                      // Nếu chọn VND, tự động set exchange rate = 1
                      if (newCurrencyCode === "VND") {
                        setSubmitForm({ ...submitForm, currencyCode: newCurrencyCode, exchangeRate: 1 });
                      } else {
                        setSubmitForm({ ...submitForm, currencyCode: newCurrencyCode });
                      }
                      // Reset exchange rate data khi đổi currency
                      setExchangeRateData(null);
                      setExchangeRateError(null);
                    }}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="VND">VND</option>
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Tỷ giá <span className="text-red-500">*</span>
                    </label>
                    {submitForm.currencyCode !== "VND" && AVAILABLE_CURRENCIES.includes(submitForm.currencyCode as CurrencyCode) && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!submitForm.currencyCode || submitForm.currencyCode === "VND") return;
                          
                          try {
                            setLoadingExchangeRate(true);
                            setExchangeRateError(null);
                            const response = await exchangeRateService.getVietcombankRate(submitForm.currencyCode as CurrencyCode);
                            
                            if (response.success && response.data) {
                              setExchangeRateData({
                                transferRate: response.data.transferRate,
                                buyRate: response.data.buyRate,
                                sellRate: response.data.sellRate,
                                date: response.data.date,
                                source: response.data.source,
                                note: response.data.note,
                              });
                            } else {
                              setExchangeRateError(response.message || "Không thể lấy tỷ giá");
                            }
                          } catch (err: unknown) {
                            console.error("❌ Lỗi khi lấy tỷ giá:", err);
                            const errorMessage = err instanceof Error ? err.message : "Không thể lấy tỷ giá từ Vietcombank";
                            setExchangeRateError(errorMessage);
                            setExchangeRateData(null);
                          } finally {
                            setLoadingExchangeRate(false);
                          }
                        }}
                        disabled={loadingExchangeRate || submitForm.currencyCode === "VND"}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingExchangeRate ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            Lấy tỷ giá VCB
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(submitForm.exchangeRate)}
                    onChange={(e) => {
                      // Không cho phép chỉnh sửa nếu currency code là VND
                      if (submitForm.currencyCode === "VND") return;
                      const value = parseNumberInput(e.target.value);
                      setSubmitForm({ ...submitForm, exchangeRate: value || 0 });
                    }}
                    onBlur={(e) => {
                      // Không cho phép chỉnh sửa nếu currency code là VND
                      if (submitForm.currencyCode === "VND") return;
                      // Format lại khi blur
                      const value = parseNumberInput(e.target.value);
                      if (value !== submitForm.exchangeRate) {
                        setSubmitForm({ ...submitForm, exchangeRate: value || 0 });
                      }
                    }}
                    maxLength={20}
                    className={`w-full border rounded-lg p-2 ${submitForm.currencyCode === "VND" ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    placeholder="Ví dụ: 30.000.000"
                    disabled={submitForm.currencyCode === "VND"}
                    required
                  />
                  {submitForm.currencyCode === "VND" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Tỷ giá tự động là 1 khi mã tiền tệ là VND
                    </p>
                  )}
                  {exchangeRateData && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-xs text-blue-800">
                          <p className="font-medium mb-1">Tỷ giá từ Vietcombank:</p>
                          <p className="mb-1">
                            <span className="font-semibold">Tỷ giá chuyển khoản: {exchangeRateData.transferRate?.toLocaleString("vi-VN")}</span>
                          </p>
                          <p className="mb-1 text-blue-700">
                            Mua: {exchangeRateData.buyRate?.toLocaleString("vi-VN")} | Bán: {exchangeRateData.sellRate?.toLocaleString("vi-VN")}
                          </p>
                          {exchangeRateData.date && (
                            <p className="text-blue-600 text-xs mt-1">
                              Cập nhật: {new Date(exchangeRateData.date).toLocaleString("vi-VN")}
                            </p>
                          )}
                          {exchangeRateData.note && (
                            <p className="text-amber-700 text-xs mt-1 font-medium">
                              ⚠️ {exchangeRateData.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {exchangeRateError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">{exchangeRateError}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phương pháp tính</label>
                  <select
                    value={submitForm.calculationMethod}
                    onChange={(e) => {
                      const newMethod = e.target.value;
                      if (newMethod === "Percentage") {
                        setSubmitForm({ 
                          ...submitForm, 
                          calculationMethod: newMethod, 
                          percentageValue: 100,
                          fixedAmount: 0,
                        });
                      } else if (newMethod === "FixedAmount") {
                        setSubmitForm({ 
                          ...submitForm, 
                          calculationMethod: newMethod, 
                          percentageValue: 0,
                          fixedAmount: submitForm.fixedAmount || submitForm.unitPriceForeignCurrency || 0,
                          unitPriceForeignCurrency: submitForm.fixedAmount || submitForm.unitPriceForeignCurrency || 0
                        });
                      }
                    }}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Percentage">Theo phần trăm</option>
                    <option value="FixedAmount">Số tiền cố định</option>
                  </select>
                </div>
                {submitForm.calculationMethod === "Percentage" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Giá trị phần trăm (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={submitForm.percentageValue || 100}
                      onChange={(e) => setSubmitForm({ ...submitForm, percentageValue: parseFloat(e.target.value) || 100, fixedAmount: 0 })}
                      className="w-full border rounded-lg p-2"
                      placeholder="Ví dụ: 100 (full month), 120 (overtime)"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ví dụ: 100% (full month), 120% (overtime)
                    </p>
                  </div>
                )}
                {submitForm.calculationMethod === "FixedAmount" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số tiền cố định ({submitForm.currencyCode}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(submitForm.fixedAmount)}
                      onChange={(e) => {
                        const fixedValue = parseNumberInput(e.target.value);
                        setSubmitForm({ 
                          ...submitForm, 
                          fixedAmount: fixedValue || null,
                          unitPriceForeignCurrency: fixedValue || 0,
                          percentageValue: 0
                        });
                      }}
                      onBlur={(e) => {
                        // Format lại khi blur
                        const fixedValue = parseNumberInput(e.target.value);
                        if (fixedValue !== (submitForm.fixedAmount || 0)) {
                          setSubmitForm({ 
                            ...submitForm, 
                            fixedAmount: fixedValue || null,
                            unitPriceForeignCurrency: fixedValue || 0,
                            percentageValue: 0
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
                    value={160}
                    className="w-full border rounded-lg p-2 bg-gray-50 cursor-not-allowed"
                    placeholder="160"
                    disabled
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Số giờ tiêu chuẩn mặc định là 160 giờ và không thể chỉnh sửa
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">File Statement of Work <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      // Validate file size (max 10MB)
                      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                      if (file.size > maxSize) {
                        setSowFileError(`Kích thước file không được vượt quá 10MB. File hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                        setSowExcelFile(null);
                        return;
                      }
                      // Validate file extension
                      const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.docx', '.doc'];
                      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                      if (!allowedExtensions.includes(fileExtension)) {
                        setSowFileError('Chỉ chấp nhận file PDF, Excel (.xlsx, .xls), Word (.docx, .doc)');
                        setSowExcelFile(null);
                        return;
                      }
                    }
                    setSowFileError(null);
                    setSowExcelFile(file);
                  }}
                  className={`w-full border rounded-lg p-2 ${sowFileError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Định dạng được phép: PDF, Excel (.xlsx, .xls), Word (.docx, .doc). Kích thước tối đa: 10MB
                </p>
                {sowFileError && (
                  <p className="mt-1 text-xs text-red-600">{sowFileError}</p>
                )}
                {sowExcelFile && !sowFileError && (
                  <p className="mt-1 text-xs text-green-600">
                    File đã chọn: {sowExcelFile.name} ({(sowExcelFile.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  value={submitForm.notes || ""}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value || null })}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Ví dụ: Standard full month contract"
                />
              </div>
              {/* Hiển thị tính toán PlannedAmountVND */}
              {((submitForm.calculationMethod === "Percentage" && submitForm.unitPriceForeignCurrency && submitForm.exchangeRate && submitForm.percentageValue) ||
                (submitForm.calculationMethod === "FixedAmount" && submitForm.fixedAmount && submitForm.exchangeRate)) && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowCostCalculation(!showCostCalculation)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
                  >
                    <p className="text-sm font-semibold text-gray-900">Tính toán chi phí dự kiến</p>
                    {showCostCalculation ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  {showCostCalculation && (
                    <div className={`p-4 ${submitForm.calculationMethod === "Percentage" ? "bg-blue-50 border-t border-blue-200" : "bg-green-50 border-t border-green-200"}`}>
                      {submitForm.calculationMethod === "Percentage" && submitForm.unitPriceForeignCurrency && submitForm.exchangeRate && submitForm.percentageValue && (
                        <div>
                          <p className="text-sm text-blue-800 mb-2">
                            Chi phí dự kiến = {formatNumberVi(submitForm.unitPriceForeignCurrency)} × {formatNumberVi(submitForm.exchangeRate)} × ({submitForm.percentageValue} / 100)
                          </p>
                          <p className="text-sm text-blue-800 mb-2">
                            = {formatNumberVi(submitForm.unitPriceForeignCurrency * submitForm.exchangeRate)} × {formatNumberWithoutTrailingZeros(submitForm.percentageValue / 100)}
                          </p>
                          <p className="text-sm font-bold text-blue-900">
                            = {calculatePlannedAmountVND() ? formatNumberVi(calculatePlannedAmountVND()!) : "0"} VND
                          </p>
                        </div>
                      )}
                      {submitForm.calculationMethod === "FixedAmount" && submitForm.fixedAmount && submitForm.exchangeRate && (
                        <div>
                          <p className="text-sm text-green-800 mb-2">
                            Chi phí dự kiến = {formatNumberVi(submitForm.fixedAmount)} × {formatNumberVi(submitForm.exchangeRate)}
                          </p>
                          <p className="text-sm font-bold text-green-900 mb-2">
                            = {calculatePlannedAmountVND() ? formatNumberVi(calculatePlannedAmountVND()!) : "0"} VND
                          </p>
                          <p className="text-xs text-green-700 italic">
                            Lưu ý: Số tiền cố định không phụ thuộc vào số giờ làm việc
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowSubmitContractModal(false);
                  setSubmitForm({
                    unitPriceForeignCurrency: 0,
                    currencyCode: "USD",
                    exchangeRate: 1,
                    calculationMethod: "Percentage",
                    percentageValue: 100,
                    fixedAmount: null,
                    plannedAmountVND: null,
                    standardHours: 160, // Always 160, not editable
                    notes: null,
                  });
                  setSowExcelFile(null);
                  setSowFileError(null);
                  setExchangeRateData(null);
                  setExchangeRateError(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitContract}
                disabled={
                  isProcessing ||
                  !sowExcelFile ||
                  !!sowFileError ||
                  !submitForm.unitPriceForeignCurrency ||
                  !submitForm.exchangeRate ||
                  (submitForm.calculationMethod === "Percentage" && (!submitForm.percentageValue || submitForm.percentageValue <= 0)) ||
                  (submitForm.calculationMethod === "FixedAmount" && (!submitForm.fixedAmount || submitForm.fixedAmount <= 0))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Ghi nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitConfirmation}
        onClose={() => setShowSubmitConfirmation(false)}
        onConfirm={handleSubmitContractConfirm}
        title="Xác nhận ghi nhận thông tin"
        message={`Bạn có chắc chắn muốn ghi nhận thông tin hợp đồng này?

• Số giờ tiêu chuẩn: 160 giờ
• Đơn giá: ${formatNumberVi(submitForm.unitPriceForeignCurrency)} ${submitForm.currencyCode}
• Tỷ giá: ${formatNumberVi(submitForm.exchangeRate)}
• Phương pháp tính: ${submitForm.calculationMethod === "Percentage"
  ? `Theo phần trăm (${submitForm.percentageValue}%)`
  : "Số tiền cố định"
}
• File SOW: ${sowExcelFile?.name}${calculatePlannedAmountVND() ? `\n• Chi phí dự kiến: ${formatNumberVi(calculatePlannedAmountVND()!)} VND` : ''}

Hành động này sẽ gửi thông tin hợp đồng để chờ xác minh từ kế toán.`}
        confirmText="Xác nhận ghi nhận"
        cancelText="Hủy"
        isLoading={isProcessing}
        variant="warning"
      />

      {/* Success Message Toast */}
      <SuccessToast
        isOpen={showSuccessMessage}
        onClose={() => setShowSuccessMessage(false)}
        title="Ghi nhận thông tin thành công!"
        message="Thông tin đã được gửi để chờ xác minh từ kế toán."
      />
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


