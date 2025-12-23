import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  talentSkillGroupAssessmentService,
  type TalentSkillGroupAssessment,
  type SkillGroupVerificationStatus,
} from '../services/TalentSkillGroupAssessment';
import { expertService, type Expert } from '../services/Expert';
import { type Skill } from '../services/Skill';
import { type SkillGroup } from '../services/SkillGroup';
import { type TalentSkill } from '../services/TalentSkill';

/**
 * Hook để quản lý Skill Group Verification logic cho Talent Detail page
 */
export function useTalentDetailSkillGroupVerification(
  talentSkills?: (TalentSkill & { skillName: string; skillGroupId?: number })[],
  showSuccessOverlay?: (message: string) => void
) {
  const { id } = useParams<{ id: string }>();

  // Verification states
  const [skillGroupVerificationStatuses, setSkillGroupVerificationStatuses] = useState<
    Record<number, SkillGroupVerificationStatus>
  >({});
  const [skillGroupVerifyModal, setSkillGroupVerifyModal] = useState<{
    isOpen: boolean;
    skillGroupId?: number;
    skillGroupName?: string;
  }>({ isOpen: false });
  const [verifyExpertName, setVerifyExpertName] = useState<string>('');
  const [verifyNote, setVerifyNote] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<boolean>(true);
  const [expertsForSkillGroup, setExpertsForSkillGroup] = useState<Expert[]>([]);
  const [expertsForSkillGroupLoading, setExpertsForSkillGroupLoading] = useState<boolean>(false);
  const [selectedExpertId, setSelectedExpertId] = useState<number | ''>('');
  const [skillSnapshotEnabled, setSkillSnapshotEnabled] = useState<boolean>(true);
  const [showAllSkillsInVerifyModal, setShowAllSkillsInVerifyModal] = useState<boolean>(false);
  const [isVerifyingSkillGroup, setIsVerifyingSkillGroup] = useState<boolean>(false);

  // History modal
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    skillGroupId?: number;
    skillGroupName?: string;
    items: TalentSkillGroupAssessment[];
    loading: boolean;
  }>({ isOpen: false, items: [], loading: false });

  // Close verify modal
  const handleCloseVerifySkillGroupModal = useCallback(() => {
    setSkillGroupVerifyModal({ isOpen: false });
    setVerifyExpertName('');
    setVerifyNote('');
    setVerifyResult(true);
    setSelectedExpertId('');
    setIsVerifyingSkillGroup(false);
  }, []);

  // Open verify modal
  const handleOpenVerifySkillGroup = useCallback(
    async (
      skillGroupId: number | undefined,
      canEdit: boolean,
      lookupSkillGroups: SkillGroup[]
    ) => {
      if (!skillGroupId) {
        alert('⚠️ Kỹ năng này chưa được gắn nhóm kỹ năng, không thể verify theo group.');
        return;
      }

      if (!canEdit) {
        alert('Bạn không có quyền verify nhóm kỹ năng. Chỉ TA đang quản lý nhân sự này mới được verify.');
        return;
      }

      const group = lookupSkillGroups.find((g) => g.id === skillGroupId);
      setSkillGroupVerifyModal({
        isOpen: true,
        skillGroupId,
        skillGroupName: group?.name ?? 'Nhóm kỹ năng',
      });
      setVerifyExpertName('');
      setVerifyNote('');
      setVerifyResult(true);
      setSelectedExpertId('');
      setExpertsForSkillGroup([]);
      setSkillSnapshotEnabled(true);
      setShowAllSkillsInVerifyModal(false);
      setIsVerifyingSkillGroup(false);

      // Fetch experts for this skill group
      const fetchExperts = async () => {
        try {
          setExpertsForSkillGroupLoading(true);
          const data = await expertService.getAll({ excludeDeleted: true });
          const arr: Expert[] = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : Array.isArray((data as any)?.data)
                ? (data as any).data
                : [];

          const result: Expert[] = [];
          for (const ex of arr) {
            try {
              const groups = await expertService.getSkillGroups(ex.id);
              if (groups.some((g) => g.skillGroupId === skillGroupId)) {
                result.push(ex);
              }
            } catch (err) {
              console.warn('Không thể tải nhóm kỹ năng của expert', ex.id, err);
            }
          }
          setExpertsForSkillGroup(result);
        } catch (err) {
          console.error('❌ Lỗi khi tải danh sách chuyên gia cho skill group:', err);
          setExpertsForSkillGroup([]);
        } finally {
          setExpertsForSkillGroupLoading(false);
        }
      };
      fetchExperts();
    },
    []
  );

  // Submit verify
  const handleSubmitVerifySkillGroup = useCallback(
    async (
      talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[],
      lookupSkills: Skill[],
      lookupSkillGroups: SkillGroup[],
      onStatusUpdate: (statuses: Record<number, SkillGroupVerificationStatus>) => void
    ) => {
      if (!id || !skillGroupVerifyModal.skillGroupId) return;

      if (expertsForSkillGroup.length === 0) {
        alert(
          '⚠️ Không có chuyên gia nào được gán cho nhóm kỹ năng này. Vui lòng liên hệ Admin để gán chuyên gia trước khi verify.'
        );
        return;
      }

      if (!selectedExpertId) {
        alert('⚠️ Vui lòng chọn chuyên gia từ danh sách.');
        return;
      }

      if (verifyResult === false && !verifyNote.trim()) {
        alert('⚠️ Vui lòng nhập ghi chú lý do khi verify fail.');
        return;
      }

      setIsVerifyingSkillGroup(true);

      try {
        const groupId = skillGroupVerifyModal.skillGroupId;

        const skillsInGroup = talentSkills.filter((s: any) => s.skillGroupId === groupId);
        if (skillsInGroup.length === 0) {
          alert('⚠️ Không tìm thấy kỹ năng nào trong nhóm để verify.');
          setIsVerifyingSkillGroup(false);
          return;
        }

        const skillsSnapshotArray = skillsInGroup.map((s: any) => ({
          skillId: s.skillId,
          skillName: s.skillName,
          level: s.level,
          yearsExp: s.yearsExp,
        }));

        const payload = {
          talentId: Number(id),
          skillGroupId: groupId,
          assessmentDate: new Date().toISOString(),
          isVerified: verifyResult,
          expertId: typeof selectedExpertId === 'number' ? selectedExpertId : undefined,
          verifiedByName: verifyExpertName || undefined,
          note: verifyNote || undefined,
          skillSnapshot: verifyResult && skillSnapshotEnabled ? JSON.stringify(skillsSnapshotArray) : undefined,
          verifiedSkills: verifyResult
            ? skillsInGroup.map((s: any) => ({
                skillId: s.skillId,
                level: s.level,
                yearsExp: s.yearsExp,
              }))
            : undefined,
        };

        await talentSkillGroupAssessmentService.verifySkillGroup(payload);

        handleCloseVerifySkillGroupModal();

        showSuccessOverlay?.(
          verifyResult
            ? 'Đã verify nhóm kỹ năng thành công (Pass)!'
            : '⚠️ Đã đánh dấu nhóm kỹ năng không hợp lệ (Fail)!'
        );

        // Refresh status in background
        setTimeout(async () => {
          try {
            const distinctSkillGroupIds = Array.from(
              new Set(
                talentSkills
                  .map((s: any) => s.skillGroupId)
                  .filter((gid: number | undefined) => typeof gid === 'number')
              )
            ) as number[];

            if (distinctSkillGroupIds.length > 0) {
              await new Promise((resolve) => setTimeout(resolve, 300));

              try {
                const statuses = await talentSkillGroupAssessmentService.getVerificationStatuses(
                  Number(id),
                  distinctSkillGroupIds
                );

                if (Array.isArray(statuses)) {
                  const statusMap: Record<number, SkillGroupVerificationStatus> = {};
                  statuses.forEach((st) => {
                    statusMap[st.skillGroupId] = st;
                  });

                  const verifiedStatus = statusMap[groupId];
                  if (!verifiedStatus || verifiedStatus.isVerified !== verifyResult) {
                    try {
                      const latest = await talentSkillGroupAssessmentService.getLatest(Number(id), groupId);
                      if (latest && latest.isVerified === verifyResult && latest.isActive !== false) {
                        statusMap[groupId] = {
                          talentId: Number(id),
                          skillGroupId: groupId,
                          skillGroupName: skillGroupVerifyModal.skillGroupName || '',
                          isVerified: latest.isVerified,
                          lastVerifiedDate: latest.assessmentDate,
                          lastVerifiedByExpertId: latest.expertId ?? undefined,
                          lastVerifiedByExpertName: latest.verifiedByName ?? latest.expertName ?? undefined,
                          needsReverification: false,
                        };
                      }
                    } catch (latestError) {
                      console.warn('Không thể lấy latest assessment:', latestError);
                    }
                  }

                  onStatusUpdate(statusMap);
                }
              } catch (statusError) {
                console.error('❌ Lỗi khi refresh trạng thái verify:', statusError);
              }
            }
          } catch (error) {
            console.error('❌ Lỗi khi refresh trạng thái verify:', error);
          }
        }, 100);
      } catch (err: any) {
        setIsVerifyingSkillGroup(false);
        console.error('❌ Lỗi khi verify nhóm kỹ năng:', err);

        const errorMessage =
          err?.message || err?.response?.data?.message || 'Không thể verify nhóm kỹ năng, vui lòng thử lại.';

        if (errorMessage.includes('Missing mandatory skills') || errorMessage.includes('mandatory')) {
          const missingSkillsMatch = errorMessage.match(/Missing mandatory skills:\s*(.+)/i);
          const missingSkillsList = missingSkillsMatch
            ? missingSkillsMatch[1].split(',').map((s: string) => s.trim())
            : [];

          const groupId = skillGroupVerifyModal.skillGroupId;
          const group = lookupSkillGroups.find((g) => g.id === groupId);
          const groupName = group?.name || skillGroupVerifyModal.skillGroupName || `Nhóm kỹ năng #${groupId}`;

          const allMandatorySkillsInGroup = lookupSkills.filter(
            (s: Skill) => s.skillGroupId === groupId && s.isMandatory === true
          );

          const talentMandatorySkills = talentSkills
            .filter((ts: any) => ts.skillGroupId === groupId)
            .map((ts: any) => {
              const skillInfo = lookupSkills.find((s: Skill) => s.id === ts.skillId);
              return skillInfo && skillInfo.isMandatory ? skillInfo : null;
            })
            .filter(Boolean) as Skill[];

          let detailMessage = `⚠️ Không thể verify nhóm kỹ năng "${groupName}"!\n\n`;
          detailMessage += `📋 Nhóm này có ${allMandatorySkillsInGroup.length} kỹ năng bắt buộc (mandatory):\n`;
          allMandatorySkillsInGroup.forEach((skill: Skill) => {
            const hasSkill = talentMandatorySkills.some((ts: Skill) => ts.id === skill.id);
            detailMessage += `  ${hasSkill ? '✅' : '❌'} ${skill.name}\n`;
          });

          if (missingSkillsList.length > 0) {
            detailMessage += `\n❌ Còn thiếu ${missingSkillsList.length} kỹ năng bắt buộc:\n`;
            missingSkillsList.forEach((skillName: string) => {
              detailMessage += `  • ${skillName}\n`;
            });
          }

          detailMessage += `\n💡 Vui lòng thêm tất cả kỹ năng bắt buộc vào nhóm kỹ năng này trước khi verify.`;
          alert(detailMessage);
        } else {
          alert(`❌ ${errorMessage}`);
        }
      }
    },
    [
      id,
      skillGroupVerifyModal,
      expertsForSkillGroup,
      selectedExpertId,
      verifyResult,
      verifyExpertName,
      verifyNote,
      skillSnapshotEnabled,
      handleCloseVerifySkillGroupModal,
    ]
  );

  // Invalidate assessment
  const handleInvalidateSkillGroup = useCallback(
    async (
      skillGroupId: number | undefined,
      canEdit: boolean,
      talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[],
      onStatusUpdate: (statuses: Record<number, SkillGroupVerificationStatus>) => void
    ) => {
      if (!id || !skillGroupId) {
        alert('⚠️ Không thể vô hiệu hóa đánh giá cho nhóm kỹ năng này.');
        return;
      }

      if (!canEdit) {
        alert('Bạn không có quyền hủy đánh giá nhóm kỹ năng. Chỉ TA đang quản lý nhân sự này mới được hủy đánh giá.');
        return;
      }

      const reason = window.prompt('Nhập lý do vô hiệu hóa đánh giá nhóm kỹ năng này (reason):', '');
      if (reason === null) return;

      try {
        await talentSkillGroupAssessmentService.invalidateAssessment(Number(id), skillGroupId, reason || undefined);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const distinctSkillGroupIds = Array.from(
          new Set(
            talentSkills
              .map((s: any) => s.skillGroupId)
              .filter((gid: number | undefined) => typeof gid === 'number')
          )
        ) as number[];

        if (distinctSkillGroupIds.length > 0) {
          const statuses = await talentSkillGroupAssessmentService.getVerificationStatuses(
            Number(id),
            distinctSkillGroupIds
          );

          if (Array.isArray(statuses)) {
            const statusMap: Record<number, SkillGroupVerificationStatus> = {};
            statuses.forEach((st) => {
              statusMap[st.skillGroupId] = st;
            });
            onStatusUpdate(statusMap);
          }
        }

        showSuccessOverlay?.('Đã vô hiệu hóa đánh giá nhóm kỹ năng thành công!');
      } catch (err) {
        console.error('❌ Lỗi khi invalidate assessment:', err);
        alert('Không thể vô hiệu hóa đánh giá, vui lòng thử lại.');
      }
    },
    [id]
  );

  // Open history modal
  const handleOpenHistorySkillGroup = useCallback(async (skillGroupId?: number) => {
    if (!id || !skillGroupId) return;
    setHistoryModal({
      isOpen: true,
      skillGroupId,
      skillGroupName: '',
      items: [],
      loading: true,
    });
    try {
      const items = await talentSkillGroupAssessmentService.getAssessmentHistory(Number(id), skillGroupId);
      setHistoryModal((prev) => ({
        ...prev,
        items,
        loading: false,
      }));
    } catch (err) {
      console.error('❌ Lỗi khi tải lịch sử đánh giá skill group:', err);
      alert('Không thể tải lịch sử đánh giá, vui lòng thử lại.');
      setHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  }, [id]);

  // Close history modal
  const handleCloseHistoryModal = useCallback(() => {
    setHistoryModal({ isOpen: false, items: [], loading: false });
  }, []);

  // Memoize skill group IDs to avoid unnecessary re-fetches
  const skillGroupIds = useMemo(() => {
    if (!talentSkills || talentSkills.length === 0) {
      return [];
    }
    return Array.from(
      new Set(
        talentSkills
          .map((s) => s.skillGroupId)
          .filter((gid: number | undefined) => typeof gid === 'number')
      )
    ) as number[];
  }, [talentSkills]);

  // Load verification statuses when talentSkills are available
  useEffect(() => {
    if (!id || skillGroupIds.length === 0) {
      return;
    }

    const loadVerificationStatuses = async () => {
      try {
        const statuses = await talentSkillGroupAssessmentService.getVerificationStatuses(
          Number(id),
          skillGroupIds
        );

        if (Array.isArray(statuses)) {
          const statusMap: Record<number, SkillGroupVerificationStatus> = {};
          statuses.forEach((st) => {
            statusMap[st.skillGroupId] = st;
          });
          setSkillGroupVerificationStatuses(statusMap);
        }
      } catch (error) {
        console.error('❌ Lỗi khi tải trạng thái verify skill group:', error);
      }
    };

    loadVerificationStatuses();
  }, [id, skillGroupIds]);

  return {
    // States
    skillGroupVerificationStatuses,
    setSkillGroupVerificationStatuses,
    skillGroupVerifyModal,
    verifyExpertName,
    setVerifyExpertName,
    verifyNote,
    setVerifyNote,
    verifyResult,
    setVerifyResult,
    expertsForSkillGroup,
    expertsForSkillGroupLoading,
    selectedExpertId,
    setSelectedExpertId,
    skillSnapshotEnabled,
    setSkillSnapshotEnabled,
    showAllSkillsInVerifyModal,
    setShowAllSkillsInVerifyModal,
    isVerifyingSkillGroup,
    historyModal,

    // Handlers
    handleOpenVerifySkillGroup,
    handleCloseVerifySkillGroupModal,
    handleSubmitVerifySkillGroup,
    handleInvalidateSkillGroup,
    handleOpenHistorySkillGroup,
    handleCloseHistoryModal,
  };
}

