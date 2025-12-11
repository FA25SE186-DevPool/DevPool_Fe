import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/common/Sidebar";
import Breadcrumb from "../../../components/common/Breadcrumb";
import { sidebarItems } from "../../../components/sidebar/accountant";
import { clientDocumentService, type ClientDocument } from "../../../services/ClientDocument";
import { partnerDocumentService, type PartnerDocument } from "../../../services/PartnerDocument";
import { documentTypeService, type DocumentType } from "../../../services/DocumentType";
import { FileText, Download, Building2, Users, Calendar, Search, Eye } from "lucide-react";

type TabType = 'client' | 'partner';

const AccountantDocumentsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('client');
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [partnerDocuments, setPartnerDocuments] = useState<PartnerDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<number | "">("");
  const [selectedSource, setSelectedSource] = useState<string>("");

  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const data = await documentTypeService.getAll({ excludeDeleted: true });
        setDocumentTypes(data?.items ?? data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDocumentTypes();
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        if (activeTab === 'client') {
          const filter: any = { excludeDeleted: true };
          if (selectedDocumentType) filter.documentTypeId = selectedDocumentType;
          if (selectedSource) filter.source = selectedSource;
          
          const data = await clientDocumentService.getAll(filter);
          setClientDocuments(data?.items ?? data ?? []);
        } else {
          const filter: any = { excludeDeleted: true };
          if (selectedDocumentType) filter.documentTypeId = selectedDocumentType;
          if (selectedSource) filter.source = selectedSource;
          
          const data = await partnerDocumentService.getAll(filter);
          setPartnerDocuments(data?.items ?? data ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, [activeTab, selectedDocumentType, selectedSource]);

  const filteredClientDocuments = clientDocuments.filter(doc => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(searchLower) ||
        (doc.description && doc.description.toLowerCase().includes(searchLower)) ||
        doc.id.toString().includes(searchLower)
      );
    }
    return true;
  });

  const filteredPartnerDocuments = partnerDocuments.filter(doc => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(searchLower) ||
        (doc.description && doc.description.toLowerCase().includes(searchLower)) ||
        doc.id.toString().includes(searchLower)
      );
    }
    return true;
  });

  const getDocumentTypeName = (typeId: number) => {
    const type = documentTypes.find(t => t.id === typeId);
    return type?.typeName || `Type ${typeId}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleDownload = (filePath: string) => {
    window.open(filePath, '_blank');
  };

  const handleView = (filePath: string) => {
    window.open(filePath, '_blank');
  };

  const currentDocuments = activeTab === 'client' ? filteredClientDocuments : filteredPartnerDocuments;
  const sources = Array.from(new Set([
    ...clientDocuments.map(d => d.source).filter(Boolean),
    ...partnerDocuments.map(d => d.source).filter(Boolean)
  ])) as string[];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Staff Accountant" />

      <div className="flex-1 p-8">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Tài liệu" }
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900">Danh sách tài liệu</h1>
          <p className="text-neutral-600 mt-1">Xem tài liệu của Khách hàng và Đối tác</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('client')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === 'client'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Tài liệu Khách hàng ({filteredClientDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('partner')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === 'partner'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              Tài liệu Đối tác ({filteredPartnerDocuments.length})
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên file, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Tất cả loại tài liệu</option>
                {documentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.typeName}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Tất cả nguồn</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mr-3" />
              Đang tải danh sách tài liệu...
            </div>
          ) : currentDocuments.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Chưa có tài liệu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-3 border-b text-left">ID</th>
                    <th className="p-3 border-b text-left">Tên file</th>
                    <th className="p-3 border-b text-left">Loại tài liệu</th>
                    <th className="p-3 border-b text-left">
                      {activeTab === 'client' ? 'Payment ID' : 'Payment ID'}
                    </th>
                    <th className="p-3 border-b text-left">Mô tả</th>
                    <th className="p-3 border-b text-left">Nguồn</th>
                    <th className="p-3 border-b text-left">Ngày upload</th>
                    <th className="p-3 border-b text-left">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="p-3">{doc.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="p-3">{getDocumentTypeName(doc.documentTypeId)}</td>
                      <td className="p-3">
                        {activeTab === 'client' 
                          ? (doc as ClientDocument).clientContractPaymentId
                          : (doc as PartnerDocument).partnerContractPaymentId
                        }
                      </td>
                      <td className="p-3">{doc.description || "-"}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {doc.source || "N/A"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(doc.uploadTimestamp)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(doc.filePath)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 transition-all"
                            title="Xem trên web"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </button>
                          <button
                            onClick={() => handleDownload(doc.filePath)}
                            className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 flex items-center gap-2 transition-all"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4" />
                            Tải xuống
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountantDocumentsList;

