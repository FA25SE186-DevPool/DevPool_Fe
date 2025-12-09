import { GOOGLE_VISION_API_KEY, GOOGLE_VISION_API_URL, FACE_DETECTION_CONFIG } from '../config/vision.config';
import type { FaceDetectionResult, FaceCaptureOptions } from '../types/face.types';

/**
 * Service để xử lý face detection và extraction sử dụng Google Vision API
 */
class FaceDetectionService {
    private apiKey: string;

    constructor() {
        this.apiKey = GOOGLE_VISION_API_KEY;
        if (!this.apiKey) {
            console.warn('⚠️ Google Vision API key chưa được cấu hình. Vui lòng thêm VITE_GOOGLE_VISION_API_KEY vào .env file');
        }
    }

    /**
     * Convert image (File, Blob, hoặc base64) thành base64 string
     */
    private async imageToBase64(image: File | Blob | string): Promise<string> {
        if (typeof image === 'string') {
            // Nếu đã là base64, loại bỏ data URL prefix nếu có
            return image.replace(/^data:image\/[a-z]+;base64,/, '');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Loại bỏ data URL prefix
                const base64 = result.replace(/^data:image\/[a-z]+;base64,/, '');
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(image);
        });
    }

    /**
     * Gọi Google Vision API để detect và extract face embedding
     */
    async detectFace(image: File | Blob | string): Promise<FaceDetectionResult> {
        if (!this.apiKey) {
            throw new Error('Google Vision API key chưa được cấu hình');
        }

        try {
            // Convert image to base64
            const base64Image = await this.imageToBase64(image);

            // Gọi Google Vision API
            const response = await fetch(
                `${GOOGLE_VISION_API_URL}?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requests: [
                            {
                                image: {
                                    content: base64Image,
                                },
                                features: [
                                    {
                                        type: 'FACE_DETECTION',
                                        maxResults: FACE_DETECTION_CONFIG.maxResults,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Google Vision API error: ${response.statusText}`;
        
        // Xử lý lỗi billing cụ thể
        if (errorMessage.includes('billing') || errorMessage.includes('Billing')) {
          throw new Error(
            'Google Vision API yêu cầu bật billing. Vui lòng bật billing trong Google Cloud Console: https://console.cloud.google.com/billing/enable'
          );
        }
        
        throw new Error(errorMessage);
      }

            const data = await response.json();

            // Kiểm tra response
            if (!data.responses || data.responses.length === 0) {
                throw new Error('Không nhận được response từ Google Vision API');
            }

            const faceAnnotations = data.responses[0].faceAnnotations;

            if (!faceAnnotations || faceAnnotations.length === 0) {
                throw new Error('Không phát hiện được khuôn mặt trong ảnh');
            }

            // Lấy khuôn mặt đầu tiên (có thể chọn khuôn mặt lớn nhất)
            const face = this.selectBestFace(faceAnnotations);

            // Extract face embedding từ landmarks
            // Google Vision API không trả về embedding trực tiếp, 
            // nên chúng ta sẽ tạo embedding từ landmarks và bounding box
            const faceVector = this.extractFaceVector(face);

            return {
                faceVector,
                confidence: face.detectionConfidence || 0.5,
                boundingBox: face.boundingPoly
                    ? {
                        x: face.boundingPoly.vertices[0]?.x || 0,
                        y: face.boundingPoly.vertices[0]?.y || 0,
                        width:
                            (face.boundingPoly.vertices[1]?.x || 0) -
                            (face.boundingPoly.vertices[0]?.x || 0),
                        height:
                            (face.boundingPoly.vertices[2]?.y || 0) -
                            (face.boundingPoly.vertices[0]?.y || 0),
                    }
                    : undefined,
            };
        } catch (error: any) {
            console.error('Face detection error:', error);
            throw new Error(error.message || 'Lỗi khi phát hiện khuôn mặt');
        }
    }

    /**
     * Chọn khuôn mặt tốt nhất từ danh sách (khuôn mặt lớn nhất hoặc confidence cao nhất)
     */
    private selectBestFace(faceAnnotations: any[]): any {
        if (faceAnnotations.length === 1) {
            return faceAnnotations[0];
        }

        // Sắp xếp theo detection confidence và chọn khuôn mặt tốt nhất
        return faceAnnotations.sort(
            (a, b) =>
                (b.detectionConfidence || 0) - (a.detectionConfidence || 0)
        )[0];
    }

    /**
     * Extract face vector từ face annotations
     * Google Vision API không trả về embedding trực tiếp,
     * nên chúng ta sẽ tạo vector từ landmarks và các features
     */
    private extractFaceVector(face: any): number[] {
        const vector: number[] = [];

        // Sử dụng landmarks để tạo embedding
        if (face.landmarks && face.landmarks.length > 0) {
            // Normalize landmarks coordinates
            const boundingBox = face.boundingPoly;
            if (boundingBox && boundingBox.vertices && boundingBox.vertices.length >= 4) {
                const width =
                    (boundingBox.vertices[1].x || 0) - (boundingBox.vertices[0].x || 0);
                const height =
                    (boundingBox.vertices[2].y || 0) - (boundingBox.vertices[0].y || 0);

                // Normalize landmarks
                face.landmarks.forEach((landmark: any) => {
                    const normalizedX = ((landmark.position.x || 0) - (boundingBox.vertices[0].x || 0)) / width;
                    const normalizedY = ((landmark.position.y || 0) - (boundingBox.vertices[0].y || 0)) / height;
                    const normalizedZ = landmark.position.z || 0;

                    vector.push(normalizedX, normalizedY, normalizedZ);
                });
            }
        }

        // Thêm các features khác
        if (face.detectionConfidence !== undefined) {
            vector.push(face.detectionConfidence);
        }
        if (face.landmarkingConfidence !== undefined) {
            vector.push(face.landmarkingConfidence);
        }
        if (face.joyLikelihood) {
            vector.push(this.likelihoodToNumber(face.joyLikelihood));
        }
        if (face.sorrowLikelihood) {
            vector.push(this.likelihoodToNumber(face.sorrowLikelihood));
        }
        if (face.angerLikelihood) {
            vector.push(this.likelihoodToNumber(face.angerLikelihood));
        }
        if (face.surpriseLikelihood) {
            vector.push(this.likelihoodToNumber(face.surpriseLikelihood));
        }

        // Normalize vector về 128 dimensions (hoặc padding/truncate)
        return this.normalizeVector(vector, FACE_DETECTION_CONFIG.embeddingDimensions);
    }

    /**
     * Convert likelihood string thành number
     */
    private likelihoodToNumber(likelihood: string): number {
        const map: Record<string, number> = {
            UNKNOWN: 0,
            VERY_UNLIKELY: 0.1,
            UNLIKELY: 0.3,
            POSSIBLE: 0.5,
            LIKELY: 0.7,
            VERY_LIKELY: 0.9,
        };
        return map[likelihood] || 0;
    }

    /**
     * Normalize vector về kích thước cố định
     */
    private normalizeVector(vector: number[], targetSize: number): number[] {
        if (vector.length === targetSize) {
            return vector;
        }

        if (vector.length < targetSize) {
            // Pad với zeros
            return [...vector, ...new Array(targetSize - vector.length).fill(0)];
        }

        // Truncate hoặc average
        const step = vector.length / targetSize;
        const result: number[] = [];
        for (let i = 0; i < targetSize; i++) {
            const start = Math.floor(i * step);
            const end = Math.floor((i + 1) * step);
            const avg = vector.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
            result.push(avg);
        }
        return result;
    }

    /**
     * Capture nhiều ảnh và tính trung bình face vector (cho enrollment)
     */
    async captureMultipleFaces(
        images: (File | Blob | string)[],
        options: FaceCaptureOptions = {}
    ): Promise<number[]> {
        const { minConfidence = 0.5 } = options;

        const vectors: number[][] = [];

        for (const image of images) {
            try {
                const result = await this.detectFace(image);
                if (result.confidence >= minConfidence) {
                    vectors.push(result.faceVector);
                }
            } catch (error) {
                console.warn('Failed to detect face in one image:', error);
            }
        }

        if (vectors.length === 0) {
            throw new Error('Không thể phát hiện khuôn mặt trong bất kỳ ảnh nào');
        }

        // Tính trung bình các vectors
        return this.averageVectors(vectors);
    }

    /**
     * Tính trung bình của nhiều face vectors
     */
    private averageVectors(vectors: number[][]): number[] {
        if (vectors.length === 0) return [];
        if (vectors.length === 1) return vectors[0];

        const length = vectors[0].length;
        const result: number[] = new Array(length).fill(0);

        for (const vector of vectors) {
            for (let i = 0; i < length; i++) {
                result[i] += vector[i] || 0;
            }
        }

        // Chia cho số lượng vectors
        for (let i = 0; i < length; i++) {
            result[i] /= vectors.length;
        }

        return result;
    }

    /**
     * Kiểm tra xem camera có sẵn không
     */
    async checkCameraAvailability(): Promise<boolean> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some((device) => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error checking camera:', error);
            return false;
        }
    }

    /**
     * Capture frame từ video stream
     */
    captureFrameFromVideo(video: HTMLVideoElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Không thể tạo canvas context');
        }
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.9);
    }
}

export const faceDetectionService = new FaceDetectionService();

