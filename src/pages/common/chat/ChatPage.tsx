import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { useChat } from "../../../hooks/useChat";
import { ChatSidebar, ChatConversation } from "../../../components/chat";
import * as signalR from "@microsoft/signalr";

export default function ChatPage() {
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    error,
    searchResults,
    isSearching,
    connectionState,
    selectConversation,
    sendMessage,
    handleTyping,
    startDirectConversation,
    createGroupConversation,
    searchUsers,
    clearSearch,
    searchEntities,
    getTypingUsersForConversation,
    clearError,
  } = useChat();

  const typingUsers = activeConversation
    ? getTypingUsersForConversation(activeConversation.id)
    : [];

  const isConnected = connectionState === signalR.HubConnectionState.Connected;

  return (
    <div className="h-[calc(100vh-64px)] flex bg-neutral-100">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-error-500 hover:text-error-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isConnected
              ? "bg-success-100 text-success-700"
              : "bg-warning-100 text-warning-700"
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Đã kết nối</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Đang kết nối...</span>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {activeConversation ? (
          <ChatConversation
            conversation={activeConversation}
            messages={messages}
            typingUsers={typingUsers}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onTyping={handleTyping}
            onSearchEntities={searchEntities}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Chào mừng đến DevPool Chat
              </h2>
              <p className="text-neutral-500 max-w-md">
                Tìm kiếm đồng nghiệp theo tên hoặc email để bắt đầu cuộc trò chuyện.
                <br />
                Hoặc chọn một cuộc trò chuyện có sẵn từ danh sách bên trái.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

