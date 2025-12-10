// Google Vision API Configuration
// Lưu ý: API key nên được lưu trong .env file và không commit vào git

import { GOOGLE_VISION_API_KEY as ENV_API_KEY } from './env.config';

export const GOOGLE_VISION_API_KEY = ENV_API_KEY;

export const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Face detection model configuration
export const FACE_DETECTION_CONFIG = {
    maxResults: 10,
    minConfidence: 0.5,
    // Face embedding dimensions (Google Vision returns 128 dimensions)
    embeddingDimensions: 128,
} as const;

