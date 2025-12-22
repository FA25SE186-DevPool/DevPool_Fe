import { BarChart3, Grid, Users, History, UserCog } from "lucide-react";

export const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3
  },
  {
    label: 'Người Dùng',
    href: '/admin/users',
    icon: Users,
    subItems: [
      { label: 'Nhân viên', href: '/admin/users' },
      { label: 'Đối tác', href: '/admin/partners' },
    ]
  },
  {
    label: 'Danh Mục',
    href: '/admin/categories',
    icon: Grid,
    subItems: [
      // Kỹ năng & Vị trí (nhóm con)
      {
        label: 'Kỹ Năng & Vị Trí',
        href: '/admin/categories/skill-groups',
        subItems: [
          { label: 'Nhóm kỹ năng', href: '/admin/categories/skill-groups' },
          { label: 'Loại vị trí tuyển dụng', href: '/admin/categories/job-roles' },
        ]
      },
      // CV & Chứng chỉ (nhóm con)
      {
        label: 'CV & Chứng Chỉ',
        href: '/admin/categories/cv-templates',
        subItems: [
          { label: 'Mẫu CV', href: '/admin/categories/cv-templates' },
          { label: 'Loại chứng chỉ', href: '/admin/categories/certificate-types' },
        ]
      },
      // Địa lý (nhóm con)
      {
        label: 'Địa Lý',
        href: '/admin/categories/locations',
        subItems: [
          { label: 'Khu vực làm việc', href: '/admin/categories/locations' },
          { label: 'Thị trường', href: '/admin/categories/markets' },
        ]
      },
      // Khác (nhóm con)
      {
        label: 'Khác',
        href: '/admin/categories/industries',
        subItems: [
          { label: 'Lĩnh vực', href: '/admin/categories/industries' },
          { label: 'Loại tài liệu', href: '/admin/categories/document-types' },
          { label: 'Chuyên gia đánh giá', href: '/admin/categories/experts', icon: UserCog },
        ]
      },
    ]
  },
  {
    label: 'Audit Log',
    href: '/admin/audit-log',
    icon: History
  },
];

