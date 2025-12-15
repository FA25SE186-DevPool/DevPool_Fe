import * as faceapi from 'face-api.js';
import type { FaceDetectionResult } from '../types/face.types';

/**
 * Service để xử lý face detection và recognition sử dụng face-api.js
 * Tạo REAL face embedding 128 chiều từ deep learning model
 */
class FaceApiService {
    private modelsLoaded = false;
    private modelsLoading = false;
    private modelLoadPromise: Promise<void> | null = null;

    /**
     * Load các models cần thiết cho face detection và recognition
     * Models cần được đặt trong thư mục public/models/
     */
    async loadModels(): Promise<void> {
        if (this.modelsLoaded) {
            return;
        }

        if (this.modelsLoading && this.modelLoadPromise) {
            return this.modelLoadPromise;
        }

        this.modelsLoading = true;
        const MODEL_URL = '/models';

        this.modelLoadPromise = (async () => {
            try {
                console.log('[FaceAPI] Loading models...');
                
                // Load các models cần thiết
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);

                this.modelsLoaded = true;
                console.log('[FaceAPI] Models loaded successfully!');
            } catch (error) {
                console.error('[FaceAPI] Error loading models:', error);
                this.modelsLoading = false;
                throw new Error(
                    'Không thể tải models cho face recognition. ' +
                    'Vui lòng đảm bảo các file model đã được đặt trong thư mục public/models/'
                );
            }
        })();

        return this.modelLoadPromise;
    }

    /**
     * Kiểm tra models đã load chưa
     */
    isModelsLoaded(): boolean {
        return this.modelsLoaded;
    }

    /**
     * Detect face và extract embedding từ video element
     */
    async detectFaceFromVideo(video: HTMLVideoElement): Promise<FaceDetectionResult> {
        await this.loadModels();

        // Detect face với landmarks và descriptor (embedding)
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error('Không phát hiện được khuôn mặt. Vui lòng đảm bảo khuôn mặt nằm trong khung hình.');
        }

        // detection.descriptor là Float32Array 128 chiều - REAL face embedding!
        const faceVector = Array.from(detection.descriptor);

        return {
            faceVector,
            confidence: detection.detection.score,
            boundingBox: {
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height,
            },
        };
    }

    /**
     * Detect face từ image element hoặc canvas
     */
    async detectFaceFromImage(
        image: HTMLImageElement | HTMLCanvasElement
    ): Promise<FaceDetectionResult> {
        await this.loadModels();

        const detection = await faceapi
            .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error('Không phát hiện được khuôn mặt trong ảnh.');
        }

        const faceVector = Array.from(detection.descriptor);

        return {
            faceVector,
            confidence: detection.detection.score,
            boundingBox: {
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height,
            },
        };
    }

    /**
     * Capture frame từ video và detect face
     */
    async captureAndDetect(video: HTMLVideoElement): Promise<FaceDetectionResult> {
        return this.detectFaceFromVideo(video);
    }

    /**
     * Capture nhiều lần và trả về tất cả vectors (cho login - thử nhiều lần)
     */
    async captureMultipleWithResults(
        video: HTMLVideoElement,
        count: number = 5,
        delayMs: number = 300
    ): Promise<Array<{ vector: number[]; confidence: number }>> {
        await this.loadModels();

        const results: Array<{ vector: number[]; confidence: number }> = [];

        for (let i = 0; i < count; i++) {
            try {
                const result = await this.detectFaceFromVideo(video);
                results.push({
                    vector: result.faceVector,
                    confidence: result.confidence,
                });
            } catch (error) {
                console.warn(`[FaceAPI] Capture ${i + 1}/${count} failed:`, error);
            }

            // Delay giữa các lần capture
            if (i < count - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        if (results.length === 0) {
            throw new Error('Không thể phát hiện khuôn mặt trong bất kỳ lần capture nào.');
        }

        // Sắp xếp theo confidence (cao nhất trước)
        return results.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Capture nhiều lần và tính trung bình vector (cho enrollment)
     */
    async captureMultipleAndAverage(
        video: HTMLVideoElement,
        count: number = 5,
        delayMs: number = 500
    ): Promise<number[]> {
        const results = await this.captureMultipleWithResults(video, count, delayMs);

        if (results.length === 0) {
            throw new Error('Không thể phát hiện khuôn mặt.');
        }

        if (results.length === 1) {
            return results[0].vector;
        }

        // Tính trung bình các vectors
        const vectorLength = results[0].vector.length;
        const averageVector = new Array(vectorLength).fill(0);

        for (const result of results) {
            for (let i = 0; i < vectorLength; i++) {
                averageVector[i] += result.vector[i];
            }
        }

        for (let i = 0; i < vectorLength; i++) {
            averageVector[i] /= results.length;
        }

        // L2 normalize
        const magnitude = Math.sqrt(
            averageVector.reduce((sum, val) => sum + val * val, 0)
        );
        if (magnitude > 0) {
            for (let i = 0; i < vectorLength; i++) {
                averageVector[i] /= magnitude;
            }
        }

        return averageVector;
    }

    /**
     * So sánh hai face vectors (client-side comparison)
     * Trả về euclidean distance - giá trị nhỏ hơn = giống hơn
     */
    compareFaceVectors(vector1: number[], vector2: number[]): number {
        if (vector1.length !== vector2.length) {
            throw new Error('Vectors phải có cùng kích thước');
        }

        // Euclidean distance
        let sum = 0;
        for (let i = 0; i < vector1.length; i++) {
            const diff = vector1[i] - vector2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    /**
     * Kiểm tra xem hai vectors có match không
     * Threshold mặc định cho face-api.js là 0.6 (euclidean distance)
     * Giá trị nhỏ hơn 0.6 = cùng một người
     */
    isFaceMatch(vector1: number[], vector2: number[], threshold: number = 0.6): boolean {
        const distance = this.compareFaceVectors(vector1, vector2);
        return distance < threshold;
    }

    /**
     * Kiểm tra camera có sẵn không
     */
    async checkCameraAvailability(): Promise<boolean> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some((device) => device.kind === 'videoinput');
        } catch (error) {
            console.error('[FaceAPI] Error checking camera:', error);
            return false;
        }
    }
}

export const faceApiService = new FaceApiService();

