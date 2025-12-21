import { useCallback, useState, useEffect } from 'react';
import { type Skill } from '../services/Skill';
import { notificationService, NotificationType, NotificationPriority } from '../services/Notification';
import { userService } from '../services/User';

interface UseTalentDetailSkillActionsProps {
  setActiveTab: (tab: 'projects' | 'cvs' | 'jobRoleLevels' | 'skills' | 'availableTimes' | 'certificates' | 'experiences') => void;
  handleOpenInlineForm: (formType: 'project' | 'skill' | 'certificate' | 'experience' | 'jobRoleLevel' | 'availableTime' | 'cv') => void;
  setInlineSkillForm: (form: any) => void;
  setSelectedSkillGroupId: (id: number | undefined) => void;
  setSkillSearchQuery: (query: string) => void;
  setIsSkillDropdownOpen: (open: boolean) => void;
  lookupSkills: Skill[];
}

/**
 * Hook để quản lý các actions liên quan đến skills trong Talent Detail page
 */
export function useTalentDetailSkillActions({
  setActiveTab,
  handleOpenInlineForm,
  setInlineSkillForm,
  setSelectedSkillGroupId,
  setSkillSearchQuery,
  setIsSkillDropdownOpen,
  lookupSkills,
}: UseTalentDetailSkillActionsProps) {
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [pendingSuggestionKeys, setPendingSuggestionKeys] = useState<Set<string>>(new Set());
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);
  const [showSkillSuggestionSuccessOverlay, setShowSkillSuggestionSuccessOverlay] = useState<boolean>(false);

  // Load admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await userService.getAll({
          excludeDeleted: true,
          pageNumber: 1,
          pageSize: 100,
        });
        const items = Array.isArray(response?.items) ? response.items : [];
        const admins = items.filter((user: any) =>
          Array.isArray(user.roles)
            ? user.roles.some((role: string) => role?.toLowerCase().includes('admin'))
            : false
        );
        setAdminUserIds(admins.map((user: any) => String(user.id)).filter(Boolean));
      } catch (error) {
        console.error('Không thể tải danh sách Admin để gửi thông báo:', error);
      }
    };
    fetchAdminUsers();
  }, []);

  // Quick create skill handler
  const handleQuickCreateSkill = useCallback(
    (matchedSkill: { skillId: number; skillName: string; cvLevel?: string; cvYearsExp?: string | number }) => {
      setActiveTab('skills');
      handleOpenInlineForm('skill');

      setTimeout(() => {
        const levelMap: Record<string, string> = {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          expert: 'Expert',
        };
        const level = matchedSkill.cvLevel
          ? levelMap[matchedSkill.cvLevel.toLowerCase()] || 'Beginner'
          : 'Beginner';
        const yearsExp = matchedSkill.cvYearsExp ? Number(matchedSkill.cvYearsExp) : 1;

        const skill = lookupSkills.find((s) => s.id === matchedSkill.skillId);

        setInlineSkillForm({
          skillId: matchedSkill.skillId,
          level: level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
          yearsExp: yearsExp,
        });

        if (skill?.skillGroupId) {
          setSelectedSkillGroupId(skill.skillGroupId);
        }

        setSkillSearchQuery(matchedSkill.skillName);
        setIsSkillDropdownOpen(false);
      }, 100);
    },
    [setActiveTab, handleOpenInlineForm, setInlineSkillForm, setSelectedSkillGroupId, setSkillSearchQuery, setIsSkillDropdownOpen, lookupSkills]
  );

  // Suggestion request handler
  const handleSuggestionRequest = useCallback(
    async (
      category: 'skill',
      key: string,
      displayItems: string[],
      detailItems: Array<Record<string, string>>
    ) => {
      if (suggestionLoading) return;
      if (!key || displayItems.length === 0) {
        alert('⚠️ Không có kỹ năng nào để đề xuất.');
        return;
      }
      if (pendingSuggestionKeys.has(key)) {
        alert('⚠️ Đã gửi đề xuất cho các kỹ năng này. Vui lòng đợi admin xử lý.');
        return;
      }

      if (adminUserIds.length === 0) {
        alert('⚠️ Không tìm thấy admin để gửi đề xuất. Vui lòng thử lại sau.');
        return;
      }

      // Xác nhận trước khi gửi
      const skillNames = displayItems.join(', ');
      const confirmMessage = `Bạn có chắc muốn gửi đề xuất thêm ${displayItems.length} kỹ năng sau vào hệ thống?\n\n${skillNames}\n\nThông báo sẽ được gửi cho tất cả admin để xem xét.`;
      if (!confirm(confirmMessage)) {
        return;
      }

      setSuggestionLoading(key);
      try {
        const skillNames = displayItems.join(', ');
        const detailText = detailItems
          .map((item, index) => {
            const name = item.skillName || displayItems[index] || `Kỹ năng ${index + 1}`;
            const level = item.level ? ` (Level: ${item.level})` : '';
            const yearsExp = item.yearsExp ? ` (Kinh nghiệm: ${item.yearsExp} năm)` : '';
            return `- ${name}${level}${yearsExp}`;
          })
          .join('\n');

        const notification = await notificationService.create({
          title: 'Đề xuất thêm kỹ năng vào hệ thống',
          message: `Các kỹ năng sau được phát hiện từ CV nhưng chưa có trong hệ thống:\n\n${detailText}\n\nVui lòng xem xét và thêm các kỹ năng này vào hệ thống.`,
          type: NotificationType.NewSkillDetectedFromCV,
          priority: NotificationPriority.Medium,
          userIds: adminUserIds,
          entityType: 'SkillSuggestion',
          metaData: {
            category: category,
            skillNames: skillNames,
            count: String(displayItems.length),
          },
        });

        const notificationArray = Array.isArray(notification) ? notification : [notification];
        const notificationIds = notificationArray
          .map((notif) => notif?.id)
          .filter((id): id is number => typeof id === 'number');

        if (notificationIds.length > 0) {
          setPendingSuggestionKeys((prev) => new Set([...prev, key]));
          setShowSkillSuggestionSuccessOverlay(true);

          // Hiển thị loading overlay trong 2 giây
          setTimeout(() => {
            setShowSkillSuggestionSuccessOverlay(false);
          }, 2000);
        } else {
          alert('⚠️ Không thể tạo thông báo. Vui lòng thử lại.');
        }
      } catch (error: any) {
        console.error('Lỗi khi gửi đề xuất:', error);
        alert(`❌ Không thể gửi đề xuất: ${error?.message || 'Lỗi không xác định'}`);
      } finally {
        setSuggestionLoading(null);
      }
    },
    [adminUserIds, suggestionLoading, pendingSuggestionKeys]
  );

  const isSuggestionPending = useCallback(
    (key: string) => {
      if (!key) return false;
      return pendingSuggestionKeys.has(key);
    },
    [pendingSuggestionKeys]
  );

  return {
    handleQuickCreateSkill,
    handleSuggestionRequest,
    isSuggestionPending,
    showSkillSuggestionSuccessOverlay,
  };
}

