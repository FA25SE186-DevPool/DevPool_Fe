/**
 * ⚠️ FILE NÀY CHỈ ĐỂ LƯU TRỮ - KHÔNG CÒN ĐƯỢC SỬ DỤNG
 * Hệ thống đã chuyển sang sử dụng face-api.js (FaceApiService.ts)
 * 
 * Service cũ sử dụng Google Vision API để face detection
 */

import { GOOGLE_VISION_API_KEY, GOOGLE_VISION_API_URL, FACE_DETECTION_CONFIG } from '../config/vision.config';
import type { FaceDetectionResult, FaceCaptureOptions } from '../types/face.types';

// Interface cho Google Vision API response
interface Vertex {
    x?: number;
    y?: number;
}

interface BoundingPoly {
    vertices?: Vertex[];
}

interface Landmark {
    type?: string;
    position?: {
        x?: number;
        y?: number;
        z?: number;
    };
}

interface FaceAnnotation {
    boundingPoly?: BoundingPoly;
    fdBoundingPoly?: BoundingPoly;
    landmarks?: Landmark[];
    rollAngle?: number;
    panAngle?: number;
    tiltAngle?: number;
    detectionConfidence?: number;
    landmarkingConfidence?: number;
    joyLikelihood?: string;
    sorrowLikelihood?: string;
    angerLikelihood?: string;
    surpriseLikelihood?: string;
    underExposedLikelihood?: string;
    blurredLikelihood?: string;
    headwearLikelihood?: string;
}

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
                const errorMessage = (errorData as { error?: { message?: string } }).error?.message || `Google Vision API error: ${response.statusText}`;

                // Xử lý lỗi billing cụ thể
                if (errorMessage.includes('billing') || errorMessage.includes('Billing')) {
                    throw new Error(
                        'Google Vision API yêu cầu bật billing. Vui lòng bật billing trong Google Cloud Console: https://console.cloud.google.com/billing/enable'
                    );
                }

                throw new Error(errorMessage);
            }

            const data = await response.json() as { responses?: Array<{ faceAnnotations?: FaceAnnotation[] }> };

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
                boundingBox: face.boundingPoly?.vertices
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
        } catch (error: unknown) {
            console.error('Face detection error:', error);
            const err = error as { message?: string };
            throw new Error(err.message || 'Lỗi khi phát hiện khuôn mặt');
        }
    }

    /**
     * Chọn khuôn mặt tốt nhất từ danh sách (khuôn mặt lớn nhất hoặc confidence cao nhất)
     */
    private selectBestFace(faceAnnotations: FaceAnnotation[]): FaceAnnotation {
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
     * 
     * ⚠️ CẢNH BÁO QUAN TRỌNG ⚠️
     * Google Vision API KHÔNG trả về face embedding thực sự!
     * Vector này được tạo từ landmarks (vị trí các điểm trên mặt),
     * KHÔNG PHẢI từ deep learning embedding như FaceNet/ArcFace.
     * 
     * Đây chỉ là giải pháp TẠM THỜI. Để face recognition hoạt động chính xác,
     * cần chuyển sang sử dụng:
     * - face-api.js (client-side, miễn phí)
     * - Azure Face API (có real embedding)
     * - Amazon Rekognition
     * - Self-hosted DeepFace/FaceNet
     */
    private extractFaceVector(face: FaceAnnotation): number[] {
        const vector: number[] = [];
        const landmarks = face.landmarks;
        const boundingPoly = face.boundingPoly;

        // Sử dụng landmarks để tạo pseudo-embedding
        // Chỉ hoạt động tốt khi cùng một người với cùng tư thế
        if (landmarks && landmarks.length > 0) {
            if (boundingPoly?.vertices && boundingPoly.vertices.length >= 4) {
                const width =
                    (boundingPoly.vertices[1]?.x || 0) - (boundingPoly.vertices[0]?.x || 0);
                const height =
                    (boundingPoly.vertices[2]?.y || 0) - (boundingPoly.vertices[0]?.y || 0);

                // Tính center của bounding box để normalize tốt hơn
                const centerX = (boundingPoly.vertices[0]?.x || 0) + width / 2;
                const centerY = (boundingPoly.vertices[0]?.y || 0) + height / 2;
                const maxDim = Math.max(width, height);

                // Normalize landmarks về -0.5 đến 0.5 dựa trên center và maxDim
                // Điều này giúp vector ít phụ thuộc vào vị trí face trong frame
                landmarks.forEach((landmark) => {
                    const pos = landmark.position;
                    const normalizedX = maxDim > 0
                        ? ((pos?.x || 0) - centerX) / maxDim
                        : 0;
                    const normalizedY = maxDim > 0
                        ? ((pos?.y || 0) - centerY) / maxDim
                        : 0;
                    // Z coordinate normalize theo maxDim để nhất quán
                    const normalizedZ = maxDim > 0 
                        ? (pos?.z || 0) / maxDim 
                        : 0;

                    vector.push(normalizedX, normalizedY, normalizedZ);
                });
            } else {
                // Fallback nếu không có bounding box
                landmarks.forEach((landmark) => {
                    const pos = landmark.position;
                    vector.push(pos?.x || 0, pos?.y || 0, pos?.z || 0);
                });
            }
        }

        // KHÔNG thêm confidence và emotion vì chúng thay đổi theo từng lần capture
        // Điều này gây ra sự không nhất quán giữa enroll và login

        // Normalize vector về 128 dimensions (hoặc padding/truncate)
        const sizedVector = this.resizeVector(vector, FACE_DETECTION_CONFIG.embeddingDimensions);

        // L2 normalize để đảm bảo cosine similarity hoạt động đúng
        return this.l2Normalize(sizedVector);
    }

    /**
     * L2 Normalize vector
     */
    private l2Normalize(vector: number[]): number[] {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vector;
        return vector.map(val => val / magnitude);
    }

    /**
     * Resize vector về kích thước cố định
     */
    private resizeVector(vector: number[], targetSize: number): number[] {
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

        // Tính trung bình các vectors (KHÔNG normalize để tương thích với DB)
        return this.averageVectors(vectors);
    }

    /**
     * Capture nhiều ảnh và trả về tất cả vectors (cho login - thử nhiều lần)
     */
    async captureMultipleFacesWithResults(
        images: (File | Blob | string)[],
        options: FaceCaptureOptions = {}
    ): Promise<Array<{ vector: number[]; confidence: number }>> {
        const { minConfidence = 0.5 } = options;
        const results: Array<{ vector: number[]; confidence: number }> = [];

        for (const image of images) {
            try {
                const result = await this.detectFace(image);
                if (result.confidence >= minConfidence) {
                    results.push({ vector: result.faceVector, confidence: result.confidence });
                }
            } catch (error) {
                console.warn('Failed to detect face in one image:', error);
            }
        }

        if (results.length === 0) {
            throw new Error('Không thể phát hiện khuôn mặt trong bất kỳ ảnh nào');
        }

        // Sắp xếp theo confidence (cao nhất trước)
        return results.sort((a, b) => b.confidence - a.confidence);
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

        // L2 normalize để đảm bảo cosine similarity hoạt động đúng
        return this.l2Normalize(result);
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
