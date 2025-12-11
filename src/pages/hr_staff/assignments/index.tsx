import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Users } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { sidebarItems } from '../../../components/sidebar/ta_staff';

interface Assignment {
    id: string;
    developerName: string;
    jobRequestName: string;
    projectName: string;
    startDate: string;
    endDate?: string;
    status: 'active' | 'completed' | 'pending';
}

export default function Assignments() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Mock data - replace with API call
    useEffect(() => {
        const mockAssignments: Assignment[] = [
            {
                id: '1',
                developerName: 'Nguyễn Văn A',
                jobRequestName: 'Frontend Developer',
                projectName: 'Project X',
                startDate: '2023-01-15',
                endDate: '2023-03-15',
                status: 'active',
            },
            {
                id: '2',
                developerName: 'Trần Thị B',
                jobRequestName: 'Backend Developer',
                projectName: 'Project Y',
                startDate: '2023-02-01',
                status: 'pending',
            },
        ];

        setTimeout(() => {
            setAssignments(mockAssignments);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar items={sidebarItems} title="TA Staff" />

            <div className="flex-1 p-8">
                <div className="mb-8">
                    <Breadcrumb
                        items={[
                            { label: "Phân công" }
                        ]}
                    />
                    <h1 className="text-3xl font-bold text-gray-900">Danh Sách Phân Công</h1>
                    <p className="text-neutral-600 mt-1">Quản lý và theo dõi các phân công nhân sự vào dự án</p>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[260px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, dự án..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-primary-500 text-gray-700"
                    >
                        <Filter className="w-5 h-5" />
                        {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    </button>

                    <button className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                        <Plus className="w-5 h-5" />
                        Thêm Phân Công
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200">
                        {/* Filter Inputs here */}
                        {/* You can add filters for status, jobRequest, project, etc. */}
                    </div>
                )}

                {/* Assignment List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải danh sách phân công...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-white rounded-2xl shadow-soft hover:shadow-medium p-6 border border-gray-200 transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{assignment.developerName}</h3>
                                            <p className="text-sm text-gray-600">{assignment.jobRequestName}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                                        assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {assignment.status === 'active' ? 'Đang làm' :
                                            assignment.status === 'completed' ? 'Hoàn thành' :
                                                'Chờ xử lý'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Dự án: {assignment.projectName}</span>
                                        <span>{assignment.startDate} - {assignment.endDate ? assignment.endDate : 'Chưa kết thúc'}</span>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                        <button className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                            Chi tiết
                                        </button>
                                        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
