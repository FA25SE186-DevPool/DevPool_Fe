import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Github,
  Globe,
  MapPin,
  Briefcase,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { sidebarItems } from '../../components/sidebar/developer';
import Sidebar from '../../components/common/Sidebar';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { partnerDashboardService, type PartnerTalentDetail, type PartnerAssignmentSummary } from '../../services/PartnerDashboard';
import { WORKING_MODE } from '../../constants/WORKING_MODE';
import { locationService, type Location } from '../../services/location';

const statusLabels = {
  'Available': 'Sẵn sàng',
  'Working': 'Đang làm việc',
  'Applying': 'Đang ứng tuyển',
  'Unavailable': 'Tạm ngưng',
  'Busy': 'Đang bận'
};

export default function TalentDetailPage() {
  const { talentId } = useParams<{ talentId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [talent, setTalent] = useState<PartnerTalentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [assignments, setAssignments] = useState<PartnerAssignmentSummary[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<PartnerAssignmentSummary[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    const fetchTalentDetail = async () => {
      if (!talentId) return;

      try {
        setLoading(true);
        setError('');
        const talentData = await partnerDashboardService.getTalentDetail(parseInt(talentId));
        setTalent(talentData);
      } catch (err: any) {
        console.error('Error fetching talent detail:', err);
        setError(err.message || 'Không thể tải thông tin nhân sự');
      } finally {
        setLoading(false);
      }
    };

    fetchTalentDetail();
  }, [talentId]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationData = await locationService.getAll({ excludeDeleted: true });
        setLocations(locationData);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setLocations([]);
      }
    };

    fetchLocations();
  }, []);

  // Fetch assignments when talent is loaded
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!talent) return;

      try {
        setAssignmentsLoading(true);
        const assignmentsData = await partnerDashboardService.getMyAssignments();
        // Filter assignments by current talent ID
        const talentAssignments = assignmentsData.filter(assignment => assignment.talentId === talent.talentId);
        setAssignments(talentAssignments);
        setFilteredAssignments(talentAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [talent]);

  // Filter assignments by search term
  useEffect(() => {
    if (!assignments.length) {
      setFilteredAssignments([]);
      return;
    }

    if (!projectSearch.trim()) {
      setFilteredAssignments(assignments);
      return;
    }

    const filtered = assignments.filter(assignment =>
      assignment.projectName?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      assignment.projectCode?.toLowerCase().includes(projectSearch.toLowerCase())
    );
    setFilteredAssignments(filtered);
  }, [assignments, projectSearch]);

  const getWorkingModeLabel = (workingMode?: number): string => {
    if (!workingMode || workingMode === 0) return '—';

    const modes: string[] = [];
    if (workingMode & WORKING_MODE.Onsite) modes.push('Tại văn phòng');
    if (workingMode & WORKING_MODE.Remote) modes.push('Từ xa');
    if (workingMode & WORKING_MODE.Hybrid) modes.push('Kết hợp');
    if (workingMode & WORKING_MODE.Flexible) modes.push('Linh hoạt');

    return modes.join(', ') || '—';
  };

  const getLocationName = (locationId?: number): string => {
    if (!locationId) return '—';
    const location = locations.find(l => l.id === locationId);
    return location?.name || '—';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAssignmentStatusIcon = (status?: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'Terminated':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAssignmentStatusLabel = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'Đang hoạt động';
      case 'Completed':
        return 'Hoàn thành';
      case 'Terminated':
        return 'Đã chấm dứt';
      case 'Draft':
        return 'Nháp';
      default:
        return status || '—';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải thông tin chi tiết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} title="Partner Portal" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Không tìm thấy thông tin nhân sự</p>
            <button
              onClick={() => navigate('/partner/talents')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Partner Portal" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: 'Nhân sự', to: '/partner/talents' },
              { label: talent.fullName || 'Chi tiết nhân sự' }
            ]}
          />

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{talent.fullName}</h1>
              <p className="text-gray-600">{talent.code}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dự án ({filteredAssignments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* First Row - Basic Info and Current Assignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin cơ bản</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <span className="text-gray-900">{talent.fullName || '—'}</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{talent.email || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{talent.phone || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{getLocationName(talent.locationId)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        talent.status === 'Available' ? 'bg-green-100 text-green-800' :
                        talent.status === 'Working' ? 'bg-blue-100 text-blue-800' :
                        talent.status === 'Applying' ? 'bg-purple-100 text-purple-800' :
                        talent.status === 'Unavailable' ? 'bg-gray-100 text-gray-800' :
                        talent.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusLabels[talent.status as keyof typeof statusLabels] || talent.status || '—'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ làm việc</label>
                      <span className="text-gray-900">{getWorkingModeLabel(talent.workingMode)}</span>
                    </div>

                    {/* Liên kết */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Liên kết</label>
                      <div className="space-y-2">
                        {talent.githubUrl && (
                          <a
                            href={talent.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          >
                            <Github className="w-4 h-4" />
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3 ml-auto" />
                          </a>
                        )}
                        {talent.portfolioUrl && (
                          <a
                            href={talent.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          >
                            <Globe className="w-4 h-4" />
                            <span>Portfolio</span>
                            <ExternalLink className="w-3 h-3 ml-auto" />
                          </a>
                        )}
                        {!talent.githubUrl && !talent.portfolioUrl && (
                          <span className="text-gray-500 text-sm">Chưa có liên kết nào</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assignment Info */}
              {talent.status === 'Working' && (
                <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin phân công hiện tại</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dự án hiện tại</label>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{talent.currentProjectName || '—'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{talent.currentRole || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {talent.assignmentStartDate ? new Date(talent.assignmentStartDate).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {talent.assignmentEndDate ? new Date(talent.assignmentEndDate).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for non-working status */}
              {talent.status !== 'Working' && (
                <div className="bg-gray-50 rounded-2xl border border-neutral-200 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Chưa có phân công nào</p>
                  </div>
                </div>
              )}
            </div>

            {/* Interview Info */}
            {talent.status === 'Interviewing' && (
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin phỏng vấn</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phỏng vấn cho khách hàng</label>
                    <span className="text-gray-900">{talent.interviewingForClient || '—'}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lịch phỏng vấn tiếp theo</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {talent.nextInterviewDate ? new Date(talent.nextInterviewDate).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kỹ năng chính</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-gray-700">{talent.primarySkills || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {/* Bio */}
            {talent.bio && (
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Giới thiệu</h2>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{talent.bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Lịch sử dự án</h2>
                <div className="text-sm text-gray-500">
                  {filteredAssignments.length} dự án
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Tìm kiếm theo tên hoặc mã dự án..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {assignmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Đang tải danh sách dự án...</p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    {assignments.length === 0 ? 'Chưa có dự án nào' : 'Không tìm thấy dự án phù hợp'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {assignments.length === 0 ? 'Nhân sự này chưa tham gia dự án nào' : 'Thử thay đổi từ khóa tìm kiếm'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.assignmentId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {assignment.projectName || `Project ${assignment.projectCode}`}
                            </h3>
                            {assignment.projectCode && (
                              <span className="text-sm text-gray-500">({assignment.projectCode})</span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{assignment.role || '—'}</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">
                                  {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí ước tính</label>
                              <span className="text-gray-900">
                                {assignment.buyingRate ? `${assignment.buyingRate.toLocaleString('vi-VN')} ${assignment.currencyCode || 'USD'}` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {getAssignmentStatusIcon(assignment.status)}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            assignment.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                            assignment.status === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            assignment.status === 'Terminated' ? 'bg-red-100 text-red-800 border-red-200' :
                            assignment.status === 'Draft' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {getAssignmentStatusLabel(assignment.status)}
                          </span>
                        </div>
                      </div>

                      {assignment.commitmentFileUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <a
                            href={assignment.commitmentFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Xem tài liệu cam kết</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}