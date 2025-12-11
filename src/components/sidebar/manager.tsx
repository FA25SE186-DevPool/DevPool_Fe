import {
  BarChart3,
  Briefcase,
  Building2,
  UserCog,
} from "lucide-react";

export const sidebarItems = [
  {
    label: "Tổng Quan",
    href: "/manager/dashboard",
    icon: BarChart3,
  },
  {
    label: "Dự án",
    href: "/manager/projects",
    icon: Briefcase,
  },
  {
    label: "Công ty KH",
    href: "/manager/client-companies",
    icon: Building2,
  },
  {
    label: "Chuyển nhượng quản lý",
    href: "/manager/handover-assignment",
    icon: UserCog,
  },
  // {
  //   label: "Kỳ Thanh Toán",
  //   href: "/manager/payment-periods",
  //   icon: CalendarClock,
  //   subItems: [
  //     {
  //       label: "Khách hàng",
  //       href: "/manager/payment-periods/clients",
  //       icon: Wallet,
  //     },
  //     {
  //       label: "Nhân sự",
  //       href: "/manager/payment-periods/partners",
  //       icon: Wallet,
  //     },
  //   ],
  // },
  // {
  //   label: "Báo cáo Kinh doanh",
  //   href: "/manager/business",
  //   icon: LineChart,
  //   subItems: [
  //     { label: "Tổng quan kinh doanh", href: "/manager/business/overview" },
  //     { label: "Doanh thu", href: "/manager/business/revenue" },
  //   ],
  // },
  // {
  //   label: 'Báo cáo Nhân sự',
  //   href: '/manager/hr',
  //   icon: Users,
  //   subItems: [
  //     { label: 'Tổng quan nhân sự', href: '/manager/hr/overview' },
  //     { label: 'Thống kê developers', href: '/manager/hr/developers' },
  //     { label: 'Tỷ lệ sử dụng nhân sự', href: '/manager/hr/utilization' },
  //     { label: 'Hiệu suất làm việc', href: '/manager/hr/performance' }
  //   ]
  // },
  // {
  //   label: "Báo cáo Tài chính",
  //   href: "/manager/finance",
  //   icon: DollarSign,
  //   subItems: [
  //     { label: "Tổng quan tài chính", href: "/manager/finance/overview" },
  //     { label: "Dòng tiền", href: "/manager/finance/cashflow" },
  //     { label: "Công nợ", href: "/manager/finance/debt" },
  //     { label: "Lợi nhuận", href: "/manager/finance/profit" },
  //   ],
  // },
];

