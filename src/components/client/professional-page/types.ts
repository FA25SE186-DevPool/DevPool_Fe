export interface Professional {
  id: string;
  code?: string; // Mã nhân sự thực tế
  name: string; // Full name
  title: string; // Position
  avatar: string;
  location?: string; // LocationName
  workingMode?: string; // WorkingMode: Onsite, Remote, Hybrid, Flexible
  status?: string; // Status
  bio?: string; // Giới thiệu ngắn
  phoneNumber?: string; // Số điện thoại để liên hệ
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  skills: Array<{
    name: string;
    level: 'Cơ bản' | 'Khá' | 'Giỏi' | 'Chuyên gia';
    yearsExp?: number; // Years of experience for this skill
  }>;
  availability: 'available' | 'busy' | 'unavailable';
  completedProjects: number; // Tổng số dự án
  description: string;
  isOnline: boolean;
  experience: number;
  category: string;
  languages: string[];
  certifications: string[];
  responseTime: string;
  successRate: number;
  workExperiences?: number; // Tổng số dự án từ work experiences
}