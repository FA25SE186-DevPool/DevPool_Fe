/**
 * Hook để quản lý logic CV form trong Talent Detail page
 * 
 * Logic này được tách từ Detail.tsx để dễ quản lý và bảo trì
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { talentCVService, type TalentCV } from '../services/TalentCV';
import { type TalentCVCreate, type CVAnalysisComparisonResponse } from '../services/TalentCV';
import { uploadTalentCV } from '../utils/firebaseStorage';
import { saveFileToIndexedDB, deleteFileFromIndexedDB } from '../utils/indexedDBStorage';
import { type JobRoleLevel } from '../services/JobRoleLevel';
import { normalizeJobRoleKey } from '../utils/talentHelpers';

interface UseTalentDetailCVFormProps {
  inlineCVForm: Partial<TalentCVCreate>;
  setInlineCVForm: (form: Partial<TalentCVCreate> | ((prev: Partial<TalentCVCreate>) => Partial<TalentCVCreate>)) => void;
  cvFormErrors: Record<string, string>;
  setCvFormErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  cvVersionError: string;
  setCvVersionError: (error: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  lookupJobRoleLevels: JobRoleLevel[];
  analysisResult: CVAnalysisComparisonResponse | null;
  onRefreshCVs: () => Promise<void>;
  onCloseForm: () => void;
  canEdit: boolean;
  // For handleConfirmInlineCVAnalysis
  jobRoleLevelSystemMap?: Map<string, JobRoleLevel>;
  setAnalysisResult?: (result: CVAnalysisComparisonResponse | null) => void;
  setAnalysisResultCVId?: (cvId: number | null) => void;
  analysisResultStorageKey?: string | null;
}

/**
 * Validate CV version
 */
const validateCVVersion = (version: number, jobRoleLevelId: number, existingCVsList: TalentCV[]): string => {
  if (version <= 0) {
    return "Version phải lớn hơn 0";
  }
  
  if (jobRoleLevelId === 0) {
    return "";
  }
  
  // Nếu chưa có CV nào cho jobRoleLevelId này, chỉ cho phép version = 1
  if (existingCVsList.length === 0) {
    if (version !== 1) {
      return "Chưa có CV nào cho vị trí công việc này. Vui lòng tạo version 1 trước.";
    }
    return "";
  }
  
  // Tìm version cao nhất trong danh sách CV hiện có
  const maxVersion = Math.max(...existingCVsList.map((cv: TalentCV) => cv.version || 0));
  
  // Kiểm tra trùng với các CV cùng jobRoleLevelId
  const duplicateCV = existingCVsList.find((cv: TalentCV) => cv.version === version);
  
  if (duplicateCV) {
    const suggestedVersion = maxVersion + 1;
    return `Version ${version} đã tồn tại cho vị trí công việc này. Vui lòng chọn version khác (ví dụ: ${suggestedVersion}).`;
  }
  
  // Kiểm tra version phải lớn hơn version cao nhất đã tồn tại
  if (version <= maxVersion) {
    const suggestedVersion = maxVersion + 1;
    return `Version ${version} không hợp lệ. Version phải lớn hơn version cao nhất hiện có (${maxVersion}). Vui lòng chọn version ${suggestedVersion} hoặc cao hơn.`;
  }
  
  return "";
};

/**
 * Extract Firebase path from URL
 */
const extractCVFirebasePath = (url: string): string | null => {
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
};

/**
 * Helper function to check if values are different
 */
const isValueDifferent = (current: string | null | undefined, suggested: string | null | undefined): boolean => {
  const currentVal = (current ?? "").trim();
  const suggestedVal = (suggested ?? "").trim();
  return currentVal !== suggestedVal && suggestedVal !== "";
};

export function useTalentDetailCVForm({
  inlineCVForm,
  setInlineCVForm,
  cvFormErrors,
  setCvFormErrors,
  cvVersionError,
  setCvVersionError,
  isSubmitting,
  setIsSubmitting,
  lookupJobRoleLevels,
  analysisResult,
  onRefreshCVs,
  onCloseForm,
  canEdit,
  jobRoleLevelSystemMap,
  setAnalysisResult,
  setAnalysisResultCVId,
  analysisResultStorageKey,
}: UseTalentDetailCVFormProps) {
  const { id } = useParams<{ id: string }>();

  // CV file states
  const [selectedCVFile, setSelectedCVFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUploadProgress, setCvUploadProgress] = useState<number>(0);
  const [isCVUploadedFromFirebase, setIsCVUploadedFromFirebase] = useState(false);
  const [uploadedCVUrl, setUploadedCVUrl] = useState<string | null>(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  
  // CV analysis states
  const [extractingCV, setExtractingCV] = useState(false);
  const [inlineCVAnalysisResult, setInlineCVAnalysisResult] = useState<CVAnalysisComparisonResponse | null>(null);
  const [showInlineCVAnalysisModal, setShowInlineCVAnalysisModal] = useState(false);
  const [showCVFullForm, setShowCVFullForm] = useState(false);
  
  // Validation states
  const [existingCVsForValidation, setExistingCVsForValidation] = useState<TalentCV[]>([]);

  // Storage keys
  const CV_FORM_STORAGE_KEY = id ? `talent-detail-cv-form-${id}` : null;
  const CV_FILE_STORAGE_KEY = id ? `talent-detail-cv-file-${id}` : null;

  // Handle CV file select
  const handleCVFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CV_FILE_STORAGE_KEY) {
      setSelectedCVFile(file);
      setCvFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.file;
        return newErrors;
      });
      const url = URL.createObjectURL(file);
      setCvPreviewUrl(url);
      
      // Lưu file vào IndexedDB để khôi phục sau khi reload
      try {
        await saveFileToIndexedDB(CV_FILE_STORAGE_KEY, file);
      } catch (error) {
        console.warn("⚠️ Không thể lưu file vào IndexedDB:", error);
      }
    }
  }, [CV_FILE_STORAGE_KEY, setCvFormErrors]);

  // Handle CV analysis
  const handleAnalyzeCV = useCallback(async () => {
    if (!selectedCVFile) {
      alert("Vui lòng chọn file CV trước!");
      return;
    }

    if (!id) {
      alert("⚠️ Không tìm thấy ID nhân sự để phân tích CV.");
      return;
    }
    
    if (!canEdit) {
      alert("Bạn không có quyền phân tích CV. Chỉ TA đang quản lý nhân sự này mới được phân tích CV.");
      return;
    }

    // Nếu đã có kết quả phân tích CV, thông báo và hủy phân tích hiện tại trước
    if (analysisResult) {
      const confirmed = window.confirm(
        "⚠️ ĐANG CÓ KẾT QUẢ PHÂN TÍCH CV HIỆN TẠI\n\n" +
        "Hệ thống sẽ hủy kết quả phân tích CV hiện tại và phân tích file CV mới.\n\n" +
        "Bạn có muốn tiếp tục không?"
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setExtractingCV(true);
      setCvFormErrors({});
      
      const result = await talentCVService.analyzeCVForUpdate(Number(id), selectedCVFile);
      
      setInlineCVAnalysisResult(result);
      setShowInlineCVAnalysisModal(true);
      
      // Tự động điền summary từ kết quả phân tích nếu có
      if (result && !inlineCVForm.summary) {
        const summaryParts: string[] = [];
        if (result.basicInfo.suggested.fullName) {
          summaryParts.push(`Tên: ${result.basicInfo.suggested.fullName}`);
        }
        if (result.skills && result.skills.newFromCV.length > 0) {
          const skills = result.skills.newFromCV.slice(0, 5).map((s: any) => s.skillName).join(', ');
          summaryParts.push(`Kỹ năng: ${skills}`);
        }
        if (summaryParts.length > 0) {
          setInlineCVForm(prev => ({ ...prev, summary: summaryParts.join('. ') + '.' }));
        }
      }
      
    } catch (error) {
      console.error("❌ Lỗi phân tích CV:", error);
      const message = (error as { message?: string }).message ?? "Không thể phân tích CV";
      setCvFormErrors({ submit: `❌ ${message}` });
      alert(`❌ ${message}`);
    } finally {
      setExtractingCV(false);
    }
  }, [selectedCVFile, id, canEdit, analysisResult, setCvFormErrors, inlineCVForm.summary, setInlineCVForm]);

  // Handle delete CV file
  const handleDeleteCVFile = useCallback(async () => {
    const currentUrl = inlineCVForm.cvFileUrl;
    if (!currentUrl) {
      return;
    }

    if (!uploadedCVUrl || uploadedCVUrl !== currentUrl) {
      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);
      return;
    }

    const confirmed = window.confirm(
      "⚠️ Bạn có chắc chắn muốn xóa file CV này?\n\n" +
      "File sẽ bị xóa vĩnh viễn khỏi Firebase Storage.\n\n" +
      "Bạn có muốn tiếp tục không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const firebasePath = extractCVFirebasePath(currentUrl);
      if (firebasePath) {
        const fileRef = ref(storage, firebasePath);
        await deleteObject(fileRef);
      }

      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);

      alert("✅ Đã xóa file CV thành công!");
    } catch (err: any) {
      console.error("❌ Error deleting CV file:", err);
      setInlineCVForm(prev => ({ ...prev, cvFileUrl: "" }));
      setUploadedCVUrl(null);
      setIsCVUploadedFromFirebase(false);
      alert("⚠️ Đã xóa URL khỏi form, nhưng có thể không xóa được file trong Firebase. Vui lòng kiểm tra lại.");
    }
  }, [inlineCVForm.cvFileUrl, uploadedCVUrl, setInlineCVForm]);

  // Handle CV file upload
  const handleCVFileUpload = useCallback(async () => {
    if (!selectedCVFile) {
      setCvFormErrors({ file: "⚠️ Vui lòng chọn file trước khi upload." });
      return;
    }

    if (!inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
      setCvFormErrors({ jobRoleLevelId: "⚠️ Vui lòng chọn vị trí công việc trước khi upload lên Firebase." });
      return;
    }

    if (!inlineCVForm.version || inlineCVForm.version <= 0) {
      setCvFormErrors({ version: "⚠️ Vui lòng nhập version CV trước khi upload." });
      return;
    }

    if (existingCVsForValidation.length > 0) {
      const versionErrorMsg = validateCVVersion(inlineCVForm.version, inlineCVForm.jobRoleLevelId, existingCVsForValidation);
      if (versionErrorMsg) {
        setCvVersionError(versionErrorMsg);
        setCvFormErrors({ version: "⚠️ " + versionErrorMsg });
        return;
      }
    }

    if (!id) {
      setCvFormErrors({ submit: "⚠️ Không tìm thấy ID nhân sự." });
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn upload file "${selectedCVFile.name}" lên Firebase không?\n\n` +
      `Version: ${inlineCVForm.version}\n` +
      `Kích thước file: ${(selectedCVFile.size / 1024).toFixed(2)} KB`
    );
    
    if (!confirmed) {
      return;
    }

    setUploadingCV(true);
    setCvFormErrors({});
    setCvUploadProgress(0);

    try {
      const downloadURL = await uploadTalentCV(
        selectedCVFile,
        Number(id),
        `v${inlineCVForm.version}`,
        (progress) => setCvUploadProgress(progress)
      );

      setInlineCVForm(prev => ({ ...prev, cvFileUrl: downloadURL }));
      setIsCVUploadedFromFirebase(true);
      setUploadedCVUrl(downloadURL);
    } catch (err: any) {
      console.error("❌ Error uploading CV file:", err);
      setCvFormErrors({ submit: err.message || "Không thể upload file. Vui lòng thử lại." });
    } finally {
      setUploadingCV(false);
      setCvUploadProgress(0);
    }
  }, [selectedCVFile, inlineCVForm.jobRoleLevelId, inlineCVForm.version, existingCVsForValidation, id, setCvFormErrors, setCvVersionError, setInlineCVForm]);

  // Fetch CVs by jobRoleLevelId for validation
  useEffect(() => {
    const fetchCVsForValidation = async () => {
      if (!id || !inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
        setExistingCVsForValidation([]);
        setCvVersionError("");
        return;
      }
      try {
        const cvs = await talentCVService.getAll({ 
          talentId: Number(id), 
          jobRoleLevelId: inlineCVForm.jobRoleLevelId,
          excludeDeleted: true 
        });
        setExistingCVsForValidation(cvs || []);
      } catch (error) {
        console.error("❌ Error loading CVs for validation", error);
        setExistingCVsForValidation([]);
      }
    };
    fetchCVsForValidation();
  }, [id, inlineCVForm.jobRoleLevelId]);

  // Auto-set version and validate when existingCVsForValidation changes
  useEffect(() => {
    const jobRoleLevelId = inlineCVForm.jobRoleLevelId || 0;
    if (jobRoleLevelId > 0 && existingCVsForValidation.length === 0) {
      // Chưa có CV nào cho jobRoleLevelId này - chỉ cho phép version 1
      if (inlineCVForm.version !== 1) {
        setInlineCVForm(prev => ({ ...prev, version: 1 }));
      }
      setCvVersionError("");
    } else if (inlineCVForm.version && inlineCVForm.version > 0 && jobRoleLevelId > 0 && existingCVsForValidation.length > 0) {
      // Đã có CV - validate version
      const error = validateCVVersion(inlineCVForm.version, jobRoleLevelId, existingCVsForValidation);
      setCvVersionError(error);
    } else if (jobRoleLevelId === 0) {
      // Chưa chọn jobRoleLevelId - clear error
      setCvVersionError("");
    }
  }, [existingCVsForValidation, inlineCVForm.jobRoleLevelId, inlineCVForm.version, setInlineCVForm, setCvVersionError]);

  // Handle confirm inline CV analysis
  const handleConfirmInlineCVAnalysis = useCallback(() => {
    if (!inlineCVAnalysisResult) return;
    
    // Tạo danh sách các trường khác nhau
    const differences: string[] = [];
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.fullName, inlineCVAnalysisResult.basicInfo.suggested.fullName)) {
      differences.push(`• Họ tên: "${inlineCVAnalysisResult.basicInfo.current.fullName ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.fullName ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.email, inlineCVAnalysisResult.basicInfo.suggested.email)) {
      differences.push(`• Email: "${inlineCVAnalysisResult.basicInfo.current.email ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.email ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.phone, inlineCVAnalysisResult.basicInfo.suggested.phone)) {
      differences.push(`• Điện thoại: "${inlineCVAnalysisResult.basicInfo.current.phone ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.phone ?? "—"}"`);
    }
    if (isValueDifferent(inlineCVAnalysisResult.basicInfo.current.locationName, inlineCVAnalysisResult.basicInfo.suggested.locationName)) {
      differences.push(`• Nơi ở: "${inlineCVAnalysisResult.basicInfo.current.locationName ?? "—"}" → "${inlineCVAnalysisResult.basicInfo.suggested.locationName ?? "—"}"`);
    }
    
    let confirmMessage = "⚠️ PHÁT HIỆN THÔNG TIN KHÁC NHAU:\n\n";
    
    if (differences.length > 0) {
      confirmMessage += differences.join("\n") + "\n\n";
    }
    
    confirmMessage += "Bạn có chắc chắn muốn xem các gợi ý phân tích ở các tab khác không?\n\n";
    confirmMessage += "Hệ thống sẽ hiển thị các gợi ý ở các tab:\n";
    confirmMessage += "• Kỹ năng\n";
    confirmMessage += "• Vị trí\n";
    confirmMessage += "• Chứng chỉ\n";
    confirmMessage += "• Dự án\n";
    confirmMessage += "• Kinh nghiệm\n\n";
    confirmMessage += "Form tạo CV sẽ được tự động điền với dữ liệu từ phân tích.\n\n";
    confirmMessage += "Bạn có muốn tiếp tục không?";
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;
    
    // Tự động điền form CV từ dữ liệu phân tích
    // 1. Tự động chọn jobRoleLevel từ gợi ý phân tích (nếu có)
    let autoSelectedJobRoleLevelId: number | undefined = undefined;
    if (inlineCVAnalysisResult.jobRoleLevels?.newFromCV && inlineCVAnalysisResult.jobRoleLevels.newFromCV.length > 0 && jobRoleLevelSystemMap) {
      // Tính toán jobRoleLevelComparisons từ inlineCVAnalysisResult
      const cvKeys = new Set<string>();
      const recognized: Array<{ suggestion: any; system: JobRoleLevel }> = [];
      
      inlineCVAnalysisResult.jobRoleLevels.newFromCV.forEach((suggestion) => {
        const key = normalizeJobRoleKey(suggestion.position, suggestion.level);
        if (key === "|") return;
        cvKeys.add(key);
        
        const system = jobRoleLevelSystemMap.get(key);
        if (system) {
          recognized.push({ suggestion, system });
        }
      });
      
      // Lấy jobRoleLevel đầu tiên từ recognized (có trong hệ thống)
      if (recognized.length > 0) {
        autoSelectedJobRoleLevelId = recognized[0].system.id;
      } else {
        // Nếu không tìm thấy trong recognized, thử tìm theo position gần đúng
        const firstSuggestion = inlineCVAnalysisResult.jobRoleLevels.newFromCV[0];
        if (firstSuggestion.position) {
          const normalizedPosition = (firstSuggestion.position ?? "").trim().toLowerCase();
          // Tìm jobRoleLevel có tên gần giống với position
          const matchedJobRoleLevel = lookupJobRoleLevels.find((jrl) => {
            const normalizedName = (jrl.name ?? "").trim().toLowerCase();
            return normalizedName.includes(normalizedPosition) || normalizedPosition.includes(normalizedName);
          });
          if (matchedJobRoleLevel) {
            autoSelectedJobRoleLevelId = matchedJobRoleLevel.id;
          }
        }
      }
    }
    
    // 2. Tự động điền summary từ dữ liệu phân tích
    const summaryParts: string[] = [];
    if (inlineCVAnalysisResult.basicInfo.suggested.fullName) {
      summaryParts.push(`Tên: ${inlineCVAnalysisResult.basicInfo.suggested.fullName}`);
    }
    if (inlineCVAnalysisResult.skills && inlineCVAnalysisResult.skills.newFromCV.length > 0) {
      const skills = inlineCVAnalysisResult.skills.newFromCV.slice(0, 5).map((s: any) => s.skillName).join(', ');
      summaryParts.push(`Kỹ năng: ${skills}`);
    }
    if (inlineCVAnalysisResult.jobRoleLevels && inlineCVAnalysisResult.jobRoleLevels.newFromCV.length > 0) {
      const positions = inlineCVAnalysisResult.jobRoleLevels.newFromCV.slice(0, 3).map((jrl: any) => jrl.position).filter(Boolean).join(', ');
      if (positions) {
        summaryParts.push(`Vị trí: ${positions}`);
      }
    }
    const autoSummary = summaryParts.length > 0 ? summaryParts.join('. ') + '.' : undefined;
    
    // Cập nhật form CV với dữ liệu tự động điền
    setInlineCVForm(prev => {
      // Ưu tiên điền jobRoleLevelId từ phân tích nếu tìm thấy
      const newJobRoleLevelId = autoSelectedJobRoleLevelId 
        ? autoSelectedJobRoleLevelId 
        : (prev.jobRoleLevelId && prev.jobRoleLevelId !== 0 ? prev.jobRoleLevelId : 0);
      
      return {
        ...prev,
        jobRoleLevelId: newJobRoleLevelId,
        // Chỉ điền summary nếu chưa có
        summary: prev.summary || autoSummary || "",
      };
    });
    
    // Set analysis result để hiển thị gợi ý ở các tab khác
    if (setAnalysisResult) {
      setAnalysisResult(inlineCVAnalysisResult);
    }
    if (setAnalysisResultCVId) {
      setAnalysisResultCVId(null); // Không có CV ID vì đây là file mới
    }
    
    // Lưu kết quả phân tích vào sessionStorage để giữ nguyên khi reload
    if (analysisResultStorageKey) {
      try {
        sessionStorage.setItem(
          analysisResultStorageKey,
          JSON.stringify({ cvId: null, result: inlineCVAnalysisResult })
        );
      } catch (storageError) {
        console.warn("Không thể lưu kết quả phân tích CV:", storageError);
      }
    }
    
    // Đóng modal và hiện form đầy đủ - KHÔNG đóng form, giữ nguyên để user có thể xem lại
    // Giữ file đã chọn (selectedCVFile và cvPreviewUrl) - không cần upload lên Firebase ngay
    setShowInlineCVAnalysisModal(false);
    setShowCVFullForm(true);
    
    // Giữ nguyên tab CV, không tự động chuyển tab
    alert("✅ Đã áp dụng kết quả phân tích! Form tạo CV đã được tự động điền. Vui lòng xem các gợi ý ở các tab tương ứng.");
  }, [
    inlineCVAnalysisResult,
    jobRoleLevelSystemMap,
    lookupJobRoleLevels,
    setInlineCVForm,
    setAnalysisResult,
    setAnalysisResultCVId,
    analysisResultStorageKey,
  ]);

  // Handle cancel inline CV analysis
  const handleCancelInlineCVAnalysis = useCallback(() => {
    // Đóng modal
    setShowInlineCVAnalysisModal(false);
    // Xóa kết quả phân tích
    setInlineCVAnalysisResult(null);
    // Có thể xóa file CV đã chọn nếu user muốn
    // Nhưng để giữ file để user có thể phân tích lại sau
  }, []);

  // Handle submit inline CV
  const handleSubmitInlineCV = useCallback(async () => {
    if (!id || isSubmitting) return;
    
    setCvFormErrors({});

    if (!inlineCVForm.jobRoleLevelId || inlineCVForm.jobRoleLevelId === 0) {
      setCvFormErrors({ jobRoleLevelId: "⚠️ Vui lòng chọn vị trí công việc trước khi tạo." });
      return;
    }

    if (!inlineCVForm.version || inlineCVForm.version <= 0) {
      setCvFormErrors({ version: "⚠️ Vui lòng nhập version CV (phải lớn hơn 0)." });
      return;
    }

    const versionErrorMsg = validateCVVersion(inlineCVForm.version, inlineCVForm.jobRoleLevelId, existingCVsForValidation);
    if (versionErrorMsg) {
      setCvVersionError(versionErrorMsg);
      setCvFormErrors({ version: "⚠️ " + versionErrorMsg });
      return;
    }

    if (!isCVUploadedFromFirebase || !inlineCVForm.cvFileUrl?.trim()) {
      setCvFormErrors({ submit: "⚠️ Vui lòng upload file CV lên Firebase trước khi tạo." });
      return;
    }

    try {
      const url = new URL(inlineCVForm.cvFileUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      setCvFormErrors({ submit: "⚠️ URL file CV không hợp lệ. Vui lòng nhập đường dẫn bắt đầu bằng http hoặc https." });
      return;
    }

    // Kiểm tra nếu có kết quả phân tích CV và có gợi ý chưa được xử lý
    if (analysisResult) {
      const hasBasicInfoChanges = analysisResult.basicInfo?.hasChanges || false;
      const hasNewSkills = (analysisResult.skills?.newFromCV?.length || 0) > 0;
      const hasNewJobRoleLevels = (analysisResult.jobRoleLevels?.newFromCV?.length || 0) > 0;
      const hasNewProjects = (analysisResult.projects?.newEntries?.length || 0) > 0;
      const hasNewCertificates = (analysisResult.certificates?.newFromCV?.length || 0) > 0;
      const hasNewExperiences = (analysisResult.workExperiences?.newEntries?.length || 0) > 0;

      if (hasBasicInfoChanges || hasNewSkills || hasNewJobRoleLevels || hasNewProjects || hasNewCertificates || hasNewExperiences) {
        let warningMessage = "⚠️ CẢNH BÁO\n\n";
        warningMessage += "Bạn đang có kết quả phân tích CV với các gợi ý chưa được xử lý:\n\n";

        const pendingItems: string[] = [];
        if (hasBasicInfoChanges) {
          pendingItems.push("• Thông tin cơ bản có thay đổi");
        }
        if (hasNewSkills) {
          pendingItems.push(`• ${analysisResult.skills.newFromCV.length} kỹ năng mới`);
        }
        if (hasNewJobRoleLevels) {
          pendingItems.push(`• ${analysisResult.jobRoleLevels.newFromCV.length} vị trí mới`);
        }
        if (hasNewProjects) {
          pendingItems.push(`• ${analysisResult.projects.newEntries.length} dự án mới`);
        }
        if (hasNewCertificates) {
          pendingItems.push(`• ${analysisResult.certificates.newFromCV.length} chứng chỉ mới`);
        }
        if (hasNewExperiences) {
          pendingItems.push(`• ${analysisResult.workExperiences.newEntries.length} kinh nghiệm làm việc mới`);
        }

        warningMessage += pendingItems.join("\n");
        warningMessage += "\n\n";
        warningMessage += "Nếu bạn tạo CV này mà chưa xử lý các gợi ý trên, bạn có thể bỏ lỡ thông tin quan trọng từ CV.\n\n";
        warningMessage += "Bạn có chắc chắn muốn tiếp tục tạo CV này không?";

        const confirmed = window.confirm(warningMessage);
        if (!confirmed) {
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      let finalForm: TalentCVCreate = {
        talentId: Number(id),
        jobRoleLevelId: inlineCVForm.jobRoleLevelId!,
        version: inlineCVForm.version!,
        cvFileUrl: inlineCVForm.cvFileUrl!,
        isActive: true,
        summary: inlineCVForm.summary || "",
        isGeneratedFromTemplate: inlineCVForm.isGeneratedFromTemplate || false,
        sourceTemplateId: inlineCVForm.sourceTemplateId,
        generatedForJobRequestId: inlineCVForm.generatedForJobRequestId,
      };
      
      const existingCVs = await talentCVService.getAll({ 
        talentId: Number(id), 
        excludeDeleted: true 
      });
      const activeCVWithSameJobRoleLevel = existingCVs.find(
        (cv: TalentCV) => cv.isActive && cv.jobRoleLevelId === finalForm.jobRoleLevelId
      );

      if (activeCVWithSameJobRoleLevel) {
        const jobRoleLevelName = lookupJobRoleLevels.find(jrl => jrl.id === finalForm.jobRoleLevelId)?.name || "vị trí này";
        const confirmed = window.confirm(
          `⚠️ Bạn đang có CV active với vị trí công việc "${jobRoleLevelName}".\n\n` +
          `CV mới sẽ được set active và CV cũ sẽ bị set inactive.\n\n` +
          `Bạn có chắc chắn muốn upload CV này không?`
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
        await talentCVService.deactivate(activeCVWithSameJobRoleLevel.id);
      } else {
        const confirmed = window.confirm("Bạn có chắc chắn muốn tạo CV mới cho nhân sự không?");
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }
      
      await talentCVService.create(finalForm);
      alert("✅ Đã tạo CV thành công!");
      
      // Xóa dữ liệu form CV từ storage
      if (CV_FORM_STORAGE_KEY) {
        try {
          const rememberMe = localStorage.getItem('remember_me') === 'true';
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.removeItem(CV_FORM_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa dữ liệu form CV từ storage:", error);
        }
      }
      
      // Xóa file từ IndexedDB
      if (CV_FILE_STORAGE_KEY) {
        try {
          await deleteFileFromIndexedDB(CV_FILE_STORAGE_KEY);
        } catch (error) {
          console.warn("Không thể xóa file từ IndexedDB:", error);
        }
      }
      
      // Clean up
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
      setSelectedCVFile(null);
      setCvPreviewUrl(null);
      setExtractingCV(false);
      setShowCVFullForm(false);
      setInlineCVAnalysisResult(null);
      setShowInlineCVAnalysisModal(false);
      setUploadingCV(false);
      setCvUploadProgress(0);
      setIsCVUploadedFromFirebase(false);
      setUploadedCVUrl(null);
      setCvFormErrors({});
      setCvVersionError("");
      setExistingCVsForValidation([]);
      
      onCloseForm();
      
      // Refresh data
      await onRefreshCVs();
    } catch (err) {
      console.error("❌ Lỗi khi tạo CV:", err);
      setCvFormErrors({ submit: "Không thể tạo CV!" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    id,
    isSubmitting,
    inlineCVForm,
    existingCVsForValidation,
    isCVUploadedFromFirebase,
    analysisResult,
    lookupJobRoleLevels,
    cvPreviewUrl,
    CV_FORM_STORAGE_KEY,
    CV_FILE_STORAGE_KEY,
    setIsSubmitting,
    setCvFormErrors,
    setCvVersionError,
    onCloseForm,
    onRefreshCVs,
  ]);

  return {
    // Form data
    inlineCVForm,
    setInlineCVForm,
    cvFormErrors,
    setCvFormErrors,
    cvVersionError,
    setCvVersionError,
    
    // File states
    selectedCVFile,
    setSelectedCVFile,
    uploadingCV,
    cvUploadProgress,
    isCVUploadedFromFirebase,
    setIsCVUploadedFromFirebase,
    uploadedCVUrl,
    setUploadedCVUrl,
    cvPreviewUrl,
    setCvPreviewUrl,
    
    // Analysis states
    extractingCV,
    inlineCVAnalysisResult,
    showInlineCVAnalysisModal,
    setShowInlineCVAnalysisModal,
    showCVFullForm,
    setShowCVFullForm,
    
    // Validation
    existingCVsForValidation,
    
    // Data
    lookupJobRoleLevels,
    
    // Handlers
    handleCVFileSelect,
    handleAnalyzeCV,
    handleDeleteCVFile,
    handleCVFileUpload,
    handleSubmitInlineCV,
    handleConfirmInlineCVAnalysis,
    handleCancelInlineCVAnalysis,
    validateCVVersion: (version: number, jobRoleLevelId: number) => validateCVVersion(version, jobRoleLevelId, existingCVsForValidation),
    isValueDifferent,
  };
}

