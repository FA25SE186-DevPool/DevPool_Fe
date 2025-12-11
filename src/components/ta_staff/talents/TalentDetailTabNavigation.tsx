import { FileText, Briefcase, Target, Star, FolderOpen, Award, Clock } from 'lucide-react';

export type TalentDetailTab =
  | 'projects'
  | 'cvs'
  | 'jobRoleLevels'
  | 'skills'
  | 'availableTimes'
  | 'certificates'
  | 'experiences';

interface TalentDetailTabNavigationProps {
  activeTab: TalentDetailTab;
  onTabChange: (tab: TalentDetailTab) => void;
}

export function TalentDetailTabNavigation({
  activeTab,
  onTabChange,
}: TalentDetailTabNavigationProps) {
  const tabs: Array<{ id: TalentDetailTab; label: string; icon: React.ReactNode }> = [
    { id: 'cvs', label: 'CV', icon: <FileText className="w-4 h-4" /> },
    { id: 'jobRoleLevels', label: 'Vị trí', icon: <Target className="w-4 h-4" /> },
    { id: 'skills', label: 'Kỹ năng', icon: <Star className="w-4 h-4" /> },
    { id: 'projects', label: 'Dự án', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'experiences', label: 'Kinh nghiệm', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'certificates', label: 'Chứng chỉ', icon: <Award className="w-4 h-4" /> },
    { id: 'availableTimes', label: 'Thời gian', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
      <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm rounded-t-2xl">
        <div className="flex overflow-x-auto scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-white'
                  : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

