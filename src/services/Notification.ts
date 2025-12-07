import axios from "../configs/axios";
import { AxiosError } from "axios";
import { NotificationType, NotificationPriority, type Notification, type NotificationCreate, type NotificationFilter, type NotificationListResult } from "../types/notification.types";

export { NotificationType, NotificationPriority };
export type { Notification, NotificationCreate, NotificationFilter, NotificationListResult };

export const notificationService = {
  async getAll(filter?: NotificationFilter): Promise<NotificationListResult> {
    try {
      const params = new URLSearchParams();

      // Không gửi UserId; BE lấy từ claims
      if (filter?.isRead !== undefined)
        params.append("IsRead", filter.isRead.toString());
      if (filter?.type !== undefined)
        params.append("Type", filter.type.toString());
      if (filter?.fromDate) params.append("FromDate", filter.fromDate);
      if (filter?.toDate) params.append("ToDate", filter.toDate);
      if (filter?.pageNumber) params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize) params.append("PageSize", filter.pageSize.toString());
      if (filter?.title) params.append("Title", filter.title);

      const url = `/notification${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải danh sách thông báo",
        };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getById(id: number): Promise<Notification> {
    try {
      const response = await axios.get(`/notification/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tải chi tiết thông báo",
        };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async create(payload: NotificationCreate): Promise<Notification | Notification[]> {
    try {
      const response = await axios.post("/notification", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể tạo thông báo mới",
        };
      throw { message: "Lỗi không xác định khi tạo thông báo" };
    }
  },

  async update(id: number, payload: Partial<NotificationCreate>): Promise<Notification> {
    try {
      const response = await axios.put(`/notification/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể cập nhật thông báo",
        };
      throw { message: "Lỗi không xác định khi cập nhật" };
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/notification/${id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể xóa thông báo",
        };
      throw { message: "Lỗi không xác định khi xóa thông báo" };
    }
  },

  async markAsRead(id: number): Promise<Notification> {
    try {
      const response = await axios.put(`/notification/${id}/mark-read`, {});
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể đánh dấu thông báo đã đọc",
        };
      throw { message: "Lỗi không xác định khi đánh dấu đã đọc" };
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      // Không gửi userId; BE lấy từ claims
      await axios.put(`/notification/mark-all-read`, {});
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể đánh dấu tất cả thông báo đã đọc",
        };
      throw { message: "Lỗi không xác định khi đánh dấu tất cả đã đọc" };
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      // Không gửi userId; BE trả { unreadCount: number }
      const response = await axios.get(`/notification/unread-count`);
      return typeof response.data === 'number'
        ? response.data
        : (response.data?.unreadCount ?? 0);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || {
          message: "Không thể lấy số lượng thông báo chưa đọc",
        };
      throw { message: "Lỗi không xác định khi lấy số lượng thông báo chưa đọc" };
    }
  },
};

