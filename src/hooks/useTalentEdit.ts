import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { talentService, type TalentCreate, type TalentStatusUpdateModel } from '../services/Talent';
import { locationService, type Location } from '../services/location';
import { partnerService, type Partner } from '../services/Partner';
import { useTalentForm } from './useTalentForm';

/**
 * Hook để quản lý logic edit talent
 */
export function useTalentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [originalStatus, setOriginalStatus] = useState<string>('');
  const [originalPartnerId, setOriginalPartnerId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [changingStatus, setChangingStatus] = useState(false);

  const {
    formData,
    errors,
    formError,
    setFormError,
    updateField,
    validateForm,
    setFormData,
  } = useTalentForm();

  // Load talent data
  useEffect(() => {
    const fetchTalent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await talentService.getById(Number(id));

        // Format dateOfBirth from ISO string to YYYY-MM-DD
        let formattedDateOfBirth = '';
        if (data.dateOfBirth) {
          try {
            const date = new Date(data.dateOfBirth);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDateOfBirth = `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error('Lỗi format ngày sinh:', e);
          }
        }

        const currentStatus = data.status || 'Available';
        setOriginalPartnerId(data.currentPartnerId);
        const talentData: Partial<TalentCreate> = {
          currentPartnerId: data.currentPartnerId,
          userId: data.userId || null,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: formattedDateOfBirth,
          locationId: data.locationId,
          workingMode: data.workingMode,
          githubUrl: data.githubUrl || '',
          portfolioUrl: data.portfolioUrl || '',
          status: currentStatus,
        };

        setFormData(talentData as TalentCreate);
        setOriginalStatus(currentStatus);
        setSelectedStatus(currentStatus);
      } catch (err) {
        console.error('❌ Lỗi tải dữ liệu:', err);
        setFormError('Không thể tải thông tin nhân sự!');
      } finally {
        setLoading(false);
      }
    };
    fetchTalent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await locationService.getAll({ excludeDeleted: true });
        const locationsArray = ensureArray<Location>(locationsData);
        setLocations(locationsArray);
      } catch (err) {
        console.error('❌ Lỗi tải danh sách địa điểm:', err);
      }
    };
    fetchLocations();
  }, []);

  // Helper function to ensure data is an array
  const ensureArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
      // Handle PagedResult with Items (C# convention) or items (JS convention)
      const obj = data as { Items?: unknown; items?: unknown; data?: unknown };
      if (Array.isArray(obj.Items)) return obj.Items as T[];
      if (Array.isArray(obj.items)) return obj.items as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
    return [];
  };

  // Load partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const partnersData = await partnerService.getAll();
        const partnersArray = ensureArray<Partner>(partnersData);
        setPartners(partnersArray);
      } catch (err) {
        console.error('❌ Lỗi tải danh sách công ty:', err);
      }
    };
    fetchPartners();
  }, []);

  // Handle status change (direct dropdown)
  const handleStatusChange = useCallback(async (nextStatus: string) => {
    if (!id) return;

    // Không cho đổi status khi talent đang Applying/Working (tránh sai nghiệp vụ)
    if (originalStatus === 'Applying' || originalStatus === 'Working') {
      alert('⚠️ Không thể thay đổi trạng thái khi nhân sự đang ở trạng thái Đang ứng tuyển/Đang làm việc.');
      setSelectedStatus(originalStatus);
      return;
    }

    // Keep local state in sync immediately (UI)
    setSelectedStatus(nextStatus);

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn thay đổi trạng thái từ "${getStatusLabel(originalStatus)}" sang "${getStatusLabel(nextStatus)}"?`
    );
    if (!confirmed) {
      setSelectedStatus(originalStatus);
      return;
    }

    try {
      setChangingStatus(true);
      const statusPayload: TalentStatusUpdateModel = {
        newStatus: nextStatus,
      };
      await talentService.changeStatus(Number(id), statusPayload);

      updateField('status', nextStatus);
      setOriginalStatus(nextStatus);

      alert('✅ Thay đổi trạng thái thành công!');
    } catch (statusErr: any) {
      console.error('❌ Lỗi khi thay đổi trạng thái:', statusErr);
      const statusErrorMsg =
        statusErr?.response?.data?.message ||
        statusErr?.message ||
        'Không thể thay đổi trạng thái';
      alert(`❌ ${statusErrorMsg}`);
      setSelectedStatus(originalStatus);
    } finally {
      setChangingStatus(false);
    }
  }, [id, originalStatus, updateField]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;

      // Chặn đổi Partner khi đang Applying/Working
      if (
        (originalStatus === 'Applying' || originalStatus === 'Working') &&
        typeof originalPartnerId === 'number' &&
        formData.currentPartnerId !== originalPartnerId
      ) {
        alert('⚠️ Không thể cập nhật công ty khi nhân sự đang ở trạng thái Đang ứng tuyển/Đang làm việc.');
        updateField('currentPartnerId', originalPartnerId);
        return;
      }

      const confirmed = window.confirm('Bạn có chắc chắn muốn lưu các thay đổi không?');
      if (!confirmed) {
        return;
      }

      // Validate
      if (!validateForm()) {
        const errorMessages = Object.values(errors);
        alert('⚠️ Vui lòng điền đầy đủ và chính xác các trường bắt buộc\n\n' + errorMessages.join('\n'));
        return;
      }

      try {
        // Format dateOfBirth to UTC ISO string if it exists
        const payload = {
          ...formData,
          dateOfBirth: formData.dateOfBirth
            ? new Date(formData.dateOfBirth + 'T00:00:00.000Z').toISOString()
            : undefined,
        };

        await talentService.update(Number(id), payload);

        alert('✅ Cập nhật nhân sự thành công!');
        navigate(`/ta/talents/${id}`);
      } catch (err: any) {
        console.error('❌ Lỗi khi cập nhật:', err);
        const data = err?.response?.data;
        let combined = '';
        if (typeof data === 'string') {
          combined = data;
        } else if (data && typeof data === 'object') {
          try {
            const candidates: string[] = [];
            const tryPush = (v: unknown) => {
              if (typeof v === 'string' && v) candidates.push(v);
            };
            tryPush((data as any).error);
            tryPush((data as any).message);
            tryPush((data as any).objecterror);
            tryPush((data as any).Objecterror);
            tryPush((data as any).detail);
            tryPush((data as any).title);
            const values = Object.values(data)
              .map((v) => (typeof v === 'string' ? v : ''))
              .filter(Boolean);
            candidates.push(...values);
            combined = candidates.join(' ');
            if (!combined) combined = JSON.stringify(data);
          } catch {
            combined = JSON.stringify(data);
          }
        }
        const lower = (combined || err?.message || '').toLowerCase();
        if (
          lower.includes('email already exists') ||
          (lower.includes('already exists') && lower.includes('email'))
        ) {
          setFormError('Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
          alert('❌ Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.');
          return;
        }
        alert('Không thể cập nhật nhân sự!');
      }
    },
    [id, formData, validateForm, errors, navigate, setFormError, originalStatus, originalPartnerId, updateField]
  );

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      Available: 'Sẵn sàng',
      Busy: 'Đang bận',
      Unavailable: 'Tạm ngưng',
      Working: 'Đang làm việc',
      Applying: 'Đang ứng tuyển',
    };
    return statusLabels[status] || status;
  };

  return {
    loading,
    formData,
    errors,
    formError,
    locations,
    partners,
    originalStatus,
    originalPartnerId,
    selectedStatus,
    setSelectedStatus,
    changingStatus,
    updateField,
    handleStatusChange,
    handleSubmit,
    getStatusLabel,
  };
}

