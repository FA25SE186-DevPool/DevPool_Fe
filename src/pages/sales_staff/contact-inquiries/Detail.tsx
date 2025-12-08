import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../../components/common/Sidebar';
import { sidebarItems } from '../../../components/sales_staff/SidebarItems';
import { 
  Mail, 
  ArrowLeft, 
  Building2, 
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Send,
  XCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { 
  contactInquiryService, 
  type ContactInquiryModel,
  ContactInquiryStatus,
  type ContactInquiryStatusType,
  type ContactInquiryStatusUpdateModel
} from '../../../services/ContactInquiry';
import { useAuth } from '../../../context/AuthContext';

export default function ContactInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [inquiry, setInquiry] = useState<ContactInquiryModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [availableTransitions, setAvailableTransitions] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ContactInquiryStatusType>(ContactInquiryStatus.Closed);
  const [responseNotes, setResponseNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const statusLabels: Record<ContactInquiryStatusType, string> = {
    New: "Mới",
    InProgress: "Đang xử lý",
    Closed: "Đã đóng"
  };

  const statusColors: Record<ContactInquiryStatusType, string> = {
    New: "bg-blue-100 text-blue-800",
    InProgress: "bg-yellow-100 text-yellow-800",
    Closed: "bg-gray-100 text-gray-800"
  };

  // Helper function to normalize status (handle both number and string)
  const normalizeStatus = (status: any): ContactInquiryStatusType => {
    if (typeof status === 'number') {
      // Map enum numbers to strings (New=1, InProgress=2, Closed=3)
      const enumMap: Record<number, ContactInquiryStatusType> = {
        1: ContactInquiryStatus.New,
        2: ContactInquiryStatus.InProgress,
        3: ContactInquiryStatus.Closed,
      };
      return enumMap[status] || ContactInquiryStatus.New;
    }
    if (typeof status === 'string') {
      // If it's already a string, check if it's a valid status
      if (status === 'New' || status === 'InProgress' || status === 'Closed') {
        return status as ContactInquiryStatusType;
      }
      // Try to match case-insensitive
      const lower = status.toLowerCase();
      if (lower === 'new') return ContactInquiryStatus.New;
      if (lower === 'inprogress' || lower === 'in progress') return ContactInquiryStatus.InProgress;
      if (lower === 'closed') return ContactInquiryStatus.Closed;
    }
    return ContactInquiryStatus.New; // Default fallback
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');
        
        const [inquiryData, transitions] = await Promise.all([
          contactInquiryService.getById(Number(id)),
          contactInquiryService.getAvailableStatusTransitions(Number(id))
        ]);
        
        setInquiry(inquiryData);
        setAvailableTransitions(transitions);
      } catch (err: any) {
        console.error("❌ Lỗi tải chi tiết yêu cầu liên hệ:", err);
        setError(err.message || "Không thể tải thông tin yêu cầu liên hệ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleClaim = async () => {
    if (!id) return;
    
    const confirmClaim = window.confirm(
      'Bạn có chắc muốn nhận yêu cầu liên hệ này?\n\nYêu cầu sẽ được gán cho bạn và chuyển sang trạng thái "Đang xử lý".'
    );
    
    if (!confirmClaim) return;

    try {
      setIsClaiming(true);
      setSuccessMessage(null);
      const result = await contactInquiryService.claimInquiry(Number(id));
      
      if (result.isSuccess) {
        setSuccessMessage(result.message || 'Nhận yêu cầu thành công!');
        // Reload data
        const [inquiryData, transitions] = await Promise.all([
          contactInquiryService.getById(Number(id)),
          contactInquiryService.getAvailableStatusTransitions(Number(id))
        ]);
        setInquiry(inquiryData);
        setAvailableTransitions(transitions);
      } else {
        alert(result.message || 'Không thể nhận yêu cầu');
      }
    } catch (err: any) {
      console.error('❌ Lỗi nhận yêu cầu:', err);
      alert(err?.message || 'Không thể nhận yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Convert status string to enum number for API
  const statusToEnumNumber = (status: ContactInquiryStatusType): number => {
    if (status === ContactInquiryStatus.New) return 1;
    if (status === ContactInquiryStatus.InProgress) return 2;
    if (status === ContactInquiryStatus.Closed) return 3;
    return 1; // Default to New
  };

  const handleUpdateStatus = async () => {
    if (!id || !inquiry) return;

    try {
      setIsUpdatingStatus(true);
      setSuccessMessage(null);
      
      const payload: ContactInquiryStatusUpdateModel = {
        newStatus: statusToEnumNumber(newStatus), // Convert to enum number (1, 2, 3)
        responseNotes: responseNotes || null
      };

      const result = await contactInquiryService.updateStatus(Number(id), payload);
      
      if (result.isSuccess) {
        setSuccessMessage(result.message || 'Cập nhật trạng thái thành công!');
        setShowStatusModal(false);
        setResponseNotes('');
        
        // Reload data
        const [inquiryData, transitions] = await Promise.all([
          contactInquiryService.getById(Number(id)),
          contactInquiryService.getAvailableStatusTransitions(Number(id))
        ]);
        setInquiry(inquiryData);
        setAvailableTransitions(transitions);
      } else {
        alert(result.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err: any) {
      console.error('❌ Lỗi cập nhật trạng thái:', err);
      alert(err?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const canClaim = inquiry && normalizeStatus(inquiry.status) === ContactInquiryStatus.New && !inquiry.assignedTo;
  const isAssignedToMe = inquiry?.assignedTo === user?.id;
  const canUpdateStatus = isAssignedToMe && availableTransitions.length > 0;

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Sales Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-500 text-lg font-medium">
              {error || "Không tìm thấy yêu cầu liên hệ"}
            </p>
            <Link 
              to="/sales/contact-inquiries"
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
      <Sidebar items={sidebarItems} title="Sales Staff" />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/sales/contact-inquiries"
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Quay lại danh sách</span>
            </Link>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Yêu Cầu Liên Hệ #{inquiry.id}</h1>
              <p className="text-neutral-600 mb-4">
                {inquiry.subject}
              </p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white">
                {(() => {
                  const normalizedStatus = normalizeStatus(inquiry.status);
                  return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[normalizedStatus] || normalizedStatus}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3">
              {canClaim && (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="w-5 h-5" />
                  {isClaiming ? 'Đang xử lý...' : 'Nhận yêu cầu'}
                </button>
              )}
              
              {canUpdateStatus && (
                <button
                  onClick={() => {
                    setNewStatus((availableTransitions[0] as ContactInquiryStatusType) || ContactInquiryStatus.Closed);
                    setShowStatusModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow"
                >
                  <Send className="w-5 h-5" />
                  Cập nhật trạng thái
                </button>
              )}
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary-600" />
                Thông tin khách hàng
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600 mb-1">Họ và tên</p>
                    <p className="text-base text-gray-900">{inquiry.fullName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <a href={`mailto:${inquiry.email}`} className="text-base text-primary-600 hover:text-primary-700">
                        {inquiry.email}
                      </a>
                    </div>
                  </div>
                </div>
                {inquiry.company && (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-600 mb-1">Công ty</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <p className="text-base text-gray-900">{inquiry.company}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                Nội dung yêu cầu
              </h2>
              <div className="prose max-w-none">
                <p className="text-base text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
              </div>
            </div>

            {/* Response Notes */}
            {inquiry.responseNotes && (
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary-600" />
                  Ghi chú phản hồi
                </h2>
                <div className="prose max-w-none">
                  <p className="text-base text-gray-700 whitespace-pre-wrap">{inquiry.responseNotes}</p>
                </div>
              </div>
            )}

            {/* Create Job Request Section - Only show when Closed and assigned to current user */}
            {(() => {
              const normalizedStatus = normalizeStatus(inquiry.status);
              const isClosed = normalizedStatus === ContactInquiryStatus.Closed;
              return isClosed && isAssignedToMe ? (
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-soft border-2 border-primary-200 p-6 animate-fade-in">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-primary-600" />
                    Tạo Yêu Cầu Tuyển Dụng
                  </h2>
                  <p className="text-neutral-600 mb-6">
                    Yêu cầu liên hệ đã được đóng. Bạn có thể tạo yêu cầu tuyển dụng từ thông tin này. 
                    Nội dung yêu cầu sẽ được tự động điền vào "Mô tả công việc" và "Yêu cầu ứng viên".
                  </p>
                  <Link
                    to={`/sales/job-requests/create?contactInquiryId=${inquiry.id}&title=${encodeURIComponent(inquiry.subject)}&description=${encodeURIComponent(inquiry.content)}&requirements=${encodeURIComponent(inquiry.content)}&company=${inquiry.company ? encodeURIComponent(inquiry.company) : ''}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                  >
                    <Briefcase className="w-5 h-5" />
                    Tạo Yêu Cầu Tuyển Dụng
                  </Link>
                </div>
              ) : null;
            })()}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Status & Assignment */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary-600" />
                Trạng thái & Giao việc
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">Trạng thái</p>
                  {(() => {
                    const normalizedStatus = normalizeStatus(inquiry.status);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[normalizedStatus] || normalizedStatus}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">Người được giao</p>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-neutral-400" />
                    <p className="text-base text-gray-900">{inquiry.assignedToName || 'Chưa được giao'}</p>
                  </div>
                </div>
                {inquiry.contactedAt && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">Ngày liên hệ</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <p className="text-base text-gray-900">{formatDate(inquiry.contactedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary-600" />
                Thời gian
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">Ngày tạo</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <p className="text-base text-gray-900">{formatDate(inquiry.createdAt)}</p>
                  </div>
                </div>
                {inquiry.updatedAt && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">Ngày cập nhật</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <p className="text-base text-gray-900">{formatDate(inquiry.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Available Transitions */}
            {canUpdateStatus && availableTransitions.length > 0 && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Có thể chuyển sang:</h3>
                <ul className="space-y-2">
                  {availableTransitions.map((transition) => (
                    <li key={transition} className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="w-4 h-4" />
                      <span>{statusLabels[transition as ContactInquiryStatusType]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cập nhật trạng thái</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ContactInquiryStatusType)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableTransitions.map((transition) => (
                    <option key={transition} value={transition}>
                      {statusLabels[transition as ContactInquiryStatusType]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Ghi chú phản hồi (tùy chọn)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nhập ghi chú về việc xử lý yêu cầu này..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setResponseNotes('');
                }}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-lg transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingStatus ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

