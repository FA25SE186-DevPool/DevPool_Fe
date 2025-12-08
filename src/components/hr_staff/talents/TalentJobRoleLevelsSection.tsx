import { Plus, X, Target, Filter, Search, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import { type TalentJobRoleLevelCreateModel } from '../../../services/Talent';
import { type JobRole } from '../../../services/JobRole';
import { type JobRoleLevel } from '../../../services/JobRoleLevel';

interface TalentJobRoleLevelsSectionProps {
  talentJobRoleLevels: TalentJobRoleLevelCreateModel[];
  jobRoles: JobRole[];
  jobRoleLevels: JobRoleLevel[];
  selectedJobRoleFilterId: Record<number, number | undefined>;
  setSelectedJobRoleFilterId: (filters: Record<number, number | undefined> | ((prev: Record<number, number | undefined>) => Record<number, number | undefined>)) => void;
  jobRoleFilterSearch: Record<number, string>;
  setJobRoleFilterSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isJobRoleFilterDropdownOpen: Record<number, boolean>;
  setIsJobRoleFilterDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  selectedJobRoleLevelName: Record<number, string>;
  setSelectedJobRoleLevelName: (names: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  jobRoleLevelNameSearch: Record<number, string>;
  setJobRoleLevelNameSearch: (search: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  isJobRoleLevelNameDropdownOpen: Record<number, boolean>;
  setIsJobRoleLevelNameDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  isLevelDropdownOpen: Record<number, boolean>;
  setIsLevelDropdownOpen: (open: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  errors: Record<string, string>;
  getLevelText: (level: number) => string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentJobRoleLevelCreateModel, value: string | number | undefined) => void;
  onSetErrors?: (errors: Record<string, string>) => void;
}

/**
 * Component section quản lý vị trí công việc (Job Role Levels) của Talent
 */
export function TalentJobRoleLevelsSection({
  talentJobRoleLevels,
  jobRoles,
  jobRoleLevels,
  selectedJobRoleFilterId,
  setSelectedJobRoleFilterId,
  jobRoleFilterSearch,
  setJobRoleFilterSearch,
  isJobRoleFilterDropdownOpen,
  setIsJobRoleFilterDropdownOpen,
  selectedJobRoleLevelName,
  setSelectedJobRoleLevelName,
  jobRoleLevelNameSearch,
  setJobRoleLevelNameSearch,
  isJobRoleLevelNameDropdownOpen,
  setIsJobRoleLevelNameDropdownOpen,
  isLevelDropdownOpen,
  setIsLevelDropdownOpen,
  errors,
  getLevelText,
  onAdd,
  onRemove,
  onUpdate,
  onSetErrors,
}: TalentJobRoleLevelsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vị trí <span className="text-red-500">*</span>
            </h2>
          </div>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {talentJobRoleLevels.map((jrl, index) => {
          const selectedJRL = jobRoleLevels.find((l) => l.id === jrl.jobRoleLevelId);
          const availableLevels = selectedJobRoleLevelName[index]
            ? jobRoleLevels
                .filter((jrl) => jrl.name === selectedJobRoleLevelName[index])
                .map((jrl) => jrl.level)
                .filter((level, idx, self) => self.indexOf(level) === idx)
            : [];
          const selectedJobRoleLevelIds = talentJobRoleLevels
            .filter((_, i) => i !== index)
            .map((jrl) => jrl.jobRoleLevelId)
            .filter((id) => id > 0);

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Role Level Name Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Vị trí <span className="text-red-500">*</span>
                  </label>

                  {/* Filter theo loại vị trí */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsJobRoleFilterDropdownOpen((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-xs border border-neutral-300 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="truncate">
                          {selectedJobRoleFilterId[index]
                            ? jobRoles.find((r) => r.id === selectedJobRoleFilterId[index])?.name ||
                              'Loại vị trí'
                            : 'Tất cả loại vị trí'}
                        </span>
                      </div>
                    </button>
                    {isJobRoleFilterDropdownOpen[index] && (
                      <div
                        className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => {
                          setIsJobRoleFilterDropdownOpen((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                          setJobRoleFilterSearch((prev) => ({
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
                              value={jobRoleFilterSearch[index] || ''}
                              onChange={(e) =>
                                setJobRoleFilterSearch((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }))
                              }
                              placeholder="Tìm loại vị trí..."
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobRoleFilterId((prev) => ({
                                ...prev,
                                [index]: undefined,
                              }));
                              setJobRoleFilterSearch((prev) => ({
                                ...prev,
                                [index]: '',
                              }));
                              setIsJobRoleFilterDropdownOpen((prev) => ({
                                ...prev,
                                [index]: false,
                              }));
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                              !selectedJobRoleFilterId[index]
                                ? 'bg-primary-50 text-primary-700'
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            Tất cả loại vị trí
                          </button>
                          {jobRoles
                            .filter(
                              (role) =>
                                !jobRoleFilterSearch[index] ||
                                role.name
                                  .toLowerCase()
                                  .includes((jobRoleFilterSearch[index] || '').toLowerCase())
                            )
                            .map((role) => (
                              <button
                                type="button"
                                key={role.id}
                                onClick={() => {
                                  setSelectedJobRoleFilterId((prev) => ({
                                    ...prev,
                                    [index]: role.id,
                                  }));
                                  setJobRoleFilterSearch((prev) => ({
                                    ...prev,
                                    [index]: '',
                                  }));
                                  setIsJobRoleFilterDropdownOpen((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm ${
                                  selectedJobRoleFilterId[index] === role.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-neutral-50 text-neutral-700'
                                }`}
                              >
                                {role.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                            let uniqueNames = Array.from(
                              new Set(jobRoleLevels.map((jrl) => jrl.name))
                            );
                            if (selectedJobRoleFilterId[index]) {
                              const filteredByJobRole = jobRoleLevels.filter(
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
                                  onUpdate(index, 'jobRoleLevelId', 0);
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

                {/* Level Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Cấp độ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedJobRoleLevelName[index]) {
                          setIsLevelDropdownOpen((prev) => ({
                            ...prev,
                            [index]: !prev[index],
                          }));
                        }
                      }}
                      disabled={!selectedJobRoleLevelName[index]}
                      className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white text-left focus:ring-2 focus:ring-primary-500/20 transition-all ${
                        errors[`jobrolelevel_${index}`]
                          ? 'border-red-500 bg-red-50'
                          : 'border-neutral-300 focus:border-primary-500 hover:border-primary-300'
                      } ${
                        !selectedJobRoleLevelName[index]
                          ? 'opacity-50 cursor-not-allowed bg-neutral-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Target className="w-4 h-4 text-neutral-500" />
                        <span
                          className={
                            !selectedJobRoleLevelName[index]
                              ? 'text-neutral-400'
                              : selectedJRL
                                ? 'font-medium text-neutral-900'
                                : 'text-neutral-500'
                          }
                        >
                          {!selectedJobRoleLevelName[index]
                            ? 'Chọn vị trí trước'
                            : selectedJRL
                              ? getLevelText(selectedJRL.level)
                              : 'Chọn cấp độ'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isLevelDropdownOpen[index] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isLevelDropdownOpen[index] && selectedJobRoleLevelName[index] && (
                      <div
                        className="absolute z-[60] mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                        onMouseLeave={() => {
                          setIsLevelDropdownOpen((prev) => ({
                            ...prev,
                            [index]: false,
                          }));
                        }}
                      >
                        <div className="max-h-56 overflow-y-auto">
                          {availableLevels.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-neutral-500">
                              Không có cấp độ nào cho vị trí này
                            </p>
                          ) : (
                            availableLevels.map((level) => {
                              const matchingJRL = jobRoleLevels.find(
                                (jrl) =>
                                  jrl.name === selectedJobRoleLevelName[index] &&
                                  jrl.level === level
                              );
                              const isDisabled = matchingJRL
                                ? selectedJobRoleLevelIds.includes(matchingJRL.id)
                                : false;

                              return (
                                <button
                                  type="button"
                                  key={level}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (matchingJRL && !isDisabled) {
                                      onUpdate(index, 'jobRoleLevelId', matchingJRL.id);
                                      setIsLevelDropdownOpen((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      }));
                                      if (onSetErrors) {
                                        const newErrors = { ...errors };
                                        delete newErrors[`jobrolelevel_${index}`];
                                        onSetErrors(newErrors);
                                      }
                                      setSelectedJobRoleFilterId((prev) => ({
                                        ...prev,
                                        [index]: matchingJRL.jobRoleId,
                                      }));
                                    }
                                  }}
                                  disabled={isDisabled || !matchingJRL}
                                  className={`w-full text-left px-4 py-2.5 text-sm ${
                                    matchingJRL && jrl.jobRoleLevelId === matchingJRL.id
                                      ? 'bg-primary-50 text-primary-700'
                                      : isDisabled
                                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed italic'
                                        : 'hover:bg-neutral-50 text-neutral-700'
                                  }`}
                                >
                                  {getLevelText(level)}
                                  {isDisabled ? ' (đã chọn)' : ''}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {!selectedJobRoleLevelName[index] && (
                    <p className="text-xs text-neutral-400 mt-1">Vui lòng chọn vị trí trước</p>
                  )}
                  {errors[`jobrolelevel_${index}`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`jobrolelevel_${index}`]}</p>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

