import { useEffect, useState } from "react";
import { Search, Filter, Plus, Shield, ShieldCheck, MoreVertical, UserRound, Trash2, Mail, Phone, CheckCircle2, XCircle } from "lucide-react";
import { sidebarItems } from "../../../components/sidebar/admin";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { userService, type User, type UserFilter, type PagedResult } from "../../../services/User";

// ------ Types ------
export type StaffRole =
  | "Manager"
  | "TA"
  | "Sale"
  | "Accountant";

type StatusFilter = "All" | "Active" | "Inactive";

// Options - Chỉ bao gồm các role staff, không có Admin và Dev (Talent)
const ROLE_OPTIONS = [
  "Manager",
  "TA",
  "Sale",
  "Accountant",
] as const satisfies readonly StaffRole[];


// Use the User type from service instead of UserRow
type UserRow = User;

// Helper function to convert User to UserRow
const convertToUserRow = (user: User): UserRow => user;

// Helper
const roleColors: Record<StaffRole, string> = {
  Manager: "bg-amber-100 text-amber-700",
  "TA": "bg-blue-100 text-blue-700",
  "Sale": "bg-sky-100 text-sky-700",
  "Accountant": "bg-teal-100 text-teal-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ------ Page Component ------
export default function StaffManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | StaffRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<null | UserRow>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PagedResult<User> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Fetch users from API
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: UserFilter = {
        name: query || undefined,
        role: roleFilter === "All" ? undefined : roleFilter,
        isActive: statusFilter === "All" ? undefined : statusFilter === "Active",
        excludeDeleted: true,
        pageNumber: page,
        pageSize: pageSize,
      };

      const result = await userService.getAll(filter);
      // Lọc bỏ Admin khỏi danh sách
      const filteredItems = result.items.filter((user: User) => 
        !user.roles.includes("Admin")
      );
      setPagination({
        ...result,
        items: filteredItems,
        totalCount: filteredItems.length,
      });
      setUsers(filteredItems.map(convertToUserRow));
    } catch (err: any) {
      console.error("❌ Lỗi khi tải danh sách người dùng:", err);
      setError(err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers(currentPage);
  }, [query, roleFilter, statusFilter, currentPage]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Since filtering is now done on the server, we just use the users directly
  const filtered = users;



  async function removeUsers(ids: string[]) {
    try {
      if (!confirm(`Bạn có chắc muốn xóa ${ids.length} người dùng?`)) {
        return;
      }

      // Delete each user individually
      for (const id of ids) {
        await userService.delete(id);
      }
      
      // Refresh the user list
      await fetchUsers(currentPage);
    } catch (err: any) {
      console.error("❌ Lỗi khi xóa người dùng:", err);
      alert("Không thể xóa người dùng. Vui lòng thử lại.");
    }
  }
  // Guards
  function isStaffRole(v: string): v is StaffRole {
    return (ROLE_OPTIONS as readonly string[]).includes(v);
  }

  // Handlers
  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "All") setRoleFilter("All");
    else if (isStaffRole(v)) setRoleFilter(v);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as StatusFilter;
    setStatusFilter(v);
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />

      <div className="flex-1 p-8">
        <Breadcrumb
          items={[
            { label: "Người dùng" }
          ]}
        />
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
            <p className="text-neutral-600 mt-1">
              Tạo/sửa tài khoản nhân viên (Manager, TA, Sales, Accountant), phân quyền vai trò và vô hiệu hóa khi cần.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" /> Thêm người dùng
          </button>
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
                placeholder="Tìm theo tên, email, số điện thoại"
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Vai trò</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                value={roleFilter}
                onChange={handleRoleChange}
              >
                <option value="All">Tất cả</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Trạng thái</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
              onClick={() => fetchUsers(currentPage)}
              className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        Đang tải người dùng...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Không có người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                            <UserRound className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.fullName}</div>
                            <div className="text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" />{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {u.phoneNumber ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {u.phoneNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {u.roles.map((r) => (
                            <span key={r} className={`px-2 py-1 rounded-lg text-xs font-medium ${roleColors[r as StaffRole] || 'bg-gray-100 text-gray-700'}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-lg text-xs font-medium">
                            <XCircle className="w-4 h-4" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100"
                          onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                          aria-label="More"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {menuOpen === u.id && (
                          <div className="absolute right-4 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-10">
                            <button
                              onClick={() => {
                                setShowEdit(u);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" /> Sửa vai trò / thông tin
                            </button>
                            <button
                              onClick={() => {
                                removeUsers([u.id]);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Xóa người dùng
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {((pagination.pageNumber - 1) * pagination.pageSize) + 1} - {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} trong {pagination.totalCount} người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Đầu
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                Trang {pagination.pageNumber} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Cuối
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <UserModal
            title="Thêm người dùng"
            onClose={() => setShowCreate(false)}
            onSubmit={async (payload) => {
              try {
                await userService.create({
                  email: payload.email,
                  fullName: payload.fullName,
                  phoneNumber: payload.phone,
                  password: "TempPassword123!", // This should be generated or set by admin
                  role: payload.roles[0] || "TA", // Take first role for now
                });
                await fetchUsers(currentPage);
                setShowCreate(false);
              } catch (err: any) {
                console.error("❌ Lỗi khi tạo người dùng:", err);
                alert(err.message || "Không thể tạo người dùng. Vui lòng thử lại.");
              }
            }}
          />
        )}

        {/* Edit Modal */}
        {showEdit && (
          <UserModal
            title="Cập nhật người dùng"
            initial={showEdit}
            onClose={() => setShowEdit(null)}
            onSubmit={async (payload) => {
              try {
                await userService.update(showEdit.id, {
                  fullName: payload.fullName,
                  phoneNumber: payload.phone,
                });
                
                // Update role if changed
                if (payload.roles[0] !== showEdit.roles[0]) {
                  await userService.updateRole(showEdit.id, {
                    role: payload.roles[0] || "TA",
                  });
                }
                
                await fetchUsers(currentPage);
                setShowEdit(null);
              } catch (err: any) {
                console.error("❌ Lỗi khi cập nhật người dùng:", err);
                alert(err.message || "Không thể cập nhật người dùng. Vui lòng thử lại.");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ------ Modal Component ------
function UserModal({
  title,
  initial,
  onSubmit,
  onClose,
}: {
  title: string;
  initial?: Partial<UserRow>;
  onSubmit: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    roles: StaffRole[];
  }) => void;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phoneNumber ?? "");
  const [roles, setRoles] = useState<StaffRole[]>(
    (initial?.roles as StaffRole[]) ?? []
  );

  function toggleRole(r: StaffRole) {
    setRoles((cur) =>
      cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Họ và tên</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="VD: Nguyễn Văn B"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="email@devpool.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="09xx xxx xxx"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Vai trò & quyền</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  "Manager",
                  "TA",
                  "Sale",
                  "Accountant",
                ] as StaffRole[]
              ).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${roles.includes(r)
                    ? "border-transparent bg-primary-600 text-white"
                    : "border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {roles.includes(r) ? <ShieldCheck className="w-4 h-4 inline mr-1" /> : <Shield className="w-4 h-4 inline mr-1" />}
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Gợi ý: 1 người dùng có thể có nhiều vai trò. Quyền chi tiết nên kiểm soát ở BE (RBAC) theo mô tả nghiệp vụ.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={() => onSubmit({ fullName, email, phone, roles })}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
