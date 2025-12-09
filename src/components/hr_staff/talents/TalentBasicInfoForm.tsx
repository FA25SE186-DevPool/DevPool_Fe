import { User, Mail, Phone, Calendar, MapPin, Globe, Building2, Github, ExternalLink } from 'lucide-react';
import { Input } from '../../ui/input';
import SearchableSelect from '../../common/SearchableSelect';
import { type TalentCreate } from '../../../services/Talent';
import { type Location } from '../../../services/location';
import { type Partner } from '../../../services/Partner';
import { WorkingMode } from '../../../constants/WORKING_MODE';

interface TalentBasicInfoFormProps {
  formData: TalentCreate;
  errors: Record<string, string>;
  locations: Location[];
  partners: Partner[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPartnerChange?: (partnerId: number | undefined) => void;
}

/**
 * Component form thông tin cơ bản của Talent
 */
export function TalentBasicInfoForm({
  formData,
  errors,
  locations,
  partners,
  onChange,
  onPartnerChange,
}: TalentBasicInfoFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Công ty đối tác */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Công ty đối tác <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={partners.map((partner) => ({
              id: partner.id,
              name: partner.companyName,
            }))}
            value={formData.currentPartnerId}
            onChange={(value) => {
              if (onPartnerChange) {
                onPartnerChange(value);
              } else {
                // Fallback: create synthetic event for backward compatibility
                const syntheticEvent = {
                  target: {
                    name: 'currentPartnerId',
                    value: value,
                  },
                } as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
                onChange(syntheticEvent);
              }
            }}
            placeholder="-- Chọn công ty --"
            searchPlaceholder="Tìm công ty..."
            icon={<Building2 className="w-4 h-4" />}
            error={errors.currentPartnerId}
          />
          {errors.currentPartnerId && <p className="mt-1 text-sm text-red-500">{errors.currentPartnerId}</p>}
        </div>

        {/* Họ tên */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <Input
            name="fullName"
            value={formData.fullName || ''}
            onChange={onChange}
            placeholder="Nhập họ và tên..."
            required
            className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
              errors.fullName ? 'border-red-500' : ''
            }`}
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={onChange}
              placeholder="Nhập email..."
              required
              className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <Input
              name="phone"
              value={formData.phone || ''}
              onChange={onChange}
              placeholder="Nhập số điện thoại..."
              required
              className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                errors.phone ? 'border-red-500' : ''
              }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ngày sinh */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ngày sinh
            </label>
            <Input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={onChange}
              className={`w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl ${
                errors.dateOfBirth ? 'border-red-500' : ''
              }`}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>}
          </div>

          {/* Khu vực */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Khu vực làm việc <span className="text-red-500">*</span>
            </label>
            <select
              name="locationId"
              value={formData.locationId || ''}
              onChange={onChange}
              className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
                errors.locationId ? 'border-red-500' : 'border-neutral-200'
              }`}
            >
              <option value="">-- Chọn khu vực --</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            {errors.locationId && <p className="mt-1 text-sm text-red-500">{errors.locationId}</p>}
          </div>
        </div>

        {/* Chế độ làm việc */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Chế độ làm việc <span className="text-red-500">*</span>
          </label>
          <select
            name="workingMode"
            value={formData.workingMode}
            onChange={onChange}
            className={`w-full border rounded-xl px-4 py-3 focus:border-primary-500 focus:ring-primary-500 bg-white ${
              errors.workingMode ? 'border-red-500' : 'border-neutral-200'
            }`}
          >
            <option value={WorkingMode.None}>Không xác định</option>
            <option value={WorkingMode.Onsite}>Tại văn phòng</option>
            <option value={WorkingMode.Remote}>Từ xa</option>
            <option value={WorkingMode.Hybrid}>Kết hợp</option>
            <option value={WorkingMode.Flexible}>Linh hoạt</option>
          </select>
          {errors.workingMode && <p className="mt-1 text-sm text-red-500">{errors.workingMode}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub URL
            </label>
            <Input
              type="url"
              name="githubUrl"
              value={formData.githubUrl || ''}
              onChange={onChange}
              placeholder="https://github.com/username"
              className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Portfolio URL
            </label>
            <Input
              type="url"
              name="portfolioUrl"
              value={formData.portfolioUrl || ''}
              onChange={onChange}
              placeholder="https://portfolio.example.com"
              className="w-full border-neutral-200 focus:border-primary-500 focus:ring-primary-500 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

