// ========== Request Models ==========

export interface CreateConversationModel {
    participantIds: string[];
    name?: string;
    isGroup: boolean;
}

export interface SendMessageModel {
    conversationId: string;
    content: string;
    linkedEntityType?: string;
    linkedEntityId?: string;
    attachments?: string[];
}

export interface MarkAsReadModel {
    conversationId: string;
    lastMessageId?: string;
}

// ========== Response Models ==========

export interface ConversationModel {
    id: string;
    name?: string;
    isGroup: boolean;
    isDefault: boolean;
    lastMessageAt?: string;
    lastMessagePreview?: string;
    unreadCount: number;
    participants: ParticipantModel[];
}

export interface ParticipantModel {
    userId: string;
    fullName: string;
    email?: string;
    role?: string;
    isOnline: boolean;
    isAdmin: boolean;
}

export interface MessageModel {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderEmail?: string;
    senderRole?: string;
    content: string;
    createdAt: string;
    editedAt?: string;
    isDeleted: boolean;
    linkedEntityType?: string;
    linkedEntityId?: string;
    linkedEntityName?: string;
    attachments?: string[];
    readBy: ReadReceiptModel[];
}

export interface ReadReceiptModel {
    userId: string;
    userName: string;
    readAt: string;
}

export interface UserSearchModel {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    isOnline: boolean;
}

// ========== SignalR Models ==========

export interface TypingIndicator {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
}

export interface MessagesReadEvent {
    conversationId: string;
    userId: string;
    lastMessageId?: string;
}

export interface UserOnlineEvent {
    userId: string;
}

// ========== UI State ==========

export interface ChatState {
    conversations: ConversationModel[];
    activeConversation: ConversationModel | null;
    messages: MessageModel[];
    isLoading: boolean;
    error: string | null;
    typingUsers: Map<string, TypingIndicator>;
    onlineUsers: Set<string>;
}

