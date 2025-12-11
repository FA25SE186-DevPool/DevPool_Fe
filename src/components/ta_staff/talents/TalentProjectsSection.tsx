import { Plus, X, FolderOpen } from 'lucide-react';
import { Button } from '../../ui/button';
import { type TalentProjectCreateModel } from '../../../services/Talent';

interface TalentProjectsSectionProps {
  talentProjects: TalentProjectCreateModel[];
  errors: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof TalentProjectCreateModel, value: string) => void;
}

/**
 * Component section quản lý dự án của Talent
 */
export function TalentProjectsSection({
  talentProjects,
  errors,
  onAdd,
  onRemove,
  onUpdate,
}: TalentProjectsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Dự án</h2>
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
            Thêm dự án
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {talentProjects.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có dự án nào. Nhấn "Thêm dự án" để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {talentProjects.map((project, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-neutral-700">Dự án #{index + 1}</span>
                  <Button
                    type="button"
                    onClick={() => onRemove(index)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tên dự án <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.projectName || ''}
                        onChange={(e) => onUpdate(index, 'projectName', e.target.value)}
                        placeholder="Tên dự án"
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white ${
                          errors[`project_name_${index}`]
                            ? 'border-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {errors[`project_name_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`project_name_${index}`]}</p>
                      )}
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Vị trí trong dự án <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.position || ''}
                        onChange={(e) => onUpdate(index, 'position', e.target.value)}
                        placeholder="Vị trí của bạn trong dự án"
                        className={`w-full px-3 py-2.5 border rounded-lg bg-white ${
                          errors[`project_position_${index}`]
                            ? 'border-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                      />
                      {errors[`project_position_${index}`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`project_position_${index}`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Technologies */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Công nghệ sử dụng
                    </label>
                    <input
                      type="text"
                      value={project.technologies || ''}
                      onChange={(e) => onUpdate(index, 'technologies', e.target.value)}
                      placeholder="React, Node.js, MongoDB..."
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Mô tả dự án</label>
                    <textarea
                      value={project.description || ''}
                      onChange={(e) => onUpdate(index, 'description', e.target.value)}
                      rows={3}
                      placeholder="Mô tả về dự án, chức năng, vai trò của bạn..."
                      className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg bg-white focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

