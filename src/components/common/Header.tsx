import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  Bell,
  LogOut,
  Loader2,
  Shield,
  UserCog,
  UserCheck,
  Briefcase,
  DollarSign,
  Code,
  Users,
  UserPen,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoDevPool from '../../assets/images/logo-DevPool.jpg';
import { getDashboardRoute, ROUTES, NOTIFICATION_CENTER_ROUTE } from '../../router/routes';
import {
  notificationService,
  type Notification,
  NotificationType,
  NotificationPriority,
} from '../../services/Notification';
import { decodeJWT } from '../../services/Auth';
import { useNotification } from '../../context/NotificationContext';
import { talentCVService } from '../../services/TalentCV';
import { talentService } from '../../services/Talent';
import { jobRoleLevelService } from '../../services/JobRoleLevel';

type ExtendedNotification = Notification & {
  metaData?: Record<string, string | number | boolean> | null;
};

interface GroupedNotifications {
  group: string;
  items: ExtendedNotification[];
  isReadGroup?: boolean;
  readTotal?: number;
}

function getNotificationGroup(type: NotificationType): string {
  if (type >= 1000 && type < 2000) return 'Tuyển dụng & Ứng tuyển';
  if (type >= 2000 && type < 3000) return 'Jobs & Projects';
  if (type >= 3000 && type < 4000) return 'Hợp đồng';
  if (type >= 5000 && type < 6000) return 'Talent';
  if (type >= 6000 && type < 7000) return 'Tài liệu';
  if (type >= 7000 && type < 8000) return 'Kỹ năng & Phân tích CV';
  if (type >= 8000 && type < 9000) return 'Thanh toán';
  if (type >= 9000 && type < 10000) return 'Yêu cầu liên hệ';
  return 'Thông báo khác';
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

interface HeaderProps {
  showPublicBranding?: boolean;
}

export default function Header({ showPublicBranding = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [viewNotification, setViewNotification] = useState<ExtendedNotification | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyNotification, setReplyNotification] = useState<ExtendedNotification | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unread, items, setUnread, setItems, updateItemById } = useNotification();

  const resolvedUserId = useMemo(() => {
    if (!user) return null;
    // Lấy token từ localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) return user.id;
    const decoded = decodeJWT(token);
    const idFromToken = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid;
    return idFromToken || user.id;
  }, [user]);

  // Track previous user để detect khi user thay đổi
  const prevUserKeyRef = useRef<string | null>(null);

  // Tạo userKey từ user hiện tại
  const currentUserKey = useMemo(() => {
    if (!user) return null;
    return `${user.id}-${user.role}-${resolvedUserId}`;
  }, [user, resolvedUserId]);

  useEffect(() => {
    // Nếu không có user hoặc resolvedUserId (logout)
    if (!user || !resolvedUserId) {
      // Clear notifications ngay lập tức khi logout
      setItems([]);
      setUnread(0);
      prevUserKeyRef.current = null;
      setIsLoadingNotifications(false);
      return;
    }

    // Nếu userKey thay đổi (user mới đăng nhập hoặc chuyển role)
    if (currentUserKey !== prevUserKeyRef.current) {
      // Clear notifications cũ ngay lập tức TRƯỚC KHI fetch
      // Đảm bảo unread được set về 0 ngay lập tức để không hiển thị unread của user cũ
      setItems([]);
      setUnread(0);
      
      // Update ref ngay lập tức để tránh fetch nhiều lần
      const userKeyToFetch = currentUserKey;
      prevUserKeyRef.current = userKeyToFetch;

      // Fetch notifications mới cho user mới
      const fetchNotifications = async () => {
        // Check lại user và resolvedUserId trước khi fetch
        // Lấy token từ localStorage
        const token = localStorage.getItem('accessToken');
        if (!token || !user || !resolvedUserId) {
          return;
        }

        // Check lại userKey để đảm bảo không bị thay đổi trong lúc fetch
        const currentKey = `${user.id}-${user.role}-${resolvedUserId}`;
        if (currentKey !== userKeyToFetch) {
          return;
        }

        try {
          setIsLoadingNotifications(true);
          
          const result = await notificationService.getAll({
            pageNumber: 1,
            pageSize: 20,
          });
          
          // Kiểm tra nhiều format response có thể có
          const notifications = (
            result?.notifications || 
            (Array.isArray(result) ? result : [])
          ) as ExtendedNotification[];
          
          // Check lại userKey một lần nữa trước khi set items
          // Đảm bảo không set notifications của user cũ
          // Lấy token từ localStorage
          const tokenCheck = localStorage.getItem('accessToken');
          const finalKey = `${user.id}-${user.role}-${resolvedUserId}`;
          if (tokenCheck && user && resolvedUserId && finalKey === userKeyToFetch && prevUserKeyRef.current === userKeyToFetch) {
            // Merge với items hiện tại để không mất real-time notifications
            // Loại bỏ duplicate trong items hiện tại trước (theo id, giữ lại item đầu tiên)
            const uniqueItems = items.reduce((acc, item) => {
              if (!acc.find(existing => existing.id === item.id)) {
                acc.push(item);
              }
              return acc;
            }, [] as ExtendedNotification[]);
            
            // Tạo map để tránh duplicate khi merge với notifications từ API
            const existingIds = new Set(uniqueItems.map((n: ExtendedNotification) => n.id));
            const newNotifications = notifications.filter((n: ExtendedNotification) => !existingIds.has(n.id));
            
            // Merge: real-time notifications (uniqueItems) + new notifications from API
            // Sắp xếp theo createdAt mới nhất trước
            const merged = [...uniqueItems, ...newNotifications].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const finalItems = merged.slice(0, 50) as ExtendedNotification[]; // Giới hạn 50 items
            // Tính unread từ items đã merge
            const unreadCount = finalItems.filter((n: ExtendedNotification) => !n.isRead).length;
            setItems(finalItems);
            setUnread(unreadCount);
          } else {
            // Nếu user đã thay đổi, không set items
            setItems([]);
            setUnread(0);
          }
        } catch (error: any) {
          // Không log error khi logout (401 Unauthorized)
          const isUnauthorized = error?.response?.status === 401 || error?.status === 401;
          // Lấy token từ localStorage
          const token = localStorage.getItem('accessToken');
          
          // Chỉ xử lý error nếu:
          // 1. Có token (không phải logout)
          // 2. Không phải 401 (Unauthorized)
          // 3. User vẫn còn và userKey vẫn khớp
          if (token && !isUnauthorized && user && resolvedUserId) {
            const finalKey = `${user.id}-${user.role}-${resolvedUserId}`;
            if (finalKey === userKeyToFetch && prevUserKeyRef.current === userKeyToFetch) {
              setItems([]);
              setUnread(0);
            }
          }
          // Nếu là 401 hoặc không có token, không log (có thể do logout)
        } finally {
          setIsLoadingNotifications(false);
        }
      };

      // Chỉ fetch nếu có user và resolvedUserId
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserKey, user, resolvedUserId]); // Chạy khi userKey, user hoặc resolvedUserId thay đổi

  // Đồng bộ unread với items mỗi khi items thay đổi (ví dụ từ realtime updates)
  // React sẽ tự động optimize nếu giá trị không thay đổi
  // Tính unread: !n.isRead (bao gồm false, null, undefined)
  useEffect(() => {
    // Nếu không có user, đảm bảo unread = 0
    if (!user) {
      setUnread(0);
      return;
    }

    if (!items || items.length === 0) {
      setUnread(0);
      return;
    }
    const actualUnreadCount = items.filter(n => !n.isRead).length;
    setUnread(actualUnreadCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, user]); // Phụ thuộc vào items và user

  const groupedNotifications: GroupedNotifications[] = useMemo(() => {
    if (!items.length) {
      return [];
    }

    const unreadList = items.filter((n) => !n.isRead);
    const read = items
      .filter((n) => n.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: GroupedNotifications[] = [];

    if (unreadList.length) {
      const unreadMap = new Map<string, ExtendedNotification[]>();
      unreadList.forEach((notification) => {
        const group = getNotificationGroup(notification.type);
        if (!unreadMap.has(group)) unreadMap.set(group, []);
        unreadMap.get(group)!.push(notification);
      });
      const unreadGroup = Array.from(unreadMap.entries()).map(([group, items]) => ({ group: `${group} (Chưa đọc)`, items }));
      groups.push(...unreadGroup);
    }

    if (read.length) {
      groups.push({
        group: 'Thông báo đã đọc gần đây',
        items: read.slice(0, 1),
        isReadGroup: true,
        readTotal: read.length,
      });
    }

    return groups;
  }, [items]);

  const markNotificationAsRead = async (notification: ExtendedNotification) => {
    if (notification.isRead) return notification;
    // Cập nhật UI ngay lập tức (optimistic update) trước khi gọi API
    const optimisticUpdate = {
      ...notification,
      isRead: true,
      readAt: new Date().toISOString(),
    } as ExtendedNotification;
    updateItemById(notification.id, { isRead: true, readAt: optimisticUpdate.readAt });
    
    try {
      const updated = (await notificationService.markAsRead(notification.id)) as ExtendedNotification;
      // Cập nhật lại với dữ liệu từ server (để đảm bảo readAt chính xác)
      updateItemById(updated.id, { isRead: true, readAt: updated.readAt });
      // unread sẽ được tự động tính lại bởi useEffect dựa trên items
      return updated;
    } catch (error) {
      // Giữ optimistic update nếu API fail
      return optimisticUpdate;
    }
  };

  const getRoleDisplay = () => {
    const role = user?.role;
    if (!role) {
      return {
        icon: <User className="w-4 h-4 text-white" />,
        containerClass: 'bg-gradient-to-r from-primary-600 to-accent-600',
      };
    }

    switch (role) {
      case 'Admin':
        return {
          icon: <Shield className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors duration-300" />,
          containerClass: 'bg-red-50',
        };
      case 'Manager':
        return {
          icon: <UserCog className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />,
          containerClass: 'bg-purple-50',
        };
      case 'Staff TA':
        return {
          icon: <UserCheck className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />,
          containerClass: 'bg-blue-50',
        };
      case 'Staff Sales':
        return {
          icon: <Briefcase className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors duration-300" />,
          containerClass: 'bg-green-50',
        };
      case 'Staff Accountant':
        return {
          icon: <DollarSign className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300" />,
          containerClass: 'bg-yellow-50',
        };
      case 'Developer':
        return {
          icon: <Code className="w-5 h-5 text-cyan-600 group-hover:text-cyan-700 transition-colors duration-300" />,
          containerClass: 'bg-cyan-50',
        };
      default:
        return {
          icon: <Users className="w-5 h-5 text-neutral-600 group-hover:text-primary-600 transition-colors duration-300" />,
          containerClass: 'bg-neutral-100',
        };
    }
  };

  const roleDisplay = useMemo(getRoleDisplay, [user?.role]);
  const handleNotificationNavigate = async (notification: ExtendedNotification) => {
    // Lưu actionUrl gốc TRƯỚC KHI làm bất cứ điều gì
    let originalActionUrl = notification.actionUrl;
    
    if (!originalActionUrl) {
      setIsNotificationOpen(false);
      return;
    }
    
    // Fix: Remove /hr prefix nếu có (backend có thể thêm prefix này)
    if (originalActionUrl.startsWith('/hr/')) {
      originalActionUrl = originalActionUrl.replace('/hr/', '/');
    }
    
    // Fix: Convert /ta/talents/:id thành /ta/developers/:id (route đúng)
    // Vì backend có thể tạo actionUrl với format cũ hoặc có notification cũ
    if (originalActionUrl.startsWith('/ta/talents/')) {
      originalActionUrl = originalActionUrl.replace('/ta/talents/', '/ta/developers/');
    }
    
    // Đóng notification dropdown ngay lập tức
    setIsNotificationOpen(false);
    
    // Xử lý đặc biệt cho notification về skill group - navigate với state để mở tab "skills"
    if (notification.type === NotificationType.SkillGroupAutoInvalidated && originalActionUrl.includes('/ta/developers/')) {
      navigate(originalActionUrl, { state: { tab: 'skills' } });
    } else {
      // Navigate ngay với actionUrl đã được fix, không đợi mark as read
      navigate(originalActionUrl);
    }
    
    // Mark as read sau khi navigate (không block navigation)
    try {
      await markNotificationAsRead(notification);
    } catch (error) {
      // Không block navigation nếu mark as read fail
    }
  };

  const handleNotificationDetail = async (notification: ExtendedNotification) => {
    try {
      // Lưu actionUrl gốc trước khi mark as read
      let originalActionUrl = notification.actionUrl;
      
      // Fix: Remove /hr prefix nếu có (backend có thể thêm prefix này)
      if (originalActionUrl && originalActionUrl.startsWith('/hr/')) {
        originalActionUrl = originalActionUrl.replace('/hr/', '/');
      }
      
      // Fix: Convert /ta/talents/:id thành /ta/developers/:id (route đúng)
      if (originalActionUrl && originalActionUrl.startsWith('/ta/talents/')) {
        originalActionUrl = originalActionUrl.replace('/ta/talents/', '/ta/developers/');
      }
      
      // Đánh dấu đã đọc trước, để UI cập nhật ngay
      const resolved = await markNotificationAsRead(notification);
      
      // Đợi một chút để người dùng thấy thay đổi (notification chuyển sang màu xám)
      await new Promise(resolve => setTimeout(resolve, 200));
      setIsNotificationOpen(false);
      
      // LUÔN giữ lại actionUrl đã được fix, không dùng từ resolved
      // Đảm bảo actionUrl luôn được giữ lại, kể cả khi resolved không có
      const finalActionUrl = originalActionUrl || notification.actionUrl || resolved?.actionUrl || null;
      
      // Xử lý đặc biệt cho notification về skill group - navigate với state để mở tab "skills"
      if (notification.type === NotificationType.SkillGroupAutoInvalidated && finalActionUrl && finalActionUrl.includes('/ta/developers/')) {
        navigate(finalActionUrl, { state: { tab: 'skills' } });
        return; // Return early, không hiển thị modal
      }
      
      setViewNotification({
        ...resolved,
        ...notification, // Giữ lại tất cả thông tin gốc
        actionUrl: finalActionUrl,
        isRead: resolved?.isRead ?? notification.isRead,
        readAt: resolved?.readAt ?? notification.readAt,
      });
    } catch (error) {
      // Nếu có lỗi, vẫn hiển thị notification với actionUrl gốc đã được fix
      console.error('Lỗi khi xem chi tiết thông báo:', error);
      let fixedActionUrl = notification.actionUrl;
      if (fixedActionUrl && fixedActionUrl.startsWith('/hr/')) {
        fixedActionUrl = fixedActionUrl.replace('/hr/', '/');
      }
      if (fixedActionUrl && fixedActionUrl.startsWith('/ta/talents/')) {
        fixedActionUrl = fixedActionUrl.replace('/ta/talents/', '/ta/developers/');
      }
      setIsNotificationOpen(false);
      setViewNotification({
        ...notification,
        actionUrl: fixedActionUrl
      });
    }
  };

  const handleCloseNotificationDetail = () => {
    setViewNotification(null);
  };

  const openReplyModal = async (notification: ExtendedNotification) => {
    setReplyNotification(notification);
    setReplyMessage('TA sẽ sử dụng CV này để cập nhật hồ sơ talent của bạn trong thời gian sớm nhất.\n\nCảm ơn bạn đã cập nhật CV!');
    setReplyModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyNotification) return;
    
    try {
      let developerId: string | null = null;
      let developerName = 'Developer';
      let talentName = '';
      let cvVersion = '';
      let jobRoleLevelName = '';
      
      // Ưu tiên lấy từ metaData
      if (replyNotification.metaData) {
        developerId = (replyNotification.metaData as any)?.developerId || 
                      (replyNotification.metaData as any)?.userId ||
                      (replyNotification.metaData as any)?.talentUserId ||
                      null;
        developerName = (replyNotification.metaData as any)?.developerName || 
                        (replyNotification.metaData as any)?.talentName || 
                        'Developer';
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
              developerName = talent.fullName || 'Developer';
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

      // Suppress unused variable warning - developerName may be used in future
      void developerName;

      // Lấy tên TA từ user context thay vì email (backend vẫn dùng HR)
      const hrStaffName = user?.name || 'TA Staff';

      // Tạo title với jobRoleLevel name
      const title = jobRoleLevelName 
        ? `[Phản hồi] ${hrStaffName} đã nhận CV mới - ${jobRoleLevelName}`
        : `[Phản hồi] ${hrStaffName} đã nhận CV mới của bạn`;

      await notificationService.create({
        title: title,
        message: `${hrStaffName} đã nhận được CV mới${cvVersion ? ` (Version ${cvVersion})` : ''}${jobRoleLevelName ? ` cho vị trí ${jobRoleLevelName}` : ''}${talentName ? ` của bạn cho talent ${talentName}` : ' của bạn'}.\n\n${replyMessage}`,
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
      } catch (markReadError) {
        // Silent fail - đã phản hồi thành công rồi
      }

      alert('✅ Đã gửi thông báo phản hồi đến developer thành công!');
      setReplyModalOpen(false);
      setReplyNotification(null);
      setReplyMessage('');
      // Refresh notifications để cập nhật UI
      if (isNotificationOpen) {
        setIsNotificationOpen(false);
      }
      setViewNotification(null);
    } catch (error) {
      alert('Không thể gửi thông báo phản hồi. Vui lòng thử lại.');
    }
  };

  const handleLogout = async () => {
    // Xác nhận trước khi đăng xuất
    const confirmed = window.confirm("Bạn có chắc muốn đăng xuất?");
    if (!confirmed) {
      return;
    }
    
    await logout();
    // Đợi một chút để đảm bảo storage đã được clear
    await new Promise(resolve => setTimeout(resolve, 100));
    // Reload trang để reset tất cả state và đảm bảo Header được remount
    window.location.href = ROUTES.GUEST.LOGIN;
  };

  const desktopLinks = showPublicBranding
    ? [
        { label: 'Trang Chủ', to: ROUTES.GUEST.HOME },
        { label: 'Nhân Sự IT', to: ROUTES.GUEST.DEVELOPERS },
        { label: 'Về Chúng Tôi', to: ROUTES.GUEST.ABOUT },
        { label: 'Liên Hệ', to: ROUTES.GUEST.CONTACT },
      ]
    : [];

  const mobileLinks = showPublicBranding
    ? [
        { label: 'Trang Chủ', to: ROUTES.GUEST.HOME },
        { label: 'Nhân Sự IT', to: ROUTES.GUEST.DEVELOPERS },
        { label: 'Về Chúng Tôi', to: ROUTES.GUEST.ABOUT },
        { label: 'Liên Hệ', to: ROUTES.GUEST.CONTACT },
      ]
    : [];

  const hasDesktopLinks = desktopLinks.length > 0;
  const hasMobileLinks = mobileLinks.length > 0;

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-soft sticky top-0 z-50 border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center min-h-[40px]">
            {showPublicBranding ? (
              <Link to="/" className="group flex items-center space-x-2 transition-all duration-300 hover:scale-105">
                <img 
                  src={logoDevPool} 
                  alt="DevPool Logo" 
                  className="h-10 w-auto object-contain"
                />
                <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">
                  DevPool
                </span>
              </Link>
            ) : null}
          </div>

          {/* Desktop Navigation */}
          {hasDesktopLinks ? (
            <nav className="hidden md:flex space-x-8">
              {desktopLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-neutral-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-105 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          ) : (
            <div className="hidden md:flex flex-1" />
          )}

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    className="group relative p-2 text-neutral-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-300"
                  >
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse-gentle">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div 
                      className="absolute right-0 mt-3 w-80 max-h-[420px] bg-white rounded-2xl shadow-medium border border-neutral-200 z-50 animate-slide-down flex flex-col"
                      onMouseLeave={() => setIsNotificationOpen(false)}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">Thông báo</p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>Bạn có {unread} thông báo chưa đọc</span>
                          </div>
                        </div>
                       
                      </div>

                      <div className="flex-1 overflow-y-auto min-h-0">
                        {isLoadingNotifications ? (
                          <div className="flex items-center justify-center py-10 text-neutral-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Đang tải thông báo...
                          </div>
                        ) : groupedNotifications.length === 0 ? (
                          <div className="py-10 text-center text-neutral-500 text-sm">Không có thông báo nào</div>
                        ) : (
                          groupedNotifications.map((group) => (
                            <div key={group.group} className="border-b border-neutral-100 last:border-0">
                              <div className="flex items-center justify-between px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                <span>{group.isReadGroup ? 'Thông báo đã đọc' : group.group}</span>
                                {group.isReadGroup && group.readTotal ? (
                                  <button
                                    onClick={() => {
                                      setIsNotificationOpen(false);
                                      navigate(NOTIFICATION_CENTER_ROUTE);
                                    }}
                                    className="text-[10px] font-medium text-primary-600 hover:text-primary-700"
                                  >
                                    {group.readTotal > 1 ? `Xem ${group.readTotal} thông báo đã đọc` : 'Xem tất cả'}
                                  </button>
                                ) : null}
                              </div>
                              {group.isReadGroup ? (
                                <div className="space-y-1 pb-3">
                                  {group.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className={`px-4 py-3 transition-all duration-200 rounded-xl border border-transparent ${
                                        item.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-primary-50/60 hover:bg-primary-50 border-primary-100'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full ${item.isRead ? 'bg-neutral-300' : 'bg-primary-500'}`} />
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug">
                                              {item.title}
                                            </p>
                                            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${getPriorityBadge(item.priority)}`}>
                                              {item.priority === NotificationPriority.Urgent
                                                ? 'Khẩn cấp'
                                                : item.priority === NotificationPriority.High
                                                ? 'Cao'
                                                : item.priority === NotificationPriority.Medium
                                                ? 'Trung bình'
                                                : 'Thấp'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                                            {item.message}
                                          </p>
                                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                            <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                            {item.actionUrl ? (
                                              <button
                                                type="button"
                                                onClick={() => handleNotificationNavigate(item)}
                                                className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                              >
                                                Xem chi tiết
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleNotificationDetail(item)}
                                                className={`text-xs font-medium ${
                                                  item.isRead ? 'text-neutral-400 cursor-default' : 'text-primary-600 hover:text-primary-700'
                                                }`}
                                              >
                                                Đã đọc
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {group.readTotal && group.readTotal > 1 && (
                                    <button
                                      onClick={() => {
                                        setIsNotificationOpen(false);
                                        navigate(NOTIFICATION_CENTER_ROUTE);
                                      }}
                                      className="w-full px-4 text-xs text-primary-600 text-left font-medium hover:text-primary-700"
                                    >
                                      Xem thêm {group.readTotal - 1} thông báo đã đọc khác
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1 pb-3">
                                  {group.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className={`px-4 py-3 transition-all duration-200 rounded-xl border border-transparent ${
                                        item.isRead ? 'bg-white hover:bg-neutral-50' : 'bg-primary-50/60 hover:bg-primary-50 border-primary-100'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full ${item.isRead ? 'bg-neutral-300' : 'bg-primary-500'}`} />
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug">
                                              {item.title}
                                            </p>
                                            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${getPriorityBadge(item.priority)}`}>
                                              {item.priority === NotificationPriority.Urgent
                                                ? 'Khẩn cấp'
                                                : item.priority === NotificationPriority.High
                                                ? 'Cao'
                                                : item.priority === NotificationPriority.Medium
                                                ? 'Trung bình'
                                                : 'Thấp'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                                            {item.message}
                                          </p>
                                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                            <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                            {item.actionUrl ? (
                                              <button
                                                type="button"
                                                onClick={() => handleNotificationNavigate(item)}
                                                className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                              >
                                                Xem chi tiết
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleNotificationDetail(item)}
                                                className={`text-xs font-medium ${
                                                  item.isRead ? 'text-neutral-400 cursor-default' : 'text-primary-600 hover:text-primary-700'
                                                }`}
                                              >
                                                Đã đọc
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
                        <button
                          onClick={() => {
                            setIsNotificationOpen(false);
                            navigate(NOTIFICATION_CENTER_ROUTE);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all"
                        >
                          Xem tất cả thông báo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="group flex items-center space-x-2 p-2 rounded-xl hover:bg-neutral-100 transition-all duration-300 hover:shadow-soft"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100 group-hover:ring-primary-300 transition-all duration-300"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-primary-100 group-hover:ring-primary-300 transition-all duration-300 shadow-sm group-hover:scale-110 ${roleDisplay.containerClass}`}
                      >
                        {roleDisplay.icon}
                      </div>
                    )}
                    <span className="text-neutral-700 font-medium group-hover:text-primary-700 transition-colors duration-300">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-medium py-2 z-50 border border-neutral-200 animate-slide-down"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <Link
                        to={user ? getDashboardRoute(user.role) : '/login'}
                        className="group flex items-center px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-300" />
                        Dashboard
                      </Link>
                      <Link
                        to={user ? (user.role === 'Staff TA' ? ROUTES.HR_STAFF.PROFILE :
                                   user.role === 'Staff Sales' ? ROUTES.SALES_STAFF.PROFILE :
                                   user.role === 'Staff Accountant' ? ROUTES.ACCOUNTANT_STAFF.PROFILE :
                                   user.role === 'Developer' ? ROUTES.DEVELOPER.PROFILE :
                                   user.role === 'Manager' ? ROUTES.MANAGER.PROFILE :
                                   user.role === 'Admin' ? ROUTES.ADMIN.PROFILE : '/') : '/'}
                        className="group flex items-center px-4 py-2 text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserPen className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-300" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="group flex items-center w-full px-4 py-2 text-neutral-700 hover:bg-error-50 hover:text-error-700 transition-all duration-300"
                      >
                        <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-300" />
                        Đăng Xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl hover:from-primary-700 hover:to-primary-800 font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                >
                  Đăng Nhập
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          {hasMobileLinks && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && hasMobileLinks && (
          <div className="md:hidden py-4 border-t border-neutral-200 animate-slide-down">
            <nav className="flex flex-col space-y-3">
              {mobileLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-neutral-700 hover:text-primary-600 font-medium py-2 px-2 rounded-lg hover:bg-primary-50 transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <div className="pt-3 border-t border-neutral-200">
                  <Link
                    to={getDashboardRoute(user.role)}
                    className="text-neutral-700 hover:text-primary-600 font-medium py-2 px-2 rounded-lg hover:bg-primary-50 transition-all duration-300 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-neutral-700 hover:text-error-600 font-medium py-2 px-2 rounded-lg hover:bg-error-50 transition-all duration-300 text-left w-full"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-neutral-200">
                  <Link
                    to="/login"
                    className="text-neutral-700 hover:text-primary-600 font-medium py-2 px-2 rounded-lg hover:bg-primary-50 transition-all duration-300 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl hover:from-primary-700 hover:to-primary-800 font-medium inline-block mt-2 transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    {viewNotification && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Chi tiết thông báo</p>
              <p className="text-xs text-neutral-500">{new Date(viewNotification.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <button
              onClick={handleCloseNotificationDetail}
              className="text-neutral-400 hover:text-neutral-600 transition-colors text-xl leading-none"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-base font-semibold text-neutral-900 mb-1">{viewNotification.title}</p>
              <span className={`inline-flex items-center text-[11px] px-2 py-1 rounded-full ${getPriorityBadge(viewNotification.priority)}`}>
                {viewNotification.priority === NotificationPriority.Urgent
                  ? 'Khẩn cấp'
                  : viewNotification.priority === NotificationPriority.High
                  ? 'Cao'
                  : viewNotification.priority === NotificationPriority.Medium
                  ? 'Trung bình'
                  : 'Thấp'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{viewNotification.message}</p>
            {viewNotification.metaData && Object.keys(viewNotification.metaData).length > 0 && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Thông tin bổ sung</p>
                <div className="space-y-1">
                  {Object.entries(viewNotification.metaData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm text-neutral-700">
                      <span className="font-medium text-neutral-600">{key}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {viewNotification.actionUrl && (
                <button
                  onClick={() => {
                    let targetUrl = viewNotification.actionUrl;
                    
                    // Fix: Remove /hr prefix nếu có (backend có thể thêm prefix này)
                    if (targetUrl && targetUrl.startsWith('/hr/')) {
                      targetUrl = targetUrl.replace('/hr/', '/');
                    }
                    
                    // Fix: Convert /ta/talents/:id thành /ta/developers/:id (route đúng)
                    if (targetUrl && targetUrl.startsWith('/ta/talents/')) {
                      targetUrl = targetUrl.replace('/ta/talents/', '/ta/developers/');
                    }
                    
                    handleCloseNotificationDetail();
                    if (targetUrl) {
                      navigate(targetUrl);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow"
                >
                  Xem chi tiết
                </button>
              )}
              {/* Nút phản hồi cho thông báo CV mới từ developer */}
              {(viewNotification.type === NotificationType.CVUploadedByDeveloper || 
                (viewNotification.type as number) === 7002) && 
               viewNotification.entityType === 'TalentCV' && 
               viewNotification.entityId &&
               !viewNotification.isRead && (
                <button
                  onClick={() => openReplyModal(viewNotification)}
                  disabled={viewNotification.isRead}
                  className="w-full inline-flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  Phản hồi Developer
                </button>
              )}
            </div>
          </div>
          <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 text-right">
            <button
              onClick={handleCloseNotificationDetail}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Modal chỉnh sửa tin nhắn phản hồi */}
    {replyModalOpen && replyNotification && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
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
              disabled={!replyMessage.trim()}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gửi phản hồi
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}