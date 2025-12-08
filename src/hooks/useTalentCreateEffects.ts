/**
 * Hook để quản lý các useEffect hooks trong Create Talent page
 * 
 * Logic này được tách từ Create.tsx để dễ quản lý và bảo trì
 */

import { useEffect } from 'react';

interface UseTalentCreateEffectsProps {
  cvPreviewUrl: string | null;
  modalCVPreviewUrl: string | null;
  isUploadedFromFirebase: boolean;
}

/**
 * Hook quản lý các side effects
 */
export function useTalentCreateEffects({
  cvPreviewUrl,
  modalCVPreviewUrl,
  isUploadedFromFirebase,
}: UseTalentCreateEffectsProps) {
  // Cleanup URL objects
  useEffect(() => {
    return () => {
      if (cvPreviewUrl) {
        URL.revokeObjectURL(cvPreviewUrl);
      }
      if (modalCVPreviewUrl) {
        URL.revokeObjectURL(modalCVPreviewUrl);
      }
    };
  }, [cvPreviewUrl, modalCVPreviewUrl]);

  // Warning when reloading after uploading CV
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadedFromFirebase) {
        e.preventDefault();
        e.returnValue = 'Bạn đã upload CV lên Firebase. Bạn có chắc chắn muốn rời khỏi trang không?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUploadedFromFirebase]);
}

