import { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { authService, getRoleFromToken, authenticateWithFirebase } from '../../services/Auth';
import { setTokens, setUser } from '../../utils/storage';
import { startNotificationConnection, onReceiveNotification, onUnreadCountUpdated, getUnreadCount } from '../../services/notificationHub';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FaceIDLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onSwitchToPassword?: () => void;
}

export default function FaceIDLogin({ onSuccess, onCancel, onSwitchToPassword }: FaceIDLoginProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const { setUnread, pushItem } = useNotification();
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    videoRef,
    isDetecting,
    hasCamera,
    checkCamera,
    startCamera,
    stopCamera,
    captureMultipleWithResults,
  } = useFaceDetection({
    minConfidence: 0.5,
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    // Kiểm tra camera khi component mount
    checkCamera();

    return () => {
      // Cleanup khi unmount
      stopCamera();
    };
  }, [checkCamera, stopCamera]);

  // Đảm bảo video play khi camera started và stream được gán
  useEffect(() => {
    if (cameraStarted && videoRef.current) {
      const video = videoRef.current;
      console.log('useEffect: cameraStarted, video element:', video);
      console.log('useEffect: video srcObject:', video.srcObject);

      // Nếu chưa có stream, đợi một chút
      if (!video.srcObject) {
        console.log('Video srcObject is null, waiting...');
        const timeout = setTimeout(() => {
          if (videoRef.current && !videoRef.current.srcObject) {
            console.error('Video srcObject still null after timeout');
          }
        }, 1000);
        return () => clearTimeout(timeout);
      }

      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded in useEffect');
        video.play().catch((err) => {
          console.error('Error playing video:', err);
        });
      };

      const handleCanPlay = () => {
        console.log('Video can play in useEffect');
        video.play().catch((err) => {
          console.error('Error playing video:', err);
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);

      // Nếu đã ready, play ngay
      if (video.readyState >= 2) {
        console.log('Video readyState >= 2, playing immediately');
        video.play().catch((err) => {
          console.error('Error playing video:', err);
        });
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [cameraStarted]);


  const handleStartCamera = async () => {
    try {
      setError('');
      setIsStartingCamera(true);
      console.log('Starting camera...');
      const stream = await startCamera();
      console.log('Camera stream obtained:', stream);
      console.log('Video ref:', videoRef.current);

      // Set camera started first so video element renders
      setCameraStarted(true);
      setIsStartingCamera(false);

      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log('Assigning stream to video element...');
          videoRef.current.srcObject = stream;

          const video = videoRef.current;

          const playVideo = () => {
            video.play()
              .then(() => {
                console.log('Video playing successfully');
              })
              .catch((err) => {
                console.error('Error playing video:', err);
                setError('Không thể phát video từ camera: ' + err.message);
              });
          };

          // Try to play immediately
          if (video.readyState >= 2) {
            playVideo();
          } else {
            // Wait for metadata
            video.onloadedmetadata = () => {
              console.log('Video metadata loaded');
              playVideo();
            };

            video.oncanplay = () => {
              console.log('Video can play');
              playVideo();
            };
          }
        } else {
          console.error('Video ref or stream is null:', { videoRef: videoRef.current, stream });
        }
      }, 200);

    } catch (err: any) {
      console.error('Camera start error:', err);
      setError(err.message || 'Không thể khởi động camera');
      setCameraStarted(false);
      setIsStartingCamera(false);
    }
  };

  const handleCapture = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccess(false);

      // Capture nhiều lần ở góc thẳng (5 lần) để có nhiều cơ hội khớp
      // Đơn giản hơn - không cần di chuyển khuôn mặt khi login
      const results = await captureMultipleWithResults(5);

      // Thử login với từng vector riêng lẻ (từ confidence cao nhất xuống thấp nhất)
      // Điều này giúp tăng khả năng khớp vì mỗi lần capture có thể có điều kiện khác nhau
      let lastError: any = null;

      for (const result of results) {
        try {
          const response = await authService.loginWithFaceID(result.vector);
          // Nếu thành công, break và tiếp tục xử lý
          await handleLoginSuccess(response);
          return; // Thoát khỏi hàm nếu login thành công
        } catch (err: any) {
          lastError = err;
          // Tiếp tục thử với vector tiếp theo
          continue;
        }
      }

      // Nếu thử với từng vector riêng lẻ không thành công, thử với vector trung bình
      const averageVector = results.reduce(
        (acc, result) => {
          return acc.map((val, idx) => val + result.vector[idx]);
        },
        new Array(results[0].vector.length).fill(0)
      ).map(val => val / results.length);

      // L2 normalize vector trung bình
      const magnitude = Math.sqrt(averageVector.reduce((sum, val) => sum + val * val, 0));
      const normalizedAverageVector = magnitude > 0
        ? averageVector.map(val => val / magnitude)
        : averageVector;

      try {
        const response = await authService.loginWithFaceID(normalizedAverageVector);
        await handleLoginSuccess(response);
        return;
      } catch (err: any) {
        lastError = err;
      }

      // Nếu tất cả đều thất bại, throw lỗi cuối cùng
      throw lastError || new Error('Không thể đăng nhập bằng FaceID');

    } catch (err: any) {
      setIsProcessing(false);
      let errorMessage = err.message || err.response?.data?.message || err.normalizedMessage || 'Đăng nhập bằng FaceID thất bại';

      // Hiển thị thông báo rõ ràng hơn cho các lỗi phổ biến
      if (errorMessage.includes('billing') || errorMessage.includes('Billing')) {
        errorMessage = 'Google Vision API yêu cầu bật billing. Vui lòng liên hệ admin để bật billing trong Google Cloud Console.';
      } else if (errorMessage.includes('No matching face found') || errorMessage.includes('not found') || errorMessage.includes('not match') || errorMessage.includes('similarity')) {
        errorMessage = 'Không tìm thấy khuôn mặt khớp với dữ liệu đã đăng ký.\n\nVui lòng:\n• Đảm bảo ánh sáng đủ sáng và đều\n• Nhìn thẳng vào camera, không nghiêng đầu\n• Giữ khoảng cách vừa phải với camera\n• Thử lại hoặc đăng nhập bằng Email/Password';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Không thể xác thực khuôn mặt. Vui lòng thử lại hoặc đăng nhập bằng Email/Password.';
      }

      setError(errorMessage);
    }
  };

  const handleLoginSuccess = async (response: any) => {
    // Lấy role từ JWT token
    const frontendRole = getRoleFromToken(response.accessToken);

    if (!frontendRole) {
      setError('Không thể xác định quyền người dùng');
      setIsProcessing(false);
      return;
    }

    // Lưu tokens
    setTokens(response.accessToken, response.refreshToken, false);
    window.dispatchEvent(new Event('storage'));

    // Authenticate với Firebase
    // Note: Với FaceID login, chúng ta không có password
    // Có thể cần xử lý khác hoặc bỏ qua Firebase auth
    try {
      // Thử authenticate với Firebase nếu có custom token
      if (response.firebaseCustomToken) {
        await authenticateWithFirebase(response, response.email, '', frontendRole);
      }
    } catch (firebaseError) {
      console.warn('Firebase authentication skipped for FaceID login:', firebaseError);
    }

    // Lưu thông tin user
    const userData = {
      id: response.userID,
      email: response.email,
      name: response.fullName,
      role: frontendRole,
      avatar: undefined,
    };
    setUser(userData, false);

    // Khởi tạo kết nối SignalR
    try {
      await startNotificationConnection();
      try {
        const count = await getUnreadCount();
        if (typeof count === 'number') setUnread(count);
      } catch {
        // Ignore error
      }
      onReceiveNotification((n: any) => {
        pushItem(n);
        console.log('ReceiveNotification', n);
      });
      onUnreadCountUpdated((count: number) => {
        if (typeof count === 'number') setUnread(count);
      });
    } catch (e) {
      console.warn('Không thể khởi tạo kết nối thông báo realtime:', e);
    }

    // Gọi login từ AuthContext
    await login(
      response.email,
      '',
      frontendRole as 'Staff TA' | 'Staff Accountant' | 'Staff Sales' | 'Developer' | 'Manager' | 'Admin'
    );

    setSuccess(true);
    setIsProcessing(false);

    // Redirect sau 1.5 giây
    setTimeout(() => {
      switch (frontendRole) {
        case 'Staff TA':
          navigate('/ta/dashboard');
          break;
        case 'Staff Accountant':
          navigate('/accountant/dashboard');
          break;
        case 'Staff Sales':
          navigate('/sales/dashboard');
          break;
        case 'Developer':
          navigate('/developer/dashboard');
          break;
        case 'Manager':
          navigate('/manager/dashboard');
          break;
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
      onSuccess?.();
    }, 1500);
  };

  const handleCancel = () => {
    stopCamera();
    setCameraStarted(false);
    setIsStartingCamera(false);
    setError('');
    onCancel?.();
  };

  const handleSwitchToPassword = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Switching to password login...');
    stopCamera();
    if (onSwitchToPassword) {
      onSwitchToPassword();
    } else {
      console.warn('onSwitchToPassword callback not provided');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
          <Camera className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold leading-normal bg-gradient-to-r from-neutral-900 via-primary-700 to-indigo-700 bg-clip-text text-transparent">
          Đăng Nhập Bằng FaceID
        </h2>
        <p className="text-neutral-600 mt-2">Đặt khuôn mặt của bạn vào khung hình</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
          <span className="text-error-700 text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl flex items-center space-x-3 animate-slide-down shadow-soft">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700 text-sm font-medium">✅ Đăng nhập thành công! Đang chuyển hướng...</span>
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
                  backgroundColor: '#000',
                  minHeight: '100%',
                  minWidth: '100%'
                }}
                onLoadedMetadata={(e) => {
                  console.log('Video metadata loaded in component', e);
                  const video = e.currentTarget;
                  video.play().catch((err) => {
                    console.error('Error playing in onLoadedMetadata:', err);
                  });
                }}
                onCanPlay={(e) => {
                  console.log('Video can play in component', e);
                  const video = e.currentTarget;
                  video.play().catch((err) => {
                    console.error('Error playing in onCanPlay:', err);
                  });
                }}
                onPlay={() => {
                  console.log('Video is playing!');
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                }}
              />
              {/* Face detection overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-64 h-64 border-2 border-primary-500 rounded-full opacity-75"></div>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Hướng dẫn:</h3>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li>• Đảm bảo ánh sáng đủ sáng</li>
            <li>• Nhìn thẳng vào camera</li>
            <li>• Giữ khuôn mặt trong khung hình</li>
            <li>• Không đeo khẩu trang hoặc che mặt</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!cameraStarted ? (
            <button
              onClick={handleStartCamera}
              disabled={hasCamera === false || isStartingCamera || isProcessing}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none flex items-center justify-center gap-2"
              type="button"
            >
              {isStartingCamera ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang khởi động camera...</span>
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
              onClick={handleCapture}
              disabled={isDetecting || isProcessing}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg transform hover:scale-102 active:scale-98 disabled:transform-none flex items-center justify-center gap-2"
              type="button"
            >
              {(isDetecting || isProcessing) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Đăng Nhập</span>
                </>
              )}
            </button>
          )}

          {cameraStarted && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full bg-neutral-200 text-neutral-700 py-3.5 px-6 rounded-xl hover:bg-neutral-300 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-102 active:scale-98 disabled:transform-none"
              type="button"
            >
              Hủy
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handleSwitchToPassword(e)}
            disabled={isProcessing}
            className="w-full bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600 active:bg-primary-100 font-semibold transition-all duration-300 text-base py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-primary-500 relative z-10 cursor-pointer"
            style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
          >
            Đăng nhập bằng Email/Password
          </button>
        </div>
      </div>
    </div>
  );
}

