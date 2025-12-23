/**
 * Hook để quản lý CV extraction modal states và handlers trong Create Talent page
 * 
 * Logic này được tách từ Create.tsx để dễ quản lý và bảo trì
 */

import { useState, useCallback } from 'react';
import { type TalentSkillCreateModel, type TalentCreate } from '../services/Talent';
import { type TalentCVCreate } from '../services/TalentCV';
import { useCVExtraction } from './useCVExtraction';
import { uploadFile } from '../utils/firebaseStorage';
import { WorkingMode } from '../constants/WORKING_MODE';
import { type TalentJobRoleLevelCreateModel } from '../services/Talent';

interface UseTalentCreateCVModalProps {
  talentSkills: TalentSkillCreateModel[];
  setTalentSkills: (value: TalentSkillCreateModel[] | ((prev: TalentSkillCreateModel[]) => TalentSkillCreateModel[])) => void;
  setTalentWorkExperiences: (value: any[] | ((prev: any[]) => any[])) => void;
  setTalentProjects: (value: any[] | ((prev: any[]) => any[])) => void;
  setTalentCertificates: (value: any[] | ((prev: any[]) => any[])) => void;
  setTalentJobRoleLevels: (value: any[] | ((prev: any[]) => any[])) => void;
  setInitialCVs: (value: Partial<TalentCVCreate>[] | ((prev: Partial<TalentCVCreate>[]) => Partial<TalentCVCreate>[])) => void;
  updateBasicField: (field: keyof TalentCreate, value: any) => void;
  cvExtraction: ReturnType<typeof useCVExtraction>;
  isUploadedFromFirebase: boolean;
  setIsUploadedFromFirebase: (value: boolean | ((prev: boolean) => boolean)) => void;
  setUploadedCVUrl: (value: string | null | ((prev: string | null) => string | null)) => void;
  initialCVs: Partial<TalentCVCreate>[];
  deleteCVFile: (index: number, url: string, isFirebase?: boolean) => Promise<boolean>;
  onFileChange?: (file: File | null) => void;
}

/**
 * Hook quản lý CV extraction modal
 */
export function useTalentCreateCVModal({
  talentSkills,
  setTalentSkills,
  setTalentWorkExperiences,
  setTalentProjects,
  setTalentCertificates,
  setTalentJobRoleLevels,
  setInitialCVs,
  updateBasicField,
  cvExtraction,
  isUploadedFromFirebase,
  setIsUploadedFromFirebase,
  setUploadedCVUrl,
  initialCVs,
  deleteCVFile,
  onFileChange,
}: UseTalentCreateCVModalProps) {
  // Modal states
  const [showExtractCVModal, setShowExtractCVModal] = useState(false);
  const [useExtractCV, setUseExtractCV] = useState(false);
  const [createCVFromExtract, setCreateCVFromExtract] = useState(false);
  const [modalCVFile, setModalCVFile] = useState<File | null>(null);
  const [modalCVPreviewUrl, setModalCVPreviewUrl] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [showCVViewerModal, setShowCVViewerModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Handle modal file change
  const handleModalFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
      }
      setModalCVFile(file);
      const url = URL.createObjectURL(file);
      setModalCVPreviewUrl(url);
      // Set the main cvFile immediately when file is selected
      setCvFile(file);
      onFileChange?.(file);
    }
  }, [modalCVPreviewUrl, onFileChange]);

  // Handle extract CV from modal
  const handleExtractCVFromModal = useCallback(async () => {
    if (!modalCVFile) {
      alert('Vui lòng chọn file CV trước!');
      return;
    }

    if (isExtracting || cvExtraction.extractingCV) {
      return; // Prevent multiple clicks
    }

    setIsExtracting(true);

    try {
      // Get existing skill IDs to avoid duplicates
      const existingSkillIds = talentSkills.map((s) => s.skillId).filter((id) => id > 0);

      // Extract and process CV
      const result = await cvExtraction.extractAndFillDataFromCV(modalCVFile, existingSkillIds);

      if (!result) {
        setIsExtracting(false);
        return;
      }

    // Fill basic info
    updateBasicField('fullName', result.basicInfo.fullName);
    updateBasicField('email', result.basicInfo.email);
    updateBasicField('phone', result.basicInfo.phone);
    updateBasicField('dateOfBirth', result.basicInfo.dateOfBirth);
    updateBasicField('locationId', result.basicInfo.locationId);
    updateBasicField('workingMode', result.basicInfo.workingMode);
    updateBasicField('githubUrl', result.basicInfo.githubUrl);
    updateBasicField('portfolioUrl', result.basicInfo.portfolioUrl);

    // Fill related data
    setTalentSkills((prev) => [...result.skills, ...prev]);
    setTalentWorkExperiences((prev) => [...result.workExperiences, ...prev]);
    setTalentProjects((prev) => [...result.projects, ...prev]);
    setTalentCertificates((prev) => [...result.certificates, ...prev]);
    setTalentJobRoleLevels((prev) => [...result.jobRoleLevels, ...prev]);

    // If should create CV, upload to Firebase
    if (createCVFromExtract && modalCVFile) {
      try {
        // Find jobRoleLevelId from extracted job role levels
        let jobRoleLevelIdForCV = 0;
        if (result.jobRoleLevels.length > 0) {
          const firstMatchedJRL = result.jobRoleLevels.find((jrl: TalentJobRoleLevelCreateModel) => jrl.jobRoleLevelId > 0);
          if (firstMatchedJRL) {
            jobRoleLevelIdForCV = firstMatchedJRL.jobRoleLevelId;
          }
        }

        // Upload CV to Firebase
        const timestamp = Date.now();
        const sanitizedVersionName = `v1`.replace(/[^a-zA-Z0-9-_]/g, '_');
        const fileExtension = modalCVFile.name.split('.').pop();
        const fileName = `temp_${sanitizedVersionName}_${timestamp}.${fileExtension}`;
        const filePath = `temp-talents/${fileName}`;

        const downloadURL = await uploadFile(modalCVFile, filePath, () => {});

        // Set uploaded state
        setIsUploadedFromFirebase(true);
        setUploadedCVUrl(downloadURL);

        // Update initial CVs
        setInitialCVs((prev) =>
          prev.map((cv, index) =>
            index === 0
              ? {
                  ...cv,
                  jobRoleLevelId: jobRoleLevelIdForCV > 0 ? jobRoleLevelIdForCV : undefined,
                  version: 1,
                  cvFileUrl: downloadURL,
                  summary: result.summary,
                  isActive: true,
                }
              : cv
          )
        );

        // Track uploaded CV
        setCvFile(modalCVFile);
        onFileChange?.(modalCVFile);
        const previewUrl = URL.createObjectURL(modalCVFile);
        setCvPreviewUrl(previewUrl);

        if (jobRoleLevelIdForCV === 0) {
          alert('⚠️ CV đã được upload nhưng chưa có vị trí công việc. Vui lòng chọn vị trí công việc cho CV sau.');
        }
      } catch (uploadError: any) {
        console.error('Lỗi upload CV:', uploadError);
        alert(`⚠️ Đã trích xuất thông tin nhưng không thể upload CV: ${uploadError.message || 'Vui lòng thử lại.'}`);
      }
    }

    // Show success message
    const successMessage = `Trích xuất thông tin CV thành công!${
      result.basicInfo.locationId !== undefined ? `\nĐã tự động chọn khu vực làm việc.` : ''
    }${
      result.basicInfo.workingMode !== WorkingMode.None ? `\nĐã tự động chọn chế độ làm việc.` : ''
    }${result.stats.addedSkillsCount > 0 ? `\nĐã tự động thêm ${result.stats.addedSkillsCount} kỹ năng vào form.` : ''}${
      result.stats.addedWorkExperiencesCount > 0
        ? `\nĐã tự động thêm ${result.stats.addedWorkExperiencesCount} kinh nghiệm làm việc vào form.`
        : ''
    }${result.stats.addedProjectsCount > 0 ? `\nĐã tự động thêm ${result.stats.addedProjectsCount} dự án vào form.` : ''}${
      result.stats.addedCertificatesCount > 0
        ? `\nĐã tự động thêm ${result.stats.addedCertificatesCount} chứng chỉ vào form (chỉ những chứng chỉ đã match được loại chứng chỉ trong hệ thống).`
        : ''
    }${
      result.stats.unmatchedCertificatesCount > 0
        ? `\n⚠️ Có ${result.stats.unmatchedCertificatesCount} chứng chỉ không match được loại chứng chỉ trong hệ thống, không được tự động thêm vào form. Xem phần "Cảnh báo" để gửi đề xuất thêm loại chứng chỉ.`
        : ''
    }${
      result.stats.addedJobRoleLevelsCount > 0
        ? `\nĐã tự động thêm ${result.stats.addedJobRoleLevelsCount} vị trí công việc vào form.`
        : ''
    }${createCVFromExtract ? `\n✅ Đã tạo CV và upload lên Firebase.` : ''}`;
    alert(successMessage);

    // Copy file and preview URL to main page
    setCvFile(modalCVFile);
    onFileChange?.(modalCVFile);
    if (modalCVPreviewUrl) {
      const newPreviewUrl = URL.createObjectURL(modalCVFile);
      setCvPreviewUrl(newPreviewUrl);
      URL.revokeObjectURL(modalCVPreviewUrl);
    } else {
      const newPreviewUrl = URL.createObjectURL(modalCVFile);
      setCvPreviewUrl(newPreviewUrl);
    }

      // Close modal and reset
      setShowExtractCVModal(false);
      setModalCVFile(null);
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
        setModalCVPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error in handleExtractCVFromModal:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [
    modalCVFile,
    talentSkills,
    cvExtraction,
    updateBasicField,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    createCVFromExtract,
    setInitialCVs,
    modalCVPreviewUrl,
    isExtracting,
  ]);

  // Handle checkbox change for useExtractCV
  const handleUseExtractCVChange = useCallback(async (checked: boolean) => {
    if (checked) {
      setUseExtractCV(true);
      setShowExtractCVModal(true);
    } else {
      if (cvExtraction.extractedData) {
        const confirmed = window.confirm(
          '⚠️ Bạn có chắc chắn muốn bỏ trích xuất CV?\n\nTất cả dữ liệu đã trích xuất sẽ bị xóa.\n\nBạn có muốn tiếp tục không?'
        );
        if (!confirmed) return;

        // Xóa file CV từ Firebase nếu đã upload
        if (isUploadedFromFirebase && initialCVs[0]?.cvFileUrl) {
          try {
            await deleteCVFile(0, initialCVs[0].cvFileUrl, true);
          } catch (error) {
            console.error('Lỗi khi xóa file CV từ Firebase:', error);
          }
        }

        // Xóa tất cả dữ liệu đã điền từ CV extraction
        // Reset basic info về giá trị mặc định
        updateBasicField('fullName', '');
        updateBasicField('email', '');
        updateBasicField('phone', '');
        updateBasicField('dateOfBirth', '');
        updateBasicField('locationId', undefined);
        updateBasicField('workingMode', 0); // WorkingMode.None
        updateBasicField('githubUrl', '');
        updateBasicField('portfolioUrl', '');

        // Xóa tất cả skills, work experiences, projects, certificates, job role levels
        setTalentSkills([]);
        setTalentWorkExperiences([]);
        setTalentProjects([]);
        setTalentCertificates([]);
        setTalentJobRoleLevels([
          {
            jobRoleLevelId: 0,
            yearsOfExp: 0,
            ratePerMonth: undefined,
          },
        ]);

        // Reset CV extraction data
        cvExtraction.setUnmatchedData({});
        // Reset extractedData bằng cách set null (nếu hook hỗ trợ)
        if (cvExtraction.setExtractedData) {
          cvExtraction.setExtractedData(null);
        }
      }

      setUseExtractCV(false);
      setShowExtractCVModal(false);
      setIsUploadedFromFirebase(false);
      setUploadedCVUrl(null);
      setModalCVFile(null);
      setCvFile(null);
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
        setModalCVPreviewUrl(null);
      }
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
        setCvPreviewUrl(null);
      }
      setInitialCVs([
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
    }
  }, [
    cvExtraction,
    isUploadedFromFirebase,
    initialCVs,
    deleteCVFile,
    modalCVPreviewUrl,
    cvPreviewUrl,
    setInitialCVs,
    updateBasicField,
    setTalentSkills,
    setTalentWorkExperiences,
    setTalentProjects,
    setTalentCertificates,
    setTalentJobRoleLevels,
    setIsUploadedFromFirebase,
    setUploadedCVUrl,
  ]);

  return {
    // States
    showExtractCVModal,
    setShowExtractCVModal,
    useExtractCV,
    setUseExtractCV,
    createCVFromExtract,
    setCreateCVFromExtract,
    modalCVFile,
    setModalCVFile,
    modalCVPreviewUrl,
    setModalCVPreviewUrl,
    cvFile,
    setCvFile,
    cvPreviewUrl,
    setCvPreviewUrl,
    showCVViewerModal,
    setShowCVViewerModal,
    isExtracting,
    
    // Handlers
    handleModalFileChange,
    handleExtractCVFromModal,
    handleUseExtractCVChange,
  };
}

