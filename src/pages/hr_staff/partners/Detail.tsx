import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/ta_staff";
import { partnerService, type PartnerDetailedModel, type PartnerTalentModel, PartnerType } from "../../../services/Partner";
import { talentService, type Talent } from "../../../services/Talent";
import { partnerContractPaymentService, type PartnerContractPaymentModel } from "../../../services/PartnerContractPayment";
import { Button } from "../../../components/ui/button";
import { 
  Edit, 
  Trash2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  XCircle,
  FileText,
  FileCheck,
  Users,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "../../../router/routes";

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<PartnerDetailedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [talentDetails, setTalentDetails] = useState<Record<number, Talent>>({});
  const [contractPayments, setContractPayments] = useState<PartnerContractPaymentModel[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contracts' | 'talents'>('basic');
  
  // Pagination states
  const [pageContracts, setPageContracts] = useState(1);
  const [pageTalents, setPageTalents] = useState(1);
  const itemsPerPageContracts = 10;
  const itemsPerPageTalents = 10;

  // Reset pagination when switching tabs
  const handleTabChange = (tab: 'basic' | 'contracts' | 'talents') => {
    setActiveTab(tab);
    if (tab === 'contracts') {
      setPageContracts(1);
      // Fetch contracts when switching to contracts tab
      if (partner && partner.talents && partner.talents.length > 0) {
        fetchContractPayments();
      }
    } else if (tab === 'talents') {
      setPageTalents(1);
    }
  };

  // Fetch contract payments for all talents of this partner
  const fetchContractPayments = async () => {
    if (!partner || !partner.talents || partner.talents.length === 0) {
      setContractPayments([]);
      return;
    }

    try {
      setLoadingContracts(true);
      const talentIds = partner.talents.map((t: PartnerTalentModel) => t.talentId);
      
      // Fetch contracts for all talents in parallel
      const contractPromises = talentIds.map((talentId: number) =>
        partnerContractPaymentService.getAll({ 
          talentId: talentId, 
          excludeDeleted: true 
        })
      );
      
      const contractResults = await Promise.all(contractPromises);
      
      // Flatten and combine all contracts
      const allContracts: PartnerContractPaymentModel[] = [];
      contractResults.forEach((result) => {
        const contracts = Array.isArray(result) ? result : ((result as any)?.items || []);
        allContracts.push(...contracts);
      });
      
      // Sort by createdAt (newest first)
      allContracts.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setContractPayments(allContracts);
    } catch (err) {
      console.error("❌ Lỗi khi tải hợp đồng:", err);
      setContractPayments([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    const fetchPartner = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await partnerService.getDetailedById(Number(id));
        // Handle response structure: { success: true, data: {...} } or direct data
        const partnerData = response?.data || response;
        console.log("🔍 Partner data from API:", partnerData);
        
        // Lấy thông tin cơ bản từ getAll để có code, taxCode, phone, partnerType (vì detailed API có thể thiếu)
        let basicPartnerInfo: any = null;
        try {
          const allPartners = await partnerService.getAll();
          const partnersArray = Array.isArray(allPartners) ? allPartners : [];
          basicPartnerInfo = partnersArray.find((p: any) => p.id === Number(id));
        } catch (err) {
          console.warn("⚠️ Không thể lấy thông tin cơ bản từ getAll:", err);
        }
        
        if (partnerData) {
          // Map dữ liệu từ backend (có thể là PascalCase) sang camelCase
          // Ưu tiên lấy từ basicPartnerInfo (getAll) nếu có, fallback về partnerData (detailed)
          const mappedPartner: PartnerDetailedModel = {
            id: partnerData.id || partnerData.Id,
            code: basicPartnerInfo?.code || partnerData.code || partnerData.Code || '',
            partnerType: basicPartnerInfo?.partnerType || partnerData.partnerType || partnerData.PartnerType || PartnerType.Partner,
            companyName: partnerData.companyName || partnerData.CompanyName || '',
            taxCode: basicPartnerInfo?.taxCode || partnerData.taxCode || partnerData.TaxCode || null,
            contactPerson: partnerData.contactPerson || partnerData.ContactPerson || null,
            email: partnerData.email || partnerData.Email || null,
            phoneNumber: basicPartnerInfo?.phone || partnerData.phoneNumber || partnerData.PhoneNumber || partnerData.phone || partnerData.Phone || null,
            address: partnerData.address || partnerData.Address || null,
            notes: partnerData.notes || partnerData.Notes || null,
            createdAt: partnerData.createdAt || partnerData.CreatedAt || '',
            updatedAt: partnerData.updatedAt || partnerData.UpdatedAt || '',
            contracts: partnerData.contracts || partnerData.Contracts || [],
            talents: partnerData.talents || partnerData.Talents || [],
            paymentPeriods: partnerData.paymentPeriods || partnerData.PaymentPeriods || [],
          };
          console.log("✅ Mapped partner data:", mappedPartner);
          setPartner(mappedPartner);
          
          // Fetch talent details for each talent
          if (partnerData.talents && partnerData.talents.length > 0) {
            const talentPromises = partnerData.talents.map(async (talent: PartnerTalentModel) => {
              try {
                const talentData = await talentService.getById(talent.talentId);
                return { talentId: talent.talentId, data: talentData };
              } catch (err) {
                console.error(`❌ Lỗi khi tải thông tin talent ${talent.talentId}:`, err);
                return null;
              }
            });
            
            const talentResults = await Promise.all(talentPromises);
            const talentMap: Record<number, Talent> = {};
            talentResults.forEach((result) => {
              if (result) {
                talentMap[result.talentId] = result.data;
              }
            });
            setTalentDetails(talentMap);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết đối tác:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !partner) return;
    const confirmDelete = window.confirm(`⚠️ Bạn có chắc muốn xóa đối tác ${partner.companyName}?`);
    if (!confirmDelete) return;

    try {
      await partnerService.deleteById(Number(id));
      alert("✅ Xóa đối tác thành công!");
      navigate(ROUTES.TA_STAFF.PARTNERS.LIST);
    } catch (err) {
      console.error("❌ Lỗi khi xóa đối tác:", err);
      alert("Không thể xóa đối tác!");
    }
  };

  const handleEdit = () => {
    navigate(`${ROUTES.TA_STAFF.PARTNERS.LIST}/edit/${id}`);
  };

  // Helper functions để chuyển đổi trạng thái hợp đồng sang tiếng Việt
  const normalizeStatus = (status?: string | null) => (status ?? '').toLowerCase();

  const getStatusText = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      // Contract Status
      case 'draft':
        return 'Nháp';
      case 'needmoreinformation':
        return 'Cần thêm thông tin';
      case 'submitted':
        return 'Đã gửi';
      case 'verified':
        return 'Đã xác minh';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      // Legacy status (for backward compatibility)
      case 'active':
        return 'Đang hiệu lực';
      case 'pending':
        return 'Chờ duyệt';
      case 'expired':
        return 'Đã hết hạn';
      case 'terminated':
        return 'Đã chấm dứt';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      // Contract Status
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'needmoreinformation':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      // Legacy status (for backward compatibility)
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-blue-100 text-blue-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu đối tác...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="TA Staff" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 text-lg font-medium">Không tìm thấy đối tác</p>
            <Link 
              to={ROUTES.TA_STAFF.PARTNERS.LIST}
              className="text-primary-600 hover:text-primary-800 text-sm mt-2 inline-block"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="TA Staff" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Breadcrumb
            items={[
              { label: "Đối tác", to: ROUTES.TA_STAFF.PARTNERS.LIST },
              { label: partner ? partner.companyName || "Chi tiết đối tác" : "Chi tiết đối tác" }
            ]}
          />

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chi tiết đối tác</h1>
              <p className="text-neutral-600 mb-4">
                Thông tin chi tiết về đối tác trong hệ thống DevPool
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleEdit}
                className="group flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Chỉnh sửa
              </Button>
              <Button
                onClick={handleDelete}
                className="group flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-soft hover:shadow-glow transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 animate-fade-in">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
            <div className="border-b border-neutral-200">
              <div className="flex space-x-1 px-6 pt-4">
                <button
                  onClick={() => handleTabChange('basic')}
                  className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'basic'
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Thông tin cơ bản
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('contracts')}
                  className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'contracts'
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Hợp đồng {contractPayments.length > 0 ? `(${contractPayments.length})` : ''}
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('talents')}
                  className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTab === 'talents'
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Nhân sự {partner.talents && partner.talents.length > 0 ? `(${partner.talents.length})` : ''}
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Thông tin cơ bản */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Mã đối tác
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{partner.code || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Loại đối tác
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {partner.partnerType === PartnerType.OwnCompany ? 'Công ty mình' :
                       partner.partnerType === PartnerType.Partner ? 'Đối tác' :
                       partner.partnerType === PartnerType.Individual ? 'Cá nhân/Freelancer' : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Tên công ty
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{partner.companyName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Mã số thuế
                    </label>
                    <p className="text-lg text-gray-900">{partner.taxCode || '—'}</p>
                  </div>

                  {partner.notes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ghi chú
                      </label>
                      <p className="text-lg text-gray-900">{partner.notes}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Người đại diện
                    </label>
                    <p className="text-lg text-gray-900">{partner.contactPerson || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-lg text-gray-900">{partner.email || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Số điện thoại
                    </label>
                    <p className="text-lg text-gray-900">{partner.phoneNumber || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Địa chỉ
                    </label>
                    <p className="text-lg text-gray-900">{partner.address || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ngày tạo
                    </label>
                    <p className="text-lg text-gray-900">
                      {partner.createdAt ? new Date(partner.createdAt).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ngày cập nhật
                    </label>
                    <p className="text-lg text-gray-900">
                      {partner.updatedAt ? new Date(partner.updatedAt).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Hợp đồng */}
              {activeTab === 'contracts' && (
                <div>
                  {loadingContracts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <p className="text-neutral-500">Đang tải hợp đồng...</p>
                    </div>
                  ) : contractPayments.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Mã hợp đồng</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Mức giá</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const startIndex = (pageContracts - 1) * itemsPerPageContracts;
                              const endIndex = startIndex + itemsPerPageContracts;
                              const paginatedContracts = contractPayments.slice(startIndex, endIndex);
                              
                              return paginatedContracts.map((contract) => (
                                <tr key={contract.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                                  <td className="py-4 px-4">
                                    <p className="text-sm font-medium text-gray-900">{contract.contractNumber}</p>
                                  </td>
                                  <td className="py-4 px-4">
                                    <p className="text-sm text-gray-900">
                                      {(() => {
                                        const monthlyRate = (contract.unitPriceForeignCurrency * contract.exchangeRate) || contract.actualAmountVND || 0;
                                        return monthlyRate > 0 ? `${monthlyRate.toLocaleString('vi-VN')} VND/tháng` : '—';
                                      })()}
                                    </p>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.contractStatus)}`}>
                                      {getStatusText(contract.contractStatus)}
                                    </span>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageContracts}
                        totalItems={contractPayments.length}
                        itemsPerPage={itemsPerPageContracts}
                        onPageChange={setPageContracts}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 text-lg font-medium">Không có hợp đồng</p>
                    </div>
                  )}
                </div>
              )}

              {/* Nhân sự */}
              {activeTab === 'talents' && (
                <div>
                  {partner.talents && partner.talents.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Họ và tên</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Email</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Số điện thoại</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Trạng thái hợp đồng</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày bắt đầu</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Ngày kết thúc</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const startIndex = (pageTalents - 1) * itemsPerPageTalents;
                              const endIndex = startIndex + itemsPerPageTalents;
                              const paginatedTalents = partner.talents.slice(startIndex, endIndex);
                              
                              return paginatedTalents.map((talent) => {
                                const talentInfo = talentDetails[talent.talentId];
                                return (
                                  <tr key={talent.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                                    <td className="py-4 px-4">
                                      <p className="text-sm font-medium text-gray-900">
                                        {talentInfo?.fullName || `Talent #${talent.talentId}`}
                                      </p>
                                    </td>
                                    <td className="py-4 px-4">
                                      <p className="text-sm text-gray-900">
                                        {talentInfo?.email || '—'}
                                      </p>
                                    </td>
                                    <td className="py-4 px-4">
                                      <p className="text-sm text-gray-900">
                                        {talentInfo?.phone || '—'}
                                      </p>
                                    </td>
                                    <td className="py-4 px-4">
                                      {talent.status ? (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(talent.status)}`}>
                                          {getStatusText(talent.status)}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-500">—</span>
                                      )}
                                    </td>
                                    <td className="py-4 px-4">
                                      <p className="text-sm text-gray-900">
                                        {new Date(talent.startDate).toLocaleDateString('vi-VN')}
                                      </p>
                                    </td>
                                    <td className="py-4 px-4">
                                      <p className="text-sm text-gray-900">
                                        {talent.endDate ? new Date(talent.endDate).toLocaleDateString('vi-VN') : 'Đang hoạt động'}
                                      </p>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                      <SectionPagination
                        currentPage={pageTalents}
                        totalItems={partner.talents.length}
                        itemsPerPage={itemsPerPageTalents}
                        onPageChange={setPageTalents}
                      />
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 text-lg font-medium">Không có nhân sự</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Kỳ thanh toán */}
          {partner.paymentPeriods && partner.paymentPeriods.length > 0 && (
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Kỳ thanh toán ({partner.paymentPeriods.length})</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partner.paymentPeriods.map((period) => (
                    <div key={period.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <p className="text-base font-semibold text-gray-900">
                          {period.periodMonth}/{period.periodYear}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-600">Trạng thái</p>
                      <p className="text-base font-semibold text-gray-900">{period.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === 1
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-primary-600"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === totalPages
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
