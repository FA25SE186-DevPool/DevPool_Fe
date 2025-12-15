/**
 * Script để download face-api.js models
 * Chạy: node scripts/download-face-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const MODELS = [
    // SSD MobileNet v1 - Face Detection
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',

    // Face Landmark 68 - Landmark Detection
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',

    // Face Recognition - Face Embedding (128 dimensions)
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(dest, () => { });
                    reject(err);
                });
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
    }

    console.log('📦 Downloading face-api.js models...\n');

    for (const model of MODELS) {
        const url = `${MODELS_URL}/${model}`;
        const dest = path.join(MODELS_DIR, model);

        if (fs.existsSync(dest)) {
            console.log(`✓ ${model} (already exists)`);
            continue;
        }

        try {
            process.stdout.write(`⬇ Downloading ${model}...`);
            await downloadFile(url, dest);
            console.log(' ✓');
        } catch (error) {
            console.log(` ✗ Error: ${error.message}`);
        }
    }

    console.log('\n✅ Done! Models are ready in public/models/');
}

main().catch(console.error);

