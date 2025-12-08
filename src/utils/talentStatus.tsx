import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Briefcase,
  Target,
} from 'lucide-react';

export interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
  bgColor: string;
}

/**
 * Get status configuration for talent status badge
 */
export const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'Available':
      return {
        label: 'Sẵn sàng',
        color: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
        bgColor: 'bg-green-50',
      };
    case 'Busy':
      return {
        label: 'Đang bận',
        color: 'text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
        bgColor: 'bg-yellow-50',
      };
    case 'Working':
      return {
        label: 'Đang làm việc',
        color: 'text-blue-800',
        icon: <Briefcase className="w-4 h-4" />,
        bgColor: 'bg-blue-50',
      };
    case 'Applying':
      return {
        label: 'Đang ứng tuyển',
        color: 'text-purple-800',
        icon: <Target className="w-4 h-4" />,
        bgColor: 'bg-purple-50',
      };
    case 'Unavailable':
      return {
        label: 'Không sẵn sàng',
        color: 'text-gray-800',
        icon: <XCircle className="w-4 h-4" />,
        bgColor: 'bg-gray-50',
      };
    default:
      return {
        label: 'Không xác định',
        color: 'text-gray-800',
        icon: <AlertCircle className="w-4 h-4" />,
        bgColor: 'bg-gray-50',
      };
  }
};

