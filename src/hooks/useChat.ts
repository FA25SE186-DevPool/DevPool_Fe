import { useState, useCallback, useEffect, useRef } from "react";
import { chatService } from "../services/Chat";
import { useChatConnection } from "./useChatConnection";
import type {
    ConversationModel,
    MessageModel,
    UserSearchModel,
    TypingIndicator,
    SendMessageModel,
} from "../types/chat.types";
import type { LinkedEntity } from "../components/chat/ChatInput";
import { useAuth } from "../context/AuthContext";

export function useChat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationModel[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationModel | null>(null);
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [searchResults, setSearchResults] = useState<UserSearchModel[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeConversationRef = useRef<ConversationModel | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    // Helper function to sort conversations: default group first, then by last message time
    const sortConversations = (convs: ConversationModel[]) => {
        return [...convs].sort((a, b) => {
            // Default group always first
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;

            // Then sort by last message time (newest first)
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA;
        });
    };

    // SignalR connection
    const {
        isConnected,
        connectionState,
        sendMessage: sendMessageViaSignalR,
        joinConversation,
        sendTypingIndicator,
        markAsRead: markAsReadViaSignalR,
    } = useChatConnection({
        onReceiveMessage: async (message) => {
            const currentConversation = activeConversationRef.current;

            // Add new message to messages list if it's for active conversation
            if (currentConversation && message.conversationId === currentConversation.id) {
                setMessages((prev) => [...prev, message]);
                // Don't increment unread count - we're viewing this conversation
            }

            // Update conversation preview and re-sort
            setConversations((prev) => {
                // Check if conversation exists in our list
                const conversationExists = prev.some((conv) => conv.id === message.conversationId);

                if (!conversationExists) {
                    // New conversation from someone else - fetch it from API
                    chatService.getConversation(message.conversationId).then((newConv) => {
                        if (newConv) {
                            setConversations((current) => {
                                const exists = current.some((c) => c.id === newConv.id);
                                if (exists) return current;
                                return sortConversations([
                                    { ...newConv, unreadCount: 1, lastMessagePreview: message.content },
                                    ...current
                                ]);
                            });
                        }
                    }).catch(console.error);
                    return prev; // Return unchanged for now, will update when API returns
                }

                const updated = prev.map((conv) =>
                    conv.id === message.conversationId
                        ? {
                            ...conv,
                            lastMessageAt: message.createdAt,
                            lastMessagePreview: message.content.length > 100
                                ? message.content.substring(0, 100) + "..."
                                : message.content,
                            // Only increment unread if NOT viewing this conversation
                            unreadCount: currentConversation?.id === conv.id
                                ? 0  // Keep at 0 since we're viewing it
                                : conv.unreadCount + 1,
                        }
                        : conv
                );
                return sortConversations(updated);
            });
        },
        onNewConversation: (conversation) => {
            // Add new conversation to list if not already exists
            setConversations((prev) => {
                const exists = prev.some((c) => c.id === conversation.id);
                if (exists) return prev;
                return sortConversations([conversation, ...prev]);
            });
        },
        onUserTyping: (indicator) => {
            if (indicator.userId === user?.id) return;

            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                if (indicator.isTyping) {
                    newMap.set(`${indicator.conversationId}-${indicator.userId}`, indicator);
                } else {
                    newMap.delete(`${indicator.conversationId}-${indicator.userId}`);
                }
                return newMap;
            });
        },
        onMessagesRead: (event) => {
            // Update read receipts if needed
            if (activeConversation && event.conversationId === activeConversation.id) {
                // Could update message read receipts here
            }
        },
        onUserOnline: (event) => {
            setOnlineUsers((prev) => new Set([...prev, event.userId]));
            // Update participants' online status
            setConversations((prev) =>
                prev.map((conv) => ({
                    ...conv,
                    participants: conv.participants.map((p) =>
                        p.userId === event.userId ? { ...p, isOnline: true } : p
                    ),
                }))
            );
        },
        onUserOffline: (event) => {
            setOnlineUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(event.userId);
                return newSet;
            });
            // Update participants' online status
            setConversations((prev) =>
                prev.map((conv) => ({
                    ...conv,
                    participants: conv.participants.map((p) =>
                        p.userId === event.userId ? { ...p, isOnline: false } : p
                    ),
                }))
            );
        },
    });

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await chatService.getConversations();
            setConversations(sortConversations(data));
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể tải cuộc trò chuyện");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            setIsLoading(true);
            const data = await chatService.getMessages(conversationId);
            setMessages(data);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể tải tin nhắn");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Select a conversation
    const selectConversation = useCallback(async (conversation: ConversationModel) => {
        setActiveConversation(conversation);
        await loadMessages(conversation.id);
        await joinConversation(conversation.id);

        // Mark as read
        if (conversation.unreadCount > 0) {
            await markAsReadViaSignalR({ conversationId: conversation.id });
            setConversations((prev) =>
                prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
            );
        }
    }, [loadMessages, joinConversation, markAsReadViaSignalR]);

    // Send a message
    const sendMessage = useCallback(async (content: string, linkedEntity?: LinkedEntity) => {
        if (!activeConversation) return;

        const model: SendMessageModel = {
            conversationId: activeConversation.id,
            content,
            linkedEntityType: linkedEntity?.type,
            linkedEntityId: linkedEntity?.id,
        };

        try {
            if (isConnected) {
                await sendMessageViaSignalR(model);
            } else {
                // Fallback to REST API
                const message = await chatService.sendMessage(model);
                setMessages((prev) => [...prev, message]);
            }

            // Stop typing indicator
            await sendTypingIndicator(activeConversation.id, false);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể gửi tin nhắn");
            throw err;
        }
    }, [activeConversation, isConnected, sendMessageViaSignalR, sendTypingIndicator]);

    // Handle typing
    const handleTyping = useCallback(() => {
        if (!activeConversation || !isConnected) return;

        sendTypingIndicator(activeConversation.id, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(activeConversation.id, false);
        }, 3000);
    }, [activeConversation, isConnected, sendTypingIndicator]);

    // Start direct conversation
    const startDirectConversation = useCallback(async (targetUserId: string) => {
        try {
            setIsLoading(true);
            const conversation = await chatService.createDirectConversation(targetUserId);

            // Add to conversations if not already there
            setConversations((prev) => {
                const exists = prev.some((c) => c.id === conversation.id);
                if (exists) {
                    return prev;
                }
                return sortConversations([conversation, ...prev]);
            });

            await selectConversation(conversation);
            return conversation;
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể tạo cuộc trò chuyện");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [selectConversation]);

    // Create group conversation
    const createGroupConversation = useCallback(async (name: string, participantIds: string[]) => {
        try {
            setIsLoading(true);
            const conversation = await chatService.createGroupConversation({
                name,
                participantIds,
                isGroup: true,
            });

            setConversations((prev) => sortConversations([conversation, ...prev]));
            await selectConversation(conversation);
            return conversation;
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể tạo nhóm");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [selectConversation]);

    // Search users
    const searchUsers = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const results = await chatService.searchUsers(query);
            setSearchResults(results);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || "Không thể tìm kiếm");
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchResults([]);
    }, []);

    // Search entities for linking
    const searchEntities = useCallback(async (type: string, query: string): Promise<LinkedEntity[]> => {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const results = await chatService.searchEntities(type, query);
            // Map to LinkedEntity type
            return results.map(r => ({
                type: r.type as LinkedEntity["type"],
                id: r.id,
                name: r.name,
            }));
        } catch {
            return [];
        }
    }, []);

    // Get typing users for active conversation
    const getTypingUsersForConversation = useCallback((conversationId: string) => {
        const users: TypingIndicator[] = [];
        typingUsers.forEach((indicator, key) => {
            if (key.startsWith(conversationId)) {
                users.push(indicator);
            }
        });
        return users;
    }, [typingUsers]);

    // Get total unread count
    const getTotalUnreadCount = useCallback(() => {
        return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    }, [conversations]);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Load online users on mount
    useEffect(() => {
        const loadOnlineUsers = async () => {
            try {
                const userIds = await chatService.getOnlineUsers();
                setOnlineUsers(new Set(userIds));
            } catch {
                // Ignore error
            }
        };
        loadOnlineUsers();
    }, []);

    // Auto mark as read when receiving new messages in active conversation
    useEffect(() => {
        if (!activeConversation || !isConnected || messages.length === 0) return;

        // Get the last message
        const lastMessage = messages[messages.length - 1];

        // If the last message is from someone else, mark as read
        if (lastMessage && lastMessage.senderId !== user?.id) {
            markAsReadViaSignalR({ conversationId: activeConversation.id, lastMessageId: lastMessage.id });
        }
    }, [messages, activeConversation, isConnected, user?.id, markAsReadViaSignalR]);

    return {
        // State
        conversations,
        activeConversation,
        messages,
        isLoading,
        error,
        searchResults,
        isSearching,
        isConnected,
        connectionState,
        onlineUsers,

        // Actions
        loadConversations,
        selectConversation,
        sendMessage,
        handleTyping,
        startDirectConversation,
        createGroupConversation,
        searchUsers,
        clearSearch,
        searchEntities,
        getTypingUsersForConversation,
        getTotalUnreadCount,
        setActiveConversation,
        clearError: () => setError(null),
    };
}

