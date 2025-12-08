import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Filter, Loader2, RefreshCcw, Search, Trash2, MessageCircle } from 'lucide-react';
import {
  notificationService,
  type Notification,
  type NotificationListResult,
  NotificationPriority,
  NotificationType,
} from '../../../services/Notification';
import { useAuth } from '../../../context/AuthContext';
import { decodeJWT } from '../../../services/Auth';
import { useNotification } from '../../../context/NotificationContext';
import { talentCVService } from '../../../services/TalentCV';
import { talentService } from '../../../services/Talent';
import { jobRoleLevelService } from '../../../services/JobRoleLevel';
import Breadcrumb from '../../../components/common/Breadcrumb';

type StatusFilter = 'all' | 'unread' | 'read';

const notificationTypeOptions = Object.entries(NotificationType)
  .filter(([, value]) => typeof value === 'number')
  .map(([label, value]) => ({ label, value }));

function getPriorityLabel(priority?: NotificationPriority) {
  switch (priority) {
    case NotificationPriority.Urgent:
      return 'Khẩn cấp';
    case NotificationPriority.High:
      return 'Cao';
    case NotificationPriority.Medium:
      return 'Trung bình';
    default:
      return 'Thấp';
  }
}

function getPriorityBadge(priority?: NotificationPriority) {
  switch (priority) {
    case NotificationPriority.Urgent:
      return 'bg-red-100 text-red-700 border border-red-200';
    case NotificationPriority.High:
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    case NotificationPriority.Medium:
      return 'bg-primary-100 text-primary-700 border border-primary-200';
    default:
      return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
  }
}

function getTypeLabel(type: NotificationType) {
  const entry = notificationTypeOptions.find((item) => item.value === type);
  if (!entry) return 'Khác';
  switch (entry.label) {
    case 'ApplicationStatusChanged':
      return 'Trạng thái hồ sơ';
    case 'InterviewRescheduled':
      return 'Dời lịch phỏng vấn';
    case 'InterviewCompleted':
      return 'Hoàn tất phỏng vấn';
    case 'InterviewResultPassed':
      return 'Đậu phỏng vấn';
    case 'InterviewResultFailed':
      return 'Rớt phỏng vấn';
    case 'ApplicationOffered':
      return 'Đề nghị mới';
    case 'ApplicationHired':
      return 'Đã tuyển';
    case 'ApplicationRejected':
      return 'Từ chối ứng viên';
    case 'ApplicationWithdrawn':
      return 'Ứng viên rút';
    case 'NewJobPosted':
      return 'Job mới';
    case 'JobStatusChanged':
      return 'Trạng thái job';
    case 'ContractCreated':
      return 'Hợp đồng mới';
    case 'ContractPendingApproval':
      return 'Hợp đồng chờ duyệt';
    case 'ContractActivated':
      return 'Hợp đồng kích hoạt';
    case 'ContractExpiringSoon':
      return 'Hợp đồng sắp hết';
    case 'ContractExpired':
      return 'Hợp đồng hết hạn';
    case 'ContractTerminated':
      return 'Hợp đồng chấm dứt';
    case 'ContractRejected':
      return 'Hợp đồng bị từ chối';
    case 'TalentStatusChanged':
      return 'Trạng thái talent';
    case 'TalentHired':
      return 'Talent nhận việc';
    case 'DocumentUploaded':
      return 'Tài liệu mới';
    case 'NewSkillDetectedFromCV':
      return 'Kỹ năng mới từ CV';
    case 'CVUploadedByDeveloper':
      return 'CV được upload bởi Developer';
    case 'PaymentDueSoon':
      return 'Thanh toán sắp đến hạn';
    case 'PaymentOverdue':
      return 'Thanh toán quá hạn';
    case 'PaymentReceived':
      return 'Đã nhận thanh toán';
    case 'PaymentCalculated':
      return 'Thanh toán đã tính toán';
    case 'PaymentApproved':
      return 'Thanh toán đã duyệt';
    case 'PaymentRejected':
      return 'Thanh toán bị từ chối';
    case 'PaymentMarkedAsPaid':
      return 'Thanh toán đã đánh dấu';
    case 'InvoiceRecorded':
      return 'Hóa đơn đã ghi nhận';
    case 'ContactInquiryReceived':
      return 'Nhận yêu cầu liên hệ';
    case 'ContactInquiryAssigned':
      return 'Yêu cầu liên hệ đã được phân công';
    default:
      return entry.label;
  }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const NotificationCenterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setUnread, updateItemById, removeItemById } = useNotification();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const resolvedUserId = useMemo(() => {
    if (!user) return null;
    const token = localStorage.getItem('accessToken');
    if (!token) return user.id;
    const decoded = decodeJWT(token);
    const idFromToken = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid;
    return idFromToken || user.id;
  }, [user]);

  const totalPages = useMemo(() => {
    return totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
  }, [totalCount, pageSize]);

  const fetchNotifications = useCallback(async () => {
    if (!resolvedUserId) return;
    try {
      setIsLoading(true);
      const filter: Parameters<typeof notificationService.getAll>[0] = {
        userId: resolvedUserId,
        pageNumber,
        pageSize,
      };

      if (statusFilter === 'unread') filter.isRead = false;
      if (statusFilter === 'read') filter.isRead = true;
      if (typeFilter !== 'all') filter.type = Number(typeFilter) as NotificationType;
      if (searchKeyword.trim()) filter.title = searchKeyword.trim();

      const result = (await notificationService.getAll(filter)) as NotificationListResult;
      const fetchedNotifications = result.notifications || [];
      setNotifications(fetchedNotifications);
      setTotalCount(result.totalCount ?? 0);
      setUnreadCount(result.unreadCount ?? 0);
      
      // Giữ nguyên repliedNotificationIds đã có (không reset)
      // Chỉ thêm các notification mới đã được phản hồi từ server nếu có
      setRepliedNotificationIds(prev => {
        const newSet = new Set(prev);
        fetchedNotifications.forEach((notif) => {
          // Nếu notification này là phản hồi (có originalNotificationId trong metaData)
          if (notif.metaData && (notif.metaData as any).originalNotificationId) {
            const originalId = Number((notif.metaData as any).originalNotificationId);
            if (!isNaN(originalId)) {
              newSet.add(originalId);
            }
          }
        });
        return newSet;
      });
    } catch (error) {
      // Silent fail - user can retry
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUserId, pageNumber, pageSize, statusFilter, typeFilter, searchKeyword]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPageNumber(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPageNumber(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPageNumber(1);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    try {
      const updated = await notificationService.markAsRead(notification.id);
      // Cập nhật ngay lập tức trong NotificationContext để navbar cập nhật unread
      updateItemById(notification.id, { isRead: true, readAt: updated?.readAt || new Date().toISOString() });
      // Cập nhật local state
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: updated?.readAt || new Date().toISOString() }
            : item
        )
      );
      // Giảm unread count ngay lập tức
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      // Fetch lại để đồng bộ với server
      fetchNotifications();
    } catch (error) {
      // Fallback: cập nhật local state và context
      const fallbackReadAt = new Date().toISOString();
      updateItemById(notification.id, { isRead: true, readAt: fallbackReadAt });
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: fallbackReadAt }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead();
      // Cập nhật tất cả notifications trong context
      notifications.forEach(notif => {
        if (!notif.isRead) {
          updateItemById(notif.id, { isRead: true, readAt: new Date().toISOString() });
        }
      });
      // Set unread về 0 ngay lập tức
      setUnread(0);
      setUnreadCount(0);
      // Fetch lại để đồng bộ với server
      fetchNotifications();
    } catch (error) {
      // Silent fail
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.');
    if (!confirmed) return;
    try {
      await notificationService.delete(notification.id);
      // Xóa ngay lập tức khỏi NotificationContext để navbar cập nhật unread
      removeItemById(notification.id);
      // Cập nhật local state
      setNotifications((prev) => prev.filter(item => item.id !== notification.id));
      // Giảm unread count nếu notification chưa đọc
      if (!notification.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
      // Giảm total count
      setTotalCount((prev) => Math.max(prev - 1, 0));
      // Xử lý pagination nếu cần
      const isLastItemOnPage = notifications.length === 1 && pageNumber > 1;
      if (isLastItemOnPage) {
        setPageNumber((prev) => Math.max(1, prev - 1));
      } else {
        // Fetch lại để đồng bộ với server
        fetchNotifications();
      }
    } catch (error) {
      alert('Không thể xóa thông báo. Vui lòng thử lại sau.');
    }
  };

  const handleDeleteAllRead = async () => {
    const readNotifications = notifications.filter(n => n.isRead);
    const readCount = totalCount - unreadCount; // Số lượng thông báo đã đọc trong toàn bộ hệ thống
    
    if (readCount === 0 && readNotifications.length === 0) {
      alert('Không có thông báo đã đọc nào để xóa.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc? Hành động này không thể hoàn tác.\n\n` +
      `(Trang hiện tại: ${readNotifications.length} thông báo đã đọc)\n` +
      `(Tổng số: ${readCount} thông báo đã đọc)`
    );
    if (!confirmed) return;

    try {
      // Xóa tất cả thông báo đã đọc trong trang hiện tại
      const deletePromises = readNotifications.map(notif => 
        notificationService.delete(notif.id).catch(err => {
          console.error(`❌ Lỗi xóa notification ${notif.id}:`, err);
          return null; // Tiếp tục xóa các notification khác dù có lỗi
        })
      );
      
      await Promise.all(deletePromises);
      
      // Xóa ngay lập tức khỏi NotificationContext
      readNotifications.forEach(notif => removeItemById(notif.id));
      
      // Cập nhật local state - chỉ giữ lại thông báo chưa đọc
      setNotifications((prev) => prev.filter(item => !item.isRead));
      
      // Cập nhật total count (giảm số lượng đã xóa)
      const deletedCount = readNotifications.length;
      setTotalCount((prev) => Math.max(prev - deletedCount, 0));
      
      // Xử lý pagination nếu cần
      const remainingNotifications = notifications.filter(n => !n.isRead);
      if (remainingNotifications.length === 0 && pageNumber > 1) {
        setPageNumber((prev) => Math.max(1, prev - 1));
      } else {
        // Fetch lại để đồng bộ với server và lấy thêm thông báo đã đọc từ các trang khác nếu có
        fetchNotifications();
      }
      
      alert(`✅ Đã xóa ${deletedCount} thông báo đã đọc thành công!`);
    } catch (error) {
      console.error('❌ Lỗi khi xóa thông báo đã đọc:', error);
      alert('Không thể xóa một số thông báo. Vui lòng thử lại sau.');
      // Fetch lại để đồng bộ với server
      fetchNotifications();
    }
  };

  const handleNavigate = async (notification: Notification) => {
    // Chỉ đánh dấu đã đọc nếu không phải là notification CVUploadedByDeveloper chưa được phản hồi
    // Để giữ nút phản hồi hiển thị sau khi xem chi tiết
    const isCVUploadNotification = (notification.type === NotificationType.CVUploadedByDeveloper || 
      (notification.type as number) === 7002) && 
      notification.entityType === 'TalentCV' && 
      notification.entityId;
    
    if (!isCVUploadNotification || notification.isRead) {
      await handleMarkAsRead(notification);
    }
    
    if (notification.actionUrl) {
      // Fix: Convert /ta/talents/:id thành /ta/developers/:id (route đúng)
      let targetUrl = notification.actionUrl;
      if (targetUrl.startsWith('/ta/talents/')) {
        targetUrl = targetUrl.replace('/ta/talents/', '/ta/developers/');
      }
      
      // Xử lý đặc biệt cho notification về skill group - navigate với state để mở tab "skills"
      if (notification.type === NotificationType.SkillGroupAutoInvalidated && targetUrl.includes('/ta/developers/')) {
        navigate(targetUrl, { state: { tab: 'skills' } });
      } else {
        navigate(targetUrl);
      }
    }
  };

  const [replyingToNotificationId, setReplyingToNotificationId] = useState<number | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyNotification, setReplyNotification] = useState<Notification | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [repliedNotificationIds, setRepliedNotificationIds] = useState<Set<number>>(new Set());

  const openReplyModal = async (notification: Notification) => {
    setReplyNotification(notification);
    setReplyMessage('TA sẽ sử dụng CV này để cập nhật hồ sơ talent trong thời gian sớm nhất.\n\nCảm ơn bạn đã cập nhật CV!');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyNotification) return;
    
    setReplyingToNotificationId(replyNotification.id);
    
    try {
      let developerId: string | null = null;
      let talentName = '';
      let cvVersion = '';
      let jobRoleLevelName = '';
      
      // Ưu tiên lấy từ metaData
      if (replyNotification.metaData) {
        developerId = (replyNotification.metaData as any)?.developerId || 
                      (replyNotification.metaData as any)?.userId ||
                      (replyNotification.metaData as any)?.talentUserId ||
                      null;
        talentName = (replyNotification.metaData as any)?.talentName || '';
        cvVersion = (replyNotification.metaData as any)?.cvVersion || '';
        jobRoleLevelName = (replyNotification.metaData as any)?.jobRoleLevelName || '';
      }
      
      // Fallback: Lấy từ entityId nếu là TalentCV
      if (!developerId && replyNotification.entityType === 'TalentCV' && replyNotification.entityId) {
        try {
          const talentCV = await talentCVService.getById(replyNotification.entityId);
          if (talentCV?.talentId) {
            const talent = await talentService.getById(talentCV.talentId);
            if (talent?.userId) {
              developerId = talent.userId;
              talentName = talent.fullName || '';
              cvVersion = String(talentCV.version || '');
              
              // Lấy jobRoleLevel name
              if (talentCV.jobRoleLevelId) {
                try {
                  const jobRoleLevel = await jobRoleLevelService.getById(talentCV.jobRoleLevelId);
                  jobRoleLevelName = jobRoleLevel?.name || '';
                } catch (err) {
                  // Silent fail
                }
              }
            }
          }
        } catch (err) {
          // Silent fail, sẽ alert sau
        }
      }
      
      if (!developerId) {
        alert('Không tìm thấy thông tin developer để phản hồi.');
        return;
      }

      // Lấy tên TA từ user context thay vì email (backend vẫn dùng HR)
      const hrStaffName = user?.name || 'TA Staff';

      // Tạo title với jobRoleLevel name
      const title = jobRoleLevelName 
        ? `[Phản hồi] ${hrStaffName} đã nhận CV (Version ${cvVersion}) mới - ${jobRoleLevelName}`
        : `[Phản hồi] ${hrStaffName} đã nhận CV mới của bạn`;

      await notificationService.create({
        title: title,
        message: `${replyMessage}`,
        type: NotificationType.DocumentUploaded,
        priority: NotificationPriority.Low,
        userIds: [String(developerId)],
        entityType: replyNotification.entityType || null,
        entityId: replyNotification.entityId || null,
        actionUrl: '/developer/profile', // Developer nên vào trang profile của họ
        metaData: {
          originalNotificationId: String(replyNotification.id),
          cvVersion: cvVersion,
          talentName: talentName,
          hrStaffName: hrStaffName,
          jobRoleLevelName: jobRoleLevelName,
          replyTo: 'cv-upload',
        },
      });

      // Đánh dấu đã đọc sau khi phản hồi thành công
      try {
        await notificationService.markAsRead(replyNotification.id);
        // Cập nhật local state
        updateItemById(replyNotification.id, { isRead: true, readAt: new Date().toISOString() });
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch (markReadError) {
        // Silent fail - đã phản hồi thành công rồi
      }

      // Đánh dấu notification này đã được phản hồi
      setRepliedNotificationIds(prev => new Set(prev).add(replyNotification.id));
      
      // Cập nhật local state để ẩn nút phản hồi ngay lập tức
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === replyNotification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
      
      alert('✅ Đã gửi thông báo phản hồi đến developer thành công!');
      setReplyModalOpen(false);
      setReplyNotification(null);
      setReplyMessage('');
      // KHÔNG refresh notifications để giữ state repliedNotificationIds
      // Nút phản hồi đã được ẩn ngay lập tức qua setRepliedNotificationIds và setNotifications
    } catch (error) {
      alert('Không thể gửi thông báo phản hồi. Vui lòng thử lại.');
    } finally {
      setReplyingToNotificationId(null);
    }
  };

  const handleSearch = () => {
    setPageNumber(1);
    fetchNotifications();
  };

  const unreadPercentage = totalCount > 0 ? Math.round((unreadCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: 'Trung tâm thông báo' }
            ]}
          />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Trung tâm thông báo</h1>
                <p className="text-sm text-neutral-500">Xem và quản lý tất cả thông báo của bạn theo thời gian thực.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Tổng thông báo</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{totalCount}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-all duration-300">
                    <Bell className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-secondary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Chưa đọc</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-3xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors duration-300">{unreadCount}</p>
                      <span className="text-xs text-neutral-500">
                        ({unreadPercentage}% tổng số)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200 transition-all duration-300">
                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-warning-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Trang hiện tại</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{pageNumber}/{totalPages}</p>
                  </div>
                  <div className="p-3 rounded-full bg-warning-100 text-warning-600 group-hover:bg-warning-200 transition-all duration-300">
                    <Filter className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <aside className="lg:col-span-1 bg-white rounded-2xl border border-neutral-100 shadow-soft p-6 h-max lg:sticky lg:top-24">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2 text-neutral-600 mb-4">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Bộ lọc</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Trạng thái</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleStatusChange('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      statusFilter === 'all'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => handleStatusChange('unread')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      statusFilter === 'unread'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Chưa đọc
                  </button>
                  <button
                    onClick={() => handleStatusChange('read')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      statusFilter === 'read'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Đã đọc
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Loại thông báo</p>
                <select
                  value={typeFilter}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả</option>
                  {notificationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{getTypeLabel(option.value as NotificationType)}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Tìm kiếm</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo tiêu đề..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSearchKeyword('');
                    setPageNumber(1);
                    handleSearch();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Đặt lại
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-b border-neutral-200">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Danh sách thông báo</p>
                <p className="text-xs text-neutral-500">Thông báo được sắp theo thời gian mới nhất.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size} / trang</option>
                  ))}
                </select>
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-200 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:text-neutral-300 disabled:border-neutral-200 disabled:bg-neutral-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
                <button
                  onClick={handleDeleteAllRead}
                  disabled={notifications.filter(n => n.isRead).length === 0 && (totalCount - unreadCount) === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:text-neutral-300 disabled:border-neutral-200 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                  title={notifications.filter(n => n.isRead).length === 0 && (totalCount - unreadCount) === 0 ? "Không có thông báo đã đọc" : "Xóa tất cả thông báo đã đọc"}
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả đã đọc
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 min-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-neutral-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang tải dữ liệu...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-neutral-500">
                  <Bell className="w-10 h-10 text-neutral-300 mb-3" />
                  <p className="text-sm">Không có thông báo nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-6 py-5 transition-all ${
                      notification.isRead ? 'bg-white' : 'bg-primary-50/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${getPriorityBadge(notification.priority)}`}>
                            {getPriorityLabel(notification.priority)}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-xs text-neutral-400">• {getTypeLabel(notification.type)}</span>
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">{notification.title}</h3>
                        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        {notification.metaData && Object.keys(notification.metaData).length > 0 && (
                          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Thông tin liên quan</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-neutral-700">
                              {Object.entries(notification.metaData).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-neutral-500">{key}</span>
                                  <span className="font-medium text-neutral-800">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-stretch gap-2 w-full md:w-48">
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            notification.isRead
                              ? 'border-neutral-200 text-neutral-400 cursor-default'
                              : 'border-primary-200 text-primary-600 hover:bg-primary-50'
                          }`}
                          disabled={notification.isRead}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {notification.isRead ? 'Đã đọc' : 'Đánh dấu đã đọc'}
                        </button>
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNavigate(notification)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all"
                          >
                            Xem chi tiết
                          </button>
                        )}
                        {/* Nút phản hồi cho thông báo CV mới từ developer */}
                        {/* Hiển thị nút phản hồi cho CVUploadedByDeveloper chưa được phản hồi */}
                        {(notification.type === NotificationType.CVUploadedByDeveloper || 
                          (notification.type as number) === 7002) && 
                         notification.entityType === 'TalentCV' && 
                         notification.entityId &&
                         !repliedNotificationIds.has(notification.id) && (
                          <button
                            onClick={() => openReplyModal(notification)}
                            disabled={replyingToNotificationId === notification.id}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gửi thông báo phản hồi đến developer"
                          >
                            {replyingToNotificationId === notification.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang gửi...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-4 h-4" />
                                Phản hồi Developer
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification)}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-error-200 text-sm font-medium text-error-600 hover:bg-error-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalCount > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                <div className="text-sm text-neutral-500">
                  Hiển thị {(notifications.length === 0 ? 0 : (pageNumber - 1) * pageSize + 1)}-
                  {(notifications.length === 0 ? 0 : (pageNumber - 1) * pageSize + notifications.length)} trong tổng số {totalCount} thông báo
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={pageNumber === 1}
                    className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:text-neutral-300 disabled:border-neutral-100"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-neutral-600">
                    Trang {pageNumber} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                    disabled={pageNumber === totalPages}
                    className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 disabled:text-neutral-300 disabled:border-neutral-100"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa tin nhắn phản hồi */}
      {replyModalOpen && replyNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Phản hồi Developer</p>
                <p className="text-xs text-neutral-500">Chỉnh sửa nội dung tin nhắn trước khi gửi</p>
              </div>
              <button
                onClick={() => {
                  setReplyModalOpen(false);
                  setReplyNotification(null);
                  setReplyMessage('');
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors text-xl leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nội dung tin nhắn
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                  placeholder="Nhập nội dung tin nhắn phản hồi..."
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setReplyModalOpen(false);
                  setReplyNotification(null);
                  setReplyMessage('');
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || replyingToNotificationId === replyNotification.id}
                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replyingToNotificationId === replyNotification.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi phản hồi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterPage;

