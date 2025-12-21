import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../router/routes';

interface SubItem {
  label: string;
  href: string;
  subItems?: SubItem[]; // Hỗ trợ nested subItems
}

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  subItems?: SubItem[];
  section?: 'main' | 'config';
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
}

export default function Sidebar({ items, title }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const topAndHeightClass = isAdminRoute
    ? 'top-0 h-screen'
    : 'top-16 h-[calc(100vh-4rem)]';

  const toggleExpand = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  // Tự động mở parent items nếu subItem đang active
  useEffect(() => {
    const activeItems: string[] = [];
    
    (items || []).forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        // Kiểm tra xem có subItem nào đang active không
        const hasActiveSubItem = item.subItems.some((subItem) => {
          // Kiểm tra subItem thông thường
          if (location.pathname === subItem.href) {
            return true;
          }
          // Kiểm tra nested subItems
          if (subItem.subItems && subItem.subItems.length > 0) {
            return subItem.subItems.some((nestedItem) => location.pathname === nestedItem.href);
          }
          return false;
        });

        if (hasActiveSubItem) {
          activeItems.push(item.href);
          
          // Nếu có nested subItem active, cũng mở nested parent
          item.subItems.forEach((subItem) => {
            if (subItem.subItems && subItem.subItems.length > 0) {
              const hasActiveNested = subItem.subItems.some(
                (nestedItem) => location.pathname === nestedItem.href
              );
              if (hasActiveNested) {
                activeItems.push(`${item.href}-${subItem.href}`);
              }
            }
          });
        }
      }
    });

    // Cập nhật expandedItems để bao gồm các items đang active
    if (activeItems.length > 0) {
      setExpandedItems((prev) => {
        const newExpanded = [...prev];
        activeItems.forEach((item) => {
          if (!newExpanded.includes(item)) {
            newExpanded.push(item);
          }
        });
        return newExpanded;
      });
    }
  }, [location.pathname, items]);

  const handleLogout = () => {
    // Xác nhận trước khi đăng xuất
    const confirmed = window.confirm("Bạn có chắc muốn đăng xuất?");
    if (!confirmed) {
      return;
    }
    
    logout();
    navigate(ROUTES.GUEST.LOGIN);
  };

  // Phân chia items theo section
  const mainItems = (items || []).filter(item => !item.section || item.section === 'main');
  const configItems = (items || []).filter(item => item.section === 'config');

  const renderItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    const isExpanded = expandedItems.includes(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.href}>
        {hasSubItems ? (
          // Items with subitems
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => toggleExpand(item.href)}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {hasSubItems && (
              <div className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        ) : (
          // Items without subitems - Make them clickable links
          <Link
            to={item.href}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        )}

        {/* Sub Items */}
        {hasSubItems && isExpanded && (
          <div className="ml-6 mt-2 space-y-1">
            {item.subItems!.map((subItem) => {
              const isSubActive = location.pathname === subItem.href;
              const hasNestedSubItems = subItem.subItems && subItem.subItems.length > 0;
              const subItemKey = `${item.href}-${subItem.href}`;
              const isSubExpanded = expandedItems.includes(subItemKey);
              
              // Handle logout specially
              if (subItem.href === '/logout') {
                return (
                  <button
                    key={subItem.href}
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-lg text-sm transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {subItem.label}
                  </button>
                );
              }
              
              // Nested subItems (subItems của subItem)
              if (hasNestedSubItems) {
                return (
                  <div key={subItem.href}>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSubActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      onClick={() => toggleExpand(subItemKey)}
                    >
                      <span className="text-sm font-medium">{subItem.label}</span>
                      <div className="text-gray-400">
                        {isSubExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                    {isSubExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {subItem.subItems!.map((nestedItem) => {
                          const isNestedActive = location.pathname === nestedItem.href;
                          return (
                            <Link
                              key={nestedItem.href}
                              to={nestedItem.href}
                              className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${isNestedActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                              {nestedItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular subItem (không có nested subItems)
              return (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isSubActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-64 bg-white shadow-sm sticky ${topAndHeightClass} overflow-y-auto z-10 flex-shrink-0 flex flex-col`}>
      <div className="p-6 flex-1">
        <h2 className="font-semibold text-lg text-gray-900 mb-6">{title}</h2>
        <nav className="space-y-2">
          {/* Phần chính */}
          {mainItems.map((item) => renderItem(item))}
        </nav>
      </div>
      
      {/* Phần cấu hình ở dưới */}
      {configItems.length > 0 && (
        <div className="p-6 border-t border-neutral-200 mt-auto">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Cấu hình</h3>
          <nav className="space-y-2">
            {configItems.map((item) => renderItem(item))}
          </nav>
        </div>
      )}
    </div>
  );
}