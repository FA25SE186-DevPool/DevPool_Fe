import { useState, useRef, useCallback } from 'react';
import { faceDetectionService } from '../services/FaceDetectionService';
import type { FaceDetectionResult } from '../types/face.types';

interface UseFaceDetectionOptions {
  onSuccess?: (result: FaceDetectionResult) => void;
  onError?: (error: Error) => void;
  minConfidence?: number;
}

export function useFaceDetection(options: UseFaceDetectionOptions = {}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  /**
   * Kiểm tra camera có sẵn không
   */
  const checkCamera = useCallback(async () => {
    try {
      const available = await faceDetectionService.checkCameraAvailability();
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

      // Không gán stream ở đây vì video element có thể chưa render
      // Stream sẽ được gán trong component sau khi video element render
      console.log('Stream obtained, will be assigned to video element later');

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

    setIsDetecting(true);
    setError(null);

    try {
      // Capture frame từ video
      const imageData = faceDetectionService.captureFrameFromVideo(videoRef.current);

      // Detect face
      const result = await faceDetectionService.detectFace(imageData);

      // Kiểm tra confidence
      if (options.minConfidence && result.confidence < options.minConfidence) {
        throw new Error(`Độ tin cậy quá thấp (${(result.confidence * 100).toFixed(1)}%). Vui lòng thử lại với ánh sáng tốt hơn.`);
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
  }, [stream, options]);

  /**
   * Capture nhiều ảnh và tính trung bình (cho enrollment)
   */
  const captureMultiple = useCallback(
    async (count: number = 3): Promise<number[]> => {
      if (!videoRef.current || !stream) {
        throw new Error('Camera chưa được khởi động');
      }

      setIsDetecting(true);
      setError(null);

      try {
        const images: string[] = [];

        // Capture nhiều frame
        for (let i = 0; i < count; i++) {
          const imageData = faceDetectionService.captureFrameFromVideo(videoRef.current!);
          images.push(imageData);

          // Đợi một chút giữa các lần capture
          if (i < count - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Detect và tính trung bình
        const vectors = await faceDetectionService.captureMultipleFaces(images, {
          minConfidence: options.minConfidence,
        });

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
    [stream, options]
  );

  /**
   * Capture nhiều ảnh và trả về tất cả vectors với confidence (cho login - thử nhiều lần)
   */
  const captureMultipleWithResults = useCallback(
    async (count: number = 5): Promise<Array<{ vector: number[]; confidence: number }>> => {
      if (!videoRef.current || !stream) {
        throw new Error('Camera chưa được khởi động');
      }

      setIsDetecting(true);
      setError(null);

      try {
        const images: string[] = [];

        // Capture nhiều frame
        for (let i = 0; i < count; i++) {
          const imageData = faceDetectionService.captureFrameFromVideo(videoRef.current!);
          images.push(imageData);

          // Đợi một chút giữa các lần capture để có sự khác biệt
          if (i < count - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Detect và trả về tất cả vectors với confidence
        const results = await faceDetectionService.captureMultipleFacesWithResults(images, {
          minConfidence: options.minConfidence,
        });

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
    [stream, options]
  );

  return {
    videoRef,
    isDetecting,
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

