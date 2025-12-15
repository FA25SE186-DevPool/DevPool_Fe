import apiClient from "../lib/apiClient";
import { AxiosError } from "axios";
import type {
    ConversationModel,
    MessageModel,
    UserSearchModel,
    CreateConversationModel,
    SendMessageModel,
} from "../types/chat.types";

export const chatService = {
    /**
     * Get all conversations for current user
     */
    async getConversations(): Promise<ConversationModel[]> {
        try {
            const response = await apiClient.get<ConversationModel[]>("/chat/conversations");
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tải danh sách cuộc trò chuyện" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Get a specific conversation by ID
     */
    async getConversation(conversationId: string): Promise<ConversationModel> {
        try {
            const response = await apiClient.get<ConversationModel>(`/chat/conversations/${conversationId}`);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tải cuộc trò chuyện" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Start or get existing direct conversation with a user
     */
    async createDirectConversation(targetUserId: string): Promise<ConversationModel> {
        try {
            const response = await apiClient.post<ConversationModel>(`/chat/conversations/direct/${targetUserId}`);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tạo cuộc trò chuyện" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Create a new group conversation
     */
    async createGroupConversation(model: CreateConversationModel): Promise<ConversationModel> {
        try {
            const response = await apiClient.post<ConversationModel>("/chat/conversations/group", model);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tạo nhóm" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId: string, page = 1, pageSize = 50): Promise<MessageModel[]> {
        try {
            const response = await apiClient.get<MessageModel[]>(
                `/chat/conversations/${conversationId}/messages`,
                { params: { page, pageSize } }
            );
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tải tin nhắn" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Send a message (REST fallback, prefer SignalR)
     */
    async sendMessage(model: SendMessageModel): Promise<MessageModel> {
        try {
            const response = await apiClient.post<MessageModel>("/chat/messages", model);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể gửi tin nhắn" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            await apiClient.delete(`/chat/messages/${messageId}`);
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể xóa tin nhắn" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Mark messages as read
     */
    async markAsRead(conversationId: string, lastMessageId?: string): Promise<void> {
        try {
            await apiClient.post(`/chat/conversations/${conversationId}/read`, { lastMessageId });
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể đánh dấu đã đọc" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Search users for starting a new conversation
     */
    async searchUsers(query: string): Promise<UserSearchModel[]> {
        try {
            if (!query || query.length < 2) return [];
            const response = await apiClient.get<UserSearchModel[]>("/chat/users/search", {
                params: { query },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tìm kiếm người dùng" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Get list of online user IDs
     */
    async getOnlineUsers(): Promise<string[]> {
        try {
            const response = await apiClient.get<string[]>("/chat/users/online");
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tải danh sách online" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Initialize default "All Staff" group (Admin only)
     */
    async initDefaultGroup(): Promise<void> {
        try {
            await apiClient.post("/chat/init-default-group");
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể khởi tạo nhóm mặc định" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },

    /**
     * Search entities for linking in messages
     * @param type Entity type: Talent, TalentApplication, ProcessStep, Project, JobRequest
     * @param query Search query
     */
    async searchEntities(type: string, query: string): Promise<{ type: string; id: string; name: string }[]> {
        try {
            if (!query || query.length < 2) return [];
            const response = await apiClient.get<{ type: string; id: string; name: string }[]>(
                "/chat/entities/search",
                { params: { type, query } }
            );
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw error.response?.data || { message: "Không thể tìm kiếm" };
            }
            throw { message: "Lỗi không xác định" };
        }
    },
};

