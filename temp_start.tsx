import { useEffect, useState } from "react";
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
  [PartnerType.OwnCompany]: "CÃ´ng ty riÃªng",
  [PartnerType.Partner]: "Äá»‘i tÃ¡c",
  [PartnerType.Individual]: "CÃ¡ nhÃ¢n",
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState<Partner | null>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [pagination, setPagination] = useState<PagedResult<Partner> | null>(null);

  // Reset email error when modal opens/closes
  useEffect(() => {
    setEmailError("");
  }, [showCreateAccount]);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
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
      console.error("âŒ Lá»—i khi táº£i danh sÃ¡ch Ä‘á»‘i tÃ¡c:", err);
      setError(err.message || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch Ä‘á»‘i tÃ¡c");
    } finally {
      setLoading(false);
    }
  };

  // Load partners on component mount and when filters change
  useEffect(() => {
    fetchPartners(currentPage);
  }, [query, taxCodeFilter, phoneFilter, partnerTypeFilter, currentPage]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchPartners(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, taxCodeFilter, phoneFilter]);

  // Since filtering is now done on the server, we just use the partners directly
  const filtered = partners;

  // Handle create account for partner
  const handleCreateAccount = async (partner: Partner, email: string) => {
    try {
      setCreatingAccount(true);
      const model: CreatePartnerAccountModel = {
        email: email.trim()
      };

      const response = await partnerService.createAccount(partner.id, model);

      // Build success message
      let successMessage = `âœ… Cáº¥p tÃ i khoáº£n thÃ nh cÃ´ng!\n\n`;
      successMessage += `Email: ${response.data?.email}\n`;
      successMessage += `Máº­t kháº©u: ${response.data?.generatedPassword}\n\n`;

      const originalEmail = partner.email || '';
      const emailChanged = email.trim() !== originalEmail.trim();
      if (emailChanged) {
        successMessage += `ðŸ“§ Email Ä‘á»‘i tÃ¡c Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t thÃ nh: ${email}\n\n`;
      }

      successMessage += `Máº­t kháº©u Ä‘Ã£ Ä‘Æ°á»£c gá»­i qua email.`;

      alert(successMessage);
      setShowCreateAccount(null);
    } catch (err: any) {
      console.error("âŒ Lá»—i khi cáº¥p tÃ i khoáº£n:", err);
      let errorMessage = "KhÃ´ng thá»ƒ cáº¥p tÃ i khoáº£n. Vui lÃ²ng thá»­ láº¡i.";
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
  function handlePartnerTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "All") setPartnerTypeFilter("All");
    else if (Object.values(PartnerType).includes(v as unknown as PartnerType)) {
      setPartnerTypeFilter(v as unknown as PartnerType);
    }
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quáº£n lÃ½ Äá»‘i tÃ¡c</h1>
            <p className="text-neutral-600 mt-1">
              Quáº£n lÃ½ danh sÃ¡ch Ä‘á»‘i tÃ¡c trong há»‡ thá»‘ng.
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
                placeholder="TÃ¬m theo mÃ£ Ä‘á»‘i tÃ¡c, tÃªn cÃ´ng ty"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-primary-500 text-gray-700"
          >
            <Filter className="w-4 h-4" /> {showFilters ? "áº¨n bá»™ lá»c" : "Hiá»‡n bá»™ lá»c"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">MÃ£ sá»‘ thuáº¿</label>
              <input
                value={taxCodeFilter}
                onChange={(e) => setTaxCodeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nháº­p mÃ£ sá»‘ thuáº¿"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Sá»‘ Ä‘iá»‡n thoáº¡i</label>
              <input
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Loáº¡i Ä‘á»‘i tÃ¡c</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                value={partnerTypeFilter}
                onChange={handlePartnerTypeChange}
              >
                <option value="All">Táº¥t cáº£</option>
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
              Thá»­ láº¡i
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden" style={{ contain: 'layout style' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left table-fixed">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-3">MÃ£ Ä‘á»‘i tÃ¡c</th>
                  <th className="px-4 py-3">TÃªn cÃ´ng ty</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Sá»‘ Ä‘iá»‡n thoáº¡i</th>
                  <th className="px-4 py-3">Loáº¡i</th>
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
                      KhÃ´ng cÃ³ Ä‘á»‘i tÃ¡c phÃ¹ há»£p.
                    </td>
                  </tr>
                ) : (
                  filtered.map((partner) => (
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
                          <div className="text-sm text-gray-600">Äáº¡i diá»‡n: {partner.contactPerson}</div>
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
                            <span className="text-gray-400">â€”</span>
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
                            <span className="text-gray-400">â€”</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${partnerTypeColors[partner.partnerType]}`}>
                          {partnerTypeLabels[partner.partnerType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100"
                          onClick={() => setMenuOpen(menuOpen === partner.id.toString() ? null : partner.id.toString())}
                          aria-label="More"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {menuOpen === partner.id.toString() && (
                          <div className="absolute right-4 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-10">
                            <button
                              onClick={() => {
                                console.log('Menu clicked for partner:', partner.companyName);
                                setShowCreateAccount(partner);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" /> Cáº¥p tÃ i khoáº£n
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Create Account Modal */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="TÃ¬m theo mÃ£ Ä‘á»‘i tÃ¡c, tÃªn cÃ´ng ty"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-primary-500 text-gray-700"
          >
            <Filter className="w-4 h-4" /> {showFilters ? "áº¨n bá»™ lá»c" : "Hiá»‡n bá»™ lá»c"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">MÃ£ sá»‘ thuáº¿</label>
              <input
                value={taxCodeFilter}
                onChange={(e) => setTaxCodeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nháº­p mÃ£ sá»‘ thuáº¿"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Sá»‘ Ä‘iá»‡n thoáº¡i</label>
              <input
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Nháº­p sá»‘ Ä‘iá»‡n thoáº¡i"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Loáº¡i Ä‘á»‘i tÃ¡c</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                value={partnerTypeFilter}
                onChange={handlePartnerTypeChange}
              >
                <option value="All">Táº¥t cáº£</option>
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
              Thá»­ láº¡i
            </button>
          </div>
        )}

