import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { talentCVService, type TalentCV, type CVAnalysisComparisonResponse } from '../services/TalentCV';
import { downloadFileFromFirebase } from '../utils/firebaseStorage';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { type Skill } from '../services/Skill';
import { type TalentSkill } from '../services/TalentSkill';
import { type JobRoleLevel } from '../services/JobRoleLevel';
import { type TalentJobRoleLevel } from '../services/TalentJobRoleLevel';
import { type CertificateType } from '../services/CertificateType';
import { type TalentCertificate } from '../services/TalentCertificate';
import { getTalentLevelName, normalizeJobRoleKey, normalizeJobRolePosition, normalizeCertificateName } from '../utils/talentHelpers';

/**
 * Hook để quản lý CV Analysis logic cho Talent Detail page
 */
export function useTalentDetailCVAnalysis(
  lookupSkills: Skill[],
  talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[],
  lookupJobRoleLevelsForTalent: JobRoleLevel[],
  jobRoleLevels: (TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string })[],
  lookupCertificateTypes: CertificateType[],
  certificates: (TalentCertificate & { certificateTypeName: string })[],
  talentCVs?: (TalentCV & { jobRoleLevelName?: string })[]
) {
  const { id } = useParams<{ id: string }>();

  // Analysis states
  const [analysisResult, setAnalysisResult] = useState<CVAnalysisComparisonResponse | null>(null);
  const [analysisResultCVId, setAnalysisResultCVId] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLoadingId, setAnalysisLoadingId] = useState<number | null>(null);
  const [expandedAnalysisDetail, setExpandedAnalysisDetail] = useState<
    'skills' | 'jobRoleLevels' | 'certificates' | 'projects' | 'experiences' | null
  >(null);
  const [expandedBasicInfo, setExpandedBasicInfo] = useState(true);

  // Storage keys
  const ANALYSIS_RESULT_STORAGE_KEY = id ? `talent-analysis-result-${id}` : null;
  const ANALYSIS_STORAGE_PREFIX = 'talent-analysis-prefill';
  type PrefillType = 'projects' | 'jobRoleLevels' | 'skills' | 'certificates' | 'experiences';
  const prefillTypes: PrefillType[] = ['projects', 'jobRoleLevels', 'skills', 'certificates', 'experiences'];
  const getPrefillStorageKey = (type: PrefillType) => `${ANALYSIS_STORAGE_PREFIX}-${type}-${id}`;

  // Clear prefill storage
  const clearPrefillStorage = useCallback(() => {
    prefillTypes.forEach((type) => {
      try {
        sessionStorage.removeItem(getPrefillStorageKey(type));
      } catch (storageError) {
        console.warn('Không thể xóa dữ liệu gợi ý', storageError);
      }
    });
  }, [id]);

  // Clear analysis result
  const clearAnalysisResult = useCallback(async () => {
    clearPrefillStorage();
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisLoadingId(null);
    setAnalysisResultCVId(null);
    if (ANALYSIS_RESULT_STORAGE_KEY) {
      try {
        sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
      } catch (storageError) {
        console.warn('Không thể xóa kết quả phân tích CV đã lưu:', storageError);
      }
    }
  }, [ANALYSIS_RESULT_STORAGE_KEY, clearPrefillStorage]);

  // Extract Firebase path from URL
  const extractCVFirebasePath = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Analyze CV from URL
  const handleAnalyzeCVFromUrl = useCallback(
    async (
      cv: TalentCV & { jobRoleLevelName?: string },
      canEdit: boolean,
    ) => {
      if (!id) return;
      if (!cv.cvFileUrl) {
        alert('⚠️ Không tìm thấy đường dẫn CV để phân tích.');
        return;
      }

      if (!canEdit) {
        alert('Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.');
        return;
      }

      // Check if there's an existing analysis result
      const hasAnalysisResult = !!analysisResult;

      if (hasAnalysisResult) {
        const warningMessage =
          '⚠️ CẢNH BÁO\n\n' +
          'Bạn đang có kết quả phân tích CV hiện tại.\n\n' +
          `Để phân tích CV "v${cv.version}", bạn cần hủy kết quả phân tích hiện tại.\n\n` +
          'Bạn có muốn tiếp tục không?';

        const confirmedCancel = window.confirm(warningMessage);
        if (!confirmedCancel) {
          return;
        }

        await clearAnalysisResult();
      }

      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn phân tích CV "v${cv.version}"?\n` +
          'Hệ thống sẽ tải file CV hiện tại và tiến hành phân tích.'
      );
      if (!confirmed) {
        return;
      }

      setAnalysisLoadingId(cv.id);
      setAnalysisError(null);

      try {
        const blob = await downloadFileFromFirebase(cv.cvFileUrl);
        const sanitizedVersionName = `v${cv.version}`.replace(/[^a-zA-Z0-9-_]/g, '_');
        const file = new File(
          [blob],
          `${sanitizedVersionName || 'cv'}_${cv.id}.pdf`,
          { type: blob.type || 'application/pdf' }
        );

        const result = await talentCVService.analyzeCVForUpdate(Number(id), file);
        setAnalysisResult(result);
        setAnalysisResultCVId(cv.id);
        if (ANALYSIS_RESULT_STORAGE_KEY) {
          try {
            sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, JSON.stringify({ cvId: cv.id, result }));
          } catch (storageError) {
            console.warn('Không thể lưu kết quả phân tích CV:', storageError);
          }
        }
      } catch (error) {
        console.error('❌ Lỗi phân tích CV:', error);
        const message = (error as { message?: string }).message ?? 'Không thể phân tích CV';
        setAnalysisError(message);
        alert(`❌ ${message}`);
      } finally {
        setAnalysisLoadingId(null);
      }
    },
    [id, analysisResult, ANALYSIS_RESULT_STORAGE_KEY, clearAnalysisResult]
  );

  // Cancel analysis
  const handleCancelAnalysis = useCallback(
    async (
      canEdit: boolean,
      hasFirebaseFile: boolean,
      uploadedCVUrl: string | null,
      onCloseCVForm?: () => void
    ) => {
      if (!canEdit) {
        alert('Bạn không có quyền hủy phân tích CV. Chỉ TA đang quản lý nhân sự này mới được hủy phân tích.');
        return;
      }

      let warningMessage = '⚠️ CẢNH BÁO\n\n';
      warningMessage += 'Bạn có chắc chắn muốn hủy kết quả phân tích CV không?\n\n';

      if (hasFirebaseFile) {
        warningMessage += '⚠️ LƯU Ý:\n';
        warningMessage += '- Kết quả phân tích CV sẽ bị xóa.\n';
        warningMessage += '- File CV đã upload lên Firebase sẽ bị xóa vĩnh viễn.\n';
        warningMessage += '- Form tạo CV sẽ bị đóng.\n\n';
      } else {
        warningMessage += 'Kết quả phân tích CV sẽ bị xóa và không thể khôi phục.\n\n';
      }

      warningMessage += 'Bạn có muốn tiếp tục không?';

      const confirmed = window.confirm(warningMessage);
      if (!confirmed) {
        return;
      }

      await clearAnalysisResult();

      // Delete Firebase file if exists
      if (hasFirebaseFile && uploadedCVUrl) {
        try {
          const firebasePath = extractCVFirebasePath(uploadedCVUrl);
          if (firebasePath) {
            const fileRef = ref(storage, firebasePath);
            await deleteObject(fileRef);
          }
        } catch (err) {
          console.error('❌ Error deleting CV file from Firebase:', err);
        }
      }

      // Close CV form if open
      if (onCloseCVForm) {
        onCloseCVForm();
      }
    },
    [clearAnalysisResult, extractCVFirebasePath]
  );

  // Restore analysis result from sessionStorage
  useEffect(() => {
    if (!ANALYSIS_RESULT_STORAGE_KEY) return;
    try {
      const stored = sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        cvId: number | null;
        result: CVAnalysisComparisonResponse | null;
      };
      if (parsed?.result) {
        if (parsed.cvId !== null) {
          // Will be checked against talentCVs in the component
          setAnalysisResult(parsed.result);
          setAnalysisResultCVId(parsed.cvId);
        } else {
          setAnalysisResult(parsed.result);
          setAnalysisResultCVId(null);
        }
      }
    } catch (error) {
      console.warn('Không thể khôi phục kết quả phân tích CV:', error);
    }
  }, [ANALYSIS_RESULT_STORAGE_KEY]);


  // Update skill maps when data changes
  const updateSkillMaps = useCallback(
    (lookupSkills: Skill[], talentSkills: (TalentSkill & { skillName: string; skillGroupId?: number })[]) => {
      // Update systemSkillMap
      const newSystemSkillMap = new Map<string, Skill>();
      lookupSkills.forEach((skill) => {
        const key = skill.name.trim().toLowerCase();
        if (!newSystemSkillMap.has(key)) newSystemSkillMap.set(key, skill);
      });

      // Update talentSkillLookup
      const newById = new Map<number, TalentSkill & { skillName: string }>();
      const newByName = new Map<string, TalentSkill & { skillName: string }>();
      const newNormalizedNames = new Set<string>();

      talentSkills.forEach((skill) => {
        newById.set(skill.skillId, skill);
        const normalized = skill.skillName?.trim().toLowerCase();
        if (normalized) {
          newByName.set(normalized, skill);
          newNormalizedNames.add(normalized);
        }
      });

      return {
        systemSkillMap: newSystemSkillMap,
        talentSkillLookup: { byId: newById, byName: newByName, normalizedNames: newNormalizedNames },
      };
    },
    []
  );

  // Get unmatched skill suggestions
  const getUnmatchedSkillSuggestions = useCallback(
    (systemSkillMap: Map<string, Skill>) => {
      if (!analysisResult) return [];
      return analysisResult.skills.newFromCV.filter((suggestion) => {
        const name = suggestion.skillName?.trim().toLowerCase() ?? '';
        if (!name) return false;
        return !systemSkillMap.has(name);
      });
    },
    [analysisResult]
  );

  // Get matched skills details
  const getMatchedSkillsDetails = useCallback(
    (talentSkillLookup: {
      byId: Map<number, TalentSkill & { skillName: string }>;
      byName: Map<string, TalentSkill & { skillName: string }>;
    }) => {
      if (!analysisResult) return [];
      return analysisResult.skills.matched
        .filter((match) => {
          const normalized = match.skillName.trim().toLowerCase();
          return (
            (match.skillId !== undefined && talentSkillLookup.byId.has(match.skillId)) ||
            talentSkillLookup.byName.has(normalized)
          );
        })
        .map((match) => {
          const normalized = match.skillName.trim().toLowerCase();
          const existing =
            (match.skillId !== undefined && talentSkillLookup.byId.get(match.skillId)) ||
            talentSkillLookup.byName.get(normalized);
          return {
            skillName: match.skillName,
            cvLevel: match.cvLevel ?? '—',
            cvYearsExp: match.cvYearsExp ?? '—',
            matchConfidence: Math.round(match.matchConfidence * 100),
            systemLevel: existing?.level ?? '—',
            systemYearsExp: existing?.yearsExp ?? '—',
          };
        });
    },
    [analysisResult]
  );

  // Get matched skills not in profile
  const getMatchedSkillsNotInProfile = useCallback(
    (
      _lookupSkills: Skill[],
      talentSkillLookup: {
        byId: Map<number, TalentSkill & { skillName: string }>;
        byName: Map<string, TalentSkill & { skillName: string }>;
      }
    ) => {
      if (!analysisResult) return [];
      return analysisResult.skills.matched
        .filter((match) => {
          if (!match.skillId) return false;
          const normalized = match.skillName.trim().toLowerCase();
          return !talentSkillLookup.byId.has(match.skillId) && !talentSkillLookup.byName.has(normalized);
        })
        .map((match) => {
          return {
            skillId: match.skillId!,
            skillName: match.skillName,
            cvLevel: match.cvLevel ?? undefined,
            cvYearsExp: match.cvYearsExp ?? undefined,
            matchConfidence: Math.round(match.matchConfidence * 100),
          };
        });
    },
    [analysisResult]
  );

  // ========== COMPUTED VALUES ==========
  // Skills computed values
  const systemSkillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    lookupSkills.forEach((skill) => {
      const key = skill.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, skill);
    });
    return map;
  }, [lookupSkills]);

  const talentSkillLookup = useMemo(() => {
    const byId = new Map<number, (TalentSkill & { skillName: string })>();
    const byName = new Map<string, (TalentSkill & { skillName: string })>();
    const normalizedNames = new Set<string>();

    talentSkills.forEach((skill) => {
      byId.set(skill.skillId, skill);
      const normalized = skill.skillName?.trim().toLowerCase();
      if (normalized) {
        byName.set(normalized, skill);
        normalizedNames.add(normalized);
      }
    });

    return { byId, byName, normalizedNames };
  }, [talentSkills]);

  const unmatchedSkillSuggestions = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.skills.newFromCV.filter((suggestion) => {
      const name = suggestion.skillName?.trim().toLowerCase() ?? '';
      if (!name) return false;
      return !systemSkillMap.has(name);
    });
  }, [analysisResult, systemSkillMap]);

  const matchedSkillsDetails = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.skills.matched
      .filter((match) => {
        const normalized = match.skillName.trim().toLowerCase();
        return (
          (match.skillId !== undefined && talentSkillLookup.byId.has(match.skillId)) ||
          talentSkillLookup.byName.has(normalized)
        );
      })
      .map((match) => {
        const normalized = match.skillName.trim().toLowerCase();
        const existing =
          (match.skillId !== undefined && talentSkillLookup.byId.get(match.skillId)) ||
          talentSkillLookup.byName.get(normalized);
        return {
          skillName: match.skillName,
          cvLevel: match.cvLevel ?? '—',
          cvYearsExp: match.cvYearsExp ?? '—',
          matchConfidence: Math.round(match.matchConfidence * 100),
          systemLevel: existing?.level ?? '—',
          systemYearsExp: existing?.yearsExp ?? '—',
        };
      });
  }, [analysisResult, talentSkillLookup]);

  const matchedSkillsNotInProfile = useMemo(() => {
    if (!analysisResult) return [];
    return analysisResult.skills.matched
      .filter((match) => {
        if (!match.skillId) return false;
        const normalized = match.skillName.trim().toLowerCase();
        return !talentSkillLookup.byId.has(match.skillId) && !talentSkillLookup.byName.has(normalized);
      })
      .map((match) => {
        return {
          skillId: match.skillId!,
          skillName: match.skillName,
          cvLevel: match.cvLevel ?? undefined,
          cvYearsExp: match.cvYearsExp ?? undefined,
        };
      });
  }, [analysisResult, talentSkillLookup]);

  const skillSuggestionRequestKey = useMemo(() => {
    if (!unmatchedSkillSuggestions.length) return '';
    return `skill:${unmatchedSkillSuggestions
      .map((suggestion, index) => {
        const normalized = (suggestion.skillName ?? '').trim().toLowerCase();
        return normalized.length > 0 ? normalized : `__unknown-skill-${index}`;
      })
      .sort()
      .join('|')}`;
  }, [unmatchedSkillSuggestions]);

  const skillSuggestionDisplayItems = useMemo(
    () =>
      unmatchedSkillSuggestions.map((suggestion, index) => {
        const name = suggestion.skillName?.trim();
        return name && name.length > 0 ? name : `Kỹ năng chưa rõ #${index + 1}`;
      }),
    [unmatchedSkillSuggestions]
  );

  const skillSuggestionDetailItems = useMemo(
    () =>
      unmatchedSkillSuggestions.map((suggestion) => ({
        skillName: suggestion.skillName ?? '',
        level: suggestion.level ?? '',
        yearsExp: suggestion.yearsExp != null ? String(suggestion.yearsExp) : '',
      })),
    [unmatchedSkillSuggestions]
  );

  // Job Role Levels computed values - map theo key (position|level)
  const jobRoleLevelSystemMap = useMemo(() => {
    const map = new Map<string, JobRoleLevel>();
    lookupJobRoleLevelsForTalent.forEach((jobRoleLevel) => {
      const levelName = getTalentLevelName(jobRoleLevel.level);
      const key = normalizeJobRoleKey(jobRoleLevel.name, levelName);
      if (key !== '|') {
        map.set(key, jobRoleLevel);
      }
    });
    return map;
  }, [lookupJobRoleLevelsForTalent]);

  // Map theo position để tìm bất kỳ level nào của position đó trong hệ thống
  const jobRolePositionSystemMap = useMemo(() => {
    const map = new Map<string, JobRoleLevel[]>();
    lookupJobRoleLevelsForTalent.forEach((jobRoleLevel) => {
      const position = normalizeJobRolePosition(jobRoleLevel.name);
      if (position) {
        if (!map.has(position)) {
          map.set(position, []);
        }
        map.get(position)!.push(jobRoleLevel);
      }
    });
    return map;
  }, [lookupJobRoleLevelsForTalent]);

  const talentJobRoleLevelMap = useMemo(() => {
    const map = new Map<
      string,
      {
        existing: TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string };
        system?: JobRoleLevel;
      }
    >();
    jobRoleLevels.forEach((record) => {
      const system = lookupJobRoleLevelsForTalent.find((jobRoleLevel) => jobRoleLevel.id === record.jobRoleLevelId);
      const levelName = system ? getTalentLevelName(system.level) : undefined;
      const key = normalizeJobRoleKey(system?.name ?? record.jobRoleLevelName, levelName);
      if (key !== '|') {
        map.set(key, { existing: record, system });
      }
    });
    return map;
  }, [jobRoleLevels, lookupJobRoleLevelsForTalent]);

  // Map theo position (name) để kiểm tra xem profile đã có position này chưa (bất kỳ level nào)
  const talentJobRolePositionSet = useMemo(() => {
    const positionSet = new Set<string>();
    jobRoleLevels.forEach((record) => {
      const system = lookupJobRoleLevelsForTalent.find((jobRoleLevel) => jobRoleLevel.id === record.jobRoleLevelId);
      const position = normalizeJobRolePosition(system?.name ?? record.jobRoleLevelName);
      if (position) {
        positionSet.add(position);
      }
    });
    return positionSet;
  }, [jobRoleLevels, lookupJobRoleLevelsForTalent]);

  // Tự động so sánh CVs với profile (không cần analysis result)
  const cvJobRoleLevelsComparison = useMemo(() => {
    const result = {
      recognized: [] as Array<{ suggestion: any; system: JobRoleLevel }>,
      unmatched: [] as any[],
    };

    if (!talentCVs || talentCVs.length === 0) return result;

    // Lấy các vị trí từ CVs (unique theo position)
    const cvPositions = new Map<string, { cv: TalentCV & { jobRoleLevelName?: string }; system?: JobRoleLevel }>();
    
    talentCVs.forEach((cv) => {
      if (!cv.jobRoleLevelId || cv.jobRoleLevelId === 0) return;
      
      const system = lookupJobRoleLevelsForTalent.find((jrl) => jrl.id === cv.jobRoleLevelId);
      const position = normalizeJobRolePosition(system?.name ?? cv.jobRoleLevelName);
      
      if (position && !cvPositions.has(position)) {
        cvPositions.set(position, { cv, system });
      }
    });

    // So sánh với profile
    cvPositions.forEach(({ cv, system }) => {
      const cvPosition = normalizeJobRolePosition(system?.name ?? cv.jobRoleLevelName);
      if (!cvPosition) return;

      const hasPositionInProfile = talentJobRolePositionSet.has(cvPosition);
      
      // Chỉ báo nếu profile CHƯA có position này
      if (!hasPositionInProfile) {
        // Profile chưa có position này - cần báo
        if (system) {
          // Có trong hệ thống - chỉ lưu position, không cần level
          result.recognized.push({
            suggestion: {
              position: system.name,
            },
            system,
          });
        } else {
          // Không có trong hệ thống
          result.unmatched.push({
            position: cv.jobRoleLevelName ?? 'Vị trí chưa rõ',
          });
        }
      }
      // Nếu hasPositionInProfile = true, không làm gì (profile đã có position này rồi)
    });

    return result;
  }, [talentCVs, lookupJobRoleLevelsForTalent, talentJobRolePositionSet]);

  const jobRoleLevelComparisons = useMemo(() => {
    const result = {
      recognized: [] as Array<{ suggestion: any; system: JobRoleLevel }>,
      matched: [] as Array<{ suggestion: any; existing: TalentJobRoleLevel & { jobRoleLevelName: string }; system?: JobRoleLevel }>,
      unmatched: [] as any[],
      onlyInTalent: [] as Array<{ existing: TalentJobRoleLevel & { jobRoleLevelName: string }; system?: JobRoleLevel }>,
    };

    // Merge với kết quả từ CV comparison (tự động)
    const recognizedPositions = new Set<string>();
    cvJobRoleLevelsComparison.recognized.forEach((item) => {
      const position = normalizeJobRolePosition(item.suggestion.position);
      if (position) {
        recognizedPositions.add(position);
        result.recognized.push(item);
      }
    });
    
    const unmatchedPositions = new Set<string>();
    cvJobRoleLevelsComparison.unmatched.forEach((item) => {
      const position = normalizeJobRolePosition(item.position);
      if (position) {
        unmatchedPositions.add(position);
        result.unmatched.push(item);
      }
    });

    if (!analysisResult) return result;

    const cvKeys = new Set<string>();

    analysisResult.jobRoleLevels?.newFromCV?.forEach((suggestion: any) => {
      const key = normalizeJobRoleKey(suggestion.position, suggestion.level);
      if (key === '|') return;
      cvKeys.add(key);

      const system = jobRoleLevelSystemMap.get(key);
      const existingInfo = talentJobRoleLevelMap.get(key);
      
      // Kiểm tra xem profile đã có position này chưa (bất kỳ level nào)
      const cvPosition = normalizeJobRolePosition(suggestion.position);
      const hasPositionInProfile = cvPosition && talentJobRolePositionSet.has(cvPosition);
      
      // Tìm bất kỳ level nào của position này trong hệ thống
      const systemsForPosition = cvPosition ? jobRolePositionSystemMap.get(cvPosition) : undefined;
      const hasPositionInSystem = systemsForPosition && systemsForPosition.length > 0;
      // Lấy system đầu tiên nếu có (để dùng cho recognized)
      const systemForPosition = systemsForPosition && systemsForPosition.length > 0 ? systemsForPosition[0] : undefined;

      if (existingInfo) {
        // Đã có chính xác position + level trong profile
        result.matched.push({ suggestion, existing: existingInfo.existing, system: existingInfo.system });
      } else if (hasPositionInProfile) {
        // Profile đã có position này (bất kỳ level nào) - không báo
        // (cùng vị trí không cần cùng level)
      } else if (!hasPositionInProfile && hasPositionInSystem && systemForPosition) {
        // Profile chưa có position này (bất kỳ level nào) nhưng có trong hệ thống
        // Dùng system chính xác nếu có, nếu không thì dùng system đầu tiên của position
        // Chỉ thêm nếu chưa có trong recognized từ CV comparison
        if (!recognizedPositions.has(cvPosition)) {
          result.recognized.push({ suggestion, system: system || systemForPosition });
        }
      } else if (!hasPositionInProfile) {
        // Profile chưa có position này (bất kỳ level nào) và không có trong hệ thống
        // Vẫn báo để người dùng biết CV có vị trí này
        // Chỉ thêm nếu chưa có trong unmatched từ CV comparison
        if (!unmatchedPositions.has(cvPosition)) {
          result.unmatched.push(suggestion);
        }
      } else {
        // Trường hợp khác (không nên xảy ra)
        if (!unmatchedPositions.has(cvPosition)) {
          result.unmatched.push(suggestion);
        }
      }
    });

    talentJobRoleLevelMap.forEach((value, key) => {
      if (!cvKeys.has(key)) {
        result.onlyInTalent.push(value);
      }
    });

    return result;
  }, [analysisResult, jobRoleLevelSystemMap, jobRolePositionSystemMap, talentJobRoleLevelMap, talentJobRolePositionSet, cvJobRoleLevelsComparison]);

  const { recognized: jobRoleLevelsRecognized, matched: jobRoleLevelsMatched, unmatched: jobRoleLevelsUnmatched } = jobRoleLevelComparisons;

  const matchedJobRoleLevelsNotInProfile = useMemo(() => {
    // Luôn trả về kết quả từ CV comparison tự động, không phụ thuộc vào analysisResult
    return jobRoleLevelsRecognized.map(({ suggestion, system }) => {
      if (system) {
        return {
          jobRoleLevelId: system.id,
          position: suggestion.position ?? system.name ?? '',
          // Không cần level - chỉ so sánh position
          yearsOfExp: suggestion.yearsOfExp ?? undefined,
          ratePerMonth: suggestion.ratePerMonth ?? undefined,
        };
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [jobRoleLevelsRecognized]);

  // Certificates computed values
  const certificateSystemMap = useMemo(() => {
    const map = new Map<string, CertificateType>();
    lookupCertificateTypes.forEach((type) => {
      const key = normalizeCertificateName(type.name);
      if (key) map.set(key, type);
    });
    return map;
  }, [lookupCertificateTypes]);

  const talentCertificateMap = useMemo(() => {
    const map = new Map<string, TalentCertificate & { certificateTypeName: string }>();
    certificates.forEach((certificate) => {
      const key = normalizeCertificateName(certificate.certificateTypeName);
      if (key) map.set(key, certificate);
    });
    return map;
  }, [certificates]);

  const certificateComparisons = useMemo(() => {
    const result = {
      recognized: [] as Array<{ suggestion: any; system: CertificateType }>,
      matched: [] as Array<{ suggestion: any; existing: TalentCertificate & { certificateTypeName: string }; system?: CertificateType }>,
      unmatched: [] as any[],
      onlyInTalent: [] as Array<TalentCertificate & { certificateTypeName: string }>,
    };

    if (!analysisResult) return result;

    const cvKeys = new Set<string>();

    analysisResult.certificates?.newFromCV?.forEach((suggestion: any) => {
      const key = normalizeCertificateName(suggestion.certificateName);
      if (!key) return;
      cvKeys.add(key);

      const system = certificateSystemMap.get(key);
      const existing = talentCertificateMap.get(key);

      if (existing) {
        result.matched.push({ suggestion, existing, system });
      } else if (system) {
        result.recognized.push({ suggestion, system });
      } else {
        result.unmatched.push(suggestion);
      }
    });

    talentCertificateMap.forEach((existing, key) => {
      if (!cvKeys.has(key)) {
        result.onlyInTalent.push(existing);
      }
    });

    return result;
  }, [analysisResult, certificateSystemMap, talentCertificateMap]);

  const { recognized: certificatesRecognized, unmatched: certificatesUnmatched } = certificateComparisons;

  return {
    // States
    analysisResult,
    setAnalysisResult,
    analysisResultCVId,
    setAnalysisResultCVId,
    analysisError,
    setAnalysisError,
    analysisLoadingId,
    setAnalysisLoadingId,
    expandedAnalysisDetail,
    setExpandedAnalysisDetail,
    expandedBasicInfo,
    setExpandedBasicInfo,

    // Handlers
    handleAnalyzeCVFromUrl,
    handleCancelAnalysis,
    clearAnalysisResult,

    // Helpers
    extractCVFirebasePath,
    updateSkillMaps,
    getUnmatchedSkillSuggestions,
    getMatchedSkillsDetails,
    getMatchedSkillsNotInProfile,

    // Computed values - Skills
    systemSkillMap,
    talentSkillLookup,
    unmatchedSkillSuggestions,
    matchedSkillsDetails,
    matchedSkillsNotInProfile,
    skillSuggestionRequestKey,
    skillSuggestionDisplayItems,
    skillSuggestionDetailItems,

    // Computed values - Job Role Levels
    jobRoleLevelSystemMap,
    talentJobRoleLevelMap,
    jobRoleLevelComparisons,
    jobRoleLevelsRecognized,
    jobRoleLevelsMatched,
    jobRoleLevelsUnmatched,
    matchedJobRoleLevelsNotInProfile,

    // Computed values - Certificates
    certificateSystemMap,
    talentCertificateMap,
    certificateComparisons,
    certificatesRecognized,
    certificatesUnmatched,

    // Storage
    ANALYSIS_RESULT_STORAGE_KEY,
    getPrefillStorageKey,
    clearPrefillStorage,
  };
}

