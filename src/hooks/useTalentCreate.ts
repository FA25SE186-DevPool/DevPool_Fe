import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type TalentWithRelatedDataCreateModel,
  type TalentSkillCreateModel,
  type TalentWorkExperienceCreateModel,
  type TalentProjectCreateModel,
  type TalentCertificateCreateModel,
  type TalentJobRoleLevelCreateModel,
  type TalentCVCreateModel,
  talentService,
} from '../services/Talent';
import { useTalentFormData } from './useTalentFormData';
import { useTalentForm } from './useTalentForm';

/**
 * Hook để quản lý logic Create Talent
 * Tách logic từ Create.tsx để dễ quản lý và tái sử dụng
 */
export function useTalentCreate() {
  const navigate = useNavigate();
  const { loading: loadingFormData, ...formDataState } = useTalentFormData();
  const {
    formData: basicFormData,
    formError,
    setFormError,
    updateField: updateBasicField,
    setFormData: _setBasicFormData,
  } = useTalentForm();

  // Related data states
  const [talentSkills, setTalentSkills] = useState<TalentSkillCreateModel[]>([]);
  const [talentWorkExperiences, setTalentWorkExperiences] = useState<TalentWorkExperienceCreateModel[]>([]);
  const [talentProjects, setTalentProjects] = useState<TalentProjectCreateModel[]>([]);
  const [talentCertificates, setTalentCertificates] = useState<TalentCertificateCreateModel[]>([]);
  const [talentJobRoleLevels, setTalentJobRoleLevels] = useState<TalentJobRoleLevelCreateModel[]>([
    {
      jobRoleLevelId: 0, // Sử dụng 0 thay vì undefined để tránh lỗi type
      yearsOfExp: 0,
      ratePerMonth: 0, // Sử dụng 0 thay vì undefined để tránh lỗi type
    },
  ]);
  const [initialCVs, setInitialCVs] = useState<Partial<TalentCVCreateModel>[]>([
    {
      jobRoleLevelId: undefined,
      version: 1,
      cvFileUrl: '',
      isActive: true,
      summary: '',
      isGeneratedFromTemplate: false,
      sourceTemplateId: undefined,
      generatedForJobRequestId: undefined,
    },
  ]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('required');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle change for basic form
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      let numValue: string | number | undefined = value;
      if (name === 'workingMode' || name === 'locationId' || name === 'currentPartnerId') {
        // Không dùng || undefined vì 0 là giá trị hợp lệ cho workingMode
        const parsed = Number(value);
        numValue = isNaN(parsed) ? undefined : parsed;
      }
      updateBasicField(name as keyof typeof basicFormData, numValue);
      // Clear error trong formErrors khi user thay đổi giá trị
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [updateBasicField, basicFormData, formErrors]
  );

  // Validation helper functions
  const validateStartDate = useCallback((date: string): boolean => {
    if (!date) return false;
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date
    return startDate <= today;
  }, []);

  // Validate all required fields (without submitting)
  const validateAllFields = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    // Basic form validation
    if (!basicFormData.fullName || basicFormData.fullName.trim() === '') {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (!basicFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicFormData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!basicFormData.phone || !/^[0-9]{10}$/.test(basicFormData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
    }

    // Validate date of birth only if provided (not required)
    if (basicFormData.dateOfBirth) {
      const birthDate = new Date(basicFormData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      if (calculatedAge < 18 || calculatedAge > 100) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
      }
    }

    // Validate workingMode
    let workingModeValue: number | undefined = undefined;
    
    if (typeof basicFormData.workingMode === 'string') {
      if (basicFormData.workingMode === '' || basicFormData.workingMode === 'undefined' || basicFormData.workingMode === 'null') {
        workingModeValue = undefined;
      } else {
        const parsed = Number(basicFormData.workingMode);
        workingModeValue = isNaN(parsed) ? undefined : parsed;
      }
    } else if (typeof basicFormData.workingMode === 'number') {
      workingModeValue = isNaN(basicFormData.workingMode) ? undefined : basicFormData.workingMode;
    } else {
      workingModeValue = undefined;
    }
    
    // Bắt buộc phải chọn chế độ làm việc (không được là undefined hoặc 0 - WorkingMode.None)
    if (workingModeValue === undefined || workingModeValue === 0) {
      newErrors.workingMode = 'Vui lòng chọn chế độ làm việc';
    }

    // Only validate location when working mode requires it (Hybrid is optional)
    const shouldValidateLocation = () => {
      switch (basicFormData.workingMode) {
        case 1: // Onsite (Tại văn phòng) - Required
          return true;
        case 4: // Hybrid (Kết hợp) - Optional
          return false;
        case 2: // Remote (Từ xa) - Not shown
        case 4: // Flexible (Linh hoạt) - Not shown
        default:
          return false;
      }
    };

    if (shouldValidateLocation() && !basicFormData.locationId) {
      newErrors.locationId = 'Vui lòng chọn khu vực làm việc';
    }

    if (!basicFormData.currentPartnerId) {
      newErrors.currentPartnerId = 'Vui lòng chọn đối tác';
    }

    // Validate CV
    if (initialCVs.length === 0 || !initialCVs[0]) {
      newErrors.cv = 'CV ban đầu là bắt buộc';
    } else {
      const cv = initialCVs[0];
      if (cv.jobRoleLevelId === undefined || cv.jobRoleLevelId === null || cv.jobRoleLevelId === 0 || cv.jobRoleLevelId < 0) {
        newErrors.cv = 'Vị trí công việc là bắt buộc';
      }
    }

    // Validate Skills
    talentSkills.forEach((skill, index) => {
      if (!skill.skillId || skill.skillId === 0) {
        newErrors[`skill_${index}`] = `Kỹ năng #${index + 1}: Vui lòng chọn kỹ năng`;
      }
    });

    // Validate Projects
    talentProjects.forEach((project, index) => {
      if (!project.projectName || project.projectName.trim() === '') {
        newErrors[`project_name_${index}`] = `Dự án #${index + 1}: Vui lòng nhập tên dự án`;
      }
      if (!project.position || project.position.trim() === '') {
        newErrors[`project_position_${index}`] = `Dự án #${index + 1}: Vui lòng nhập vị trí trong dự án`;
      }
    });

    // Validate Work Experiences
    talentWorkExperiences.forEach((exp, index) => {
      if (!exp.company || exp.company.trim() === '') {
        newErrors[`workexp_company_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập công ty`;
      }
      if (!exp.position || exp.position.trim() === '') {
        newErrors[`workexp_position_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập vị trí`;
      }
      if (!exp.startDate || exp.startDate.trim() === '') {
        newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng chọn ngày bắt đầu`;
      } else if (!validateStartDate(exp.startDate)) {
        newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày bắt đầu không hợp lệ (không được sau ngày hiện tại)`;
      }
      if (exp.endDate && exp.endDate.trim() !== '') {
        const startDate = new Date(exp.startDate);
        const endDate = new Date(exp.endDate);
        if (endDate < startDate) {
          newErrors[`workexp_enddate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày kết thúc phải sau ngày bắt đầu`;
        }
      }
    });

    // Validate Job Role Levels
    if (talentJobRoleLevels.length === 0) {
      newErrors.jobRoleLevels = 'Vui lòng thêm ít nhất 1 vị trí';
    } else {
      let hasValidJobRoleLevel = false;
      talentJobRoleLevels.forEach((jrl, index) => {
        if (!jrl.jobRoleLevelId || jrl.jobRoleLevelId === 0) {
          newErrors[`jobrolelevel_${index}`] = `Vị trí & cấp độ #${index + 1}: Vui lòng chọn vị trí & cấp độ`;
        } else {
          hasValidJobRoleLevel = true;
        }
      });
      if (!hasValidJobRoleLevel) {
        newErrors.jobRoleLevels = 'Vui lòng chọn ít nhất 1 vị trí công việc hợp lệ';
      }
    }

    // Validate Certificates
    talentCertificates.forEach((cert, index) => {
      if (!cert.certificateTypeId || cert.certificateTypeId === 0) {
        newErrors[`certificate_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng chọn loại chứng chỉ`;
      }
      if (!cert.certificateName || cert.certificateName.trim() === '') {
        newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng nhập tên chứng chỉ`;
      }
      if (cert.certificateName && cert.certificateName.length > 255) {
        newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Tên chứng chỉ không được vượt quá 255 ký tự`;
      }
      if (cert.certificateDescription && cert.certificateDescription.length > 1000) {
        newErrors[`certificate_description_${index}`] = `Chứng chỉ #${index + 1}: Mô tả chứng chỉ không được vượt quá 1000 ký tự`;
      }
    });

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  }, [
    basicFormData,
    initialCVs,
    talentSkills,
    talentProjects,
    talentWorkExperiences,
    talentJobRoleLevels,
    talentCertificates,
    validateStartDate,
  ]);

  // Handle submit
  // Hàm submit thực tế (không có confirm dialog)
  // Nhận uploadedCVUrl như một tham số tùy chọn để đảm bảo CV URL được truyền vào
  const performSubmit = useCallback(async (uploadedCVUrl?: string | null) => {

      // Validate all required fields
      const newErrors: Record<string, string> = {};

      // Basic form validation
      if (!basicFormData.fullName || basicFormData.fullName.trim() === '') {
        newErrors.fullName = 'Họ và tên là bắt buộc';
      }

      if (!basicFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basicFormData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }

      if (!basicFormData.phone || !/^[0-9]{10}$/.test(basicFormData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số';
      }

      // Validate date of birth only if provided (not required)
      if (basicFormData.dateOfBirth) {
        const birthDate = new Date(basicFormData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
        if (calculatedAge < 18 || calculatedAge > 100) {
          newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
        }
      }

      // Chỉ validate nếu workingMode là undefined, null, hoặc không phải là số hợp lệ
      // WorkingMode.None = 0 là giá trị hợp lệ, không báo lỗi
      // Xử lý cả trường hợp workingMode là string (từ select element)
      let workingModeValue: number | undefined = undefined;
      
      if (typeof basicFormData.workingMode === 'string') {
        // Nếu là string rỗng hoặc không hợp lệ
        if (basicFormData.workingMode === '' || basicFormData.workingMode === 'undefined' || basicFormData.workingMode === 'null') {
          workingModeValue = undefined;
        } else {
          const parsed = Number(basicFormData.workingMode);
          workingModeValue = isNaN(parsed) ? undefined : parsed;
        }
      } else if (typeof basicFormData.workingMode === 'number') {
        // Nếu đã là number, kiểm tra NaN
        workingModeValue = isNaN(basicFormData.workingMode) ? undefined : basicFormData.workingMode;
      } else {
        // undefined hoặc null
        workingModeValue = undefined;
      }
      
      // Bắt buộc phải chọn chế độ làm việc (không được là undefined hoặc 0 - WorkingMode.None)
      if (workingModeValue === undefined || workingModeValue === 0) {
        newErrors.workingMode = 'Vui lòng chọn chế độ làm việc';
      }

      // Only validate location when working mode requires it (Hybrid is optional)
      const shouldValidateLocation = () => {
        switch (basicFormData.workingMode) {
          case 1: // Onsite (Tại văn phòng) - Required
            return true;
          case 4: // Hybrid (Kết hợp) - Optional
            return false;
          case 2: // Remote (Từ xa) - Not shown
          case 4: // Flexible (Linh hoạt) - Not shown
          default:
            return false;
        }
      };

      if (shouldValidateLocation() && !basicFormData.locationId) {
        newErrors.locationId = 'Vui lòng chọn khu vực làm việc';
      }

      if (!basicFormData.currentPartnerId) {
        newErrors.currentPartnerId = 'Vui lòng chọn đối tác';
      }

      // Validation CV - Bắt buộc luôn
      if (initialCVs.length === 0 || !initialCVs[0]) {
        alert('⚠️ Vui lòng thêm CV ban đầu!');
        setFormErrors((prev) => ({ ...prev, cv: 'CV ban đầu là bắt buộc' }));
        return;
      }

      const cv = initialCVs[0];
      // Kiểm tra vị trí công việc: phải là số dương hợp lệ
      if (cv.jobRoleLevelId === undefined || cv.jobRoleLevelId === null || cv.jobRoleLevelId === 0 || cv.jobRoleLevelId < 0) {
        alert('⚠️ Vui lòng chọn vị trí công việc cho CV ban đầu trước khi tạo nhân sự!\n\nCV đã được upload lên Firebase nhưng chưa có vị trí công việc.');
        setFormErrors((prev) => ({ ...prev, cv: 'Vị trí công việc là bắt buộc' }));
        return;
      }
      // Tự động set version = 1 nếu chưa có
      if (!cv.version || cv.version <= 0) {
        setInitialCVs((prev) =>
          prev.map((c, i) => (i === 0 ? { ...c, version: 1 } : c))
        );
      }
      // Không yêu cầu URL nếu có file CV chưa upload (sẽ tự động upload khi tạo nhân sự)

      // Validation cho các trường bắt buộc trong arrays
      // Validate Skills: skillId phải > 0
      talentSkills.forEach((skill, index) => {
        if (!skill.skillId || skill.skillId === 0) {
          newErrors[`skill_${index}`] = `Kỹ năng #${index + 1}: Vui lòng chọn kỹ năng`;
        }
      });

      // Validate Projects: projectName và position bắt buộc
      talentProjects.forEach((project, index) => {
        if (!project.projectName || project.projectName.trim() === '') {
          newErrors[`project_name_${index}`] = `Dự án #${index + 1}: Vui lòng nhập tên dự án`;
        }
        if (!project.position || project.position.trim() === '') {
          newErrors[`project_position_${index}`] = `Dự án #${index + 1}: Vui lòng nhập vị trí trong dự án`;
        }
      });

      // Validate Work Experiences: company, position, startDate bắt buộc
      talentWorkExperiences.forEach((exp, index) => {
        if (!exp.company || exp.company.trim() === '') {
          newErrors[`workexp_company_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập công ty`;
        }
        if (!exp.position || exp.position.trim() === '') {
          newErrors[`workexp_position_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng nhập vị trí`;
        }
        if (!exp.startDate || exp.startDate.trim() === '') {
          newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Vui lòng chọn ngày bắt đầu`;
        } else if (!validateStartDate(exp.startDate)) {
          newErrors[`workexp_startdate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày bắt đầu không hợp lệ (không được sau ngày hiện tại)`;
        }
        // Validate endDate nếu có (phải sau startDate)
        if (exp.endDate && exp.endDate.trim() !== '') {
          const startDate = new Date(exp.startDate);
          const endDate = new Date(exp.endDate);
          if (endDate < startDate) {
            newErrors[`workexp_enddate_${index}`] = `Kinh nghiệm #${index + 1}: Ngày kết thúc phải sau ngày bắt đầu`;
          }
        }
      });

      // Validation Job Role Levels bắt buộc
      if (talentJobRoleLevels.length === 0) {
        alert('⚠️ Vui lòng thêm ít nhất 1 vị trí!');
        return;
      }

      // Validate Job Role Levels: jobRoleLevelId phải > 0
      let hasValidJobRoleLevel = false;
      talentJobRoleLevels.forEach((jrl, index) => {
        if (!jrl.jobRoleLevelId || jrl.jobRoleLevelId === 0) {
          newErrors[`jobrolelevel_${index}`] = `Vị trí & cấp độ #${index + 1}: Vui lòng chọn vị trí & cấp độ`;
        } else {
          hasValidJobRoleLevel = true;
        }
      });

      // Đảm bảo có ít nhất 1 vị trí hợp lệ được chọn
      if (!hasValidJobRoleLevel) {
        alert('⚠️ Vui lòng chọn ít nhất 1 vị trí công việc hợp lệ!');
        setFormErrors(newErrors);
        return;
      }

      // Validate Certificates: certificateTypeId phải > 0, certificateName bắt buộc
      talentCertificates.forEach((cert, index) => {
        if (!cert.certificateTypeId || cert.certificateTypeId === 0) {
          newErrors[`certificate_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng chọn loại chứng chỉ`;
        }
        if (!cert.certificateName || cert.certificateName.trim() === '') {
          newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Vui lòng nhập tên chứng chỉ`;
        }
        if (cert.certificateName && cert.certificateName.length > 255) {
          newErrors[`certificate_name_${index}`] = `Chứng chỉ #${index + 1}: Tên chứng chỉ không được vượt quá 255 ký tự`;
        }
        if (cert.certificateDescription && cert.certificateDescription.length > 1000) {
          newErrors[`certificate_description_${index}`] = `Chứng chỉ #${index + 1}: Mô tả chứng chỉ không được vượt quá 1000 ký tự`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        // Tạo thông báo chi tiết về các lỗi
        const basicErrors = Object.entries(newErrors)
          .filter(([key]) => !key.startsWith('skill_') && !key.startsWith('project_') && !key.startsWith('workexp_') && !key.startsWith('jobrolelevel_') && !key.startsWith('certificate_'))
          .map(([, value]) => value);

        const arrayErrors = Object.values(newErrors).filter(msg =>
          msg.includes('Kỹ năng') || msg.includes('Dự án') || msg.includes('Kinh nghiệm') || msg.includes('Vị trí & cấp độ') || msg.includes('Chứng chỉ')
        );

        let alertMessage = '⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc';
        if (basicErrors.length > 0) {
          alertMessage += '\n\n' + basicErrors.join('\n');
        }
        if (arrayErrors.length > 0) {
          alertMessage += '\n\n' + arrayErrors.slice(0, 5).join('\n'); // Hiển thị tối đa 5 lỗi đầu tiên
          if (arrayErrors.length > 5) {
            alertMessage += `\n... và ${arrayErrors.length - 5} lỗi khác`;
          }
        }
        alert(alertMessage);
        return;
      }

      try {
        setLoading(true);
        setFormError('');

        // Build payload
        // Format work experiences dates to ISO string and add talentId = 0
        const formattedWorkExperiences = talentWorkExperiences.map((exp) => ({
          talentId: 0,
          talentCVId: 0,
          company: exp.company || '',
          position: exp.position || '',
          startDate: exp.startDate ? new Date(exp.startDate + 'T00:00:00.000Z').toISOString() : '',
          endDate: exp.endDate ? new Date(exp.endDate + 'T00:00:00.000Z').toISOString() : undefined,
          description: exp.description || '',
        }));

        // Format certificates dates to ISO string and add talentId = 0
        const formattedCertificates = talentCertificates.map((cert) => ({
          talentId: 0,
          certificateTypeId: cert.certificateTypeId,
          certificateName: cert.certificateName || '',
          certificateDescription: cert.certificateDescription || '',
          issuedDate: cert.issuedDate ? new Date(cert.issuedDate + 'T00:00:00.000Z').toISOString() : undefined,
          isVerified: cert.isVerified ?? false,
          imageUrl: cert.imageUrl || '',
        }));

        // Format projects and add talentId = 0
        const formattedProjects = talentProjects.map((project) => ({
          talentId: 0,
          talentCVId: 0,
          projectName: project.projectName || '',
          position: project.position || '',
          technologies: project.technologies || '',
          description: project.description || '',
        }));

        // Format skills and add talentId = 0
        const formattedSkills = talentSkills
          .filter((s) => s.skillId && s.skillId > 0)
          .map((s) => ({
            talentId: 0,
            skillId: s.skillId,
            level: s.level || 'Beginner',
            yearsExp: s.yearsExp || 0,
          }));

        // Format jobRoleLevels and add talentId = 0
        const formattedJobRoleLevels = talentJobRoleLevels
          .filter((jrl) => jrl.jobRoleLevelId && jrl.jobRoleLevelId > 0)
          .map((jrl) => ({
            talentId: 0,
            jobRoleLevelId: jrl.jobRoleLevelId,
            yearsOfExp: jrl.yearsOfExp || 0,
            ratePerMonth: jrl.ratePerMonth || 0,
          }));

        const payload: TalentWithRelatedDataCreateModel = {
          currentPartnerId: basicFormData.currentPartnerId,
          fullName: basicFormData.fullName || '',
          email: basicFormData.email || '',
          phone: basicFormData.phone || '',
          dateOfBirth: basicFormData.dateOfBirth
            ? new Date(basicFormData.dateOfBirth + 'T00:00:00.000Z').toISOString()
            : undefined,
          bio: basicFormData.bio,
          locationId: basicFormData.locationId,
          workingMode: basicFormData.workingMode,
          githubUrl: basicFormData.githubUrl || '',
          portfolioUrl: basicFormData.portfolioUrl || '',
          status: basicFormData.status || 'Available',
          skills: formattedSkills,
          workExperiences: formattedWorkExperiences,
          projects: formattedProjects,
          certificates: formattedCertificates,
          jobRoleLevels: formattedJobRoleLevels,
          initialCV: initialCVs.length > 0 && initialCVs[0].jobRoleLevelId && initialCVs[0].jobRoleLevelId > 0 && 
            (uploadedCVUrl || initialCVs[0].cvFileUrl) ? {
            jobRoleLevelId: initialCVs[0].jobRoleLevelId,
            version: 1, // Luôn là 1
            cvFileUrl: uploadedCVUrl || initialCVs[0].cvFileUrl || '', // Ưu tiên sử dụng uploadedCVUrl nếu có
            isActive: initialCVs[0].isActive ?? true,
            summary: initialCVs[0].summary || '',
            isGeneratedFromTemplate: initialCVs[0].isGeneratedFromTemplate ?? false,
            sourceTemplateId: initialCVs[0].sourceTemplateId && initialCVs[0].sourceTemplateId > 0 ? initialCVs[0].sourceTemplateId : undefined,
            generatedForJobRequestId: initialCVs[0].generatedForJobRequestId && initialCVs[0].generatedForJobRequestId > 0 ? initialCVs[0].generatedForJobRequestId : undefined,
          } : undefined,
        };

        const result = await talentService.createWithRelatedData(payload);
        console.log('✅ API createWithRelatedData result:', result);
        console.log('✅ Result type:', typeof result);
        console.log('✅ Result keys:', result && typeof result === 'object' ? Object.keys(result) : 'Not an object');
        console.log('✅ Result ID (direct):', result?.id);
        console.log('✅ Result data.id:', result?.data?.id);
        console.log('✅ Result talent.id:', result?.talent?.id);
        return result;
      } catch (err: any) {
        console.error('❌ Lỗi khi tạo nhân sự:', err);
        console.error('❌ Error response:', err?.response);
        console.error('❌ Error data:', err?.response?.data);
        
        // Thu thập thông điệp lỗi từ mọi trường khả dĩ (kể cả objecterror)
        const data = err?.response?.data;
        let combined = '';
        if (typeof data === 'string') {
          combined = data;
        } else if (data && typeof data === 'object') {
          try {
            // Thu thập các field phổ biến
            const candidates: string[] = [];
            const tryPush = (v: unknown) => {
              if (typeof v === 'string' && v) candidates.push(v);
            };
            tryPush((data as any).error);
            tryPush((data as any).message);
            tryPush((data as any).objecterror);
            tryPush((data as any).Objecterror);
            tryPush((data as any).detail);
            tryPush((data as any).title);
            // Nếu có mảng/lỗi chi tiết
            const values = Object.values(data)
              .map((v) => (typeof v === 'string' ? v : ''))
              .filter(Boolean);
            candidates.push(...values);
            combined = candidates.join(' ');
            if (!combined) combined = JSON.stringify(data);
          } catch {
            combined = JSON.stringify(data);
          }
        }
        // Kiểm tra email đã tồn tại - kiểm tra nhiều cách để đảm bảo bắt được tất cả các trường hợp
        // Kiểm tra cả err.message (đã được apiClient interceptor cập nhật) và normalizedMessage
        const normalizedMessage = (err as any)?.normalizedMessage || '';
        const errorText = (combined || err?.message || normalizedMessage || JSON.stringify(data) || '').toLowerCase();
        
        const isEmailExistsError = 
          errorText.includes('email already exists') || 
          errorText.includes('email đã tồn tại') ||
          (errorText.includes('already exists') && errorText.includes('email')) ||
          (errorText.includes('đã tồn tại') && errorText.includes('email')) ||
          (data && typeof data === 'object' && (data as any).objecterror && 
           String((data as any).objecterror).toLowerCase().includes('email') && 
           String((data as any).objecterror).toLowerCase().includes('already exists')) ||
          (normalizedMessage && normalizedMessage.toLowerCase().includes('email') && 
           normalizedMessage.toLowerCase().includes('already exists'));
        
        if (isEmailExistsError) {
          setFormErrors((prev) => ({ ...prev, email: 'Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.' }));
          setFormError('Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
          // Không hiển thị alert ở đây vì apiClient interceptor đã hiển thị rồi
          // Chỉ hiển thị nếu apiClient interceptor chưa hiển thị (kiểm tra bằng cách xem có normalizedMessage không)
          if (!normalizedMessage || !normalizedMessage.toLowerCase().includes('email')) {
            alert('❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
          }
          return; // Dừng lại ngay, không hiển thị alert "Lỗi khi tạo nhân sự!"
        }
        
        // Không set formError để không hiển thị ở đầu trang - chỉ hiển thị alert
        // setFormError(combined || err?.message || 'Không thể tạo nhân sự');
        
        // Kiểm tra lại một lần nữa để đảm bảo không hiển thị alert "Lỗi khi tạo nhân sự!" khi email đã tồn tại
        // (Có thể đã được kiểm tra ở trên nhưng để chắc chắn, kiểm tra lại)
        const finalCheckErrorText = (combined || err?.message || normalizedMessage || JSON.stringify(data) || '').toLowerCase();
        const isEmailExistsErrorFinal = 
          finalCheckErrorText.includes('email already exists') || 
          finalCheckErrorText.includes('email đã tồn tại') ||
          (finalCheckErrorText.includes('already exists') && finalCheckErrorText.includes('email')) ||
          (finalCheckErrorText.includes('đã tồn tại') && finalCheckErrorText.includes('email')) ||
          (data && typeof data === 'object' && (data as any).objecterror && 
           String((data as any).objecterror).toLowerCase().includes('email') && 
           String((data as any).objecterror).toLowerCase().includes('already exists'));
        
        // Nếu là lỗi email đã tồn tại, không hiển thị alert "Lỗi khi tạo nhân sự!"
        if (isEmailExistsErrorFinal) {
          // Đã xử lý ở trên, không cần làm gì thêm
          return;
        }
        
        // Hiển thị lỗi chi tiết hơn (chỉ khi không phải lỗi email đã tồn tại)
        let errorMessage = '❌ Lỗi khi tạo nhân sự!\n\n';
        if (combined) {
          errorMessage += `Chi tiết: ${combined}`;
        } else if (err?.message) {
          errorMessage += `Lỗi: ${err.message}`;
        } else {
          errorMessage += 'Vui lòng kiểm tra lại thông tin đã nhập.';
        }
        
        // Nếu có validation errors từ server
        if (data && typeof data === 'object' && (data as any).errors) {
          const validationErrors = (data as any).errors;
          if (typeof validationErrors === 'object') {
            const errorList = Object.entries(validationErrors)
              .map(([key, value]) => {
                const val = Array.isArray(value) ? value.join(', ') : String(value);
                return `${key}: ${val}`;
              })
              .join('\n');
            errorMessage += '\n\nLỗi validation:\n' + errorList;
          }
        }
        
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
  }, [
    basicFormData,
    validateStartDate,
    talentSkills,
    talentWorkExperiences,
    talentProjects,
    talentCertificates,
    talentJobRoleLevels,
    initialCVs,
    navigate,
    setFormError,
    setFormErrors,
  ]);

  // Hàm handleSubmit với confirm dialog (cho form submit thông thường)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const confirmed = window.confirm('Bạn có chắc chắn muốn tạo nhân sự mới không?');
      if (!confirmed) {
        return;
      }

      // Gọi hàm submit thực tế
      await performSubmit();
    },
    [performSubmit]
  );

  return {
    // Form data
    formData: basicFormData,
    talentSkills,
    talentWorkExperiences,
    talentProjects,
    talentCertificates,
    talentJobRoleLevels,
    initialCVs,

    // Lookup data
    ...formDataState,
    loading: loading || loadingFormData,

    // UI state
    activeTab,
    setActiveTab,
    errors: formErrors,
    formError,

    // Handlers
    handleChange,
    handleSubmit,
    performSubmit, // Export hàm submit không có confirm dialog để gọi sau khi upload CV
    updateBasicField,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    setInitialCVs,
    setErrors: setFormErrors,
    setFormError,
    validateAllFields,
  };
}

