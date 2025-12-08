import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { talentProjectService } from '../services/TalentProject';
import { talentSkillService, type TalentSkill } from '../services/TalentSkill';
import { talentWorkExperienceService } from '../services/TalentWorkExperience';
import { talentJobRoleLevelService, type TalentJobRoleLevel } from '../services/TalentJobRoleLevel';
import { talentCertificateService, type TalentCertificate } from '../services/TalentCertificate';
import { talentAvailableTimeService, type TalentAvailableTime } from '../services/TalentAvailableTime';
import { talentCVService, type TalentCV } from '../services/TalentCV';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { uploadFile } from '../utils/firebaseStorage';
import { jobRoleLevelService, type JobRoleLevel, TalentLevel } from '../services/JobRoleLevel';
import { skillService, type Skill } from '../services/Skill';
import { certificateTypeService, type CertificateType } from '../services/CertificateType';
import {
  talentSkillGroupAssessmentService,
  type SkillGroupVerificationStatus,
} from '../services/TalentSkillGroupAssessment';
import { type TalentProjectCreateModel, type TalentSkillCreateModel, type TalentWorkExperienceCreateModel, type TalentCertificateCreateModel, type TalentJobRoleLevelCreateModel } from '../services/Talent';
import { type TalentCVCreate } from '../services/TalentCV';

/**
 * Hook để quản lý inline forms và operations cho Talent Detail page
 */
export function useTalentDetailOperations() {
  const { id } = useParams<{ id: string }>();

  // Inline form states
  const [showInlineForm, setShowInlineForm] = useState<
    'project' | 'skill' | 'certificate' | 'experience' | 'jobRoleLevel' | 'availableTime' | 'cv' | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline form data
  const [inlineProjectForm, setInlineProjectForm] = useState<Partial<TalentProjectCreateModel>>({
    projectName: '',
    position: '',
    technologies: '',
    description: '',
  });
  const [inlineSkillForm, setInlineSkillForm] = useState<Partial<TalentSkillCreateModel>>({
    skillId: 0,
    level: 'Beginner',
    yearsExp: 1,
  });
  const [inlineCertificateForm, setInlineCertificateForm] = useState<Partial<TalentCertificateCreateModel>>({
    certificateTypeId: 0,
    certificateName: '',
    certificateDescription: '',
    issuedDate: undefined,
    isVerified: false,
    imageUrl: '',
  });
  const [inlineExperienceForm, setInlineExperienceForm] = useState<Partial<TalentWorkExperienceCreateModel>>({
    company: '',
    position: '',
    startDate: '',
    endDate: undefined,
    description: '',
  });
  const [inlineJobRoleLevelForm, setInlineJobRoleLevelForm] = useState<Partial<TalentJobRoleLevelCreateModel>>({
    jobRoleLevelId: 0,
    yearsOfExp: 1,
    ratePerMonth: undefined,
  });
  const [inlineAvailableTimeForm, setInlineAvailableTimeForm] = useState<Partial<TalentAvailableTime>>({
    startTime: '',
    endTime: undefined,
    notes: '',
  });
  const [inlineCVForm, setInlineCVForm] = useState<Partial<TalentCVCreate>>({
    jobRoleLevelId: 0,
    version: 1,
    cvFileUrl: '',
    isActive: true,
    summary: '',
    isGeneratedFromTemplate: false,
  });

  // Form errors
  const [certificateFormErrors, setCertificateFormErrors] = useState<Record<string, string>>({});
  const [availableTimeFormErrors, setAvailableTimeFormErrors] = useState<Record<string, string>>({});
  const [cvFormErrors, setCvFormErrors] = useState<Record<string, string>>({});
  const [cvVersionError, setCvVersionError] = useState<string>('');

  // Certificate file upload states
  const [certificateImageFile, setCertificateImageFile] = useState<File | null>(null);
  const [uploadingCertificateImage, setUploadingCertificateImage] = useState(false);
  const [certificateUploadProgress, setCertificateUploadProgress] = useState<number>(0);
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState<string | null>(null);

  // Extract Firebase path from URL
  const extractFirebasePath = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  // Certificate file upload handlers
  const handleCertificateImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Vui lòng chọn file ảnh (jpg, png, gif, etc.)');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('⚠️ Kích thước file không được vượt quá 10MB');
        e.target.value = '';
        return;
      }
      setCertificateImageFile(file);
      setCertificateFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.imageFile;
        return newErrors;
      });
    }
  }, []);

  const handleUploadCertificateImage = useCallback(async () => {
    if (!certificateImageFile) {
      alert('Vui lòng chọn file ảnh trước!');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload ảnh "${certificateImageFile.name}" lên Firebase không?\n\n` +
        `Kích thước file: ${(certificateImageFile.size / 1024).toFixed(2)} KB`
    );

    if (!confirmed) return;

    setUploadingCertificateImage(true);
    setCertificateUploadProgress(0);

    try {
      const timestamp = Date.now();
      const sanitizedFileName = certificateImageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const fileName = `cert_${timestamp}_${sanitizedFileName}`;
      const filePath = `certificates/${fileName}`;

      const downloadURL = await uploadFile(certificateImageFile, filePath, (progress) =>
        setCertificateUploadProgress(progress)
      );

      setInlineCertificateForm((prev) => ({ ...prev, imageUrl: downloadURL }));
      setUploadedCertificateUrl(downloadURL);
      setCertificateImageFile(null);
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert('✅ Upload ảnh chứng chỉ thành công!');
    } catch (err: any) {
      console.error('❌ Error uploading certificate image:', err);
      alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setUploadingCertificateImage(false);
      setCertificateUploadProgress(0);
    }
  }, [certificateImageFile, setInlineCertificateForm]);

  const handleDeleteCertificateImage = useCallback(async () => {
    const currentUrl = inlineCertificateForm.imageUrl;
    if (!currentUrl) return;

    const uploadedUrl = uploadedCertificateUrl;
    if (!uploadedUrl || uploadedUrl !== currentUrl) {
      setInlineCertificateForm((prev) => ({ ...prev, imageUrl: '' }));
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa ảnh chứng chỉ này không? File sẽ bị xóa khỏi Firebase.');
    if (!confirmed) return;

    try {
      const firebasePath = extractFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }

      setInlineCertificateForm((prev) => ({ ...prev, imageUrl: '' }));
      setUploadedCertificateUrl(null);
      alert('✅ Đã xóa ảnh chứng chỉ thành công!');
    } catch (err) {
      console.error('❌ Error deleting certificate image:', err);
      alert('Không thể xóa ảnh chứng chỉ!');
    }
  }, [inlineCertificateForm.imageUrl, uploadedCertificateUrl, extractFirebasePath, setInlineCertificateForm]);

  // Selected items for delete operations
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>([]);
  const [selectedJobRoleLevels, setSelectedJobRoleLevels] = useState<number[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<number[]>([]);
  const [selectedAvailableTimes, setSelectedAvailableTimes] = useState<number[]>([]);
  const [selectedCVs, setSelectedCVs] = useState<number[]>([]);

  // Job role level selection states (for inline form)
  const [selectedJobRoleLevelName, setSelectedJobRoleLevelName] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);

  // Helper function to get level text
  const getLevelText = useCallback((level: number): string => {
    const levelMap: Record<number, string> = {
      [TalentLevel.Junior]: 'Junior',
      [TalentLevel.Middle]: 'Middle',
      [TalentLevel.Senior]: 'Senior',
      [TalentLevel.Lead]: 'Lead',
    };
    return levelMap[level] || 'Unknown';
  }, []);

  // Open inline form
  const handleOpenInlineForm = useCallback(
    (type: 'project' | 'skill' | 'certificate' | 'experience' | 'jobRoleLevel' | 'availableTime' | 'cv') => {
      if (isSubmitting) return;
      setShowInlineForm(type);
      // Reset form based on type
      if (type === 'project') {
        setInlineProjectForm({ projectName: '', position: '', technologies: '', description: '' });
      } else if (type === 'skill') {
        setInlineSkillForm({ skillId: 0, level: 'Beginner', yearsExp: 1 });
      } else if (type === 'certificate') {
        setInlineCertificateForm({
          certificateTypeId: 0,
          certificateName: '',
          certificateDescription: '',
          issuedDate: undefined,
          isVerified: false,
          imageUrl: '',
        });
        setCertificateFormErrors({});
      } else if (type === 'experience') {
        setInlineExperienceForm({ company: '', position: '', startDate: '', endDate: undefined, description: '' });
      } else if (type === 'jobRoleLevel') {
        setInlineJobRoleLevelForm({ jobRoleLevelId: 0, yearsOfExp: 1, ratePerMonth: undefined });
        setSelectedJobRoleLevelName('');
        setSelectedLevel(undefined);
      } else if (type === 'availableTime') {
        setInlineAvailableTimeForm({ startTime: '', endTime: undefined, notes: '' });
        setAvailableTimeFormErrors({});
      } else if (type === 'cv') {
        setInlineCVForm({
          jobRoleLevelId: 0,
          version: 1,
          cvFileUrl: '',
          isActive: true,
          summary: '',
          isGeneratedFromTemplate: false,
        });
        setCvFormErrors({});
        setCvVersionError('');
      }
    },
    [isSubmitting]
  );

  // Close inline form
  const handleCloseInlineForm = useCallback(async () => {
    setShowInlineForm(null);
    setCertificateFormErrors({});
    setAvailableTimeFormErrors({});
    setCvFormErrors({});
    setCvVersionError('');
  }, []);

  // Submit inline project
  const handleSubmitInlineProject = useCallback(
    async (
      talentCVs: (TalentCV & { jobRoleLevelName?: string })[],
      onSuccess: (projects: any[]) => void
    ) => {
      if (!id || isSubmitting) return;
      if (!inlineProjectForm.projectName?.trim()) {
        alert('⚠️ Vui lòng nhập tên dự án!');
        return;
      }
      try {
        setIsSubmitting(true);
        const activeCV = talentCVs.find((cv) => cv.isActive) || talentCVs[0];
        if (!activeCV) {
          alert('⚠️ Vui lòng tạo CV trước khi thêm dự án!');
          return;
        }
        await talentProjectService.create({
          talentId: Number(id),
          talentCVId: activeCV.id,
          projectName: inlineProjectForm.projectName!,
          position: inlineProjectForm.position || '',
          technologies: inlineProjectForm.technologies || '',
          description: inlineProjectForm.description || '',
        });
        alert('✅ Đã tạo dự án thành công!');
        handleCloseInlineForm();
        const projects = await talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true });
        onSuccess(projects);
      } catch (err) {
        console.error('❌ Lỗi khi tạo dự án:', err);
        alert('Không thể tạo dự án!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, inlineProjectForm, handleCloseInlineForm]
  );

  // Submit inline skill
  const handleSubmitInlineSkill = useCallback(
    async (
      onSuccess: (skills: (TalentSkill & { skillName: string; skillGroupId?: number })[]) => void,
      onSkillGroupStatusUpdate?: (statuses: Record<number, SkillGroupVerificationStatus>) => void
    ) => {
      if (!id || isSubmitting) return;
      if (!inlineSkillForm.skillId || inlineSkillForm.skillId === 0) {
        alert('⚠️ Vui lòng chọn kỹ năng!');
        return;
      }
      try {
        setIsSubmitting(true);
        await talentSkillService.create({
          talentId: Number(id),
          skillId: inlineSkillForm.skillId!,
          level: inlineSkillForm.level || 'Beginner',
          yearsExp: 0, // Không cần nhập số năm kinh nghiệm
        });
        alert('✅ Đã thêm kỹ năng thành công!');
        handleCloseInlineForm();
        const skills = await talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true });
        const allSkills = await skillService.getAll();
        const skillsWithNames = skills.map((skill: TalentSkill) => {
          const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
          return {
            ...skill,
            skillName: skillInfo?.name ?? 'Unknown Skill',
            skillGroupId: skillInfo?.skillGroupId,
          };
        });
        onSuccess(skillsWithNames);

        // Refresh skill group status if callback provided
        if (onSkillGroupStatusUpdate) {
          const addedSkillInfo = allSkills.find((s: Skill) => s.id === inlineSkillForm.skillId);
          const addedSkillGroupId = addedSkillInfo?.skillGroupId;
          if (addedSkillGroupId && typeof addedSkillGroupId === 'number') {
            try {
              const statuses = await talentSkillGroupAssessmentService.getVerificationStatuses(
                Number(id),
                [addedSkillGroupId]
              );
              if (Array.isArray(statuses) && statuses.length > 0) {
                const statusMap: Record<number, SkillGroupVerificationStatus> = {};
                statuses.forEach((st) => {
                  statusMap[st.skillGroupId] = st;
                });
                onSkillGroupStatusUpdate(statusMap);
              }
            } catch (statusError) {
              console.error('❌ Lỗi khi refresh trạng thái verify sau khi thêm skill:', statusError);
            }
          }
        }
      } catch (err) {
        console.error('❌ Lỗi khi thêm kỹ năng:', err);
        alert('Không thể thêm kỹ năng!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, inlineSkillForm, handleCloseInlineForm]
  );

  // Submit inline certificate
  const handleSubmitInlineCertificate = useCallback(
    async (onSuccess: (certificates: (TalentCertificate & { certificateTypeName: string })[]) => void) => {
      if (!id || isSubmitting) return;
      if (!inlineCertificateForm.certificateTypeId || inlineCertificateForm.certificateTypeId === 0) {
        setCertificateFormErrors({ certificateTypeId: '⚠️ Vui lòng chọn loại chứng chỉ!' });
        return;
      }
      if (!inlineCertificateForm.certificateName?.trim()) {
        setCertificateFormErrors({ certificateName: '⚠️ Vui lòng nhập tên chứng chỉ!' });
        return;
      }
      // Validate issued date
      if (inlineCertificateForm.issuedDate) {
        const issuedDate = new Date(inlineCertificateForm.issuedDate);
        const now = new Date();
        if (issuedDate > now) {
          setCertificateFormErrors({ issuedDate: '⚠️ Ngày cấp không được là ngày trong tương lai.' });
          return;
        }
      }
      try {
        setIsSubmitting(true);
        await talentCertificateService.create({
          talentId: Number(id),
          certificateTypeId: inlineCertificateForm.certificateTypeId!,
          certificateName: inlineCertificateForm.certificateName!,
          certificateDescription: inlineCertificateForm.certificateDescription,
          issuedDate: inlineCertificateForm.issuedDate,
          isVerified: inlineCertificateForm.isVerified || false,
          imageUrl: inlineCertificateForm.imageUrl || '',
        });
        alert('✅ Đã thêm chứng chỉ thành công!');
        handleCloseInlineForm();
        setCertificateFormErrors({});
        const certificatesData = await talentCertificateService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        const allCertificateTypes = await certificateTypeService.getAll();
        const certificatesWithNames = certificatesData.map((cert: TalentCertificate) => {
          const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
          return { ...cert, certificateTypeName: certTypeInfo?.name ?? 'Unknown Certificate' };
        });
        onSuccess(certificatesWithNames);
      } catch (err) {
        console.error('❌ Lỗi khi thêm chứng chỉ:', err);
        alert('Không thể thêm chứng chỉ!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, inlineCertificateForm, handleCloseInlineForm]
  );

  // Submit inline experience
  const handleSubmitInlineExperience = useCallback(
    async (
      talentCVs: (TalentCV & { jobRoleLevelName?: string })[],
      onSuccess: (experiences: any[]) => void
    ) => {
      if (!id || isSubmitting) return;
      if (!inlineExperienceForm.company?.trim() || !inlineExperienceForm.position?.trim()) {
        alert('⚠️ Vui lòng nhập đầy đủ thông tin công ty và vị trí!');
        return;
      }
      if (!inlineExperienceForm.startDate) {
        alert('⚠️ Vui lòng nhập ngày bắt đầu!');
        return;
      }
      // Validation: Ngày kết thúc phải sau ngày bắt đầu
      if (inlineExperienceForm.endDate && inlineExperienceForm.startDate && inlineExperienceForm.endDate < inlineExperienceForm.startDate) {
        alert('⚠️ Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
        return;
      }
      try {
        setIsSubmitting(true);
        const activeCV = talentCVs.find((cv) => cv.isActive) || talentCVs[0];
        if (!activeCV) {
          alert('⚠️ Vui lòng tạo CV trước khi thêm kinh nghiệm!');
          return;
        }
        await talentWorkExperienceService.create({
          talentId: Number(id),
          talentCVId: activeCV.id,
          company: inlineExperienceForm.company!,
          position: inlineExperienceForm.position!,
          startDate: inlineExperienceForm.startDate!,
          endDate: inlineExperienceForm.endDate,
          description: inlineExperienceForm.description || '',
        });
        alert('✅ Đã thêm kinh nghiệm thành công!');
        handleCloseInlineForm();
        const experiences = await talentWorkExperienceService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        onSuccess(experiences);
      } catch (err) {
        console.error('❌ Lỗi khi thêm kinh nghiệm:', err);
        alert('Không thể thêm kinh nghiệm!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, inlineExperienceForm, handleCloseInlineForm]
  );

  // Submit inline job role level
  const handleSubmitInlineJobRoleLevel = useCallback(
    async (
      lookupJobRoleLevelsForTalent: JobRoleLevel[],
      onSuccess: (jobRoleLevels: (TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string })[]) => void
    ) => {
      if (!id || isSubmitting) return;
      if (!selectedJobRoleLevelName || selectedLevel === undefined) {
        alert('⚠️ Vui lòng chọn đầy đủ vị trí và cấp độ!');
        return;
      }
      const matchingJobRoleLevel = lookupJobRoleLevelsForTalent.find(
        (j) => j.name === selectedJobRoleLevelName && j.level === selectedLevel
      );
      if (!matchingJobRoleLevel || !matchingJobRoleLevel.id || matchingJobRoleLevel.id === 0) {
        alert('⚠️ Không tìm thấy vị trí phù hợp!');
        return;
      }
      try {
        setIsSubmitting(true);
        await talentJobRoleLevelService.create({
          talentId: Number(id),
          jobRoleLevelId: matchingJobRoleLevel.id,
          yearsOfExp: inlineJobRoleLevelForm.yearsOfExp || 1,
          ratePerMonth: inlineJobRoleLevelForm.ratePerMonth,
        });
        alert('✅ Đã thêm vị trí thành công!');
        handleCloseInlineForm();
        const jobRoleLevelsData = await talentJobRoleLevelService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
          const jobRoleLevelInfo = allJobRoleLevels.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
          if (!jobRoleLevelInfo) {
            return { ...jrl, jobRoleLevelName: 'Unknown Level', jobRoleLevelLevel: '—' };
          }
          const levelText = getLevelText(jobRoleLevelInfo.level);
          return { ...jrl, jobRoleLevelName: jobRoleLevelInfo.name || '—', jobRoleLevelLevel: levelText };
        });
        onSuccess(jobRoleLevelsWithNames);
      } catch (err) {
        console.error('❌ Lỗi khi thêm vị trí:', err);
        alert('Không thể thêm vị trí!');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, selectedJobRoleLevelName, selectedLevel, inlineJobRoleLevelForm, handleCloseInlineForm, getLevelText]
  );

  // Delete operations
  const handleDeleteProjects = useCallback(
    async (onSuccess: (projects: any[]) => void) => {
      if (!id) return;
      if (selectedProjects.length === 0) {
        alert('⚠️ Vui lòng chọn dự án để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedProjects.length} dự án đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedProjects.map((projectId) => talentProjectService.deleteById(projectId)));
        alert('✅ Đã xóa dự án thành công!');
        setSelectedProjects([]);
        const projects = await talentProjectService.getAll({ talentId: Number(id), excludeDeleted: true });
        onSuccess(projects);
      } catch (err) {
        console.error('❌ Lỗi khi xóa dự án:', err);
        alert('Không thể xóa dự án!');
      }
    },
    [id, selectedProjects]
  );

  const handleDeleteSkills = useCallback(
    async (
      onSuccess: (skills: (TalentSkill & { skillName: string; skillGroupId?: number })[]) => void,
      onSkillGroupStatusUpdate?: (statuses: Record<number, SkillGroupVerificationStatus>) => void
    ) => {
      if (!id) return;
      if (selectedSkills.length === 0) {
        alert('⚠️ Vui lòng chọn kỹ năng để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedSkills.length} kỹ năng đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedSkills.map((skillId) => talentSkillService.deleteById(skillId)));
        alert('✅ Đã xóa kỹ năng thành công!');
        setSelectedSkills([]);
        const skills = await talentSkillService.getAll({ talentId: Number(id), excludeDeleted: true });
        const allSkills = await skillService.getAll();
        const skillsWithNames = skills.map((skill: TalentSkill) => {
          const skillInfo = allSkills.find((s: Skill) => s.id === skill.skillId);
          return { ...skill, skillName: skillInfo?.name ?? 'Unknown Skill', skillGroupId: skillInfo?.skillGroupId };
        });
        onSuccess(skillsWithNames);

        // Refresh skill group status if callback provided
        if (onSkillGroupStatusUpdate) {
          const distinctSkillGroupIds = Array.from(
            new Set(skillsWithNames.map((s: any) => s.skillGroupId).filter((gid: number | undefined) => typeof gid === 'number'))
          ) as number[];
          if (distinctSkillGroupIds.length > 0) {
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
                onSkillGroupStatusUpdate(statusMap);
              }
            } catch (statusError) {
              console.error('❌ Lỗi khi refresh trạng thái verify sau khi xóa skill:', statusError);
            }
          }
        }
      } catch (err) {
        console.error('❌ Lỗi khi xóa kỹ năng:', err);
        alert('Không thể xóa kỹ năng!');
      }
    },
    [id, selectedSkills]
  );

  const handleDeleteExperiences = useCallback(
    async (onSuccess: (experiences: any[]) => void) => {
      if (!id) return;
      if (selectedExperiences.length === 0) {
        alert('⚠️ Vui lòng chọn kinh nghiệm để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedExperiences.length} kinh nghiệm đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedExperiences.map((expId) => talentWorkExperienceService.deleteById(expId)));
        alert('✅ Đã xóa kinh nghiệm thành công!');
        setSelectedExperiences([]);
        const experiences = await talentWorkExperienceService.getAll({ talentId: Number(id), excludeDeleted: true });
        onSuccess(experiences);
      } catch (err) {
        console.error('❌ Lỗi khi xóa kinh nghiệm:', err);
        alert('Không thể xóa kinh nghiệm!');
      }
    },
    [id, selectedExperiences]
  );

  const handleDeleteJobRoleLevels = useCallback(
    async (
      onSuccess: (jobRoleLevels: (TalentJobRoleLevel & { jobRoleLevelName: string; jobRoleLevelLevel: string })[]) => void
    ) => {
      if (!id) return;
      if (selectedJobRoleLevels.length === 0) {
        alert('⚠️ Vui lòng chọn vị trí để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedJobRoleLevels.length} vị trí đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedJobRoleLevels.map((jrlId) => talentJobRoleLevelService.deleteById(jrlId)));
        alert('✅ Đã xóa vị trí thành công!');
        setSelectedJobRoleLevels([]);
        const jobRoleLevelsData = await talentJobRoleLevelService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        const jobRoleLevelsWithNames = jobRoleLevelsData.map((jrl: TalentJobRoleLevel) => {
          const jobRoleLevelInfo = allJobRoleLevels.find((j: JobRoleLevel) => j.id === jrl.jobRoleLevelId);
          if (!jobRoleLevelInfo) {
            return { ...jrl, jobRoleLevelName: 'Unknown Level', jobRoleLevelLevel: '—' };
          }
          const levelText = getLevelText(jobRoleLevelInfo.level);
          return { ...jrl, jobRoleLevelName: jobRoleLevelInfo.name || '—', jobRoleLevelLevel: levelText };
        });
        onSuccess(jobRoleLevelsWithNames);
      } catch (err) {
        console.error('❌ Lỗi khi xóa vị trí:', err);
        alert('Không thể xóa vị trí!');
      }
    },
    [id, selectedJobRoleLevels, getLevelText]
  );

  const handleDeleteCertificates = useCallback(
    async (onSuccess: (certificates: (TalentCertificate & { certificateTypeName: string })[]) => void) => {
      if (!id) return;
      if (selectedCertificates.length === 0) {
        alert('⚠️ Vui lòng chọn chứng chỉ để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedCertificates.length} chứng chỉ đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedCertificates.map((certId) => talentCertificateService.deleteById(certId)));
        alert('✅ Đã xóa chứng chỉ thành công!');
        setSelectedCertificates([]);
        const certificatesData = await talentCertificateService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        const allCertificateTypes = await certificateTypeService.getAll();
        const certificatesWithNames = certificatesData.map((cert: TalentCertificate) => {
          const certTypeInfo = allCertificateTypes.find((c: CertificateType) => c.id === cert.certificateTypeId);
          return { ...cert, certificateTypeName: certTypeInfo?.name ?? 'Unknown Certificate' };
        });
        onSuccess(certificatesWithNames);
      } catch (err) {
        console.error('❌ Lỗi khi xóa chứng chỉ:', err);
        alert('Không thể xóa chứng chỉ!');
      }
    },
    [id, selectedCertificates]
  );

  const handleDeleteAvailableTimes = useCallback(
    async (onSuccess: (availableTimes: TalentAvailableTime[]) => void) => {
      if (!id) return;
      if (selectedAvailableTimes.length === 0) {
        alert('⚠️ Vui lòng chọn thời gian để xóa!');
        return;
      }
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa ${selectedAvailableTimes.length} thời gian đã chọn?`);
      if (!confirm) return;
      try {
        await Promise.all(selectedAvailableTimes.map((timeId) => talentAvailableTimeService.deleteById(timeId)));
        alert('✅ Đã xóa thời gian thành công!');
        setSelectedAvailableTimes([]);
        const availableTimesData = await talentAvailableTimeService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });
        onSuccess(availableTimesData);
      } catch (err) {
        console.error('❌ Lỗi khi xóa thời gian:', err);
        alert('Không thể xóa thời gian!');
      }
    },
    [id, selectedAvailableTimes]
  );

  const handleSubmitInlineAvailableTime = useCallback(
    async (onSuccess: (availableTimes: TalentAvailableTime[]) => void) => {
      if (!id || isSubmitting) return;

      // Validate startTime
      if (!inlineAvailableTimeForm.startTime) {
        setAvailableTimeFormErrors({ startTime: '⚠️ Vui lòng nhập thời gian bắt đầu!' });
        return;
      }

      // Validate startTime hợp lý
      const validateStartTime = (dateTime: string): boolean => {
        if (!dateTime) return false;
        const startDateTime = new Date(dateTime);
        const now = new Date();
        return startDateTime > now;
      };

      if (!validateStartTime(inlineAvailableTimeForm.startTime)) {
        setAvailableTimeFormErrors({ startTime: '⚠️ Thời gian bắt đầu phải nằm trong tương lai.' });
        return;
      }

      // Validate endTime hợp lý
      const validateEndTime = (startDateTime: string, endDateTime: string | undefined): boolean => {
        if (!endDateTime) return true;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        return end > start;
      };

      if (inlineAvailableTimeForm.endTime && !validateEndTime(inlineAvailableTimeForm.startTime, inlineAvailableTimeForm.endTime)) {
        setAvailableTimeFormErrors({ endTime: '⚠️ Thời gian kết thúc phải sau thời gian bắt đầu.' });
        return;
      }

      try {
        setIsSubmitting(true);
        setAvailableTimeFormErrors({});

        const newStart = new Date(inlineAvailableTimeForm.startTime!);
        const newEnd = inlineAvailableTimeForm.endTime ? new Date(inlineAvailableTimeForm.endTime) : undefined;

        // Kiểm tra trùng lặp với các slot đã có
        const existingTimes = await talentAvailableTimeService.getAll({
          talentId: Number(id),
          excludeDeleted: true,
        });

        const findOverlappingSlot = (existing: TalentAvailableTime[], newStart: Date, newEnd?: Date) => {
          const effectiveNewEnd = newEnd ?? new Date(8640000000000000);
          for (const slot of existing) {
            const slotStart = new Date(slot.startTime);
            const slotEnd = slot.endTime ? new Date(slot.endTime) : new Date(8640000000000000);
            if (newStart < slotEnd && slotStart < effectiveNewEnd) {
              return slot;
            }
          }
          return null;
        };

        const formatDateTime = (value?: string) => {
          if (!value) return 'Không xác định';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return 'Không xác định';
          return date.toLocaleString('vi-VN', { hour12: false });
        };

        const formatRange = (slot: TalentAvailableTime) => {
          const start = formatDateTime(slot.startTime);
          const end = slot.endTime ? formatDateTime(slot.endTime) : 'Không xác định';
          return `${start} - ${end}`;
        };

        if (Array.isArray(existingTimes)) {
          const overlappingSlot = findOverlappingSlot(existingTimes, newStart, newEnd);
          if (overlappingSlot) {
            setAvailableTimeFormErrors({
              startTime: `⚠️ Khung giờ này trùng với khoảng đã có: ${formatRange(overlappingSlot)}. Vui lòng chọn khung khác.`,
            });
            setIsSubmitting(false);
            return;
          }
        }

        // Convert datetime-local to UTC ISO string for PostgreSQL
        await talentAvailableTimeService.create({
          talentId: Number(id),
          startTime: newStart.toISOString(),
          endTime: newEnd ? newEnd.toISOString() : undefined,
          notes: inlineAvailableTimeForm.notes || '',
        });
        alert('✅ Đã thêm thời gian thành công!');
        handleCloseInlineForm();
        setAvailableTimeFormErrors({});
        // Refresh data
        const availableTimesData = await talentAvailableTimeService.getAll({ talentId: Number(id), excludeDeleted: true });
        onSuccess(availableTimesData);
      } catch (err) {
        console.error('❌ Lỗi khi thêm thời gian:', err);
        setAvailableTimeFormErrors({ submit: 'Không thể thêm thời gian!' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, isSubmitting, inlineAvailableTimeForm, handleCloseInlineForm]
  );

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

  const handleDeleteCVs = useCallback(
    async (
      talentCVs: (TalentCV & { jobRoleLevelName?: string })[],
      onSuccess: (cvs: (TalentCV & { jobRoleLevelName?: string })[]) => void
    ) => {
      if (!id) return;
      if (selectedCVs.length === 0) {
        alert('⚠️ Vui lòng chọn CV để xóa!');
        return;
      }

      const activeCVs = talentCVs.filter((cv) => selectedCVs.includes(cv.id) && cv.isActive);
      if (activeCVs.length > 0) {
        alert('⚠️ Không thể xóa các CV đang hoạt động. Vui lòng bỏ chọn hoặc hủy kích hoạt trước khi xóa.');
        setSelectedCVs((prev) => prev.filter((id) => !activeCVs.some((cv) => cv.id === id)));
        return;
      }

      const deletableCVIds = selectedCVs.filter((id) => {
        const cv = talentCVs.find((item) => item.id === id);
        return cv && !cv.isActive;
      });

      if (deletableCVIds.length === 0) {
        alert('⚠️ Không có CV nào hợp lệ để xóa.');
        return;
      }

      const confirm = window.confirm(
        `⚠️ Bạn có chắc muốn xóa ${selectedCVs.length} CV đã chọn?\n\nFile CV trên Firebase Storage cũng sẽ bị xóa vĩnh viễn.`
      );
      if (!confirm) return;

      try {
        // Delete files from Firebase first
        const cvsToDelete = talentCVs.filter((cv) => deletableCVIds.includes(cv.id));
        const deleteFilePromises = cvsToDelete
          .filter((cv) => cv.cvFileUrl)
          .map(async (cv) => {
            try {
              const firebasePath = extractCVFirebasePath(cv.cvFileUrl!);
              if (firebasePath) {
                const fileRef = ref(storage, firebasePath);
                await deleteObject(fileRef);
              }
            } catch (err) {
              console.error(`❌ Error deleting CV file from Firebase for CV ${cv.id}:`, err);
            }
          });

        await Promise.all(deleteFilePromises);

        // Then delete CVs from database
        await Promise.all(deletableCVIds.map((cvId) => talentCVService.deleteById(cvId)));
        alert('✅ Đã xóa CV và file trên Firebase thành công!');
        setSelectedCVs((prev) => prev.filter((id) => !deletableCVIds.includes(id)));

        // Refresh data
        const cvs = await talentCVService.getAll({ talentId: Number(id), excludeDeleted: true });
        const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true, distinctByName: true });
        const jobRoleLevelsArray = Array.isArray(allJobRoleLevels) ? allJobRoleLevels : [];
        const cvsWithJobRoleLevelNames = cvs.map((cv: TalentCV) => {
          const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: JobRoleLevel) => jrl.id === cv.jobRoleLevelId);
          return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? 'Chưa xác định' };
        });

        // Sort CVs
        const sortedCVs = cvsWithJobRoleLevelNames.sort(
          (a: TalentCV & { jobRoleLevelName?: string }, b: TalentCV & { jobRoleLevelName?: string }) => {
            const nameA = a.jobRoleLevelName || '';
            const nameB = b.jobRoleLevelName || '';
            if (nameA !== nameB) {
              return nameA.localeCompare(nameB);
            }
            if (a.isActive !== b.isActive) {
              return a.isActive ? -1 : 1;
            }
            return (b.version || 0) - (a.version || 0);
          }
        );
        onSuccess(sortedCVs);
      } catch (err) {
        console.error('❌ Lỗi khi xóa CV:', err);
        alert('Không thể xóa CV!');
      }
    },
    [id, selectedCVs, extractCVFirebasePath]
  );

  return {
    // Form states
    showInlineForm,
    isSubmitting,
    setIsSubmitting,
    inlineProjectForm,
    setInlineProjectForm,
    inlineSkillForm,
    setInlineSkillForm,
    inlineCertificateForm,
    setInlineCertificateForm,
    inlineExperienceForm,
    setInlineExperienceForm,
    inlineJobRoleLevelForm,
    setInlineJobRoleLevelForm,
    inlineAvailableTimeForm,
    setInlineAvailableTimeForm,
    inlineCVForm,
    setInlineCVForm,

    // Form errors
    certificateFormErrors,
    setCertificateFormErrors,
    availableTimeFormErrors,
    setAvailableTimeFormErrors,
    cvFormErrors,
    setCvFormErrors,
    cvVersionError,
    setCvVersionError,

    // Selected items
    selectedProjects,
    setSelectedProjects,
    selectedSkills,
    setSelectedSkills,
    selectedExperiences,
    setSelectedExperiences,
    selectedJobRoleLevels,
    setSelectedJobRoleLevels,
    selectedCertificates,
    setSelectedCertificates,
    selectedAvailableTimes,
    setSelectedAvailableTimes,
    selectedCVs,
    setSelectedCVs,

    // Job role level selection
    selectedJobRoleLevelName,
    setSelectedJobRoleLevelName,
    selectedLevel,
    setSelectedLevel,

    // Handlers
    handleOpenInlineForm,
    handleCloseInlineForm,
    handleSubmitInlineProject,
    handleSubmitInlineSkill,
    handleSubmitInlineCertificate,
    handleSubmitInlineExperience,
    handleSubmitInlineJobRoleLevel,
    handleSubmitInlineAvailableTime,
    handleDeleteProjects,
    handleDeleteSkills,
    handleDeleteExperiences,
    handleDeleteJobRoleLevels,
    handleDeleteCertificates,
    handleDeleteAvailableTimes,
    handleDeleteCVs,

    // Certificate file upload
    certificateImageFile,
    setCertificateImageFile,
    uploadingCertificateImage,
    certificateUploadProgress,
    uploadedCertificateUrl,
    setUploadedCertificateUrl,
    handleCertificateImageFileChange,
    handleUploadCertificateImage,
    handleDeleteCertificateImage,

    // Helpers
    getLevelText,
  };
}

