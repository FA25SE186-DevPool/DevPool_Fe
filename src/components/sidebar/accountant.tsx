import { BarChart3, FileText, Briefcase } from "lucide-react";

export const sidebarItems = [
  {
    label: "Tổng Quan",
    href: "/accountant/dashboard",
    icon: BarChart3,
  },
  {
    label: "Dự án",
    href: "/accountant/projects",
    icon: Briefcase,
  },
  // {
  //   label: "Kỳ Thanh Toán",
  //   href: "/accountant/payment-periods",
  //   icon: CalendarClock,
  //   subItems: [
  //     {
  //       label: "Khách hàng",
  //       href: "/accountant/payment-periods/clients",
  //       icon: Wallet,
  //     },
  //     {
  //       label: "Nhân sự",
  //       href: "/accountant/payment-periods/partners",
  //       icon: Wallet,
  //     },
  //   ],
  // },
  {
    label: "Danh sách tài liệu",
    href: "/accountant/documents",
    icon: FileText,
  },
];

