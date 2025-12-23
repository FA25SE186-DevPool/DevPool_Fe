import { useState, useCallback } from 'react';
import { uploadFile } from '../utils/firebaseStorage';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Hook để quản lý file upload (CV và certificate images)
 */
export function useFileUpload() {
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCVIndex, setUploadingCVIndex] = useState<number | null>(null);
  const [isUploadedFromFirebase, setIsUploadedFromFirebase] = useState(false);
  const [uploadedCVUrl, setUploadedCVUrl] = useState<string | null>(null);

  // Certificate image upload states
  const [certificateImageFiles, setCertificateImageFiles] = useState<Record<number, File>>({});
  const [uploadingCertificateIndex, setUploadingCertificateIndex] = useState<number | null>(null);
  const [certificateUploadProgress, setCertificateUploadProgress] = useState<Record<number, number>>({});
  const [uploadedCertificateUrls, setUploadedCertificateUrls] = useState<Record<number, string>>({});

  // Success overlay states
  const [showUploadCertificateImageSuccessOverlay, setShowUploadCertificateImageSuccessOverlay] = useState<boolean>(false);
  const [showDeleteCVSuccessOverlay, setShowDeleteCVSuccessOverlay] = useState<boolean>(false);
  const [showDeleteCertificateImageSuccessOverlay, setShowDeleteCertificateImageSuccessOverlay] = useState<boolean>(false);

  /**
   * Upload CV file to Firebase
   */
  const uploadCV = useCallback(
    async (
      file: File,
      cvIndex: number,
      version: number,
      jobRoleLevelId: number,
      onSuccess?: (url: string) => void
    ): Promise<string | null> => {
      if (!file) {
        alert('Vui lòng chọn file CV trước!');
        return null;
      }

      // Validate file type (PDF, DOC, DOCX, TXT)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('⚠️ Vui lòng chọn file CV có định dạng PDF, DOC, DOCX hoặc TXT');
        return null;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('⚠️ Kích thước file CV không được vượt quá 10MB');
        return null;
      }

      if (!version || version <= 0) {
        alert('Vui lòng nhập version CV trước khi upload!');
        return null;
      }

      if (!jobRoleLevelId || jobRoleLevelId <= 0) {
        alert('⚠️ Vui lòng chọn vị trí công việc cho CV trước khi upload lên Firebase!');
        return null;
      }

      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn upload file "${file.name}" lên Firebase không?\n\n` +
          `Version: ${version}\n` +
          `Kích thước file: ${(file.size / 1024).toFixed(2)} KB`
      );

      if (!confirmed) {
        // User đã cancel, không throw error
        return 'CANCELLED' as any;
      }

      setUploadingCVIndex(cvIndex);
      setUploadingCV(true);
      setUploadProgress(0);

      try {
        const timestamp = Date.now();
        const sanitizedVersionName = `v${version}`.replace(/[^a-zA-Z0-9-_]/g, '_');
        const fileExtension = file.name.split('.').pop();
        const fileName = `temp_${sanitizedVersionName}_${timestamp}.${fileExtension}`;
        const filePath = `temp-talents/${fileName}`;

        const downloadURL = await uploadFile(file, filePath, (progress) => setUploadProgress(progress));

        setIsUploadedFromFirebase(true);
        setUploadedCVUrl(downloadURL);

        if (onSuccess) {
          onSuccess(downloadURL);
        }

        // Không hiển thị alert khi upload tự động trong form submit
        // Alert sẽ được hiển thị ở nơi gọi hàm này nếu cần
        // alert('✅ Upload CV thành công!');
        return downloadURL;
      } catch (err: any) {
        console.error('❌ Error uploading CV:', err);
        alert(`❌ Lỗi khi upload CV: ${err.message || 'Vui lòng thử lại.'}`);
        return null;
      } finally {
        setUploadingCV(false);
        setUploadingCVIndex(null);
        setUploadProgress(0);
      }
    },
    []
  );

  /**
   * Handle certificate image file selection
   */
  const handleFileChangeCertificate = useCallback((certIndex: number, e: React.ChangeEvent<HTMLInputElement> | { target: { files: null; value: string } }) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Vui lòng chọn file ảnh (jpg, png, gif, etc.)');
        if ('value' in e.target) {
          e.target.value = '';
        }
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('⚠️ Kích thước file không được vượt quá 10MB');
        if ('value' in e.target) {
          e.target.value = '';
        }
        return;
      }

      setCertificateImageFiles((prev) => ({ ...prev, [certIndex]: file }));
    } else {
      // Clear file from state
      setCertificateImageFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[certIndex];
        return newFiles;
      });
    }
  }, []);

  /**
   * Upload certificate image to Firebase
   */
  const uploadCertificateImage = useCallback(
    async (certIndex: number, onSuccess?: (url: string) => void): Promise<string | null> => {
      const imageFile = certificateImageFiles[certIndex];
      if (!imageFile) {
        alert('Vui lòng chọn file ảnh trước!');
        return null;
      }

      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn upload ảnh "${imageFile.name}" lên Firebase không?\n\n` +
          `Kích thước file: ${(imageFile.size / 1024).toFixed(2)} KB`
      );

      if (!confirmed) {
        return null;
      }

      setUploadingCertificateIndex(certIndex);
      setCertificateUploadProgress((prev) => ({ ...prev, [certIndex]: 0 }));

      try {
        const timestamp = Date.now();
        const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
        const fileName = `cert_${certIndex}_${timestamp}_${sanitizedFileName}`;
        const filePath = `certificates/${fileName}`;

        const downloadURL = await uploadFile(imageFile, filePath, (progress) =>
          setCertificateUploadProgress((prev) => ({ ...prev, [certIndex]: progress }))
        );

        setUploadedCertificateUrls((prev) => ({ ...prev, [certIndex]: downloadURL }));

        // Clear the file from state after successful upload
        setCertificateImageFiles((prev) => {
          const newFiles = { ...prev };
          delete newFiles[certIndex];
          return newFiles;
        });

        if (onSuccess) {
          onSuccess(downloadURL);
        }

        setShowUploadCertificateImageSuccessOverlay(true);

        // Hiển thị loading overlay trong 2 giây
        setTimeout(() => {
          setShowUploadCertificateImageSuccessOverlay(false);
        }, 2000);

        return downloadURL;
      } catch (err: any) {
        console.error('❌ Error uploading certificate image:', err);
        alert(`❌ Lỗi khi upload ảnh: ${err.message || 'Vui lòng thử lại.'}`);
        return null;
      } finally {
        setUploadingCertificateIndex(null);
        setCertificateUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[certIndex];
          return newProgress;
        });
      }
    },
    [certificateImageFiles]
  );

  /**
   * Extract Firebase Storage path from download URL
   */
  const extractFirebasePath = useCallback((url: string): string | null => {
    try {
      // Check if it's a Firebase Storage URL
      if (!url.includes('firebasestorage.googleapis.com') && !url.includes('firebaseapp.com')) {
        console.warn('URL không phải là Firebase Storage URL:', url);
        return null;
      }

      const urlObj = new URL(url);
      // Match pattern: /o/{path}? or /o/{path}
      // Firebase Storage URLs: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        // Decode the path (Firebase encodes spaces and special chars)
        const decodedPath = decodeURIComponent(pathMatch[1]);
        console.log('Extracted Firebase path:', decodedPath);
        return decodedPath;
      }
      console.warn('Không thể extract path từ URL:', url);
      return null;
    } catch (e) {
      console.error('Error extracting Firebase path:', e, 'URL:', url);
      return null;
    }
  }, []);

  /**
   * Delete CV file from Firebase
   */
  const deleteCVFile = useCallback(
    async (_cvIndex: number, cvFileUrl: string, skipConfirm: boolean = false): Promise<boolean> => {
      if (!cvFileUrl) {
        console.warn('Không có URL để xóa');
        return false;
      }

      if (!skipConfirm) {
        const confirmed = window.confirm('Bạn có chắc chắn muốn xóa file CV này không?');
        if (!confirmed) {
          return false;
        }
      }

      try {
        const firebasePath = extractFirebasePath(cvFileUrl);
        if (!firebasePath) {
          console.error('❌ Không thể extract Firebase path từ URL:', cvFileUrl);
          alert('❌ URL không hợp lệ hoặc không phải là Firebase Storage URL. Không thể xóa file.');
          return false;
        }

        console.log('Đang xóa file từ Firebase:', firebasePath);
        const storageRef = ref(storage, firebasePath);
        await deleteObject(storageRef);
        console.log('Đã xóa file thành công từ Firebase');
        setShowDeleteCVSuccessOverlay(true);

        // Hiển thị loading overlay trong 2 giây
        setTimeout(() => {
          setShowDeleteCVSuccessOverlay(false);
        }, 2000);

        return true;
      } catch (err: any) {
        console.error('❌ Error deleting CV file:', err);
        const errorMessage = err?.message || 'Vui lòng thử lại.';
        alert(`❌ Lỗi khi xóa file CV: ${errorMessage}`);
        return false;
      }
    },
    [extractFirebasePath]
  );

  /**
   * Delete certificate image from Firebase
   */
  const deleteCertificateImage = useCallback(
    async (certIndex: number, imageUrl: string): Promise<boolean> => {
      if (!imageUrl) {
        console.warn('Không có URL để xóa');
        return false;
      }

      const uploadedUrl = uploadedCertificateUrls[certIndex];
      if (!uploadedUrl || uploadedUrl !== imageUrl) {
        // Not uploaded from Firebase, just clear the URL
        return true;
      }

      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa ảnh chứng chỉ này không?');
      if (!confirmed) {
        return false;
      }

      try {
        const firebasePath = extractFirebasePath(imageUrl);
        if (!firebasePath) {
          console.error('❌ Không thể extract Firebase path từ URL:', imageUrl);
          alert('❌ URL không hợp lệ hoặc không phải là Firebase Storage URL. Không thể xóa file.');
          return false;
        }

        console.log('Đang xóa ảnh từ Firebase:', firebasePath);
        const storageRef = ref(storage, firebasePath);
        await deleteObject(storageRef);
        console.log('Đã xóa ảnh thành công từ Firebase');
        setShowDeleteCertificateImageSuccessOverlay(true);

        // Hiển thị loading overlay trong 2 giây
        setTimeout(() => {
          setShowDeleteCertificateImageSuccessOverlay(false);
        }, 2000);

        // Clear from uploaded URLs
        setUploadedCertificateUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[certIndex];
          return newUrls;
        });

        return true;
      } catch (err: any) {
        console.error('❌ Error deleting certificate image:', err);
        const errorMessage = err?.message || 'Vui lòng thử lại.';
        alert(`❌ Lỗi khi xóa ảnh: ${errorMessage}`);
        return false;
      }
    },
    [extractFirebasePath, uploadedCertificateUrls]
  );

  return {
    // CV upload
    uploadingCV,
    uploadProgress,
    uploadingCVIndex,
    isUploadedFromFirebase,
    setIsUploadedFromFirebase,
    uploadedCVUrl,
    setUploadedCVUrl,
    uploadCV,
    deleteCVFile,

    // Certificate image upload
    certificateImageFiles,
    uploadingCertificateIndex,
    certificateUploadProgress,
    uploadedCertificateUrls,
    handleFileChangeCertificate,
    uploadCertificateImage,
    deleteCertificateImage,

    // Helpers
    extractFirebasePath,

    // Success overlay states
    showUploadCertificateImageSuccessOverlay,
    showDeleteCVSuccessOverlay,
    showDeleteCertificateImageSuccessOverlay,
  };
}

