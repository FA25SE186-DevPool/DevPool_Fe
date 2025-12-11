// pages/admin/companies/clients.tsx
import { useEffect, useState } from "react";
import { Plus, Search, Mail, Phone } from "lucide-react";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/admin";

type ClientCompany = {
  id: string;
  name: string;
  taxCode: string;
  email: string;
  phone: string;
  contactPerson: string;
  address?: string;
  isActive: boolean;
};

const mockClients: ClientCompany[] = [
  {
    id: "cl-001",
    name: "Công ty TNHH FPT Software",
    taxCode: "123456789",
    email: "contact@fpt.com",
    phone: "0901 333 444",
    contactPerson: "Lê Văn C",
    address: "Hà Nội",
    isActive: true,
  },
  {
    id: "cl-002",
    name: "Công ty Cổ phần VinTech",
    taxCode: "999888777",
    email: "support@vintech.com",
    phone: "0988 555 222",
    contactPerson: "Trần Thị D",
    address: "TP. HCM",
    isActive: false,
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setClients(mockClients); // TODO: gọi API thực tế
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Công ty Khách hàng</h1>
            <p className="text-neutral-600 mt-1">
              Quản lý thông tin công ty khách hàng và trạng thái hợp tác.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
            <Plus className="w-5 h-5" /> Thêm khách hàng
          </button>
        </header>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm khách hàng"
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
                <th className="px-4 py-3">Người đại diện</th>
                <th className="px-4 py-3">Thông tin liên hệ</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.taxCode}</td>
                  <td className="px-4 py-3">{c.contactPerson}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {c.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {c.phone}
                      </span>
                      {c.address && <span>📍 {c.address}</span>}
                    </div>
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
                    Không tìm thấy khách hàng phù hợp.
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
