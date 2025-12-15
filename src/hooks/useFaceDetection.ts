import { useState, useRef, useCallback, useEffect } from 'react';
import { faceApiService } from '../services/FaceApiService';
import type { FaceDetectionResult } from '../types/face.types';

interface UseFaceDetectionOptions {
  onSuccess?: (result: FaceDetectionResult) => void;
  onError?: (error: Error) => void;
  minConfidence?: number;
}

export function useFaceDetection(options: UseFaceDetectionOptions = {}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  /**
   * Load face-api.js models khi component mount
   */
  useEffect(() => {
    const loadModels = async () => {
      if (faceApiService.isModelsLoaded()) {
        setModelsLoaded(true);
        return;
      }

      setIsModelsLoading(true);
      try {
        await faceApiService.loadModels();
        setModelsLoaded(true);
      } catch (err: any) {
        setError(err.message || 'Không thể tải models');
        options.onError?.(err);
      } finally {
        setIsModelsLoading(false);
      }
    };

    loadModels();
  }, []);

  /**
   * Kiểm tra camera có sẵn không
   */
  const checkCamera = useCallback(async () => {
    try {
      const available = await faceApiService.checkCameraAvailability();
      setHasCamera(available);
      return available;
    } catch (err) {
      setHasCamera(false);
      return false;
    }
  }, []);

  /**
   * Khởi động camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      console.log('[FaceDetection] Camera stream obtained');

      return mediaStream;
    } catch (err: any) {
      const errorMessage =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Vui lòng cho phép truy cập camera'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
            ? 'Không tìm thấy camera'
            : 'Không thể khởi động camera';

      setError(errorMessage);
      options.onError?.(new Error(errorMessage));
      throw new Error(errorMessage);
    }
  }, [options]);

  /**
   * Dừng camera stream
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  /**
   * Capture và detect face từ video
   */
  const captureAndDetect = useCallback(async (): Promise<FaceDetectionResult> => {
    if (!videoRef.current) {
      throw new Error('Video element chưa được khởi tạo');
    }

    if (!stream) {
      throw new Error('Camera chưa được khởi động');
    }

    if (!modelsLoaded) {
      throw new Error('Models chưa được tải xong');
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Detect face trực tiếp từ video element
      const result = await faceApiService.detectFaceFromVideo(videoRef.current);

      // Kiểm tra confidence
      if (options.minConfidence && result.confidence < options.minConfidence) {
        throw new Error(
          `Độ tin cậy quá thấp (${(result.confidence * 100).toFixed(1)}%). Vui lòng thử lại với ánh sáng tốt hơn.`
        );
      }

      options.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Lỗi khi phát hiện khuôn mặt';
      setError(errorMessage);
      options.onError?.(err);
      throw err;
    } finally {
      setIsDetecting(false);
    }
  }, [stream, modelsLoaded, options]);

  /**
   * Capture nhiều ảnh và tính trung bình (cho enrollment)
   */
  const captureMultiple = useCallback(
    async (count: number = 5): Promise<number[]> => {
      if (!videoRef.current || !stream) {
        throw new Error('Camera chưa được khởi động');
      }

      if (!modelsLoaded) {
        throw new Error('Models chưa được tải xong');
      }

      setIsDetecting(true);
      setError(null);

      try {
        const vectors = await faceApiService.captureMultipleAndAverage(
          videoRef.current,
          count,
          500
        );
        return vectors;
      } catch (err: any) {
        const errorMessage = err.message || 'Lỗi khi capture nhiều ảnh';
        setError(errorMessage);
        options.onError?.(err);
        throw err;
      } finally {
        setIsDetecting(false);
      }
    },
    [stream, modelsLoaded, options]
  );

  /**
   * Capture nhiều ảnh và trả về tất cả vectors với confidence (cho login - thử nhiều lần)
   */
  const captureMultipleWithResults = useCallback(
    async (count: number = 5): Promise<Array<{ vector: number[]; confidence: number }>> => {
      if (!videoRef.current || !stream) {
        throw new Error('Camera chưa được khởi động');
      }

      if (!modelsLoaded) {
        throw new Error('Models chưa được tải xong');
      }

      setIsDetecting(true);
      setError(null);

      try {
        const results = await faceApiService.captureMultipleWithResults(
          videoRef.current,
          count,
          300
        );
        return results;
      } catch (err: any) {
        const errorMessage = err.message || 'Lỗi khi capture nhiều ảnh';
        setError(errorMessage);
        options.onError?.(err);
        throw err;
      } finally {
        setIsDetecting(false);
      }
    },
    [stream, modelsLoaded, options]
  );

  return {
    videoRef,
    isDetecting,
    isModelsLoading,
    modelsLoaded,
    error,
    stream,
    hasCamera,
    checkCamera,
    startCamera,
    stopCamera,
    captureAndDetect,
    captureMultiple,
    captureMultipleWithResults,
  };
}
