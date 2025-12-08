import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Code2,
  Timer,
  ClipboardList,
  CheckCircle2,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { sidebarItems } from '../../components/developer/SidebarItems';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { decodeJWT } from '../../services/Auth';
import { talentService, type Talent } from '../../services/Talent';
import { partnerContractPaymentService, type PartnerContractPaymentModel } from '../../services/PartnerContractPayment';
import { clientContractPaymentService, type ClientContractPaymentModel } from '../../services/ClientContractPayment';
import { talentSkillService, type TalentSkill } from '../../services/TalentSkill';
import { skillService, type Skill } from '../../services/Skill';

interface DevStats {
  currentAssignments: number;
  utilizationRate: number; // %
  hoursThisMonth: number;  // hours
  totalEarnings: number; // VNĐ
  monthlyEarnings: { month: string; earnings: number }[];
  techStack: { skill: string; level: number }[]; // 0..100
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTalentId, setCurrentTalentId] = useState<number | null>(null);
  const [stats, setStats] = useState<DevStats>({
    currentAssignments: 0,
    utilizationRate: 0,
    hoursThisMonth: 0,
    totalEarnings: 0,
    monthlyEarnings: [],
    techStack: []
  });

  // Lấy talentId từ user hiện tại
  useEffect(() => {
    const fetchTalentId = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        let userId: string | null = null;
        
        if (token) {
          const decoded = decodeJWT(token);
          userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || user.id;
        } else {
          userId = user.id;
        }
        
        if (!userId) return;
        
        const talents = await talentService.getAll({ excludeDeleted: true });
        const talent = Array.isArray(talents) 
          ? talents.find((t: Talent) => t.userId === userId)
          : null;
        
        if (talent) {
          setCurrentTalentId(talent.id);
        } else {
          setError('Không tìm thấy thông tin nhân sự của bạn. Vui lòng liên hệ TA.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ Lỗi tìm talent:', err);
        setError('Không thể tải thông tin nhân sự. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchTalentId();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTalentId) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch contract payments and skills in parallel
        const [
          partnerPayments,
          clientPayments,
          payments,
          talentSkillsData,
          allSkillsData,
        ] = await Promise.all([
          partnerContractPaymentService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
          clientContractPaymentService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
          partnerContractPaymentService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
          talentSkillService.getAll({ talentId: currentTalentId, excludeDeleted: true }),
          skillService.getAll({ excludeDeleted: true }),
        ]);

        // Tính toán stats
        // 1. Current Assignments = số hợp đồng đang active (contractStatus = "Active" hoặc "Ongoing")
        const activeContracts = [
          ...partnerPayments.filter((c: PartnerContractPaymentModel) => 
            c.contractStatus === 'Active' || c.contractStatus === 'Ongoing'
          ),
          ...clientPayments.filter((c: ClientContractPaymentModel) => 
            c.contractStatus === 'Active' || c.contractStatus === 'Ongoing'
          )
        ];
        const currentAssignments = activeContracts.length;

        // 2. Hours this month = tổng giờ làm trong tháng hiện tại
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthPayments = payments.filter((p: PartnerContractPaymentModel) => {
          if (!p.paymentDate) return false;
          const paymentDate = new Date(p.paymentDate);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });
        
        const hoursThisMonth = thisMonthPayments.reduce((sum: number, p: PartnerContractPaymentModel) => {
          return sum + (p.reportedHours || 0);
        }, 0);

        // 3. Total Earnings = tổng số tiền đã thanh toán
        const paidPayments = payments.filter((p: PartnerContractPaymentModel) => 
          p.paymentStatus?.toLowerCase() === 'paid'
        );
        const totalEarnings = paidPayments.reduce((sum: number, p: PartnerContractPaymentModel) => {
          return sum + (p.totalPaidAmount || p.actualAmountVND || 0);
        }, 0);

        // 4. Utilization Rate = (hours this month / 160) * 100 (giả sử 1 tháng = 160 giờ)
        const utilizationRate = Math.min(100, Math.round((hoursThisMonth / 160) * 100));

        // 5. Monthly Earnings (6 tháng gần nhất)
        const monthlyEarningsMap = new Map<string, number>();
        payments.forEach((p: PartnerContractPaymentModel) => {
          if (p.paymentStatus?.toLowerCase() === 'paid' && p.paymentDate) {
            const date = new Date(p.paymentDate);
            const monthLabel = `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
            const current = monthlyEarningsMap.get(monthLabel) || 0;
            monthlyEarningsMap.set(monthLabel, current + (p.totalPaidAmount || p.actualAmountVND || 0));
          }
        });
        
        const monthlyEarnings = Array.from(monthlyEarningsMap.entries())
          .map(([month, earnings]) => ({ month, earnings }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);

        // 6. Tech Stack - fetch từ API
        const talentSkills = Array.isArray(talentSkillsData) ? talentSkillsData : [];
        const allSkills = Array.isArray(allSkillsData) ? allSkillsData : [];
        
        // Map level từ string sang số (0-100)
        const levelToNumber = (level: string): number => {
          const normalizedLevel = (level || '').toLowerCase().trim();
          switch (normalizedLevel) {
            case 'beginner':
            case 'junior':
              return 25;
            case 'intermediate':
            case 'middle':
              return 50;
            case 'advanced':
            case 'senior':
              return 75;
            case 'expert':
            case 'lead':
              return 100;
            default:
              return 50; // Default to intermediate
          }
        };

        // Build tech stack từ talent skills
        let techStack = talentSkills
          .map((ts: TalentSkill) => {
            const skill = allSkills.find((s: Skill) => s.id === ts.skillId);
            if (!skill || !skill.name) return null;
            
            return {
              skill: skill.name,
              level: levelToNumber(ts.level)
            };
          })
          .filter((item): item is { skill: string; level: number } => item !== null && item.skill && item.level !== undefined)
          .slice(0, 10); // Giới hạn tối đa 10 skills để radar chart không quá đông
        
        // Đảm bảo có ít nhất 3 skills để radar chart hiển thị đẹp
        if (techStack.length < 3 && techStack.length > 0) {
          // Nếu có ít hơn 3 skills, có thể thêm placeholder hoặc giữ nguyên
          console.warn('Tech Stack có ít hơn 3 skills, radar chart có thể không hiển thị tối ưu');
        }
        
        console.log('Tech Stack data:', techStack);
        console.log('Talent Skills count:', talentSkills.length);
        console.log('All Skills count:', allSkills.length);

        setStats({
          currentAssignments,
          utilizationRate,
          hoursThisMonth,
          totalEarnings,
          monthlyEarnings,
          techStack
        });
      } catch (err: any) {
        console.error('❌ Lỗi tải dữ liệu dashboard:', err);
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTalentId]);

  const formatHours = (v: number) => `${v}h`;
  const formatPercent = (v: number) => `${v}%`;
  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' VNĐ';

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar items={sidebarItems} title="Developer" />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
          <p className="text-neutral-600 mt-1">Hiệu suất cá nhân, thời gian và thu nhập</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Hợp đồng đang thực hiện</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{stats.currentAssignments}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-all duration-300">
                    <ClipboardList className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Hợp đồng đang active
                </p>
              </div>

              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Tỷ lệ sử dụng</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{formatPercent(stats.utilizationRate)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-warning-100 text-warning-600 group-hover:bg-warning-200 transition-all duration-300">
                    <Timer className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Dựa trên 160 giờ/tháng
                </p>
              </div>

              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Giờ làm trong tháng</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300">{formatHours(stats.hoursThisMonth)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-accent-100 text-accent-600 group-hover:bg-accent-200 transition-all duration-300">
                    <Code2 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Tổng giờ đã làm việc
                </p>
              </div>

              <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 transition-all duration-300 transform hover:-translate-y-1 border border-neutral-100 hover:border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors duration-300">Tổng thu nhập</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors duration-300 break-words leading-tight">{formatVND(stats.totalEarnings)}</p>
                  </div>
                  <div className="p-3 rounded-full bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200 transition-all duration-300">
                    <DollarSign className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <p className="text-sm text-secondary-600 mt-4 flex items-center group-hover:text-secondary-700 transition-colors duration-300">
                  <TrendingUp className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Tổng số tiền đã nhận
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thu nhập theo tháng</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.monthlyEarnings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatVND(v)} />
                    <Legend />
                    <Bar dataKey="earnings" name="Thu nhập" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỹ năng chuyên môn</h2>
                {stats.techStack && stats.techStack.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={stats.techStack} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                        <PolarGrid />
                        <PolarAngleAxis 
                          dataKey="skill" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]} 
                          tick={{ fontSize: 10 }}
                        />
                        <Radar 
                          name="Mức độ" 
                          dataKey="level" 
                          stroke="#14b8a6" 
                          fill="#14b8a6" 
                          fillOpacity={0.6}
                          strokeWidth={2}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}/100`, 'Mức độ']}
                          labelFormatter={(label) => `Kỹ năng: ${label}`}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                    <p className="mt-2 text-sm text-gray-500 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Thang điểm 0–100 (Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100)
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <Code2 className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-center">Chưa có kỹ năng nào được đăng ký</p>
                    <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ TA để thêm kỹ năng vào hồ sơ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

