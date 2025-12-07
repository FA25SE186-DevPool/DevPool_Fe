import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import { sidebarItems } from '../../components/admin/SidebarItems';
import { useAuth } from '../../contexts/AuthContext';
import { userService, type User as UserType } from '../../services/User';
import { decodeJWT } from '../../services/Auth';

export default function AdminProfilePage() {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!authUser) return;
            
            try {
                setLoading(true);
                setError('');
                
                const token = localStorage.getItem('accessToken');
                let userId: string | null = null;
                
                if (token) {
                    const decoded = decodeJWT(token);
                    userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
                } else {
                    userId = authUser.id;
                }
                
                if (!userId) {
                    setError('Không thể xác định người dùng');
                    setLoading(false);
                    return;
                }
                
                const userData = await userService.getById(userId);
                setUser(userData);
                setFormData({
                    fullName: userData.fullName || '',
                    phoneNumber: userData.phoneNumber || '',
                });
            } catch (err: any) {
                console.error('❌ Lỗi tải thông tin người dùng:', err);
                setError(err.message || 'Không thể tải thông tin người dùng');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUser();
    }, [authUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !authUser) return;
        
        try {
            setSaving(true);
            setError('');
            setSuccess(false);
            
            const token = localStorage.getItem('accessToken');
            let userId: string | null = null;
            
            if (token) {
                const decoded = decodeJWT(token);
                userId = decoded?.nameid || decoded?.sub || decoded?.userId || decoded?.uid || authUser.id;
            } else {
                userId = authUser.id;
            }
            
            if (!userId) {
                setError('Không thể xác định người dùng');
                return;
            }
            
            await userService.update(userId, {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber || undefined,
            });
            
            const updatedUser = await userService.getById(userId);
            setUser(updatedUser);
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('❌ Lỗi cập nhật thông tin:', err);
            setError(err.message || 'Không thể cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar items={sidebarItems} title="Admin" />
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Đang tải thông tin...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar items={sidebarItems} title="Admin" />
            
            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 animate-slide-up">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông Tin Cá Nhân</h1>
                        <p className="text-neutral-600">Quản lý thông tin tài khoản của bạn</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-primary-50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary-100 rounded-lg">
                                    <User className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Thông Tin Tài Khoản</h2>
                                    <p className="text-sm text-neutral-600">Cập nhật thông tin cá nhân của bạn</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {success && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="text-green-800 font-medium">Cập nhật thông tin thành công!</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-red-800 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-neutral-500">Email không thể thay đổi</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Họ và Tên
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Số Điện Thoại
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                                        Vai Trò
                                    </label>
                                    <input
                                        type="text"
                                        value={authUser?.role || 'Admin'}
                                        disabled
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-neutral-200">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Lưu Thay Đổi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

