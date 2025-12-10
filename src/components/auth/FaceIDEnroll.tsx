import { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, Loader2, User } from 'lucide-react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
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
    const [totalCaptures] = useState(3);

    const {
        videoRef,
        isDetecting,
        error: detectionError,
        hasCamera,
        checkCamera,
        startCamera,
        stopCamera,
        captureMultiple,
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

    const handleEnroll = async () => {
        try {
            setIsProcessing(true);
            setError('');
            setSuccess(false);

            // Capture nhiều ảnh và tính trung bình
            const faceVector = await captureMultiple(totalCaptures);

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
      let errorMessage = err.message || err.response?.data?.message || 'Đăng ký FaceID thất bại';
      
      // Hiển thị thông báo rõ ràng hơn cho lỗi billing
      if (errorMessage.includes('billing') || errorMessage.includes('Billing')) {
        errorMessage = 'Google Vision API yêu cầu bật billing. Vui lòng liên hệ admin để bật billing trong Google Cloud Console.';
      }
      
      setError(errorMessage);
    }
    };

    const handleCancel = () => {
        stopCamera();
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

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-green-700 text-sm font-medium">✅ Đăng ký FaceID thành công!</span>
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
                            />
                            {/* Face detection overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 border-2 border-primary-500 rounded-full opacity-75"></div>
                            </div>
                            {/* Capture progress */}
                            {isProcessing && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
                                    <p className="text-sm">Đang xử lý {totalCaptures} ảnh...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-2">Hướng dẫn đăng ký:</h3>
                    <ul className="text-xs text-neutral-600 space-y-1">
                        <li>• Hệ thống sẽ chụp {totalCaptures} ảnh từ các góc độ khác nhau</li>
                        <li>• Đảm bảo ánh sáng đủ sáng và đồng đều</li>
                        <li>• Nhìn thẳng vào camera, sau đó quay nhẹ sang trái, phải</li>
                        <li>• Không đeo khẩu trang hoặc che mặt</li>
                        <li>• Giữ khuôn mặt trong khung hình suốt quá trình</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {!cameraStarted ? (
                        <button
                            onClick={handleStartCamera}
                            disabled={hasCamera === false || isProcessing}
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hasCamera === false ? 'Camera không khả dụng' : 'Khởi Động Camera'}
                        </button>
                    ) : (
                        <button
                            onClick={handleEnroll}
                            disabled={isDetecting || isProcessing}
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {(isDetecting || isProcessing) ? (
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

                    {cameraStarted && (
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

