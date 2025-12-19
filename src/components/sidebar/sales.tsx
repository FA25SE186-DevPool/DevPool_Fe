import {
  BarChart3,
  Layers,
  Building,
  Briefcase,
  Mail,
  Settings,
} from "lucide-react";

export const sidebarItems = [
  // Phần chính
  {
    label: "Tổng Quan",
    href: "/sales/dashboard",
    icon: BarChart3,
    section: "main" as const,
  },
  {
    label: "Yêu Cầu Tuyển Dụng",
    href: "/sales/job-requests",
    icon: Briefcase,
    section: "main" as const,
  },
  {
    label: "Dự Án",
    href: "/sales/projects",
    icon: Layers,
    section: "main" as const,
  },
  {
    label: "Công ty",
    href: "/sales/clients",
    icon: Building,
    section: "main" as const,
  },

  {
    label: "Yêu cầu hỗ trợ",
    href: "/sales/contact-inquiries",
    icon: Mail,
    section: "main" as const,
  },

  // Phần cấu hình (ở dưới)
  {
    label: "Mẫu Quy Trình",
    href: "/sales/apply-process-templates",
    icon: Settings,
    section: "config" as const,
  },
];

