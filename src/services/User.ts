import axios from "../configs/axios";
import { AxiosError } from "axios";
import type { User, UserCreate, UserUpdate, UserUpdateRole, UserRegister, UserFilter, PagedResult } from "../types/user.types";

export type { User, UserCreate, UserUpdate, UserUpdateRole, UserRegister, UserFilter, PagedResult };

export const userService = {
  async getAll(filter?: UserFilter): Promise<PagedResult<User>> {
    try {
      const params = new URLSearchParams();

      if (filter?.name)
        params.append("Name", filter.name);
      if (filter?.role)
        params.append("Role", filter.role);
      if (filter?.isActive !== undefined)
        params.append("IsActive", filter.isActive ? "true" : "false");
      if (filter?.excludeDeleted !== undefined)
        params.append("ExcludeDeleted", filter.excludeDeleted ? "true" : "false");
      if (filter?.pageNumber)
        params.append("PageNumber", filter.pageNumber.toString());
      if (filter?.pageSize)
        params.append("PageSize", filter.pageSize.toString());

      const url = `/user${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải danh sách người dùng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async getById(id: string): Promise<User> {
    try {
      const response = await axios.get(`/user/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tải thông tin người dùng" };
      throw { message: "Lỗi không xác định khi tải dữ liệu" };
    }
  },

  async register(payload: UserRegister): Promise<User> {
    try {
      const response = await axios.post("/auth/register", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể đăng ký người dùng mới" };
      throw { message: "Lỗi không xác định khi đăng ký người dùng" };
    }
  },

  async create(payload: UserCreate): Promise<User> {
    try {
      const response = await axios.post("/user", payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể tạo người dùng mới" };
      throw { message: "Lỗi không xác định khi tạo người dùng" };
    }
  },

  async update(id: string, payload: UserUpdate): Promise<User> {
    try {
      const response = await axios.put(`/user/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật người dùng" };
      throw { message: "Lỗi không xác định khi cập nhật người dùng" };
    }
  },

  async updateRole(id: string, payload: UserUpdateRole): Promise<User> {
    try {
      const response = await axios.put(`/user/${id}/role`, payload);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể cập nhật vai trò người dùng" };
      throw { message: "Lỗi không xác định khi cập nhật vai trò" };
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`/user/${id}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể xóa người dùng" };
      throw { message: "Lỗi không xác định khi xóa người dùng" };
    }
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    try {
      await axios.put(`/user/${id}/reset-password`, { password: newPassword });
    } catch (error: unknown) {
      if (error instanceof AxiosError)
        throw error.response?.data || { message: "Không thể đặt lại mật khẩu" };
      throw { message: "Lỗi không xác định khi đặt lại mật khẩu" };
    }
  },

};
