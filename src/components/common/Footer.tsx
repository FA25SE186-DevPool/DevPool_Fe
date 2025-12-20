import { Link } from 'react-router-dom';
import { Facebook, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import logoDevPool from '../../assets/images/logo-DevPool.jpg';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center p-1">
                <img 
                  src={logoDevPool} 
                  alt="DevPool Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-xl">DevPool</span>
            </div>
            <p className="text-gray-300">
              Nền tảng kết nối doanh nghiệp với nhân sự DevPool hàng đầu Việt Nam.
              Giải pháp tuyển dụng thông minh cho thời đại số.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:support@devpool.vn" className="text-gray-400 hover:text-blue-400">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liên Kết Nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  Về DevPool
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-300 hover:text-white">
                  Cách Hoạt Động
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-white">
                  Bảng Giá
                </Link>
              </li>
              <li>
                <Link to="/success-stories" className="text-gray-300 hover:text-white">
                  Câu Chuyện Thành Công
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Dịch Vụ</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/web-development" className="text-gray-300 hover:text-white">
                  Web Development
                </Link>
              </li>
              <li>
                <Link to="/mobile-development" className="text-gray-300 hover:text-white">
                  Mobile Development
                </Link>
              </li>
              <li>
                <Link to="/ui-ux-design" className="text-gray-300 hover:text-white">
                  UI/UX Design
                </Link>
              </li>
              <li>
                <Link to="/testing-qa" className="text-gray-300 hover:text-white">
                  Testing & QA
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liên Hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href="mailto:support@devpool.vn" className="text-gray-300 hover:text-white">
                  support@devpool.vn
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href="tel:+84123456789" className="text-gray-300 hover:text-white">
                  +84 123 456 789
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <span className="text-gray-300">
                  Tầng 10, Tòa nhà ABC<br />
                  123 Đường XYZ, Quận 1<br />
                  TP. Hồ Chí Minh
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2025 DevPool Vietnam. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                Chính Sách Bảo Mật
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
                Điều Khoản Sử Dụng
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}