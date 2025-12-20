"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Heart, Briefcase as BriefcaseIcon, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import type { Professional } from './types';

interface ProfessionalCardProps {
    professional: Professional;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    showOnlyFavorites?: boolean;
    isSelectedForContact?: boolean;
    onToggleSelectForContact?: (id: string) => void;
}

// Lấy tên rút gọn (tên lót + tên chính, bỏ họ)
const getShortName = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return fullName;
    if (parts.length === 1) return parts[0];
    // Lấy tên lót + tên chính (từ phần tử thứ 2 trở đi)
    return parts.slice(1).join(' ');
};

// Format mã nhân sự - sử dụng code thực tế hoặc fallback
const formatTalentCode = (code?: string, id?: string): string => {
    if (code) return code;
    if (id) {
        const numId = parseInt(id);
        if (isNaN(numId)) return `EMP${id}`;
        return `EMP${String(numId).padStart(3, '0')}`;
    }
    return 'N/A';
};

// Format WorkingMode
const formatWorkingMode = (workingMode?: string | null): string => {
    if (!workingMode || workingMode === 'null' || workingMode === 'None') return 'Không xác định';
    const modeMap: Record<string, string> = {
        'Onsite': 'Tại văn phòng',
        'Remote': 'Từ xa',
        'Hybrid': 'Kết hợp',
        'Flexible': 'Linh hoạt',
        '0': 'Tại văn phòng',
        '1': 'Từ xa',
        '2': 'Kết hợp',
        '3': 'Linh hoạt',
    };
    return modeMap[workingMode] || 'Không xác định';
};

// Format Status
const formatStatus = (status?: string): string => {
    if (!status) return '—';
    const statusMap: Record<string, string> = {
        'Working': 'Đang làm việc',
        'Available': 'Sẵn sàng',
        'Busy': 'Bận',
        'Unavailable': 'Tạm ngưng',
        'Applying': 'Đang ứng tuyển',
    };
    return statusMap[status] || status;
};


const getSkillLevelColor = (level: string) => {
    switch (level) {
        case 'Chuyên gia': return 'bg-violet-100 text-violet-800 border-violet-200';
        case 'Giỏi': return 'bg-success-100 text-success-800 border-success-200';
        case 'Khá': return 'bg-primary-100 text-primary-800 border-primary-200';
        case 'Cơ bản': return 'bg-neutral-100 text-neutral-800 border-neutral-200';
        default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
};

// Default avatar
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=150';

export default function ProfessionalCard({ 
    professional, 
    isFavorite, 
    onToggleFavorite,
    showOnlyFavorites = false,
    isSelectedForContact = false,
    onToggleSelectForContact
}: ProfessionalCardProps) {
    const navigate = useNavigate();
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const shortName = getShortName(professional.name);
    const avatarUrl = professional.avatar || DEFAULT_AVATAR;
    const maxSkillsToShow = 4; // Giới hạn số skills hiển thị (tối đa 2 hàng)
    const talentCode = formatTalentCode(professional.code, professional.id);
    
    const bioText = professional.bio || professional.description || '';
    const shouldShowExpandButton = bioText.length > 100; // Hiển thị nút nếu bio dài hơn 100 ký tự

    const handleContact = () => {
        // Điều hướng đến trang contact với query params chứa talentId và talentCode
        navigate(`/contact?talentId=${professional.id}&talentCode=${encodeURIComponent(talentCode)}`);
    };

    return (
        <div
            className={`group relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft hover:shadow-strong border transition-all duration-500 transform hover:scale-102 hover:-translate-y-2 flex flex-col h-full p-6 ${
                isSelectedForContact 
                    ? 'border-primary-500 ring-2 ring-primary-300' 
                    : 'border-neutral-200 hover:border-primary-300'
            }`}
        >
            {/* Checkbox để chọn liên hệ - Chỉ hiển thị khi showOnlyFavorites = true */}
            {showOnlyFavorites && onToggleSelectForContact && (
                <div className="absolute top-4 left-4 z-10">
                    <input
                        type="checkbox"
                        checked={isSelectedForContact}
                        onChange={() => onToggleSelectForContact(professional.id)}
                        className="w-6 h-6 text-primary-600 border-2 border-neutral-300 rounded-lg focus:ring-primary-500 focus:ring-2 cursor-pointer shadow-md hover:border-primary-400 transition-all duration-200"
                        style={{ accentColor: '#6366f1' }}
                    />
                </div>
            )}

            {/* Header: Avatar, Name, Position, Favorite */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarUrl}
                            alt={professional.name}
                            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary-100 group-hover:ring-primary-300 transition-all duration-300"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                        />
                        {professional.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success-500 rounded-full border-2 border-white animate-pulse-gentle"></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-neutral-900 group-hover:text-primary-700 transition-colors duration-300 mb-1 truncate">
                            {shortName}
                        </h3>
                        <p className="text-sm text-neutral-600 font-medium group-hover:text-neutral-700 transition-colors duration-300 truncate mb-1">
                            {professional.title}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-bold rounded-lg border border-primary-200 shadow-sm">
                            {talentCode}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onToggleFavorite(professional.id)}
                    className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 transform flex-shrink-0 ${isFavorite
                        ? 'text-error-500 bg-error-50 hover:bg-error-100'
                        : 'text-neutral-400 hover:text-error-500 hover:bg-error-50'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Thông tin cơ bản: Location, WorkingMode, Status - Gộp lại thành grid */}
            <div className="grid grid-cols-1 gap-2 mb-4">
                {/* Location - chỉ hiển thị khi có location */}
                {professional.location && (
                    <div className="flex items-start space-x-2 text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium break-words">{professional.location}</span>
                    </div>
                )}

                {/* WorkingMode và Status - Cùng một hàng nếu có */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center space-x-2 text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 flex-1 min-w-0">
                        <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{formatWorkingMode(professional.workingMode)}</span>
                    </div>
                    {professional.status && (
                        <div className="flex items-center space-x-2 bg-primary-50 rounded-lg px-3 py-2 flex-1 min-w-0">
                            <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-primary-700 truncate">{formatStatus(professional.status)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bio (Giới thiệu ngắn) */}
            {bioText && (
                <div className="mb-4">
                    <p className={`text-sm text-neutral-700 leading-relaxed group-hover:text-neutral-800 transition-colors duration-300 whitespace-pre-wrap break-words ${
                        !isBioExpanded && shouldShowExpandButton ? 'line-clamp-2' : ''
                    }`}>
                        {bioText}
                    </p>
                    {shouldShowExpandButton && (
                        <button
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-300"
                        >
                            {isBioExpanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Thu gọn
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Xem thêm
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Skills - Hiển thị tên skill và level, giới hạn số lượng */}
            {professional.skills && professional.skills.length > 0 && (
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {professional.skills.slice(0, maxSkillsToShow).map((skill, index) => (
                            <span
                                key={`${skill.name}-${index}`}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-300 hover:scale-105 ${getSkillLevelColor(skill.level)}`}
                                title={`${skill.name} - ${skill.level}`}
                            >
                                {skill.name} ({skill.level})
                            </span>
                        ))}
                        {professional.skills.length > maxSkillsToShow && (
                            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg border border-neutral-200 hover:bg-neutral-200 transition-colors duration-300">
                                +{professional.skills.length - maxSkillsToShow}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Stats: Tổng số dự án và Availability - Gộp lại */}
            <div className="mt-auto space-y-3">
                {/* Tổng số dự án */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200 group-hover:from-primary-100 group-hover:to-secondary-100 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                        <BriefcaseIcon className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-600">Tổng dự án thực hiện</span>
                    </div>
                    <span className="text-base font-bold text-primary-700">
                        {professional.completedProjects || professional.workExperiences || 0}
                    </span>
                </div>

            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
                <button
                    onClick={handleContact}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold text-sm transition-all duration-300 shadow-glow hover:shadow-glow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    <Phone className="w-4 h-4" />
                    Liên hệ
                </button>
            </div>
        </div>
    );
}