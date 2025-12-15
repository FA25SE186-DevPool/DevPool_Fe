import { useState } from "react";
import { Search, Users, MessageCircle, Plus, X, Check } from "lucide-react";
import type { ConversationModel, UserSearchModel } from "../../types/chat.types";
import { useAuth } from "../../context/AuthContext";

interface ChatSidebarProps {
    conversations: ConversationModel[];
    activeConversation: ConversationModel | null;
    searchResults: UserSearchModel[];
    isSearching: boolean;
    onSelectConversation: (conversation: ConversationModel) => void;
    onSearchUsers: (query: string) => void;
    onStartDirectConversation: (userId: string) => void;
    onCreateGroup: (name: string, participantIds: string[]) => void;
    onClearSearch: () => void;
}

export default function ChatSidebar({
    conversations,
    activeConversation,
    searchResults,
    isSearching,
    onSelectConversation,
    onSearchUsers,
    onStartDirectConversation,
    onCreateGroup,
    onClearSearch,
}: ChatSidebarProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<UserSearchModel[]>([]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        onSearchUsers(query);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        onClearSearch();
    };

    const handleSelectSearchResult = (userResult: UserSearchModel) => {
        if (showNewGroup) {
            // Add to group selection
            if (!selectedUsers.find((u) => u.userId === userResult.userId)) {
                setSelectedUsers([...selectedUsers, userResult]);
            }
        } else {
            // Start direct conversation
            onStartDirectConversation(userResult.userId);
            handleClearSearch();
        }
    };

    const handleRemoveFromGroup = (userId: string) => {
        setSelectedUsers(selectedUsers.filter((u) => u.userId !== userId));
    };

    const handleCreateGroup = () => {
        if (groupName.trim() && selectedUsers.length > 0) {
            onCreateGroup(
                groupName.trim(),
                selectedUsers.map((u) => u.userId)
            );
            setShowNewGroup(false);
            setGroupName("");
            setSelectedUsers([]);
            handleClearSearch();
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        } else if (days === 1) {
            return "Hôm qua";
        } else if (days < 7) {
            return date.toLocaleDateString("vi-VN", { weekday: "short" });
        } else {
            return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        }
    };

    const getConversationName = (conv: ConversationModel) => {
        if (conv.name) return conv.name;
        // For direct messages, get other participant's name
        const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
        return otherParticipant?.fullName || "Unknown";
    };

    const getConversationAvatar = (conv: ConversationModel) => {
        if (conv.isGroup) {
            return (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                </div>
            );
        }
        const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
        const initials = otherParticipant?.fullName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
        const isOnline = otherParticipant?.isOnline;

        return (
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {initials}
                </div>
                {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success-500 border-2 border-white rounded-full" />
                )}
            </div>
        );
    };

    return (
        <div className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-neutral-900">Tin nhắn</h2>
                    <button
                        onClick={() => setShowNewGroup(!showNewGroup)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Tạo nhóm mới"
                    >
                        {showNewGroup ? (
                            <X className="w-5 h-5 text-neutral-600" />
                        ) : (
                            <Plus className="w-5 h-5 text-neutral-600" />
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                        </button>
                    )}
                </div>

                {/* New Group Form */}
                {showNewGroup && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                        <input
                            type="text"
                            placeholder="Tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 mb-2"
                        />
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {selectedUsers.map((u) => (
                                    <span
                                        key={u.userId}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                                    >
                                        {u.fullName}
                                        <button onClick={() => handleRemoveFromGroup(u.userId)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedUsers.length === 0}
                            className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tạo nhóm ({selectedUsers.length} thành viên)
                        </button>
                    </div>
                )}
            </div>

            {/* Search Results */}
            {searchQuery && (
                <div className="flex-1 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-neutral-500">Đang tìm kiếm...</div>
                    ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500">Không tìm thấy kết quả</div>
                    ) : (
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs text-neutral-500 font-medium uppercase">
                                Kết quả tìm kiếm
                            </p>
                            {searchResults.map((result) => (
                                <button
                                    key={result.userId}
                                    onClick={() => handleSelectSearchResult(result)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-neutral-100 rounded-lg transition-colors"
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                                            {result.fullName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </div>
                                        {result.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-neutral-900">{result.fullName}</p>
                                        <p className="text-xs text-neutral-500">{result.role} • {result.email}</p>
                                    </div>
                                    {showNewGroup && selectedUsers.find((u) => u.userId === result.userId) && (
                                        <Check className="w-5 h-5 text-primary-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Conversations List */}
            {!searchQuery && (
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                            <p>Chưa có cuộc trò chuyện nào</p>
                            <p className="text-sm">Tìm kiếm để bắt đầu chat</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {/* Default Group */}
                            {conversations
                                .filter((c) => c.isDefault)
                                .map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${activeConversation?.id === conv.id
                                            ? "bg-primary-50 border border-primary-200"
                                            : "hover:bg-neutral-100"
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-neutral-900 truncate">{conv.name}</p>
                                                <span className="text-xs text-neutral-400">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className="text-sm text-neutral-500 truncate">{conv.lastMessagePreview || "Nhóm chung"}</p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}

                            {/* Separator */}
                            {conversations.some((c) => c.isDefault) && conversations.some((c) => !c.isDefault) && (
                                <div className="my-2 border-t border-neutral-200" />
                            )}

                            {/* Other Conversations */}
                            {conversations
                                .filter((c) => !c.isDefault)
                                .map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => onSelectConversation(conv)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${activeConversation?.id === conv.id
                                            ? "bg-primary-50 border border-primary-200"
                                            : "hover:bg-neutral-100"
                                            }`}
                                    >
                                        {getConversationAvatar(conv)}
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-neutral-900 truncate">
                                                    {getConversationName(conv)}
                                                </p>
                                                <span className="text-xs text-neutral-400">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className="text-sm text-neutral-500 truncate">
                                                {conv.lastMessagePreview || "Bắt đầu cuộc trò chuyện"}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

