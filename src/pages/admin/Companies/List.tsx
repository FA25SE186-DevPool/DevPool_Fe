// pages/admin/companies/index.tsx
import { useEffect, useState } from "react";
import { Plus, Search, Mail, Phone } from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/admin";

type CompanyRow = {
  id: string;
  name: string;
  taxCode?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  type: "Partner" | "Client";
  isActive: boolean;
};

const mockCompanies: CompanyRow[] = [
  {
    id: "c-001",
    name: "Công ty TNHH ABC",
    taxCode: "123456789",
    email: "contact@abc.com",
    phone: "0909 111 222",
    contactPerson: "Nguyễn Văn A",
    type: "Client",
    isActive: true,
  },
  {
    id: "c-002",
    name: "Công ty XYZ Solutions",
    taxCode: "987654321",
    email: "info@xyz.com",
    phone: "0912 333 444",
    contactPerson: "Trần Thị B",
    type: "Partner",
    isActive: false,
  },
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setCompanies(mockCompanies); // TODO: gọi API thực tế
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        <Breadcrumb
          items={[
            { label: "Công ty" }
          ]}
        />
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Danh sách Công ty</h1>
            <p className="text-neutral-600 mt-1">
              Quản lý công ty đối tác & khách hàng trong hệ thống.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
            <Plus className="w-5 h-5" /> Thêm công ty
          </button>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="w-full pl-10 pr-4 py-2 border rounded-xl"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">Tên công ty</th>
                <th className="px-4 py-3">Mã số thuế</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.taxCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      {c.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-4 h-4" /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {c.phone}
                        </span>
                      )}
                      {c.contactPerson && <span>👤 {c.contactPerson}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.type === "Client" ? (
                      <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg">
                        Khách hàng
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">
                        Đối tác
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg">
                        Ngưng
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Không có công ty nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
