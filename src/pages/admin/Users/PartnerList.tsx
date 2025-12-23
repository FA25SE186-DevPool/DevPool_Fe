import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Building, Mail, Phone, XCircle, MoreVertical, Shield } from "lucide-react";
import { sidebarItems } from "../../../components/sidebar/admin";
import Sidebar from "../../../components/common/Sidebar";
import { partnerService, PartnerType, type Partner, type PartnerFilter, type CreatePartnerAccountModel } from "../../../services/Partner";
import { type PagedResult } from "../../../services/User";

// ------ Types ------
type PartnerRow = Partner;

// Helper function to convert Partner to PartnerRow
const convertToPartnerRow = (partner: Partner): PartnerRow => partner;

// Helper for partner type display
const partnerTypeLabels: Record<PartnerType, string> = {
  [PartnerType.OwnCompany]: "Công ty riêng",
  [PartnerType.Partner]: "Đối tác",
  [PartnerType.Individual]: "Cá nhân",
};

const partnerTypeColors: Record<PartnerType, string> = {
  [PartnerType.OwnCompany]: "bg-purple-100 text-purple-700",
  [PartnerType.Partner]: "bg-blue-100 text-blue-700",
  [PartnerType.Individual]: "bg-green-100 text-green-700",
};

// ------ Page Component ------
const PartnerManagementPage = () => {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [taxCodeFilter, setTaxCodeFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerType | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState<Partner | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [pagination, setPagination] = useState<PagedResult<Partner> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);

  // Fetch partners from API
  const fetchPartners = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const filter: PartnerFilter = {
        companyName: query || undefined,
        taxCode: taxCodeFilter || undefined,
        phone: phoneFilter || undefined,
        excludeDeleted: true,
        pageNumber: page,
        pageSize: pageSize,
      };

      if (partnerTypeFilter !== "All") {
        filter.partnerType = partnerTypeFilter as PartnerType;
      }

      const result = await partnerService.getAll(filter);
      setPagination(result);
      setPartners(result.items.map(convertToPartnerRow));
    } catch (err: any) {
      console.error("❌ Lỗi khi tải danh sách đối tác:", err);
      setError(err.message || "Không thể tải danh sách đối tác");
    } finally {
      setLoading(false);
    }
  };

  // Load partners on component mount and when filters/page change
  useEffect(() => {
    fetchPartners(currentPage);
  }, [currentPage]); // Only depend on currentPage

  // Debounced search - reset to page 1 when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, taxCodeFilter, phoneFilter, partnerTypeFilter]);

  // Since filtering is now done on the server, we just use the partners directly
  const filtered = partners;
  const lastItemIndex = filtered.length - 1;

  // Handle create account for partner
  const handleCreateAccount = async (partner: Partner, email: string) => {
    try {
      setCreatingAccount(true);
      const model: CreatePartnerAccountModel = {
        email: email.trim()
      };

      const response = await partnerService.createAccount(partner.id, model);

      // Check if email was changed and update partner if needed
      const originalEmail = partner.email || '';
      const emailChanged = email.trim() !== originalEmail.trim();

      if (emailChanged) {
        // Update partner email
        await partnerService.update(partner.id, {
          ...partner,
          email: email.trim()
        });

        // Update local state
        setPartners(prev => prev.map(p =>
          p.id === partner.id ? { ...p, email: email.trim() } : p
        ));
      }

      // Build success message
      let successMessage = `Cấp tài khoản thành công!\n\n`;
      successMessage += `Email: ${response.data?.email}\n`;
      successMessage += `Mật khẩu: ${response.data?.generatedPassword}\n\n`;

      if (emailChanged) {
        successMessage += `✅ Email đối tác đã được cập nhật thành: ${email}\n\n`;
      }

      successMessage += `Mật khẩu đã được gửi qua email này.`;

      // Update partner's userId status (set a temporary userId to indicate account created)
      setPartners(prev => prev.map(p =>
        p.id === partner.id ? { ...p, userId: 1 } : p // Set userId to indicate account is created
      ));

      alert(successMessage);
      setShowCreateAccount(null);
    } catch (err: any) {
      console.error("❌ Lỗi khi cấp tài khoản:", err);
      let errorMessage = "Không thể cấp tài khoản. Vui lòng thử lại.";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setCreatingAccount(false);
    }
  };

  // Handlers
  const handlePartnerTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "All") setPartnerTypeFilter("All");
    else if (Object.values(PartnerType).includes(v as unknown as PartnerType)) {
      setPartnerTypeFilter(v as unknown as PartnerType);
    }
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Cấp Tài Khoản</h1>
            <p className="text-neutral-600 mt-1">
              Danh sách đối tác cần cấp tài khoản trong hệ thống.
            </p>
          </div>
        </header>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Tìm theo mã đối tác, tên công ty"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-primary-500 text-gray-700"
          >
            <Filter className="w-4 h-4" /> {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Mã số thuế</label>
              <input
                value={taxCodeFilter}
                onChange={(e) => setTaxCodeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nhập mã số thuế"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <input
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Loại đối tác</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                value={partnerTypeFilter}
                onChange={handlePartnerTypeChange}
              >
                <option value="All">Tất cả</option>
                {Object.values(PartnerType).map((type) => (
                  <option key={type} value={type}>
                    {partnerTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => fetchPartners(currentPage)}
              className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden" style={{ contain: 'layout style' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left table-fixed">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-3">Mã đối tác</th>
                  <th className="px-4 py-3">Tên công ty</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-40"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                          <div className="h-3 bg-gray-200 rounded w-48"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Không có đối tác phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((partner, index) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-gray-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{partner.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{partner.companyName}</div>
                        {partner.contactPerson && (
                          <div className="text-sm text-gray-600">Đại diện: {partner.contactPerson}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {partner.email ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {partner.email}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {partner.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {partner.phone}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${partnerTypeColors[partner.partnerType]}`}>
                          {partnerTypeLabels[partner.partnerType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        {partner.userId ? (
                          <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
                            Đã có TK
                          </span>
                        ) : (
                          <>
                            <button
                              className="p-2 rounded-lg hover:bg-gray-100"
                              onClick={() => setMenuOpen(menuOpen === partner.id ? null : partner.id)}
                              aria-label="More"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {menuOpen === partner.id && (
                              <div className={`absolute right-4 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-10 ${index === lastItemIndex ? 'bottom-full mb-2' : 'mt-2'}`}>
                                <button
                                  onClick={() => {
                                    setShowCreateAccount(partner);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Shield className="w-4 h-4" /> Cấp tài khoản
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {(() => {
          // @ts-ignore - pagination is checked for null before accessing totalPages
          if (!pagination || pagination.totalPages <= 1) return null;
          const p = pagination!;
          return (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {((p.pageNumber - 1) * p.pageSize) + 1} - {Math.min(p.pageNumber * p.pageSize, p.totalCount)} trong {p.totalCount} đối tác
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!p.hasPreviousPage}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Đầu
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!p.hasPreviousPage}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Trang {p.pageNumber} / {p.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!p.hasNextPage}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
                <button
                  onClick={() => setCurrentPage(p.totalPages)}
                  disabled={!p.hasNextPage}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Cuối
                </button>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className={`fixed inset-0 z-40 grid place-items-center p-4 ${creatingAccount ? 'bg-black/50' : 'bg-black/30'}`}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cấp tài khoản cho đối tác</h3>
              <button
                onClick={() => setShowCreateAccount(null)}
                disabled={creatingAccount}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">{showCreateAccount?.companyName}</div>
                    <div className="text-sm text-blue-700">Mã: {showCreateAccount?.code}</div>
                    {showCreateAccount?.contactPerson && (
                      <div className="text-sm text-blue-700">Đại diện: {showCreateAccount?.contactPerson}</div>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (creatingAccount) return; // Prevent double submission

                const formData = new FormData(e.target as HTMLFormElement);
                const email = formData.get('email') as string;

                if (email && showCreateAccount) {
                  const originalEmail = showCreateAccount.email || '';
                  const emailChanged = email.trim() !== originalEmail.trim();

                  // Build confirmation message
                  let confirmMessage = `Bạn có chắc muốn cấp tài khoản cho đối tác "${showCreateAccount.companyName}"?\n\n`;
                  confirmMessage += `Email tài khoản: ${email}\n`;

                  if (emailChanged) {
                    confirmMessage += `⚠️ Email sẽ được cập nhật từ "${originalEmail}" thành "${email}"\n`;
                  }

                  confirmMessage += `\nMật khẩu sẽ được tạo tự động và gửi qua email này.`;

                  const confirmed = window.confirm(confirmMessage);
                  if (confirmed) {
                    handleCreateAccount(showCreateAccount, email);
                  }
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      disabled={creatingAccount}
                      defaultValue={showCreateAccount?.email || ''}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Nhập email để cấp tài khoản (đã điền sẵn)"
                    />
                  </div>

                  <div className="text-xs text-neutral-500">
                    Mật khẩu sẽ được tạo tự động và gửi qua email này. Nếu bạn thay đổi email, hệ thống sẽ cập nhật email của đối tác.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAccount(null)}
                    disabled={creatingAccount}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creatingAccount ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Cấp tài khoản'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerManagementPage;
