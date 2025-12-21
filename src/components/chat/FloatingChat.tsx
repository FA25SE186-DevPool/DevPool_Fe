import { useState } from "react";
import { MessageCircle, X, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import ChatSidebar from "./ChatSidebar";
import ChatConversation from "./ChatConversation";

interface FloatingChatProps {
  className?: string;
}

export default function FloatingChat({ className = "" }: FloatingChatProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    searchResults,
    isSearching,
    selectConversation,
    sendMessage,
    handleTyping,
    startDirectConversation,
    createGroupConversation,
    searchUsers,
    clearSearch,
    getTypingUsersForConversation,
    getTotalUnreadCount,
    setActiveConversation,
  } = useChat();

  const unreadCount = getTotalUnreadCount();
  const typingUsers = activeConversation
    ? getTypingUsersForConversation(activeConversation.id)
    : [];

  const handleOpenFullPage = () => {
    setIsOpen(false);
    navigate("/chat");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-300 z-40 ${className}`}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-6 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-40 transition-all ${
        isExpanded ? "w-[700px] h-[600px]" : "w-[380px] h-[500px]"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h3 className="font-semibold">Tin nhắn</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenFullPage}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
            title="Mở trang chat"
          >
            Mở rộng
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setActiveConversation(null);
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-52px)]">
        {isExpanded ? (
          // Expanded view: Sidebar + Conversation
          <>
            <div className="w-72 border-r border-neutral-200">
              <ChatSidebar
                conversations={conversations}
                activeConversation={activeConversation}
                searchResults={searchResults}
                isSearching={isSearching}
                onSelectConversation={selectConversation}
                onSearchUsers={searchUsers}
                onStartDirectConversation={startDirectConversation}
                onCreateGroup={createGroupConversation}
                onClearSearch={clearSearch}
              />
            </div>
            <div className="flex-1">
              {activeConversation ? (
                <ChatConversation
                  conversation={activeConversation}
                  messages={messages}
                  typingUsers={typingUsers}
                  isLoading={isLoading}
                  onSendMessage={sendMessage}
                  onTyping={handleTyping}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                    <p>Chọn cuộc trò chuyện</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Compact view: Either sidebar or conversation
          <>
            {activeConversation ? (
              <ChatConversation
                conversation={activeConversation}
                messages={messages}
                typingUsers={typingUsers}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onTyping={handleTyping}
                onBack={() => setActiveConversation(null)}
                showBackButton
              />
            ) : (
              <ChatSidebar
                conversations={conversations}
                activeConversation={activeConversation}
                searchResults={searchResults}
                isSearching={isSearching}
                onSelectConversation={selectConversation}
                onSearchUsers={searchUsers}
                onStartDirectConversation={startDirectConversation}
                onCreateGroup={createGroupConversation}
                onClearSearch={clearSearch}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

