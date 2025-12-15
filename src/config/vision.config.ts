// Google Vision API Configuration

import { GOOGLE_VISION_API_KEY as ENV_API_KEY } from './env.config';

export const GOOGLE_VISION_API_KEY = ENV_API_KEY;

export const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Face detection model configuration
export const FACE_DETECTION_CONFIG = {
    maxResults: 10,
    minConfidence: 0.7,
    embeddingDimensions: 128,
} as const;

