// Types for FaceID functionality

export interface FaceVector {
    values: number[];
}

export interface FaceLoginPayload {
    faceVector: number[];
}

export interface FaceEnrollPayload {
    email: string;
    faceVector: number[];
}

export interface FaceDetectionResult {
    faceVector: number[];
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface FaceCaptureOptions {
    maxAttempts?: number;
    minConfidence?: number;
    captureCount?: number; // For enrollment - number of captures to average
}

