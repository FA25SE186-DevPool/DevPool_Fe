"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { contactInquiryService } from "../../../services/ContactInquiry";

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Tự động điền form khi có query params từ professional page
  useEffect(() => {
    const talentId = searchParams.get('talentId');
    const talentCode = searchParams.get('talentCode');
    const talentIds = searchParams.get('talentIds');
    const talentCodes = searchParams.get('talentCodes');
    
    // Xử lý trường hợp liên hệ nhiều nhân sự (từ favorites)
    if (talentIds && talentCodes) {
      const codes = decodeURIComponent(talentCodes).split(',');
      const codesText = codes.join(', ');
      // Tự động điền tiêu đề với danh sách mã TAL
      const subjectText = `Liên hệ về nhân sự: ${codesText}`;
      // Tự động điền nội dung với danh sách mã TAL
      const messageText = `Xin chào,\n\nTôi quan tâm đến các nhân sự có mã: ${codesText}.\n\nVui lòng liên hệ với tôi để trao đổi thêm.\n\nTrân trọng!`;
      
      setFormData(prev => ({
        ...prev,
        subject: subjectText,
        message: messageText
      }));
    }
    // Xử lý trường hợp liên hệ 1 nhân sự (từ card)
    else if (talentId && talentCode) {
      // Tự động điền tiêu đề với mã TAL
      const subjectText = `Liên hệ về nhân sự ${talentCode}`;
      // Tự động điền nội dung với mã TAL
      const messageText = `Xin chào,\n\nTôi quan tâm đến nhân sự có mã ${talentCode}.\n\nVui lòng liên hệ với tôi để trao đổi thêm.\n\nTrân trọng!`;
      
      setFormData(prev => ({
        ...prev,
        subject: subjectText,
        message: messageText
      }));
    }
  }, [searchParams]);

  // Tính toán số dòng dựa trên nội dung
  const calculateRows = (text: string): number => {
    if (!text) return 4;
    // Mỗi dòng text có thể wrap, nên tính thêm dựa trên độ dài
    const estimatedRows = text.split('\n').reduce((total, line) => {
      // Giả sử mỗi dòng khoảng 50 ký tự thì wrap thành 2 dòng
      return total + Math.max(1, Math.ceil(line.length / 50));
    }, 0);
    return Math.max(6, Math.min(estimatedRows, 15)); // Tối thiểu 6 dòng, tối đa 15 dòng
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submit
    if (!validateEmail(formData.email.trim())) {
      setEmailError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setEmailError(null);
    setSuccess(false);

    try {
      // Map form data to API payload
      const payload = {
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company?.trim() || null,
        subject: formData.subject.trim(),
        content: formData.message.trim(),
      };

      // Call API
      await contactInquiryService.submitInquiry(payload);

      // Success
      setSuccess(true);
      setFormData({ name: "", email: "", company: "", subject: "", message: "" });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("❌ Lỗi gửi yêu cầu liên hệ:", err);
      setError(
        err?.message || "Không thể gửi yêu cầu liên hệ. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate email in real-time
    if (name === 'email') {
      if (value.trim() === '') {
        setEmailError(null);
      } else if (!validateEmail(value.trim())) {
        setEmailError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      } else {
        setEmailError(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-neutral-900 via-primary-700 to-secondary-700 bg-clip-text text-transparent mb-6 leading-tight">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi nếu bạn
            cần được giúp đỡ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Info Cards - Column 1 */}
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-5 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-primary-100 rounded-xl">
                <Phone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-neutral-900">
                  Điện thoại
                </h3>
                <p className="text-sm text-neutral-600">Hỗ trợ 24/7</p>
              </div>
            </div>
            <a
              href="tel:+84123456789"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              +84 123 456 789
            </a>
          </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-5 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-secondary-100 rounded-xl">
                  <Mail className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900">Email</h3>
                  <p className="text-sm text-neutral-600">Phản hồi trong 24h</p>
                </div>
              </div>
              <a
                href="mailto:support@devpool.com"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                support@devpool.com
              </a>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-5 border border-neutral-200/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-accent-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900">
                    Địa chỉ
                  </h3>
                  <p className="text-sm text-neutral-600">Trụ sở chính</p>
                </div>
              </div>
              <p className="text-neutral-600">
                123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
              </p>
            </div>
          </div>

          {/* Contact Form - Column 2 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-neutral-200/50">
            <h2 className="text-xl font-bold text-neutral-900 mb-5">
              Gửi Tin Nhắn
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 rounded-lg border transition-all duration-300 ${
                    emailError
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                  placeholder="example@email.com"
                />
                {emailError && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Công ty
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
                  placeholder="Nhập tên công ty (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
                  placeholder="Nhập tiêu đề tin nhắn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={calculateRows(formData.message)}
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
                  placeholder="Nhập nội dung tin nhắn"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || !!emailError || !validateEmail(formData.email.trim())}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Gửi tin nhắn</span>
                  </>
                )}
              </button>

              {success && (
                <div className="flex items-center gap-2 text-success-600 bg-success-50 p-3 rounded-lg animate-fade-in border border-success-200">
                  <CheckCircle className="w-5 h-5" />
                  <span>Tin nhắn đã được gửi thành công! Chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg animate-fade-in border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}