import { useState } from 'react';
import { FileText, Ban } from 'lucide-react';
import { TalentDetailBasicInfoSection } from './TalentDetailBasicInfoSection';
import { type Talent } from '../../../services/Talent';
import { type ClientTalentBlacklist } from '../../../services/ClientTalentBlacklist';

interface TalentDetailBasicInfoTabsProps {
  talent: Talent;
  locationName: string;
  partnerName: string;
  blacklists: ClientTalentBlacklist[];
  workingModeLabels: Record<number, string>;
  formatLinkDisplay: (url?: string) => string;
}

export function TalentDetailBasicInfoTabs({
  talent,
  locationName,
  partnerName,
  blacklists,
  workingModeLabels,
  formatLinkDisplay,
}: TalentDetailBasicInfoTabsProps) {
  const [basicInfoTab, setBasicInfoTab] = useState<'info' | 'blacklist'>('info');

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 mb-8 animate-fade-in">
      {/* Tab Headers */}
      <div className="border-b border-neutral-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setBasicInfoTab('info')}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
              basicInfoTab === 'info'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Thông tin cơ bản
          </button>
          {blacklists.length > 0 && (
            <button
              onClick={() => setBasicInfoTab('blacklist')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-300 whitespace-nowrap border-b-2 ${
                basicInfoTab === 'blacklist'
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Ban className="w-4 h-4" />
              Cảnh báo Blacklist
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                {blacklists.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {basicInfoTab === 'info' && (
          <TalentDetailBasicInfoSection
            talent={talent}
            locationName={locationName}
            partnerName={partnerName}
            blacklists={blacklists}
            workingModeLabels={workingModeLabels}
            formatLinkDisplay={formatLinkDisplay}
          />
        )}
        {basicInfoTab === 'blacklist' && blacklists.length > 0 && (
          <TalentDetailBasicInfoSection
            talent={talent}
            locationName={locationName}
            partnerName={partnerName}
            blacklists={blacklists}
            workingModeLabels={workingModeLabels}
            formatLinkDisplay={formatLinkDisplay}
          />
        )}
      </div>
    </div>
  );
}

