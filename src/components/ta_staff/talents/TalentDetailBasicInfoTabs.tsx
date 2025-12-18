import { useState } from 'react';
import { FileText, Briefcase, Target, Star, FolderOpen, Award, Clock } from 'lucide-react';
import { TalentDetailBasicInfoSection } from './TalentDetailBasicInfoSection';
import { type Talent } from '../../../services/Talent';
import { type ClientTalentBlacklist } from '../../../services/ClientTalentBlacklist';
import { type TalentDetailTab } from './TalentDetailTabNavigation';

interface TalentDetailBasicInfoTabsProps {
  talent: Talent;
  locationName: string;
  partnerName: string;
  blacklists: ClientTalentBlacklist[];
  workingModeLabels: Record<number, string>;
  formatLinkDisplay: (url?: string) => string;
  onPartnerClick?: () => void;
  activeTab: TalentDetailTab | null;
  onTabChange: (tab: TalentDetailTab | null) => void;
  tabContent?: React.ReactNode;
}

export function TalentDetailBasicInfoTabs({
  talent,
  locationName,
  partnerName,
  blacklists,
  workingModeLabels,
  formatLinkDisplay,
  onPartnerClick,
  activeTab,
  onTabChange,
  tabContent,
}: TalentDetailBasicInfoTabsProps) {
  const [basicInfoTab, setBasicInfoTab] = useState<'info'>('info');

  // Các tab con (CV, Vị trí, Kỹ năng, v.v.)
  const detailTabs: Array<{ id: TalentDetailTab; label: string; icon: React.ReactNode }> = [
    { id: 'cvs', label: 'CV', icon: <FileText className="w-4 h-4" /> },
    { id: 'jobRoleLevels', label: 'Vị trí', icon: <Target className="w-4 h-4" /> },
    { id: 'skills', label: 'Kỹ năng', icon: <Star className="w-4 h-4" /> },
    { id: 'projects', label: 'Dự án', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'experiences', label: 'Kinh nghiệm', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'certificates', label: 'Chứng chỉ', icon: <Award className="w-4 h-4" /> },
    { id: 'availableTimes', label: 'Thời gian', icon: <Clock className="w-4 h-4" /> },
  ];

  // Kiểm tra xem có tab con nào đang được chọn không
  const isDetailTabActive = activeTab !== null;

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
      {/* Tab Headers - cùng hàng với tab Thông tin */}
      <div className="border-b border-neutral-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Tab Thông tin cơ bản */}
          <button
            onClick={() => {
              setBasicInfoTab('info');
              onTabChange(null); // Clear activeTab để hiển thị tab Thông tin
            }}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 flex-shrink-0 ${
              !isDetailTabActive && basicInfoTab === 'info'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Thông tin
          </button>
          
          {/* Các tab con (CV, Vị trí, Kỹ năng, v.v.) */}
          {detailTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Nội dung tab Thông tin */}
        {!isDetailTabActive && basicInfoTab === 'info' && (
          <TalentDetailBasicInfoSection
            talent={talent}
            locationName={locationName}
            partnerName={partnerName}
            blacklists={blacklists}
            workingModeLabels={workingModeLabels}
            formatLinkDisplay={formatLinkDisplay}
            onPartnerClick={onPartnerClick}
          />
        )}
        
        {/* Nội dung các tab khác (CV, Vị trí, Kỹ năng, v.v.) */}
        {isDetailTabActive && tabContent}
      </div>
    </div>
  );
}
