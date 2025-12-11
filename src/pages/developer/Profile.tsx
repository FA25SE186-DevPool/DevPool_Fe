import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Save, AlertCircle, CheckCircle, Calendar, MapPin,
  Briefcase, Award, FileText, Clock, Building2, Eye, Download,
  Code, Target, Star, Edit, Upload, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import { sidebarItems } from '../../components/sidebar/developer';
import { useAuth } from '../../context/AuthContext';
import { userService, type User as UserType } from '../../services/User';
import { decodeJWT } from '../../services/Auth';
import { talentService, type TalentDetailedModel } from '../../services/Talent';
import { locationService } from '../../services/location';
import { partnerService } from '../../services/Partner';
import { skillService } from '../../services/Skill';
import { jobRoleLevelService } from '../../services/JobRoleLevel';
import { jobRoleService } from '../../services/JobRole';
import { certificateTypeService } from '../../services/CertificateType';
import { WorkingMode } from '../../constants/WORKING_MODE';

// Mapping WorkingMode values to Vietnamese names
const workingModeLabels: Record<number, string> = {
  [WorkingMode.None]: "Không xác định",
  [WorkingMode.Onsite]: "Tại văn phòng",
  [WorkingMode.Remote]: "Từ xa",
  [WorkingMode.Hybrid]: "Kết hợp",
  [WorkingMode.Flexible]: "Linh hoạt",
};

export default function DeveloperProfilePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [talent, setTalent] = useState<TalentDetailedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lookup data
  const [locationName, setLocationName] = useState<string>('—');
  const [partnerName, setPartnerName] = useState<string>('—');
  const [skillsMap, setSkillsMap] = useState<Map<number, string>>(new Map());
  const [jobRoleLevelsMap, setJobRoleLevelsMap] = useState<Map<number, { name: string; jobRoleName: string }>>(new Map());
  const [certificateTypesMap, setCertificateTypesMap] = useState<Map<number, string>>(new Map());

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  // CV pagination and grouping
  const [pageCVs, setPageCVs] = useState(1);
  const itemsPerPageCVs = 5;
  const [collapsedInactiveCVGroups, setCollapsedInactiveCVGroups] = useState<Set<string>>(new Set());
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'info' | 'cvs' | 'skills' | 'jobRole' | 'experience' | 'projects' | 'certificates'>('info');

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser) return;

      try {
        setLoading(true);
        setError('');

        // Get userId from token
        const token = localStorage.getItem('accessToken');
        let userId: string | null = null;

        if (token) {
          const decoded = decodeJWT(token);
          userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
        } else {
          userId = authUser.id;
        }

        if (!userId) {
          setError('Không thể xác định người dùng');
          setLoading(false);
          return;
        }

        // Fetch user data
        const userData = await userService.getById(userId);
        setUser(userData);

        // Fetch talent detailed data
        const allTalents = await talentService.getAllDetailed({ excludeDeleted: true });
        const currentTalent = allTalents.find(t => t.userId === userId);

        if (currentTalent) {
          // Xử lý trường hợp API trả về cVs (chữ V hoa) thay vì cvs (chữ v thường)
          if ((currentTalent as any).cVs && Array.isArray((currentTalent as any).cVs)) {
            currentTalent.cvs = (currentTalent as any).cVs;
          }
          // Đảm bảo cvs là mảng nếu undefined hoặc null
          if (!currentTalent.cvs) {
            currentTalent.cvs = [];
          }
          
          setTalent(currentTalent);

          // Fetch basic talent info to get githubUrl and portfolioUrl
          // (TalentDetailedModel may not have these fields populated)
          let githubUrl = currentTalent.gitHubProfile || '';
          let portfolioUrl = currentTalent.linkedInProfile || '';

          try {
            const basicTalent = await talentService.getById(currentTalent.id);
            console.log('Basic Talent data:', basicTalent);
            console.log('Detailed Talent data:', currentTalent);
            // Use basic talent data if available, otherwise use detailed model data
            githubUrl = basicTalent?.githubUrl || currentTalent.gitHubProfile || '';
            portfolioUrl = basicTalent?.portfolioUrl || currentTalent.linkedInProfile || '';
            console.log('Final githubUrl:', githubUrl, 'portfolioUrl:', portfolioUrl);
          } catch (err) {
            console.warn('Không thể lấy thông tin từ Talent service:', err);
            // Fallback to detailed model data
            githubUrl = currentTalent.gitHubProfile || '';
            portfolioUrl = currentTalent.linkedInProfile || '';
          }

          // Set form data
          setFormData({
            fullName: currentTalent.fullName || userData.fullName || '',
            phoneNumber: currentTalent.phoneNumber || userData.phoneNumber || '',
            dateOfBirth: currentTalent.dateOfBirth ? currentTalent.dateOfBirth.split('T')[0] : '',
            bio: currentTalent.bio || '',
            githubUrl: githubUrl,
            portfolioUrl: portfolioUrl,
          });

          // Fetch location name
          if (currentTalent.locationId) {
            try {
              const location = await locationService.getById(currentTalent.locationId);
              setLocationName(location?.name || '—');
            } catch {
              setLocationName('—');
            }
          }

          // Fetch partner name
          if (currentTalent.currentPartnerId) {
            try {
              const partners = await partnerService.getAll();
              const partner = partners.find((p: any) => p.id === currentTalent.currentPartnerId);
              setPartnerName(partner?.companyName || '—');
            } catch {
              setPartnerName('—');
            }
          }

          // Fetch lookup data for skills, job role levels, certificate types
          try {
            const [skills, jobRoleLevels, jobRoles, certificateTypes] = await Promise.all([
              skillService.getAll({ excludeDeleted: true }),
              jobRoleLevelService.getAll({ excludeDeleted: true }),
              jobRoleService.getAll({ excludeDeleted: true }),
              certificateTypeService.getAll({ excludeDeleted: true }),
            ]);

            // Build skills map
            const skillsMapData = new Map<number, string>();
            (skills || []).forEach((skill: any) => {
              skillsMapData.set(skill.id, skill.name);
            });
            setSkillsMap(skillsMapData);

            // Build job role levels map
            const jobRoleLevelsMapData = new Map<number, { name: string; jobRoleName: string }>();
            (jobRoleLevels || []).forEach((jrl: any) => {
              const jobRole = (jobRoles || []).find((jr: any) => jr.id === jrl.jobRoleId);
              jobRoleLevelsMapData.set(jrl.id, {
                name: jrl.name,
                jobRoleName: jobRole?.name || '—',
              });
            });
            setJobRoleLevelsMap(jobRoleLevelsMapData);

            // Build certificate types map
            const certificateTypesMapData = new Map<number, string>();
            (certificateTypes || []).forEach((ct: any) => {
              certificateTypesMapData.set(ct.id, ct.typeName);
            });
            setCertificateTypesMap(certificateTypesMapData);
            
            // Map CVs with job role level names và sắp xếp sau khi có jobRoleLevels
            if (currentTalent.cvs && currentTalent.cvs.length > 0) {
              const jobRoleLevelsArray = Array.isArray(jobRoleLevels) ? jobRoleLevels : [];
              const cvsWithJobRoleLevelNames = currentTalent.cvs.map((cv: any) => {
                const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: any) => jrl.id === cv.jobRoleLevelId);
                return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? "Chưa xác định" };
              });
              
              // Sắp xếp CV: nhóm theo jobRoleLevelName, active trước, sau đó theo version giảm dần
              const sortedCVs = cvsWithJobRoleLevelNames.sort((a: any, b: any) => {
                // Ưu tiên 1: Sắp xếp theo jobRoleLevelName
                const nameA = a.jobRoleLevelName || "";
                const nameB = b.jobRoleLevelName || "";
                if (nameA !== nameB) {
                  return nameA.localeCompare(nameB);
                }
                // Ưu tiên 2: Active trước, inactive sau
                if (a.isActive !== b.isActive) {
                  return a.isActive ? -1 : 1;
                }
                // Ưu tiên 3: Version giảm dần (mới nhất trước)
                return (b.version || 0) - (a.version || 0);
              });
              
              // Cập nhật talent với CVs đã sắp xếp
              currentTalent.cvs = sortedCVs;
              
              // Thu gọn tất cả các nhóm CV không hoạt động mặc định
              const inactiveGroups = new Set<string>();
              sortedCVs.forEach((cv: any) => {
                if (!cv.isActive && cv.jobRoleLevelName) {
                  inactiveGroups.add(cv.jobRoleLevelName);
                }
              });
              setCollapsedInactiveCVGroups(inactiveGroups);
              
              setTalent({ ...currentTalent });
            }
          } catch (err) {
            console.error('❌ Lỗi tải lookup data:', err);
          }
        } else {
          // No talent found, just use user data
          setFormData({
            fullName: userData.fullName || '',
            phoneNumber: userData.phoneNumber || '',
            dateOfBirth: '',
            bio: '',
            githubUrl: '',
            portfolioUrl: '',
          });
        }
      } catch (err: any) {
        console.error('❌ Lỗi tải thông tin:', err);
        setError(err.message || 'Không thể tải thông tin');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    // Validate phone
    if (name === 'phoneNumber') {
      if (value && validatePhone(value)) {
        delete newErrors.phoneNumber;
      } else if (value && !validatePhone(value)) {
        newErrors.phoneNumber = 'Số điện thoại phải có đúng 10 chữ số';
      }
    }

    // Validate date of birth
    if (name === 'dateOfBirth') {
      if (value && validateDateOfBirth(value)) {
        delete newErrors.dateOfBirth;
      } else if (value && !validateDateOfBirth(value)) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
      }
    }

    // Validate URLs
    if (name === 'githubUrl') {
      if (value && validateURL(value)) {
        delete newErrors.githubUrl;
      } else if (value && !validateURL(value)) {
        newErrors.githubUrl = 'URL không hợp lệ';
      }
    }

    if (name === 'portfolioUrl') {
      if (value && validateURL(value)) {
        delete newErrors.portfolioUrl;
      } else if (value && !validateURL(value)) {
        newErrors.portfolioUrl = 'URL không hợp lệ';
      }
    }

    setErrors(newErrors);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !authUser || !talent) {
      setError('Không tìm thấy thông tin talent. Vui lòng liên hệ TA.');
      return;
    }

    // Không cho phép sửa khi đang ứng tuyển hoặc đang làm việc
    if (talent.status === "Applying" || talent.status === "Working") {
      setError('Không thể cập nhật thông tin khi đang ứng tuyển hoặc đang làm việc. Vui lòng liên hệ TA.');
      return;
    }

    // Validate all fields before submit
    const newErrors: Record<string, string> = {};

    // Validate phone
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại phải có đúng 10 chữ số';
    }

    // Validate date of birth
    if (formData.dateOfBirth && !validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Ngày sinh không hợp lệ (tuổi từ 18-100)';
    }

    // Validate URLs
    if (formData.githubUrl && !validateURL(formData.githubUrl)) {
      newErrors.githubUrl = 'URL GitHub không hợp lệ';
    }

    if (formData.portfolioUrl && !validateURL(formData.portfolioUrl)) {
      newErrors.portfolioUrl = 'URL Portfolio không hợp lệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Vui lòng sửa các lỗi trước khi lưu');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      setErrors({});

      // Get userId from token
      const token = localStorage.getItem('accessToken');
      let userId: string | null = null;

      if (token) {
        const decoded = decodeJWT(token);
        userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
      } else {
        userId = authUser.id;
      }

      if (!userId) {
        setError('Không thể xác định người dùng');
        return;
      }

      // Update talent profile using talentService.updateProfile
      await talentService.updateProfile(talent.id, {
        phone: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        bio: formData.bio || undefined,
        githubUrl: formData.githubUrl || undefined,
        portfolioUrl: formData.portfolioUrl || undefined,
      });

      // Reload data
      const updatedUser = await userService.getById(userId);
      setUser(updatedUser);

      const allTalents = await talentService.getAllDetailed({ excludeDeleted: true });
      const updatedTalent = allTalents.find(t => t.userId === userId);
      if (updatedTalent) {
        // Xử lý trường hợp API trả về cVs (chữ V hoa) thay vì cvs (chữ v thường)
        if ((updatedTalent as any).cVs && Array.isArray((updatedTalent as any).cVs)) {
          updatedTalent.cvs = (updatedTalent as any).cVs;
        }
        // Đảm bảo cvs là mảng nếu undefined hoặc null
        if (!updatedTalent.cvs) {
          updatedTalent.cvs = [];
        }
        
        // Map CVs with job role level names và sắp xếp
        const allJobRoleLevels = await jobRoleLevelService.getAll({ excludeDeleted: true });
        const jobRoleLevelsArray = Array.isArray(allJobRoleLevels) ? allJobRoleLevels : [];
        const cvsWithJobRoleLevelNames = updatedTalent.cvs.map((cv: any) => {
          const jobRoleLevelInfo = jobRoleLevelsArray.find((jrl: any) => jrl.id === cv.jobRoleLevelId);
          return { ...cv, jobRoleLevelName: jobRoleLevelInfo?.name ?? "Chưa xác định" };
        });
        
        // Sắp xếp CV: nhóm theo jobRoleLevelName, active trước, sau đó theo version giảm dần
        const sortedCVs = cvsWithJobRoleLevelNames.sort((a: any, b: any) => {
          // Ưu tiên 1: Sắp xếp theo jobRoleLevelName
          const nameA = a.jobRoleLevelName || "";
          const nameB = b.jobRoleLevelName || "";
          if (nameA !== nameB) {
            return nameA.localeCompare(nameB);
          }
          // Ưu tiên 2: Active trước, inactive sau
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }
          // Ưu tiên 3: Version giảm dần (mới nhất trước)
          return (b.version || 0) - (a.version || 0);
        });
        
        // Cập nhật talent với CVs đã sắp xếp
        updatedTalent.cvs = sortedCVs;
        
        // Thu gọn tất cả các nhóm CV không hoạt động mặc định
        const inactiveGroups = new Set<string>();
        sortedCVs.forEach((cv: any) => {
          if (!cv.isActive && cv.jobRoleLevelName) {
            inactiveGroups.add(cv.jobRoleLevelName);
          }
        });
        setCollapsedInactiveCVGroups(inactiveGroups);
        
        setTalent(updatedTalent);

        // Fetch basic talent info to get githubUrl and portfolioUrl
        let githubUrl = updatedTalent.gitHubProfile || '';
        let portfolioUrl = updatedTalent.linkedInProfile || '';

        try {
          const basicTalent = await talentService.getById(updatedTalent.id);
          // Use basic talent data if available, otherwise use detailed model data
          githubUrl = basicTalent?.githubUrl || updatedTalent.gitHubProfile || '';
          portfolioUrl = basicTalent?.portfolioUrl || updatedTalent.linkedInProfile || '';
        } catch (err) {
          console.warn('Không thể lấy thông tin từ Talent service:', err);
          // Fallback to detailed model data
          githubUrl = updatedTalent.gitHubProfile || '';
          portfolioUrl = updatedTalent.linkedInProfile || '';
        }

        // Update form data with new values
        setFormData({
          fullName: updatedTalent.fullName || '',
          phoneNumber: updatedTalent.phoneNumber || '',
          dateOfBirth: updatedTalent.dateOfBirth ? updatedTalent.dateOfBirth.split('T')[0] : '',
          bio: updatedTalent.bio || '',
          githubUrl: githubUrl,
          portfolioUrl: portfolioUrl,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Lỗi cập nhật thông tin:', err);
      setError(err.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formatWorkingMode = (workingMode: string | null | undefined) => {
    if (!workingMode) return '—';
    const modeNum = parseInt(workingMode);
    if (isNaN(modeNum)) return workingMode;
    return workingModeLabels[modeNum] || workingMode;
  };

  // Validation functions
  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateDateOfBirth = (date: string): boolean => {
    if (!date || date.trim() === '') return true; // Optional field
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18 && age - 1 <= 100;
    }
    return age >= 18 && age <= 100;
  };

  const validateURL = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Developer" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Developer" />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ Sơ Cá Nhân</h1>
            <p className="text-neutral-600">Xem và quản lý thông tin hồ sơ của bạn</p>
          </div>

          {/* Main Content Card with Tabs */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-fade-in">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 bg-white">
              <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'info'
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Thông Tin Cá Nhân
                </button>
                {talent && (
                  <>
                    <button
                      onClick={() => setActiveTab('cvs')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'cvs'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Hồ Sơ (CVs)
                    </button>
                    <button
                      onClick={() => setActiveTab('skills')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'skills'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      Kỹ Năng
                    </button>
                    <button
                      onClick={() => setActiveTab('jobRole')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'jobRole'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      Vai Trò & Cấp Độ
                    </button>
                    <button
                      onClick={() => setActiveTab('experience')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'experience'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Kinh Nghiệm
                    </button>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'projects'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      Dự Án
                    </button>
                    <button
                      onClick={() => setActiveTab('certificates')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === 'certificates'
                          ? 'border-primary-600 text-primary-600 bg-primary-50'
                          : 'border-transparent text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      Chứng Chỉ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <>
                {/* Thông Tin Cá Nhân Tab */}
                {activeTab === 'info' && (
                  <div>
                    <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Thông Tin Cá Nhân</h2>
                    <p className="text-sm text-neutral-600">Thông tin cơ bản của bạn</p>
                  </div>
                </div>
                <Edit className="w-5 h-5 text-neutral-400" />
              </div>
            </div>

                      {talent && (talent.status === "Applying" || talent.status === "Working") && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">
                    Không thể chỉnh sửa thông tin khi đang ứng tuyển hoặc đang làm việc. Vui lòng liên hệ TA nếu cần thay đổi.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Họ tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                    placeholder="Họ và tên"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Họ tên không thể thay đổi</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={talent?.email || user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Email không thể thay đổi</p>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={!!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-neutral-300'
                    } ${talent && (talent.status === "Applying" || talent.status === "Working") ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.dateOfBirth ? 'border-red-500 focus:border-red-500' : 'border-neutral-300'
                    } ${talent && (talent.status === "Applying" || talent.status === "Working") ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                </div>

                {/* Working Mode */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Chế độ làm việc
                  </label>
                  <input
                    type="text"
                    value={formatWorkingMode(talent?.workingMode || undefined)}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Giới thiệu ngắn
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                    rows={4}
                    className={`w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      talent && (talent.status === "Applying" || talent.status === "Working") ? 'bg-neutral-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="Nhập giới thiệu ngắn về bản thân"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Code className="w-4 h-4 inline mr-2" />
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    disabled={!!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.githubUrl ? 'border-red-500 focus:border-red-500' : 'border-neutral-300'
                    } ${talent && (talent.status === "Applying" || talent.status === "Working") ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
                    placeholder="https://github.com/username"
                  />
                  {errors.githubUrl && (
                    <p className="mt-1 text-sm text-red-500">{errors.githubUrl}</p>
                  )}
                </div>

                {/* Portfolio URL */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    disabled={!!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.portfolioUrl ? 'border-red-500 focus:border-red-500' : 'border-neutral-300'
                    } ${talent && (talent.status === "Applying" || talent.status === "Working") ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
                    placeholder="https://yourportfolio.com"
                  />
                  {errors.portfolioUrl && (
                    <p className="mt-1 text-sm text-red-500">{errors.portfolioUrl}</p>
                  )}
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Cập nhật thông tin thành công!</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 mt-6 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={saving || !!(talent && (talent.status === "Applying" || talent.status === "Working"))}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
                    </form>

                    {/* Lịch Rảnh (Available Time) */}
                    {talent && talent.availableTimes && talent.availableTimes.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-neutral-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-primary-100 rounded-lg">
                            <Clock className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Lịch Rảnh (Available Time)</h2>
                            <p className="text-sm text-neutral-600">Thời gian bạn có thể làm việc</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {talent.availableTimes.map((at) => (
                            <div key={at.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-900">
                                  {formatDate(at.startTime)} - {at.endTime ? formatDate(at.endTime) : 'Không giới hạn'}
                                </p>
                              </div>
                              {at.notes && (
                                <p className="text-sm text-neutral-700 mt-2">{at.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Đối Tác Hiện Tại */}
                    {talent && talent.currentPartnerId && (
                      <div className="mt-8 pt-8 border-t border-neutral-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-primary-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Đối Tác Hiện Tại</h2>
                            <p className="text-sm text-neutral-600">Công ty đối tác bạn đang làm việc</p>
                          </div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <p className="text-lg font-semibold text-gray-900">{partnerName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hồ Sơ (CVs) Tab */}
                {activeTab === 'cvs' && talent && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-100 rounded-lg">
                          <FileText className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Hồ Sơ (CVs)</h2>
                          <p className="text-sm text-neutral-600">Danh sách CV của bạn</p>
                        </div>
                      </div>
                      <Link to={`/developer/cv/create?talentId=${talent.id}`}>
                        <button
                          className="group flex items-center gap-2 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
                        >
                          <Upload className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                          Tải lên CV
                        </button>
                      </Link>
                    </div>
                    <div>
                  {talent.cvs && Array.isArray(talent.cvs) && talent.cvs.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {(() => {
                          // Nhóm CV theo jobRoleLevelName
                          const groupedCVs = new Map<string, any[]>();
                          talent.cvs.forEach((cv: any) => {
                            const key = cv.jobRoleLevelName || "Chưa xác định";
                            if (!groupedCVs.has(key)) {
                              groupedCVs.set(key, []);
                            }
                            groupedCVs.get(key)!.push(cv);
                          });

                          // Lấy danh sách các nhóm đã sắp xếp
                          const sortedGroups = Array.from(groupedCVs.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                          // Tính toán phân trang
                          const startIndex = (pageCVs - 1) * itemsPerPageCVs;
                          const endIndex = startIndex + itemsPerPageCVs;
                          const paginatedGroups = sortedGroups.slice(startIndex, endIndex);

                          return paginatedGroups.map(([jobRoleLevelName, cvs]) => {
                            // Tách CV active và inactive
                            const activeCVs = cvs.filter((cv: any) => cv.isActive);
                            const inactiveCVs = cvs.filter((cv: any) => !cv.isActive);
                            const isCollapsed = collapsedInactiveCVGroups.has(jobRoleLevelName);

                            return (
                              <div key={jobRoleLevelName} className="mb-6 last:mb-0">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-primary-600" />
                                  {jobRoleLevelName}
                                </h3>
                                <div className="space-y-3">
                                  {/* CV đang hoạt động */}
                                  {activeCVs.map((cv: any) => {
                                    const jrlInfo = jobRoleLevelsMap.get(cv.jobRoleLevelId);
                                    return (
                                      <div key={cv.id} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors duration-200">
                                        <div className="flex items-center gap-3 flex-1">
                                          <FileText className="w-5 h-5 text-primary-600" />
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              Version {cv.version}
                                            </p>
                                            {jrlInfo && (
                                              <p className="text-sm text-neutral-600">{jrlInfo.name}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Đang hoạt động</span>
                                          <a
                                            href={cv.cvFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300"
                                          >
                                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                            <span className="text-sm font-medium">Xem PDF</span>
                                          </a>
                                          <a
                                            href={cv.cvFileUrl}
                                            download
                                            className="group flex items-center gap-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all duration-300"
                                          >
                                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                            <span className="text-sm font-medium">Tải</span>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* CV không hoạt động - Thu gọn */}
                                  {inactiveCVs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-neutral-200">
                                      {/* Nút toggle để expand/collapse */}
                                      <button
                                        onClick={() => {
                                          setCollapsedInactiveCVGroups(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(jobRoleLevelName)) {
                                              newSet.delete(jobRoleLevelName);
                                            } else {
                                              newSet.add(jobRoleLevelName);
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors duration-200 border border-neutral-200 bg-neutral-50/50"
                                      >
                                        <span className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-neutral-500" />
                                          <span>
                                            {inactiveCVs.length} phiên bản cũ ({jobRoleLevelName})
                                          </span>
                                        </span>
                                        {isCollapsed ? (
                                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                                        ) : (
                                          <ChevronUp className="w-4 h-4 text-neutral-500" />
                                        )}
                                      </button>

                                      {/* Danh sách CV không hoạt động */}
                                      {!isCollapsed && (
                                        <div className="mt-3 space-y-2 pl-2">
                                          {inactiveCVs.map((cv: any) => {
                                            const jrlInfo = jobRoleLevelsMap.get(cv.jobRoleLevelId);
                                            return (
                                              <div key={cv.id} className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all duration-200">
                                                <div className="flex items-center gap-3 flex-1">
                                                  <FileText className="w-4 h-4 text-neutral-500" />
                                                  <div>
                                                    <p className="text-sm font-medium text-neutral-700">
                                                      Version {cv.version}
                                                    </p>
                                                    {jrlInfo && (
                                                      <p className="text-xs text-neutral-600">{jrlInfo.name}</p>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Không hoạt động</span>
                                                  <a
                                                    href={cv.cvFileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-300 text-sm font-medium"
                                                  >
                                                    <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                    <span>Xem PDF</span>
                                                  </a>
                                                  <a
                                                    href={cv.cvFileUrl}
                                                    download
                                                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all duration-300 text-sm font-medium"
                                                  >
                                                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                                    <span>Tải</span>
                                                  </a>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <SectionPagination
                        currentPage={pageCVs}
                        totalItems={(() => {
                          // Đếm số nhóm CV
                          const groupedCVs = new Map<string, any[]>();
                          talent.cvs.forEach((cv: any) => {
                            const key = cv.jobRoleLevelName || "Chưa xác định";
                            if (!groupedCVs.has(key)) {
                              groupedCVs.set(key, []);
                            }
                            groupedCVs.get(key)!.push(cv);
                          });
                          return groupedCVs.size;
                        })()}
                        itemsPerPage={itemsPerPageCVs}
                        onPageChange={setPageCVs}
                      />
                    </>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có CV nào</p>
                    )}
                    </div>
                  </div>
                )}

                {/* Kỹ Năng (Skills) Tab */}
                {activeTab === 'skills' && talent && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Code className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Kỹ Năng (Skills)</h2>
                        <p className="text-sm text-neutral-600">Danh sách kỹ năng của bạn</p>
                      </div>
                    </div>
                    <div>
                  {talent.skills && talent.skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {talent.skills.map((skill) => (
                        <div key={skill.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {skillsMap.get(skill.skillId) || `Skill #${skill.skillId}`}
                            </h3>
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                              {skill.level}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600">
                            Kinh nghiệm: {skill.yearsExp} năm
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có kỹ năng nào</p>
                    )}
                    </div>
                  </div>
                )}

                {/* Vai Trò & Cấp Độ Tab */}
                {activeTab === 'jobRole' && talent && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Target className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Vai Trò & Cấp Độ (Job Role Level)</h2>
                        <p className="text-sm text-neutral-600">Vai trò và cấp độ của bạn</p>
                      </div>
                    </div>
                    <div>
                  {talent.jobRoleLevels && talent.jobRoleLevels.length > 0 ? (
                    <div className="space-y-4">
                      {talent.jobRoleLevels.map((jrl) => {
                        const jrlInfo = jobRoleLevelsMap.get(jrl.jobRoleLevelId);
                        return (
                          <div key={jrl.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {jrlInfo?.jobRoleName || '—'} - {jrlInfo?.name || '—'}
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <p className="text-sm text-neutral-600">
                                <span className="font-medium">Kinh nghiệm:</span> {jrl.yearsOfExp} năm
                              </p>
                              {jrl.ratePerMonth && (
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">Mức lương/tháng:</span> {new Intl.NumberFormat('vi-VN').format(jrl.ratePerMonth)} VNĐ
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có vai trò nào</p>
                    )}
                    </div>
                  </div>
                )}

                {/* Kinh Nghiệm Làm Việc Tab */}
                {activeTab === 'experience' && talent && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Kinh Nghiệm Làm Việc</h2>
                        <p className="text-sm text-neutral-600">Lịch sử công việc của bạn</p>
                      </div>
                    </div>
                    <div>
                  {talent.workExperiences && talent.workExperiences.length > 0 ? (
                    <div className="space-y-4">
                      {talent.workExperiences.map((exp) => (
                        <div key={exp.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{exp.company}</h3>
                              <p className="text-sm text-neutral-600 mt-1">{exp.position}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-neutral-600">
                                {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}
                              </p>
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-neutral-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có kinh nghiệm làm việc nào</p>
                    )}
                    </div>
                  </div>
                )}

                {/* Dự Án (Projects) Tab */}
                {activeTab === 'projects' && talent && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Star className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Dự Án (Projects)</h2>
                        <p className="text-sm text-neutral-600">Các dự án bạn đã tham gia</p>
                      </div>
                    </div>
                    <div>
                  {talent.projects && talent.projects.length > 0 ? (
                    <div className="space-y-4">
                      {talent.projects.map((project) => (
                        <div key={project.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <h3 className="font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                          <p className="text-sm text-neutral-600 mb-2">
                            <span className="font-medium">Vị trí:</span> {project.position}
                          </p>
                          <p className="text-sm text-neutral-600 mb-2">
                            <span className="font-medium">Công nghệ:</span> {project.technologies}
                          </p>
                          {project.description && (
                            <p className="text-sm text-neutral-700 mt-2">{project.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có dự án nào</p>
                    )}
                    </div>
                  </div>
                )}

                {/* Chứng Chỉ (Certificates) Tab */}
                {activeTab === 'certificates' && talent && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Award className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Chứng Chỉ (Certificates)</h2>
                        <p className="text-sm text-neutral-600">Các chứng chỉ của bạn</p>
                      </div>
                    </div>
                    <div>
                  {talent.certificates && talent.certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {talent.certificates.map((cert) => (
                        <div key={cert.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{cert.certificateName}</h3>
                            {cert.isVerified && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Đã xác thực
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">
                            <span className="font-medium">Loại:</span> {certificateTypesMap.get(cert.certificateTypeId) || '—'}
                          </p>
                          {cert.certificateDescription && (
                            <p className="text-sm text-neutral-700 mb-2">{cert.certificateDescription}</p>
                          )}
                          {cert.issuedDate && (
                            <p className="text-sm text-neutral-600 mb-2">
                              <span className="font-medium">Ngày cấp:</span> {formatDate(cert.issuedDate)}
                            </p>
                          )}
                          {cert.imageUrl && (
                            <div className="mt-2">
                              <a
                                href={cert.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Xem hình ảnh
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-center py-8">Chưa có chứng chỉ nào</p>
                    )}
                    </div>
                  </div>
                )}


                {!talent && activeTab === 'info' && (
                  <div className="text-center py-8">
                    <p className="text-neutral-500">Chưa có thông tin talent. Vui lòng liên hệ TA để được tạo hồ sơ.</p>
                  </div>
                )}
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component phân trang
function SectionPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = endIndex;

  if (totalItems <= itemsPerPage) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
      <p className="text-sm text-neutral-600">
        {startItem}-{endItem} của {totalItems} mục
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-primary-600"
            }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-primary-600"
            }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
