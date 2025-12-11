import { BarChart3, Users, Building2, Briefcase } from "lucide-react";

export const sidebarItems = [
  {
    label: "Tổng Quan",
    href: "/ta/dashboard",
    icon: BarChart3,
  },
  {
    label: "Nhân Sự",
    href: "/ta/developers",
    icon: Users,
    // subItems: [
    //   { label: 'Danh sách nhân sự', href: '/ta/developers' },
    //   { label: 'Tạo nhân sự', href: '/ta/developers/create' },

    // ]
  },
  {
    label: "Yêu Cầu Tuyển Dụng",
    href: "/ta/job-requests",
    icon: Briefcase,
    // subItems: [
    //   { label: 'Danh Sách Yêu Cầu', href: '/ta/job-requests' },
    // ]
  },
  {
    label: "Đối Tác",
    href: "/ta/partners",
    icon: Building2,
  },
  // {
  //   label: 'Tạo tài liệu nhân sự',
  //   href: '/ta/payment-periods/partners',
  //   icon: FileUp
  // },

  // {
  //   label: 'Quản lý Template CV',
  //   href: '/ta/templates',
  //   icon: Users,
  //   subItems: [
  //     { label: 'Danh Sách Template', href: '/ta/templates' },
  //     { label: 'Tạo Template', href: '/ta/templates/create' },
  //     { label: 'Gán Template KH', href: '/ta/templates/assign' },
  //   ]
  // },
  // {
];

