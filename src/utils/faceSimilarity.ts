/**
 * ⚠️ FILE NÀY CHỈ ĐỂ LƯU TRỮ - KHÔNG CÒN ĐƯỢC SỬ DỤNG
 * Backend đã xử lý face comparison
 * 
 * Utility functions để tính toán face similarity
 */

/**
 * Tính Cosine Similarity giữa 2 vectors
 * @param vectorA - Vector thứ nhất
 * @param vectorB - Vector thứ hai
 * @returns Giá trị từ -1 đến 1, với 1 là giống nhất
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
        throw new Error(`Vector length mismatch: ${vectorA.length} vs ${vectorB.length}`);
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Tính Euclidean Distance giữa 2 vectors
 * @param vectorA - Vector thứ nhất
 * @param vectorB - Vector thứ hai
 * @returns Khoảng cách (giá trị nhỏ hơn = giống hơn)
 */
export function calculateEuclideanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
        throw new Error(`Vector length mismatch: ${vectorA.length} vs ${vectorB.length}`);
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
        const diff = vectorA[i] - vectorB[i];
        sum += diff * diff;
    }

    return Math.sqrt(sum);
}

/**
 * So sánh vector với vector trong DB (để test)
 * @param currentVector - Vector hiện tại từ frontend
 * @param dbVector - Vector từ DB (string hoặc array)
 * @returns Similarity score và các thông tin debug
 */
export function compareWithDBVector(
    currentVector: number[],
    dbVector: number[] | string
): {
    cosineSimilarity: number;
    euclideanDistance: number;
    isMatch: boolean;
    threshold: number;
    differences: number[];
} {
    // Parse DB vector nếu là string
    let parsedDbVector: number[];
    if (typeof dbVector === 'string') {
        try {
            parsedDbVector = JSON.parse(dbVector);
        } catch {
            // Nếu không parse được, thử split bằng comma
            parsedDbVector = dbVector.split(',').map(v => parseFloat(v.trim()));
        }
    } else {
        parsedDbVector = dbVector;
    }

    // Đảm bảo cùng length
    if (currentVector.length !== parsedDbVector.length) {
        console.warn(`Vector length mismatch: current=${currentVector.length}, db=${parsedDbVector.length}`);
        // Pad hoặc truncate để cùng length
        if (currentVector.length < parsedDbVector.length) {
            currentVector = [...currentVector, ...new Array(parsedDbVector.length - currentVector.length).fill(0)];
        } else {
            parsedDbVector = [...parsedDbVector, ...new Array(currentVector.length - parsedDbVector.length).fill(0)];
        }
    }

    const cosineSim = calculateCosineSimilarity(currentVector, parsedDbVector);
    const euclideanDist = calculateEuclideanDistance(currentVector, parsedDbVector);

    // Tính differences
    const differences = currentVector.map((val, idx) => Math.abs(val - parsedDbVector[idx]));

    // Threshold thông thường cho cosine similarity: 0.7-0.85
    const threshold = 0.75;
    const isMatch = cosineSim >= threshold;

    return {
        cosineSimilarity: cosineSim,
        euclideanDistance: euclideanDist,
        isMatch,
        threshold,
        differences,
    };
}

