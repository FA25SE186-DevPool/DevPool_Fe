"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Shield, Sparkles, Users } from "lucide-react"
import { clientCompanyService } from "../../services/ClientCompany"
import { partnerService } from "../../services/Partner"
import { talentService } from "../../services/Talent"

const HeroSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientCompaniesCount, setClientCompaniesCount] = useState<number | null>(null)
  const [partnersCount, setPartnersCount] = useState<number | null>(null)
  const [talentsCount, setTalentsCount] = useState<number | null>(null)

  // Function to format count with + suffix (round down to nearest 4)
  const formatCount = (count: number): string => {
    if (count <= 0) return "4+"
    const roundedDown = Math.floor(count / 4) * 4
    return roundedDown > 0 ? `${roundedDown}+` : "4+"
  }

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        // Fetch client companies, partners, and talents count in parallel
        const [clientCompaniesResult, partnersResult, talentsResult] = await Promise.all([
          clientCompanyService.getAll({ excludeDeleted: true }),
          partnerService.getAll({ excludeDeleted: true }),
          talentService.getAll({ excludeDeleted: true, pageSize: 1 }) // Get total count only
        ])

        // Process client companies count
        let clientCompaniesCount = 0
        if (Array.isArray(clientCompaniesResult)) {
          clientCompaniesCount = clientCompaniesResult.length
        } else if (clientCompaniesResult && typeof clientCompaniesResult === 'object') {
          const obj = clientCompaniesResult as any
          if (obj.data && Array.isArray(obj.data)) {
            clientCompaniesCount = obj.data.length
          } else if (obj.items && Array.isArray(obj.items)) {
            clientCompaniesCount = obj.items.length
          } else if (obj.totalCount !== undefined) {
            clientCompaniesCount = obj.totalCount
          }
        }

        // Process partners count
        let partnersCount = 0
        if (Array.isArray(partnersResult)) {
          partnersCount = partnersResult.length
        } else if (partnersResult && typeof partnersResult === 'object') {
          const obj = partnersResult as any
          if (obj.data && Array.isArray(obj.data)) {
            partnersCount = obj.data.length
          } else if (obj.items && Array.isArray(obj.items)) {
            partnersCount = obj.items.length
          } else if (obj.totalCount !== undefined) {
            partnersCount = obj.totalCount
          }
        }

        // Process talents count
        let talentsCount = 0
        if (Array.isArray(talentsResult)) {
          talentsCount = talentsResult.length
        } else if (talentsResult && typeof talentsResult === 'object') {
          const obj = talentsResult as any
          if (obj.totalCount !== undefined) {
            talentsCount = obj.totalCount
          } else if (obj.data && Array.isArray(obj.data)) {
            talentsCount = obj.data.length
          } else if (obj.items && Array.isArray(obj.items)) {
            talentsCount = obj.items.length
          }
        }

        setClientCompaniesCount(clientCompaniesCount)
        setPartnersCount(partnersCount)
        setTalentsCount(talentsCount)
      } catch (error) {
        console.error("❌ Lỗi tải dữ liệu thống kê:", error)
        // Fallback values
        setClientCompaniesCount(4)
        setPartnersCount(4)
        setTalentsCount(50)
      }
    }

    fetchStatsData()
  }, [])

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-100 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-7">
        <div className="text-center space-y-12 min-h-screen flex flex-col justify-center">
          <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-300 backdrop-blur-sm mx-auto animate-fade-in">
            <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-purple-700 font-medium">DevPool – Giải pháp Quản lý Gia công Phần mềm Tự động
            </span>
          </div>

          <div className="space-y-6 animate-fade-in">
            <h1 className="text-6xl lg:text-8xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gray-800 via-purple-700 to-blue-700 bg-clip-text text-transparent">
                Cung Cấp
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Nhân Sự
              </span>
              <br />
              <span className="text-gray-900">Chất Lượng Cao</span>
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              DevPool - Đối tác tin cậy cung cấp giải pháp nhân sự IT outsourcing cho doanh nghiệp. Quy trình chuyên nghiệp, minh bạch từ tuyển dụng đến quản lý hợp đồng.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 animate-fade-in">
            <Link
              to="/contact"
              className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-semibold text-xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 transform"
            >
              <span>Tôi Cần Tuyển Dev</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
            </Link>

            <Link
              to="/login"
              className="group relative bg-white/80 backdrop-blur-sm text-gray-800 px-10 py-5 rounded-2xl font-semibold text-xl flex items-center space-x-3 border border-gray-200 transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-2xl hover:shadow-gray-300/20 transform"
            >
              <Users className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Tôi Là có tài khoản</span>
            </Link>
          </div>

          <div className="flex justify-center items-center space-x-16 pt-12 animate-fade-in-delay">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {talentsCount !== null ? formatCount(talentsCount) : "50+"}
              </div>
              <div className="text-purple-600 font-medium">Nhân sự</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {clientCompaniesCount !== null ? formatCount(clientCompaniesCount) : "4+"}
              </div>
              <div className="text-purple-600 font-medium">Doanh nghiệp</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {partnersCount !== null ? formatCount(partnersCount) : "4+"}
              </div>
              <div className="text-purple-600 font-medium">Đối tác</div>
            </div>
          </div>

          <div className="relative max-w-4xl mx-auto animate-fade-in-delay">
            <div className="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-102 transform">
              <img
                src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop"
                alt="Professional IT team collaboration"
                className="rounded-2xl shadow-xl w-full h-96 object-cover"
              />

              <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Shield  className="w-5 h-5 text-white fill-current" />
                  <span className="text-white font-bold text-sm">Đối tác uy tín</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Tìm Việc IT</h3>
            <p className="text-gray-700 mb-6">
              Khám phá hàng nghìn cơ hội việc làm IT hấp dẫn từ các công ty hàng đầu.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/projects"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-center hover:scale-105 transition-transform duration-300"
                onClick={() => setIsModalOpen(false)}
              >
                Xem Việc Làm
              </Link>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in-delay {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
  .animate-fade-in-delay {
    animation: fade-in-delay 0.8s ease-out 0.3s both;
  }
  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
`}</style>

    </section>
  )
}

export default HeroSection
