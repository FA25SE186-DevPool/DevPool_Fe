import { X, Target, Search, ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../../ui/button';
import { type TalentJobRoleLevelCreateModel } from '../../../services/Talent';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';

interface TalentJobRoleLevelsSectionProps {
  talentJobRoleLevels: TalentJobRoleLevelCreateModel[];
  jobRoleLevels: JobRoleLevel[];
  selectedJobRoleFilterId: Record<number, number | undefined>;
  setSelectedJobRoleFilterId: (filters: Record<number, number | undefined> | ((prev: Record<number, number | undefined>) => Record<number, number | undefined>)) => void;
  selectedJobRoleLevelName: Record<number, string>;
  setSelectedJobRoleLevelName: (names: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  jobRoleLevelNameSearch: Record<number, string>;
  setJobRoleLevelNameSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isJobRoleLevelNameDropdownOpen: Record<number, boolean>;
  setIsJobRoleLevelNameDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  errors: Record<string, string>;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentJobRoleLevelCreateModel, value: string | number | undefined) => void;
  onSetErrors?: (errors: Record<string, string>) => void;
  initialCVs?: Array<{ jobRoleLevelId?: number }>; // CV Ban Đầu để filter vị trí
}

/**
 * Component section quản lý vị trí công việc (Job Role Levels) của Talent
 */
export function TalentJobRoleLevelsSection({
  talentJobRoleLevels,
  jobRoleLevels,
  selectedJobRoleFilterId,
  selectedJobRoleLevelName,
  setSelectedJobRoleLevelName,
  jobRoleLevelNameSearch,
  setJobRoleLevelNameSearch,
  isJobRoleLevelNameDropdownOpen,
  setIsJobRoleLevelNameDropdownOpen,
  errors,
  onRemove,
  onUpdate,
  onSetErrors,
  initialCVs,
}: TalentJobRoleLevelsSectionProps) {
  // Lấy các jobRoleLevelId và jobRoleId từ CV Ban Đầu (nếu có)
  const cvJobRoleLevelIds = initialCVs
    ?.filter((cv) => cv.jobRoleLevelId && cv.jobRoleLevelId > 0)
    .map((cv) => cv.jobRoleLevelId!)
    .filter((id, index, self) => self.indexOf(id) === index) || [];

  // Lấy các jobRoleId từ CV (để filter theo loại vị trí)
  const cvJobRoleIds = cvJobRoleLevelIds.length > 0
    ? jobRoleLevels
        .filter((jrl) => cvJobRoleLevelIds.includes(jrl.id))
        .map((jrl) => jrl.jobRoleId)
        .filter((id, index, self) => self.indexOf(id) === index)
    : [];

  // Nếu có CV, chỉ hiển thị các vị trí từ CV và cùng loại (jobRole)
  const availableJobRoleLevels = cvJobRoleLevelIds.length > 0
    ? jobRoleLevels.filter((jrl) => cvJobRoleIds.includes(jrl.jobRoleId))
    : jobRoleLevels;


  // Tự động set selectedJobRoleLevelName từ jobRoleLevelId khi có giá trị
  useEffect(() => {
    talentJobRoleLevels.forEach((jrl, index) => {
      if (jrl.jobRoleLevelId && jrl.jobRoleLevelId > 0) {
        const jobRoleLevel = jobRoleLevels.find((l) => l.id === jrl.jobRoleLevelId);
        if (jobRoleLevel && (!selectedJobRoleLevelName[index] || selectedJobRoleLevelName[index] !== jobRoleLevel.name)) {
          setSelectedJobRoleLevelName((prev) => ({
            ...prev,
            [index]: jobRoleLevel.name || '',
          }));
        }
      }
    });
  }, [talentJobRoleLevels, jobRoleLevels, selectedJobRoleLevelName, setSelectedJobRoleLevelName]);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Vị trí <span className="text-red-500">*</span>
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {talentJobRoleLevels.map((_jrl, index) => {

          return (
            <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-neutral-700">Vị trí #{index + 1}</span>
                <Button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={talentJobRoleLevels.length <= 1}
                  variant="ghost"
                  className={`text-red-600 hover:text-red-700 p-1 ${
                    talentJobRoleLevels.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={
                    talentJobRoleLevels.length <= 1
                      ? 'Vị trí là bắt buộc. Phải có ít nhất 1 vị trí.'
                      : 'Xóa vị trí'
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Job Role Level Name Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Vị trí <span className="text-red-500">*</span>
                  </label>

                  {/* Job Role Level Name Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsJobRoleLevelNameDropdownOpen((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                        errors[`jobrolelevel_${index}`]
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-500" />
                        <span
                          className={
                            selectedJobRoleLevelName[index]
                              ? 'font-medium text-neutral-900'
                              : 'text-neutral-500'
                          }
                        >
                          {selectedJobRoleLevelName[index] || 'Chọn vị trí'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isJobRoleLevelNameDropdownOpen[index] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isJobRoleLevelNameDropdownOpen[index] && (
                      <div
                        className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => {
                          setIsJobRoleLevelNameDropdownOpen((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                          setJobRoleLevelNameSearch((prev) => ({
                            ...prev,
                            [index]: '',
                          }));
                        }}
                      >
                        <div className="p-3 border-b border-neutral-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                              type="text"
                              value={jobRoleLevelNameSearch[index] || ''}
                              onChange={(e) =>
                                setJobRoleLevelNameSearch((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Tìm vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {(() => {
                            // Sử dụng availableJobRoleLevels thay vì jobRoleLevels
                            let uniqueNames = Array.from(
                              new Set(availableJobRoleLevels.map((jrl) => jrl.name))
                            );
                            if (selectedJobRoleFilterId[index]) {
                              const filteredByJobRole = availableJobRoleLevels.filter(
                                (l) => l.jobRoleId === selectedJobRoleFilterId[index]
                              );
                              uniqueNames = Array.from(
                                new Set(filteredByJobRole.map((jrl) => jrl.name))
                              );
                            }
                            const filtered = jobRoleLevelNameSearch[index]
                              ? uniqueNames.filter((name) =>
                                  name
                                    .toLowerCase()
                                    .includes((jobRoleLevelNameSearch[index] || '').toLowerCase())
                                )
                              : uniqueNames;
                            if (filtered.length === 0) {
                              return (
                                <p className="px-4 py-3 text-sm text-neutral-500">
                                  Không tìm thấy vị trí nào
                                </p>
                              );
                            }
                            return filtered.map((name) => (
                              <button
                                type="button"
                                key={name}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedJobRoleLevelName((prev) => ({
                                    ...prev,
                                    [index]: name,
                                  }));
                                  setIsJobRoleLevelNameDropdownOpen((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                  setJobRoleLevelNameSearch((prev) => ({
                                    ...prev,
                                    [index]: '',
                                  }));
                                  onUpdate(index, 'jobRoleLevelId', undefined);
                                  if (onSetErrors) {
                                    const newErrors = { ...errors };
                                    delete newErrors[`jobrolelevel_${index}`];
                                    onSetErrors(newErrors);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleLevelName[index] === name
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {name}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

