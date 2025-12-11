import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../../../components/common/Sidebar";
import { sidebarItems } from "../../../components/sidebar/admin";
import { 
  ArrowLeft,
  History,
  Calendar,
  User,
  FileText,
  XCircle,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { auditLogService, type AuditLogModel } from "../../../services/AuditLog";
import { ROUTES } from "../../../router/routes";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}


function getActionColor(action: string) {
  const colorMap: Record<string, string> = {
    'Create': 'bg-green-100 text-green-700 border-green-200',
    'Update': 'bg-blue-100 text-blue-700 border-blue-200',
    'Delete': 'bg-red-100 text-red-700 border-red-200',
    'StatusChange': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'TransferOwnership': 'bg-purple-100 text-purple-700 border-purple-200'
  };
  return colorMap[action] || 'bg-gray-100 text-gray-700 border-gray-200';
}

function getActionIcon(action: string) {
  if (action === 'Create') return <CheckCircle className="w-5 h-5" />;
  if (action === 'Delete') return <XCircle className="w-5 h-5" />;
  if (action === 'StatusChange') return <AlertCircle className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

export default function AuditLogDetailPage() {
  const { entityName, entityId } = useParams<{ entityName: string; entityId: string }>();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!entityName || !entityId) {
        setError("Thiếu thông tin thực thể");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await auditLogService.getEntityHistory(entityName, parseInt(entityId));
        setLogs(result.data || []);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải lịch sử audit log:", err);
        setError(err.message || "Không thể tải lịch sử audit log");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [entityName, entityId]);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar items={sidebarItems} title="Admin" />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải lịch sử...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Admin" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={ROUTES.ADMIN.AUDIT.LIST}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {entityName} #{entityId}
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Lịch sử thay đổi
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <History className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Stats */}
        {logs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-100">
              <p className="text-xs text-neutral-600">Tổng số</p>
              <p className="text-xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-100">
              <p className="text-xs text-neutral-600">Đầu tiên</p>
              <p className="text-xs font-medium text-gray-900 mt-1">
                {logs.length > 0 ? formatDate(logs[logs.length - 1].changedAt) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-100">
              <p className="text-xs text-neutral-600">Gần nhất</p>
              <p className="text-xs font-medium text-gray-900 mt-1">
                {logs.length > 0 ? formatDate(logs[0].changedAt) : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không có lịch sử thay đổi.</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-12">
                      <div className={`absolute left-4 w-3 h-3 rounded-full border-2 border-white ${getActionColor(log.action).split(' ')[0]}`}></div>
                      
                      <details className={`rounded-lg border p-4 transition-all ${getActionColor(log.action)}`}>
                        <summary className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded ${getActionColor(log.action).split(' ')[0]}`}>
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{log.action}</div>
                              <div className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {formatDate(log.changedAt)}
                                {log.changedBy && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <User className="w-3 h-3" />
                                    <span>{log.changedByName || log.changedBy}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 pt-3 border-t border-current/20 space-y-3">
                          {log.fieldName && (
                            <div>
                              <div className="text-xs font-medium mb-1.5">Field: {log.fieldName}</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/50 rounded p-2">
                                  <div className="text-red-700 font-medium mb-0.5">Old:</div>
                                  <div className="break-words">{log.oldValue || '—'}</div>
                                </div>
                                <div className="bg-white/50 rounded p-2">
                                  <div className="text-green-700 font-medium mb-0.5">New:</div>
                                  <div className="break-words">{log.newValue || '—'}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {log.reason && (
                            <div>
                              <div className="text-xs font-medium mb-1">Reason:</div>
                              <div className="text-xs bg-white/50 rounded p-2">{log.reason}</div>
                            </div>
                          )}

                          {log.metaData && (() => {
                            try {
                              const parsed = typeof log.metaData === 'string' 
                                ? JSON.parse(log.metaData) 
                                : log.metaData;
                              return (
                                <details className="mt-2">
                                  <summary className="text-xs font-medium cursor-pointer">Metadata</summary>
                                  <pre className="mt-1 text-xs bg-white/50 rounded p-2 overflow-x-auto max-h-40">
                                    {JSON.stringify(parsed, null, 2)}
                                  </pre>
                                </details>
                              );
                            } catch {
                              return (
                                <details className="mt-2">
                                  <summary className="text-xs font-medium cursor-pointer">Metadata</summary>
                                  <pre className="mt-1 text-xs bg-white/50 rounded p-2 overflow-x-auto">
                                    {String(log.metaData)}
                                  </pre>
                                </details>
                              );
                            }
                          })()}

                          <div className="text-xs opacity-60 pt-2 border-t border-current/10">
                            Log ID: {log.id}
                          </div>
                        </div>
                      </details>
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

