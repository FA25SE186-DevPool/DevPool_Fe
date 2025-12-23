import { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, Loader2, User, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { faceApiService } from '../../services/FaceApiService';
import { authService } from '../../services/Auth';

interface FaceIDEnrollProps {
    email: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function FaceIDEnroll({ email, onSuccess, onCancel }: FaceIDEnrollProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [captureStep, setCaptureStep] = useState<'idle' | 'center' | 'left' | 'right' | 'up' | 'down' | 'complete'>('idle');
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureProgress, setCaptureProgress] = useState(0);

    const {
        videoRef,
        isDetecting,
        isModelsLoading,
        modelsLoaded,
        error: detectionError,
        hasCamera,
        checkCamera,
        startCamera,
        stopCamera,
    } = useFaceDetection({
        minConfidence: 0.5,
        onError: (err) => {
            setError(err.message);
        },
    });

    useEffect(() => {
        checkCamera();

        return () => {
            stopCamera();
        };
    }, [checkCamera, stopCamera]);

    useEffect(() => {
        if (detectionError) {
            setError(detectionError);
        }
    }, [detectionError]);

    const handleStartCamera = async () => {
        try {
            setError('');
            const stream = await startCamera();
            
            // Set camera started first so video element renders
            setCameraStarted(true);
            
            // Wait for video element to render, then assign stream
            setTimeout(() => {
                if (videoRef.current && stream) {
                    console.log('Assigning stream to video element in FaceIDEnroll');
                    videoRef.current.srcObject = stream;
                    
                    const video = videoRef.current;
                    const playVideo = () => {
                        video.play().catch((err) => {
                            console.error('Error playing video:', err);
                        });
                    };
                    
                    if (video.readyState >= 2) {
                        playVideo();
                    } else {
                        video.onloadedmetadata = () => playVideo();
                        video.oncanplay = () => playVideo();
                    }
                } else {
                    console.error('Video ref or stream is null:', { videoRef: videoRef.current, stream });
                }
            }, 200);
        } catch (err: any) {
            setError(err.message || 'Không thể khởi động camera');
            setCameraStarted(false);
        }
    };

    // Hàm capture với hướng dẫn di chuyển khuôn mặt (như iPhone FaceID setup)
    // Sử dụng face-api.js để tạo REAL face embedding
    const captureWithFaceMovement = async (): Promise<number[]> => {
        if (!videoRef.current) {
            throw new Error('Camera chưa được khởi động');
        }

        setIsCapturing(true);
        setCaptureProgress(0);
        const vectors: number[][] = [];
        const steps: Array<'center' | 'left' | 'right' | 'up' | 'down'> = ['center', 'left', 'right', 'up', 'down'];
        const totalSteps = steps.length * 2; // 2 captures per step
        let currentStep = 0;
        
        for (const step of steps) {
            setCaptureStep(step);
            
            // Đợi người dùng di chuyển khuôn mặt (1.5 giây cho mỗi bước)
            await new Promise((resolve) => setTimeout(resolve, 1500));
            
            // Capture 2 lần ở mỗi góc độ để có nhiều dữ liệu
            for (let i = 0; i < 2; i++) {
                try {
                    const result = await faceApiService.detectFaceFromVideo(videoRef.current);
                    
                    if (result.confidence >= 0.5) {
                        vectors.push(result.faceVector);
                        console.log(`[FaceIDEnroll] Captured at ${step}, confidence: ${result.confidence.toFixed(3)}`);
                    }
                    
                    currentStep++;
                    setCaptureProgress(Math.round((currentStep / totalSteps) * 100));
                    
                    // Đợi một chút giữa các lần capture
                    if (i < 1) {
                        await new Promise((resolve) => setTimeout(resolve, 300));
                    }
                } catch (error) {
                    console.warn(`[FaceIDEnroll] Failed to capture at ${step} step:`, error);
                }
            }
        }
        
        setCaptureStep('complete');
        setIsCapturing(false);
        
        if (vectors.length === 0) {
            throw new Error('Không thể phát hiện khuôn mặt trong bất kỳ góc độ nào');
        }

        console.log(`[FaceIDEnroll] Captured ${vectors.length} vectors`);
        
        // Tính trung bình các vectors và normalize
        const averageVector = vectors.reduce(
            (acc, vector) => acc.map((val, idx) => val + vector[idx]),
            new Array(vectors[0].length).fill(0)
        ).map(val => val / vectors.length);
        
        // L2 normalize
        const magnitude = Math.sqrt(averageVector.reduce((sum, val) => sum + val * val, 0));
        const normalizedVector = magnitude > 0 ? averageVector.map(val => val / magnitude) : averageVector;
        
        console.log(`[FaceIDEnroll] Final vector length: ${normalizedVector.length}`);
        
        return normalizedVector;
    };

    const handleEnroll = async () => {
        try {
            setIsProcessing(true);
            setError('');
            setSuccess(false);

            // Capture với hướng dẫn di chuyển khuôn mặt để lấy nhiều góc độ
            const faceVector = await captureWithFaceMovement();

            // Gọi API enroll
            await authService.enrollFaceID(email, faceVector);

            setSuccess(true);
            setIsProcessing(false);

            // Gọi callback sau 2 giây
            setTimeout(() => {
                onSuccess?.();
            }, 2000);
        } catch (err: any) {
            setIsProcessing(false);
            setIsCapturing(false);
            setCaptureStep('idle');
            setCaptureProgress(0);
            let errorMessage = err.message || err.response?.data?.message || 'Đăng ký FaceID thất bại';
            
            setError(errorMessage);
        }
    };

    const handleCancel = () => {
        stopCamera();
        setCameraStarted(false);
        setCaptureStep('idle');
        setCaptureProgress(0);
        onCancel?.();
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                    <User className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Đăng Ký FaceID</h2>
                <p className="text-neutral-600 mt-2">Chụp nhiều góc để tăng độ chính xác</p>
            </div>

            {/* Models Loading Indicator */}
            {isModelsLoading && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                    <span className="text-blue-700 text-sm font-medium">Đang tải AI models...</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-700 text-sm font-medium">Đăng ký FaceID thành công!</span>
                </div>
            )}

            <div className="space-y-6">
                {/* Camera Preview */}
                <div className="relative bg-neutral-900 rounded-xl overflow-hidden aspect-video">
                    {!cameraStarted ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                            <div className="text-center text-white">
                                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-400">Camera chưa được khởi động</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{
                                    transform: 'scaleX(-1)', // Mirror effect for better UX
                                }}
                            />
                            {/* Face detection overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-64 h-64 border-2 border-primary-500 rounded-full opacity-75"></div>
                            </div>
                            
                            {/* Face movement guide overlay */}
                            {isCapturing && captureStep !== 'idle' && captureStep !== 'complete' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 pointer-events-none">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center max-w-sm">
                                        {captureStep === 'center' && (
                                            <>
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary-500 flex items-center justify-center animate-pulse">
                                                    <Camera className="w-10 h-10 text-primary-500" />
                                                </div>
                                                <p className="text-white text-lg font-semibold mb-2">Nhìn thẳng vào camera</p>
                                                <p className="text-white/80 text-sm">Giữ nguyên vị trí...</p>
                                            </>
                                        )}
                                        {captureStep === 'left' && (
                                            <>
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary-500 flex items-center justify-center animate-pulse">
                                                    <ArrowLeft className="w-10 h-10 text-primary-500" />
                                                </div>
                                                <p className="text-white text-lg font-semibold mb-2">Quay đầu sang trái</p>
                                                <p className="text-white/80 text-sm">Từ từ quay đầu...</p>
                                            </>
                                        )}
                                        {captureStep === 'right' && (
                                            <>
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary-500 flex items-center justify-center animate-pulse">
                                                    <ArrowRight className="w-10 h-10 text-primary-500" />
                                                </div>
                                                <p className="text-white text-lg font-semibold mb-2">Quay đầu sang phải</p>
                                                <p className="text-white/80 text-sm">Từ từ quay đầu...</p>
                                            </>
                                        )}
                                        {captureStep === 'up' && (
                                            <>
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary-500 flex items-center justify-center animate-pulse">
                                                    <ArrowUp className="w-10 h-10 text-primary-500" />
                                                </div>
                                                <p className="text-white text-lg font-semibold mb-2">Nhìn lên trên</p>
                                                <p className="text-white/80 text-sm">Từ từ ngẩng đầu...</p>
                                            </>
                                        )}
                                        {captureStep === 'down' && (
                                            <>
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-primary-500 flex items-center justify-center animate-pulse">
                                                    <ArrowDown className="w-10 h-10 text-primary-500" />
                                                </div>
                                                <p className="text-white text-lg font-semibold mb-2">Nhìn xuống dưới</p>
                                                <p className="text-white/80 text-sm">Từ từ cúi đầu...</p>
                                            </>
                                        )}
                                        
                                        {/* Progress bar */}
                                        <div className="mt-4">
                                            <div className="w-full bg-white/20 rounded-full h-2">
                                                <div 
                                                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${captureProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-white/60 text-xs mt-1">{captureProgress}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Capture complete */}
                            {isCapturing && captureStep === 'complete' && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg z-20">
                                    <p className="text-sm">Đang xử lý và lưu dữ liệu...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Instructions */}
                {!isCapturing && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Hướng dẫn đăng ký:</h3>
                        <ul className="text-xs text-neutral-600 space-y-1">
                            <li>• Khi nhấn "Đăng Ký FaceID", bạn sẽ được hướng dẫn di chuyển khuôn mặt</li>
                            <li>• Làm theo hướng dẫn: nhìn thẳng, quay trái, quay phải, nhìn lên, nhìn xuống</li>
                            <li>• Mỗi góc độ sẽ chụp 2 lần để có dữ liệu tốt nhất</li>
                            <li>• Đảm bảo ánh sáng đủ sáng và đồng đều</li>
                            <li>• Không đeo khẩu trang hoặc che mặt</li>
                            <li>• Giữ khuôn mặt trong khung hình suốt quá trình</li>
                        </ul>
                    </div>
                )}
                
                {isCapturing && captureStep === 'complete' && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            <p className="text-sm font-semibold text-blue-900">Đang xử lý và lưu dữ liệu FaceID...</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    {!cameraStarted ? (
                        <button
                            onClick={handleStartCamera}
                            disabled={hasCamera === false || isProcessing || isModelsLoading || !modelsLoaded}
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isModelsLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang tải AI models...</span>
                                </>
                            ) : hasCamera === false ? (
                                'Camera không khả dụng'
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    <span>Khởi Động Camera</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleEnroll}
                            disabled={isDetecting || isProcessing || isCapturing}
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCapturing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang quét khuôn mặt...</span>
                                </>
                            ) : (isDetecting || isProcessing) ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    <span>Đăng Ký FaceID</span>
                                </>
                            )}
                        </button>
                    )}

                    {cameraStarted && !isCapturing && (
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="w-full bg-neutral-200 text-neutral-700 py-3.5 px-6 rounded-xl hover:bg-neutral-300 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
