interface PageLoaderProps {
  phase?: 'phase1' | 'complete';
}

export default function PageLoader({ phase }: PageLoaderProps = {}) {
  const getLoadingMessage = () => {
    switch (phase) {
      case 'phase1':
        return 'Đang tải toàn bộ dữ liệu...';
      default:
        return 'Đang tải...';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-sm text-gray-600">{getLoadingMessage()}</p>
      </div>
    </div>
  );
}

