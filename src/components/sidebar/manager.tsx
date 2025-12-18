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
    label: "Bàn giao phân công",
    href: "/manager/handover-assignment",
    icon: UserCog,
  },
];

