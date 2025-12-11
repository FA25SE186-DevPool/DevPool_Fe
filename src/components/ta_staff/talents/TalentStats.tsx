
interface Stat {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  icon: React.ReactNode;
}

interface TalentStatsProps {
  stats: Stat[];
  startIndex: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Component hiển thị thống kê talents
 */
export function TalentStats({ stats, startIndex, pageSize, onPrev, onNext }: TalentStatsProps) {
  const statsSlice = stats.slice(startIndex, Math.min(startIndex + pageSize, stats.length));
  const canShowNav = stats.length > pageSize;
  const canGoPrev = canShowNav && startIndex > 0;
  const canGoNext = canShowNav && startIndex + pageSize < stats.length;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-primary-100 text-primary-600 group-hover:bg-primary-200';
      case 'green':
        return 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200';
      case 'purple':
        return 'bg-accent-100 text-accent-600 group-hover:bg-accent-200';
      case 'gray':
        return 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200';
      default:
        return 'bg-warning-100 text-warning-600 group-hover:bg-warning-200';
    }
  };

  return (
    <div className="mb-8 animate-fade-in">
      <div className="relative">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsSlice.map((stat, index) => (
            <div
              key={`${stat.title}-${startIndex + index}`}
              className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getColorClasses(stat.color)} transition-all duration-300`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        {canShowNav && (
          <>
            <button
              type="button"
              onClick={onPrev}
              disabled={!canGoPrev}
              className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                canGoPrev
                  ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                  : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
              }`}
              aria-label="Xem thống kê phía trước"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                canGoNext
                  ? 'h-9 w-9 bg-white/90 backdrop-blur border-neutral-200 text-neutral-600 shadow-soft hover:text-primary-600 hover:border-primary-300'
                  : 'h-9 w-9 bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed'
              }`}
              aria-label="Xem thống kê tiếp theo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      {canShowNav && (
        <div className="mt-3 flex justify-end text-xs text-neutral-500 lg:hidden">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canGoPrev}
              className={canGoPrev ? 'text-primary-600 hover:text-primary-700' : 'text-neutral-300 cursor-not-allowed'}
            >
              Trước
            </button>
            <span className="text-neutral-400">
              {startIndex + 1}-{Math.min(startIndex + pageSize, stats.length)} / {stats.length}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={canGoNext ? 'text-primary-600 hover:text-primary-700' : 'text-neutral-300 cursor-not-allowed'}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

