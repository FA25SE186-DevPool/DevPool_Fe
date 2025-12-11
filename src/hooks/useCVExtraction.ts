import { useState, useCallback } from 'react';
import { talentCVService, type TalentCVExtractResponse } from '../services/TalentCV';
import { type Location } from '../services/location';
import { type Skill } from '../services/Skill';
import { type CertificateType } from '../services/CertificateType';
import { type JobRole } from '../services/JobRole';
import { type JobRoleLevel } from '../services/JobRoleLevel';
import { WorkingMode } from '../constants/WORKING_MODE';
import {
  type TalentSkillCreateModel,
  type TalentWorkExperienceCreateModel,
  type TalentProjectCreateModel,
  type TalentCertificateCreateModel,
  type TalentJobRoleLevelCreateModel,
} from '../services/Talent';

/**
 * Interface for extracted CV data
 */
export interface ExtractedCVData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD or null
  locationName?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  workingMode?: string | null; // Remote/Onsite/Hybrid
  skills?: Array<{
    skillName: string;
    level?: string | null; // Beginner/Intermediate/Advanced/Expert
    yearsExp?: number | null;
  }>;
  workExperiences?: Array<{
    company?: string | null;
    position?: string | null;
    startDate?: string; // YYYY-MM or string
    endDate?: string | null; // YYYY-MM or string or 'Present'
    description?: string | null;
  }>;
  projects?: Array<{
    projectName?: string | null;
    position?: string | null;
    description?: string | null;
    technologies?: string | null;
  }>;
  certificates?: Array<{
    certificateName: string;
    certificateDescription?: string | null;
    issuedDate?: string | null; // YYYY-MM or string or null
    imageUrl?: string | null;
  }>;
  jobRoleLevels?: Array<{
    position: string; // e.g., Frontend Developer, Backend Developer
    level?: string | null; // Junior/Middle/Senior/Lead
    yearsOfExp?: number | null;
    ratePerMonth?: number | null; // in VND
  }>;
  [key: string]: unknown;
}

/**
 * Result of CV extraction processing
 */
export interface CVExtractionResult {
  basicInfo: Partial<{
    fullName: string;
    email: string;
    phone: string | undefined;
    dateOfBirth: string | undefined;
    locationId: number | undefined;
    workingMode: WorkingMode;
    githubUrl: string | undefined;
    portfolioUrl: string | undefined;
  }>;
  skills: TalentSkillCreateModel[];
  workExperiences: TalentWorkExperienceCreateModel[];
  projects: TalentProjectCreateModel[];
  certificates: TalentCertificateCreateModel[];
  jobRoleLevels: TalentJobRoleLevelCreateModel[];
  unmatchedData: {
    location?: string;
    skills?: string[];
    certificateTypes?: string[];
    jobRoles?: string[];
  };
  summary: string;
  stats: {
    addedSkillsCount: number;
    addedWorkExperiencesCount: number;
    addedProjectsCount: number;
    addedCertificatesCount: number;
    matchedCertificatesCount: number;
    unmatchedCertificatesCount: number;
    addedJobRoleLevelsCount: number;
  };
}

/**
 * Hook để quản lý CV extraction logic
 */
export function useCVExtraction(
  locations: Location[],
  skills: Skill[],
  certificateTypes: CertificateType[],
  jobRoles: JobRole[],
  jobRoleLevels: JobRoleLevel[]
) {
  const [extractingCV, setExtractingCV] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedCVData | null>(null);
  const [unmatchedData, setUnmatchedData] = useState<{
    location?: string;
    skills?: string[];
    certificateTypes?: string[];
    jobRoles?: string[];
  }>({});

  /**
   * Clean phone number to digits only
   */
  const cleanPhoneNumber = useCallback((phone: string): string => {
    return phone.replace(/\D/g, '');
  }, []);

  /**
   * Normalize Vietnamese text (remove diacritics)
   */
  const normalizeVietnamese = useCallback((text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim();
  }, []);

  /**
   * Normalize skill/tech name (remove special chars, extensions, etc.)
   */
  const normalizeSkillName = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/\.(js|ts|jsx|tsx|net|py|java|cpp|csharp|php|go|rb|swift|kt|dart)$/i, '') // Remove common extensions
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }, []);

  /**
   * Fuzzy match text (exact → normalized → substring → contains)
   */
  const fuzzyMatch = useCallback(
    (cvText: string, systemText: string): boolean => {
      const cvLower = cvText.toLowerCase().trim();
      const sysLower = systemText.toLowerCase().trim();

      // 1. Exact match (case-insensitive)
      if (cvLower === sysLower) return true;

      // 2. Normalized match (remove diacritics, special chars)
      const cvNormalized = normalizeSkillName(cvText);
      const sysNormalized = normalizeSkillName(systemText);
      if (cvNormalized === sysNormalized) return true;

      // 3. Substring match (one contains the other)
      if (cvNormalized.includes(sysNormalized) || sysNormalized.includes(cvNormalized)) {
        const minLength = Math.min(cvNormalized.length, sysNormalized.length);
        if (minLength >= 3) return true;
      }

      // 4. Word-based match (at least 2 words match)
      const cvWords = cvNormalized.split(/\s+/).filter((w) => w.length > 2);
      const sysWords = sysNormalized.split(/\s+/).filter((w) => w.length > 2);
      const commonWords = cvWords.filter((w) => sysWords.includes(w));
      if (commonWords.length >= 2) return true;

      return false;
    },
    [normalizeSkillName]
  );

  /**
   * Match location from CV data
   */
  const matchLocation = useCallback(
    (locationNameFromCV: string | null | undefined): number | undefined => {
      if (!locationNameFromCV || typeof locationNameFromCV !== 'string' || locations.length === 0) {
        return undefined;
      }

      // Mapping dictionary for common city names (English -> Vietnamese)
      const locationMapping: Record<string, string[]> = {
        'ho chi minh city': [
          'ho chi minh',
          'thanh pho ho chi minh',
          'tp hcm',
          'hcm',
          'hochiminh',
        ],
        'hanoi': ['ha noi', 'thanh pho ha noi', 'tp ha noi', 'hanoi'],
        'da nang': ['da nang', 'thanh pho da nang', 'tp da nang', 'danang'],
        'haiphong': ['hai phong', 'thanh pho hai phong', 'tp hai phong', 'haiphong'],
        'can tho': ['can tho', 'thanh pho can tho', 'tp can tho', 'cantho'],
        'nha trang': ['nha trang', 'khanh hoa', 'nhatrang'],
        'vung tau': ['vung tau', 'ba ria vung tau', 'vungtau'],
        'hue': ['hue', 'thua thien hue', 'hue'],
      };

      const normalizedCVLocation = normalizeVietnamese(locationNameFromCV);

      // 1. Exact match (case-insensitive, normalized)
      let matchedLocation = locations.find((loc) => {
        const normalizedLocName = normalizeVietnamese(loc.name);
        return normalizedLocName === normalizedCVLocation;
      });

      // 2. Try mapping dictionary
      if (!matchedLocation) {
        const mappingKey = Object.keys(locationMapping).find(
          (key) =>
            normalizedCVLocation.includes(normalizeVietnamese(key)) ||
            normalizeVietnamese(key).includes(normalizedCVLocation)
        );

        if (mappingKey) {
          const mappedNames = locationMapping[mappingKey];
          matchedLocation = locations.find((loc) => {
            const normalizedLocName = normalizeVietnamese(loc.name);
            return mappedNames.some(
              (mappedName) =>
                normalizedLocName === normalizeVietnamese(mappedName) ||
                normalizedLocName.includes(normalizeVietnamese(mappedName)) ||
                normalizeVietnamese(mappedName).includes(normalizedLocName)
            );
          });
        }
      }

      // 3. Fuzzy matching (contains)
      if (!matchedLocation) {
        matchedLocation = locations.find((loc) => {
          const normalizedLocName = normalizeVietnamese(loc.name);
          const cvWords = normalizedCVLocation.split(/\s+/);
          const locWords = normalizedLocName.split(/\s+/);

          const commonWords = cvWords.filter(
            (word) =>
              word.length > 3 &&
              locWords.some(
                (locWord) => locWord.includes(word) || word.includes(locWord)
              )
          );

          return (
            commonWords.length > 0 ||
            normalizedLocName.includes(normalizedCVLocation) ||
            normalizedCVLocation.includes(normalizedLocName)
          );
        });
      }

      return matchedLocation?.id;
    },
    [locations, normalizeVietnamese]
  );

  /**
   * Map working mode string to WorkingMode enum
   */
  const mapWorkingMode = useCallback((workingModeStr: string | null | undefined): WorkingMode => {
    if (!workingModeStr) return WorkingMode.None;

    const mode = workingModeStr.toLowerCase();
    if (mode === 'onsite') return WorkingMode.Onsite;
    if (mode === 'remote') return WorkingMode.Remote;
    if (mode === 'hybrid') return WorkingMode.Hybrid;
    if (mode === 'flexible') return WorkingMode.Flexible;
    return WorkingMode.None;
  }, []);

  /**
   * Format date for input (YYYY-MM -> YYYY-MM-DD)
   */
  const formatDateForInput = useCallback(
    (dateStr: string | null | undefined): string | undefined => {
      if (!dateStr) return undefined;
      // If 'Present', return undefined
      if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'hiện tại') {
        return undefined;
      }
      // If already YYYY-MM-DD, keep as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // If YYYY-MM, add -01
      if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
      // Try to parse other formats
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        // If can't parse, return undefined
      }
      return undefined;
    },
    []
  );

  /**
   * Match skills from CV
   */
  const matchSkills = useCallback(
    (
      cvSkills: ExtractedCVData['skills'],
      existingSkillIds: number[]
    ): {
      matched: TalentSkillCreateModel[];
      unmatched: string[];
    } => {
      const matched: TalentSkillCreateModel[] = [];
      const unmatched: string[] = [];

      if (!cvSkills || !Array.isArray(cvSkills) || cvSkills.length === 0) {
        return { matched, unmatched };
      }

      cvSkills.forEach((skillObj: any) => {
        const skillName = typeof skillObj === 'string' ? skillObj : skillObj.skillName;
        const skillLevel =
          typeof skillObj === 'object' ? skillObj.level || 'Intermediate' : 'Intermediate';
        const skillYearsExp = typeof skillObj === 'object' ? skillObj.yearsExp || 0 : 0;

        // Find skill in system (exact match first, then fuzzy)
        let matchedSkill = skills.find(
          (s) => s.name.toLowerCase().trim() === skillName.toLowerCase().trim()
        );

        if (!matchedSkill) {
          matchedSkill = skills.find((s) => fuzzyMatch(skillName, s.name));
        }

        if (matchedSkill && !existingSkillIds.includes(matchedSkill.id)) {
          // Map level to valid level
          let mappedLevel = skillLevel;
          if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skillLevel)) {
            mappedLevel = 'Intermediate';
          }

          // Auto set yearsExp = 1 if 0
          const yearsExp = skillYearsExp && skillYearsExp > 0 ? skillYearsExp : 1;

          matched.push({
            skillId: matchedSkill.id,
            level: mappedLevel,
            yearsExp: yearsExp,
          });
        } else if (!matchedSkill) {
          unmatched.push(skillName);
        }
      });

      return { matched, unmatched };
    },
    [skills, fuzzyMatch]
  );

  /**
   * Match certificates from CV
   */
  const matchCertificates = useCallback(
    (
      cvCertificates: ExtractedCVData['certificates']
    ): {
      matched: TalentCertificateCreateModel[];
      unmatched: string[];
    } => {
      const matched: TalentCertificateCreateModel[] = [];
      const unmatched: string[] = [];

      if (!cvCertificates || !Array.isArray(cvCertificates) || cvCertificates.length === 0) {
        return { matched, unmatched };
      }

      // Extract keywords from certificate type name
      const extractKeywords = (typeName: string): { primary: string[]; secondary: string[] } => {
        const normalized = typeName.toLowerCase().trim();

        // Get words in parentheses (usually main keywords)
        const inParentheses = normalized.match(/\(([^)]+)\)/);
        const parenthesesWords: string[] = [];
        if (inParentheses) {
          const parenthesesContent = inParentheses[1]
            .replace(/[^\w\s]/g, ' ')
            .split(/\s*[,\/]\s*/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length >= 3);
          parenthesesWords.push(...parenthesesContent);
        }

        // Remove parentheses content to get main part
        let mainPart = normalized
          .replace(/\([^)]*\)/g, '')
          .replace(/\[[^\]]*\]/g, '')
          .replace(/^chứng chỉ\s*/i, '')
          .replace(/^certificate\s*/i, '')
          .replace(/^cert\s*/i, '')
          .replace(/\.{2,}/g, '')
          .replace(/[^\w\s]/g, ' ')
          .trim();

        const firstWord = mainPart.split(/\s+/)[0];
        const primary: string[] = [];
        if (firstWord && firstWord.length >= 3) {
          primary.push(firstWord);
        }

        const remainingWords = mainPart.split(/\s+/).slice(1).filter((w) => w.length >= 3);

        const stopWords = [
          'certified',
          'certificate',
          'cert',
          'solutions',
          'architect',
          'practitioner',
          'engineer',
          'developer',
          'professional',
          'associate',
          'specialist',
          'expert',
          'master',
          'foundation',
          'fundamentals',
          'tiếng',
          'anh',
          'chứng',
          'chỉ',
        ];

        const filteredPrimary = primary.filter((word) => !stopWords.includes(word));
        const filteredSecondary = [...remainingWords, ...parenthesesWords].filter(
          (word) => !stopWords.includes(word)
        );

        return { primary: filteredPrimary, secondary: filteredSecondary };
      };

      // Normalize certificate name
      const normalizeCertificateName = (certName: string): string => {
        return certName
          .toLowerCase()
          .replace(
            /\b(certified|certificate|cert|solutions|architect|practitioner|engineer|developer|professional|associate|specialist|expert|master|foundation|fundamentals)\b/g,
            ''
          )
          .replace(/\s+/g, ' ')
          .trim();
      };

      cvCertificates.forEach((cert: any) => {
        const certificateName = cert.certificateName || '';
        let matchedCertificateTypeId: number = 0;

        if (certificateName && certificateTypes.length > 0) {
          // Find certificate type by keyword matching
          const matchedType = certificateTypes.find((ct) => {
            const { primary, secondary } = extractKeywords(ct.name);
            if (primary.length === 0 && secondary.length === 0) return false;

            const normalizedCert = normalizeCertificateName(certificateName);

            // Try primary keywords first
            const primaryMatch = primary.some((keyword) => {
              if (keyword.length < 3) return false;
              return normalizedCert.includes(keyword);
            });

            if (primaryMatch) return true;

            // Try secondary keywords
            return secondary.some((keyword) => {
              if (keyword.length < 3) return false;
              return normalizedCert.includes(keyword);
            });
          });

          if (matchedType) {
            matchedCertificateTypeId = matchedType.id;
          } else {
            if (!unmatched.includes(certificateName)) {
              unmatched.push(certificateName);
            }
          }
        } else if (certificateName && certificateTypes.length === 0) {
          if (!unmatched.includes(certificateName)) {
            unmatched.push(certificateName);
          }
        }

        // Only add if matched
        if (matchedCertificateTypeId > 0) {
          matched.push({
            certificateTypeId: matchedCertificateTypeId,
            certificateName: certificateName,
            certificateDescription: cert.certificateDescription || '',
            issuedDate: formatDateForInput(cert.issuedDate),
            isVerified: false,
            imageUrl: cert.imageUrl || '',
          });
        }
      });

      return { matched, unmatched };
    },
    [certificateTypes, formatDateForInput]
  );

  /**
   * Match job role levels from CV
   */
  const matchJobRoleLevels = useCallback(
    (
      cvJobRoleLevels: ExtractedCVData['jobRoleLevels']
    ): {
      matched: TalentJobRoleLevelCreateModel[];
      unmatched: string[];
    } => {
      const matched: TalentJobRoleLevelCreateModel[] = [];
      const unmatched: string[] = [];

      if (!cvJobRoleLevels || !Array.isArray(cvJobRoleLevels) || cvJobRoleLevels.length === 0) {
        return { matched, unmatched };
      }

      const levelMap: Record<string, string> = {
        junior: 'Junior',
        middle: 'Middle',
        senior: 'Senior',
        lead: 'Lead',
      };

      cvJobRoleLevels.forEach((jrl: any) => {
        // Find job role by position
        let matchedJobRole = jobRoles.find(
          (jr) =>
            jr.name.toLowerCase().includes(jrl.position.toLowerCase()) ||
            jrl.position.toLowerCase().includes(jr.name.toLowerCase())
        );

        if (!matchedJobRole) {
          matchedJobRole = jobRoles.find((jr) => fuzzyMatch(jrl.position, jr.name));
        }

        if (!matchedJobRole) {
          if (!unmatched.includes(jrl.position)) {
            unmatched.push(jrl.position);
          }
          // Still create job role level with id = 0
          matched.push({
            jobRoleLevelId: 0,
            yearsOfExp: jrl.yearsOfExp && jrl.yearsOfExp > 0 ? jrl.yearsOfExp : 1,
            ratePerMonth: jrl.ratePerMonth || undefined,
          });
          return;
        }

        // Map level
        const normalizedLevel = jrl.level
          ? levelMap[jrl.level.toLowerCase()] || jrl.level
          : null;

        // Find job role level
        let matchedJobRoleLevel = jobRoleLevels.find((jrLevel) => {
          // Find by position name and level
          const nameMatch =
            jrLevel.name.toLowerCase().includes(jrl.position.toLowerCase()) ||
            jrl.position.toLowerCase().includes(jrLevel.name.toLowerCase());
          const levelMatch = normalizedLevel ? jrLevel.level === normalizedLevel : true;
          return nameMatch && levelMatch;
        });

        if (!matchedJobRoleLevel) {
          matchedJobRoleLevel = jobRoleLevels.find((jrLevel) =>
            fuzzyMatch(jrl.position, jrLevel.name)
          );
        }

        matched.push({
          jobRoleLevelId: matchedJobRoleLevel ? matchedJobRoleLevel.id : 0,
          yearsOfExp: jrl.yearsOfExp && jrl.yearsOfExp > 0 ? jrl.yearsOfExp : 1,
          ratePerMonth: jrl.ratePerMonth || undefined,
        });
      });

      return { matched, unmatched };
    },
    [jobRoles, jobRoleLevels, fuzzyMatch]
  );

  /**
   * Generate summary from extracted data
   */
  const generateSummary = useCallback((data: ExtractedCVData): string => {
    const parts: string[] = [];

    if (data.fullName) {
      parts.push(`Tên: ${data.fullName}`);
    }

    if (data.email) {
      parts.push(`Email: ${data.email}`);
    }

    if (data.phone) {
      parts.push(`SĐT: ${data.phone}`);
    }

    if (data.locationName) {
      parts.push(`Khu vực: ${data.locationName}`);
    }

    if (data.workingMode) {
      parts.push(`Chế độ làm việc: ${data.workingMode}`);
    }

    if (data.skills && data.skills.length > 0) {
      const skillNames = data.skills
        .map((s) => (typeof s === 'string' ? s : s.skillName))
        .join(', ');
      parts.push(`Kỹ năng: ${skillNames}`);
    }

    if (data.workExperiences && data.workExperiences.length > 0) {
      parts.push(
        `Kinh nghiệm: ${data.workExperiences.length} vị trí (${data.workExperiences
          .map((e) => e.position || e.company || '')
          .filter(Boolean)
          .join(', ')})`
      );
    }

    if (data.projects && data.projects.length > 0) {
      parts.push(`Dự án: ${data.projects.length} dự án`);
    }

    if (data.certificates && data.certificates.length > 0) {
      parts.push(`Chứng chỉ: ${data.certificates.length} chứng chỉ`);
    }

    return parts.join('\n');
  }, []);

  /**
   * Process extracted data and return structured result
   */
  const processExtractedData = useCallback(
    (
      parsedData: ExtractedCVData,
      existingSkillIds: number[] = []
    ): CVExtractionResult => {
      // Match location
      const matchedLocationId = matchLocation(parsedData.locationName);

      // Map working mode
      const workingMode = mapWorkingMode(parsedData.workingMode);

      // Match skills
      const { matched: matchedSkills, unmatched: unmatchedSkills } = matchSkills(
        parsedData.skills,
        existingSkillIds
      );

      // Format work experiences
      const workExperiences: TalentWorkExperienceCreateModel[] =
        parsedData.workExperiences && Array.isArray(parsedData.workExperiences)
          ? parsedData.workExperiences.map((exp: any) => ({
              company: exp.company || '',
              position: exp.position || '',
              startDate: formatDateForInput(exp.startDate) || '',
              endDate: formatDateForInput(exp.endDate),
              description: exp.description || '',
            }))
          : [];

      // Format projects
      const projects: TalentProjectCreateModel[] =
        parsedData.projects && Array.isArray(parsedData.projects)
          ? parsedData.projects.map((project: any) => ({
              projectName: project.projectName || '',
              position: project.position || '',
              technologies: project.technologies || '',
              description: project.description || '',
            }))
          : [];

      // Match certificates
      const { matched: matchedCertificates, unmatched: unmatchedCertificates } =
        matchCertificates(parsedData.certificates);

      // Match job role levels
      const { matched: matchedJobRoleLevels, unmatched: unmatchedJobRoles } =
        matchJobRoleLevels(parsedData.jobRoleLevels);

      // Generate summary
      const summary = generateSummary(parsedData);

      // Build unmatched data
      const unmatchedData: CVExtractionResult['unmatchedData'] = {};
      if (matchedLocationId === undefined && parsedData.locationName) {
        unmatchedData.location = parsedData.locationName;
      }
      if (unmatchedSkills.length > 0) {
        unmatchedData.skills = unmatchedSkills;
      }
      if (unmatchedCertificates.length > 0) {
        unmatchedData.certificateTypes = unmatchedCertificates;
      }
      if (unmatchedJobRoles.length > 0) {
        unmatchedData.jobRoles = unmatchedJobRoles;
      }

      return {
        basicInfo: {
          fullName: parsedData.fullName || '',
          email: parsedData.email || '',
          phone: parsedData.phone || undefined,
          dateOfBirth: parsedData.dateOfBirth || undefined,
          locationId: matchedLocationId,
          workingMode: workingMode,
          githubUrl: parsedData.githubUrl || undefined,
          portfolioUrl: parsedData.portfolioUrl || undefined,
        },
        skills: matchedSkills,
        workExperiences: workExperiences,
        projects: projects,
        certificates: matchedCertificates,
        jobRoleLevels: matchedJobRoleLevels,
        unmatchedData: unmatchedData,
        summary: summary,
        stats: {
          addedSkillsCount: matchedSkills.length,
          addedWorkExperiencesCount: workExperiences.length,
          addedProjectsCount: projects.length,
          addedCertificatesCount: matchedCertificates.length,
          matchedCertificatesCount: matchedCertificates.length,
          unmatchedCertificatesCount: unmatchedCertificates.length,
          addedJobRoleLevelsCount: matchedJobRoleLevels.length,
        },
      };
    },
    [
      matchLocation,
      mapWorkingMode,
      matchSkills,
      formatDateForInput,
      matchCertificates,
      matchJobRoleLevels,
      generateSummary,
    ]
  );

  /**
   * Extract and fill data from CV
   */
  const extractAndFillDataFromCV = useCallback(
    async (
      file: File,
      existingSkillIds: number[] = []
    ): Promise<CVExtractionResult | null> => {
      try {
        setExtractingCV(true);
        setExtractedData(null);
        setUnmatchedData({});

        const extractResult: TalentCVExtractResponse = await talentCVService.extractFromPDF(file);

        if (extractResult.isSuccess && extractResult.generateText) {
          // Clean the response text by removing markdown code blocks
          let cleanText = extractResult.generateText.trim();
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsedData: ExtractedCVData = JSON.parse(cleanText);

          // Clean phone number
          if (parsedData.phone) {
            parsedData.phone = cleanPhoneNumber(parsedData.phone);
          }

          setExtractedData(parsedData);

          // Process extracted data
          const processedResult = processExtractedData(parsedData, existingSkillIds);
          setUnmatchedData(processedResult.unmatchedData);

          return processedResult;
        } else {
          alert('❌ Không thể trích xuất dữ liệu từ CV. Vui lòng thử lại.');
          return null;
        }
      } catch (err: any) {
        console.error('❌ Error extracting CV:', err);
        alert(`❌ Lỗi khi trích xuất CV: ${err.message || 'Vui lòng thử lại.'}`);
        return null;
      } finally {
        setExtractingCV(false);
      }
    },
    [cleanPhoneNumber, processExtractedData]
  );

  return {
    extractingCV,
    extractedData,
    setExtractedData,
    unmatchedData,
    setUnmatchedData,
    extractAndFillDataFromCV,
    fuzzyMatch,
    normalizeVietnamese,
    normalizeSkillName,
    matchLocation,
    mapWorkingMode,
    formatDateForInput,
    generateSummary,
  };
}
