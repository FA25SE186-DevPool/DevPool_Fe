import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Send, Paperclip, Link2, X, User, Briefcase, FileText, ChevronDown } from "lucide-react";

// Linked Entity Types
export interface LinkedEntity {
  type: "Talent" | "TalentApplication" | "ProcessStep" | "Project" | "JobRequest";
  id: string;
  name: string;
}

interface ChatInputProps {
  onSendMessage: (content: string, linkedEntity?: LinkedEntity) => Promise<void>;
  onTyping: () => void;
  onSearchEntities?: (type: string, query: string) => Promise<LinkedEntity[]>;
  placeholder?: string;
  disabled?: boolean;
}

const ENTITY_TYPES = [
  { value: "Talent", label: "Talent", icon: User },
  { value: "TalentApplication", label: "Đơn ứng tuyển", icon: FileText },
  { value: "ProcessStep", label: "Bước tuyển dụng", icon: Briefcase },
  { value: "Project", label: "Dự án", icon: Briefcase },
  { value: "JobRequest", label: "Yêu cầu tuyển dụng", icon: FileText },
];

export default function ChatInput({
  onSendMessage,
  onTyping,
  onSearchEntities,
  placeholder = "Nhập tin nhắn...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LinkedEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linkedEntity, setLinkedEntity] = useState<LinkedEntity | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const linkMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (linkMenuRef.current && !linkMenuRef.current.contains(event.target as Node)) {
        setShowLinkMenu(false);
        setSelectedEntityType(null);
        setEntitySearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search entities when query changes
  useEffect(() => {
    const searchEntities = async () => {
      if (!selectedEntityType || !entitySearchQuery.trim() || !onSearchEntities) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearchEntities(selectedEntityType, entitySearchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchEntities, 300);
    return () => clearTimeout(debounce);
  }, [selectedEntityType, entitySearchQuery, onSearchEntities]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(trimmedMessage, linkedEntity || undefined);
      setMessage("");
      setLinkedEntity(null);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping();

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSelectEntity = (entity: LinkedEntity) => {
    setLinkedEntity(entity);
    setShowLinkMenu(false);
    setSelectedEntityType(null);
    setEntitySearchQuery("");
    setSearchResults([]);
  };

  const getEntityIcon = (type: string) => {
    const entityType = ENTITY_TYPES.find(et => et.value === type);
    return entityType?.icon || FileText;
  };

  const getEntityLabel = (type: string) => {
    const entityType = ENTITY_TYPES.find(et => et.value === type);
    return entityType?.label || type;
  };

  return (
    <div className="p-4 bg-white border-t border-neutral-200">
      {/* Linked Entity Preview */}
      {linkedEntity && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <Link2 className="w-4 h-4 text-primary-600" />
          <span className="text-xs text-primary-600 font-medium">{getEntityLabel(linkedEntity.type)}:</span>
          <span className="text-sm text-primary-800 flex-1 truncate">{linkedEntity.name}</span>
          <button
            onClick={() => setLinkedEntity(null)}
            className="p-1 hover:bg-primary-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-primary-600" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          type="button"
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Đính kèm file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Link Entity button */}
        <div className="relative" ref={linkMenuRef}>
          <button
            type="button"
            onClick={() => setShowLinkMenu(!showLinkMenu)}
            className={`p-2 rounded-lg transition-colors ${showLinkMenu || linkedEntity
                ? "text-primary-600 bg-primary-50"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              }`}
            title="Liên kết Talent/Dự án/Ứng tuyển..."
          >
            <Link2 className="w-5 h-5" />
          </button>

          {/* Link Menu Dropdown */}
          {showLinkMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50">
              {!selectedEntityType ? (
                // Entity Type Selection
                <div className="p-2">
                  <p className="px-2 py-1 text-xs text-neutral-500 font-medium uppercase">
                    Chọn loại liên kết
                  </p>
                  {ENTITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedEntityType(type.value)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        <Icon className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm text-neutral-700">{type.label}</span>
                        <ChevronDown className="w-4 h-4 text-neutral-400 ml-auto -rotate-90" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Entity Search
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => {
                        setSelectedEntityType(null);
                        setEntitySearchQuery("");
                        setSearchResults([]);
                      }}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <ChevronDown className="w-4 h-4 text-neutral-500 rotate-90" />
                    </button>
                    <span className="text-sm font-medium text-neutral-700">
                      {getEntityLabel(selectedEntityType)}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={entitySearchQuery}
                    onChange={(e) => setEntitySearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full px-3 py-2 bg-neutral-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white"
                    autoFocus
                  />

                  <div className="mt-2 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="py-4 text-center text-neutral-500 text-sm">
                        Đang tìm kiếm...
                      </div>
                    ) : searchResults.length === 0 && entitySearchQuery ? (
                      <div className="py-4 text-center text-neutral-500 text-sm">
                        Không tìm thấy kết quả
                      </div>
                    ) : (
                      searchResults.map((entity) => {
                        const Icon = getEntityIcon(entity.type);
                        return (
                          <button
                            key={entity.id}
                            onClick={() => handleSelectEntity(entity)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                          >
                            <Icon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            <span className="text-sm text-neutral-700 truncate">{entity.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full px-4 py-2.5 bg-neutral-100 border-0 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all disabled:opacity-50"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim() || disabled || isSending}
          className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      <p className="text-xs text-neutral-400 mt-2 text-center">
        Nhấn <kbd className="px-1 py-0.5 bg-neutral-100 rounded text-neutral-500">Enter</kbd> để gửi,{" "}
        <kbd className="px-1 py-0.5 bg-neutral-100 rounded text-neutral-500">Shift + Enter</kbd> để xuống dòng
      </p>
    </div>
  );
}
