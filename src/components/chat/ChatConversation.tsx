import { useRef, useEffect } from "react";
import { Users, ArrowLeft, Link2, User, Briefcase, FileText } from "lucide-react";
import type { ConversationModel, MessageModel, TypingIndicator } from "../../types/chat.types";
import { useAuth } from "../../context/AuthContext";
import ChatInput from "./ChatInput";
import type { LinkedEntity } from "./ChatInput";

interface ChatConversationProps {
  conversation: ConversationModel;
  messages: MessageModel[];
  typingUsers: TypingIndicator[];
  isLoading: boolean;
  onSendMessage: (content: string, linkedEntity?: LinkedEntity) => Promise<void>;
  onTyping: () => void;
  onSearchEntities?: (type: string, query: string) => Promise<LinkedEntity[]>;
  onBack?: () => void;
  showBackButton?: boolean;
}

// Entity type configuration
const ENTITY_TYPES: Record<string, { label: string; icon: typeof User; color: string }> = {
  talent: { label: "Talent", icon: User, color: "bg-blue-100 text-blue-700 border-blue-200" },
  talentapplication: { label: "Đơn ứng tuyển", icon: FileText, color: "bg-purple-100 text-purple-700 border-purple-200" },
  processstep: { label: "Bước tuyển dụng", icon: Briefcase, color: "bg-amber-100 text-amber-700 border-amber-200" },
  project: { label: "Dự án", icon: Briefcase, color: "bg-green-100 text-green-700 border-green-200" },
  jobrequest: { label: "Yêu cầu tuyển dụng", icon: FileText, color: "bg-pink-100 text-pink-700 border-pink-200" },
};

export default function ChatConversation({
  conversation,
  messages,
  typingUsers,
  isLoading,
  onSendMessage,
  onTyping,
  onSearchEntities,
  onBack,
  showBackButton = false,
}: ChatConversationProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    const otherParticipant = conversation.participants.find((p) => p.userId !== user?.id);
    return otherParticipant?.fullName || "Unknown";
  };

  const getConversationSubtitle = () => {
    if (conversation.isGroup) {
      return `${conversation.participants.length} thành viên`;
    }
    const otherParticipant = conversation.participants.find((p) => p.userId !== user?.id);
    if (otherParticipant?.isOnline) {
      return "Đang hoạt động";
    }
    return otherParticipant?.role || "";
  };

  const renderLinkedEntity = (message: MessageModel, isOwnMessage: boolean) => {
    if (!message.linkedEntityType || !message.linkedEntityId) return null;

    const entityConfig = ENTITY_TYPES[message.linkedEntityType.toLowerCase()];
    const Icon = entityConfig?.icon || Link2;

    if (isOwnMessage) {
      // Style for own messages (on primary background)
      return (
        <div className="mt-2 p-2 bg-white/20 rounded-lg border border-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-white/80" />
            <div>
              <p className="text-xs text-white/70">
                {entityConfig?.label || message.linkedEntityType}
              </p>
              <p className="font-medium text-white">
                {message.linkedEntityName || message.linkedEntityId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Style for other's messages (on white background)
    return (
      <div className={`mt-2 p-2 rounded-lg border ${entityConfig?.color || "bg-neutral-100 text-neutral-700 border-neutral-200"}`}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <div>
            <p className="text-xs opacity-70">
              {entityConfig?.label || message.linkedEntityType}
            </p>
            <p className="font-medium">
              {message.linkedEntityName || message.linkedEntityId}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-neutral-200 flex items-center gap-3">
        {showBackButton && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
        )}

        {conversation.isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {getConversationName()
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            {conversation.participants.find((p) => p.userId !== user?.id)?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
            )}
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{getConversationName()}</h3>
          <p className="text-sm text-neutral-500">{getConversationSubtitle()}</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="font-medium">Bắt đầu cuộc trò chuyện</p>
            <p className="text-sm">Gửi tin nhắn đầu tiên</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const showDateSeparator = shouldShowDateSeparator(index);

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                      {/* Avatar (only for others in group) */}
                      {!isOwnMessage && conversation.isGroup && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {message.senderName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}

                      <div>
                        {/* Sender name (only for others in group) */}
                        {!isOwnMessage && conversation.isGroup && (
                          <p className="text-xs text-neutral-500 mb-1 ml-1">
                            {message.senderName}
                            {message.senderEmail && (
                              <span className="ml-1 text-neutral-400">({message.senderEmail})</span>
                            )}
                            {message.senderRole && (
                              <span className="ml-1 text-neutral-400">• {message.senderRole}</span>
                            )}
                          </p>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${isOwnMessage
                            ? "bg-primary-600 text-white rounded-tr-md"
                            : "bg-white text-neutral-900 rounded-tl-md shadow-sm border border-neutral-100"
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          {renderLinkedEntity(message, isOwnMessage)}
                        </div>

                        {/* Time */}
                        <p
                          className={`text-xs text-neutral-400 mt-1 ${isOwnMessage ? "text-right mr-1" : "ml-1"
                            }`}
                        >
                          {formatTime(message.createdAt)}
                          {/* Chỉ hiển thị tick đã đọc cho chat 1-1 (không phải group) */}
                          {isOwnMessage && !conversation.isGroup && message.readBy.length > 0 && (
                            <span className="ml-1 text-primary-500">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>
                  {typingUsers.map((t) => t.userName).join(", ")} đang nhập...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onSearchEntities={onSearchEntities}
      />
    </div>
  );
}
