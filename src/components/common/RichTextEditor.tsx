import { useEffect, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  simple?: boolean; // Disable formatting toolbar
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  minHeight = 180,
  simple = false,
}: RichTextEditorProps) {
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: (() => {
      const raw = [
        StarterKit.configure({
          bulletList: { keepMarks: true, keepAttributes: false },
          orderedList: { keepMarks: true, keepAttributes: false },
          code: false,
          codeBlock: false,
        }),
        TaskList.configure({
          HTMLAttributes: { class: "rt-task-list" },
        }),
        TaskItem.configure({
          nested: true,
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
      ];
      // Deduplicate by extension name to avoid tiptap warning "Duplicate extension names"
      const seen = new Set<string>();
      return raw.filter((ext: any) => {
        const name = ext?.name ?? ext?.config?.name;
        if (!name) return true;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    })(),
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none text-sm",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      forceUpdate((prev) => prev + 1);
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full border border-neutral-200 rounded-xl bg-white px-4 py-3 text-neutral-400">
        Đang tải trình chỉnh sửa...
      </div>
    );
  }

  type ToolbarButton = {
    key: string;
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
  };

  const labelClass = "hidden 2xl:inline";

  const toolbarButtonClasses = (active: boolean) =>
    `flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${
      active
        ? "border-primary-500 bg-primary-50 text-primary-700"
        : "border-transparent text-neutral-600 hover:border-primary-200 hover:text-primary-600 hover:bg-white"
    } transition-colors text-sm font-medium`;

  const inlineButtons: ToolbarButton[] = [
    {
      key: "bold",
      label: "Đậm",
      icon: <Bold className="w-4 h-4" />,
      isActive: editor.isActive("bold"),
      onClick: () => {
        if (editor.isActive("bold")) {
          editor.chain().focus().unsetBold().run();
        } else {
          editor.chain().focus().setBold().run();
        }
      },
    },
    {
      key: "italic",
      label: "Nghiêng",
      icon: <Italic className="w-4 h-4" />,
      isActive: editor.isActive("italic"),
      onClick: () => {
        if (editor.isActive("italic")) {
          editor.chain().focus().unsetItalic().run();
        } else {
          editor.chain().focus().setItalic().run();
        }
      },
    },
    // underline button will be appended below if extension exists
    {
      key: "strike",
      label: "Gạch ngang",
      icon: <Strikethrough className="w-4 h-4" />,
      isActive: editor.isActive("strike"),
      onClick: () => {
        if (editor.isActive("strike")) {
          editor.chain().focus().unsetStrike().run();
        } else {
          editor.chain().focus().setStrike().run();
        }
      },
    },
  ];

  const listButtons: ToolbarButton[] = [
    {
      key: "bullet",
      label: "Bullet",
      icon: <List className="w-4 h-4" />,
      isActive: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: "ordered",
      label: "Số",
      icon: <ListOrdered className="w-4 h-4" />,
      isActive: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "task",
      label: "Checklist",
      icon: <ListChecks className="w-4 h-4" />,
      isActive: editor.isActive("taskList"),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
    },
  ];

  const isAlignActive = (value: "left" | "center" | "right" | "justify") =>
    editor.isActive({ textAlign: value });

  const toggleAlign = (value: "left" | "center" | "right" | "justify") => {
    if (isAlignActive(value)) {
      editor.chain().focus().unsetTextAlign().run();
    } else {
      editor.chain().focus().setTextAlign(value).run();
    }
  };

  const alignButtons: ToolbarButton[] = [
    {
      key: "align-left",
      label: "Trái",
      icon: <AlignLeft className="w-4 h-4" />,
      isActive: isAlignActive("left"),
      onClick: () => toggleAlign("left"),
    },
    {
      key: "align-center",
      label: "Giữa",
      icon: <AlignCenter className="w-4 h-4" />,
      isActive: isAlignActive("center"),
      onClick: () => toggleAlign("center"),
    },
    {
      key: "align-right",
      label: "Phải",
      icon: <AlignRight className="w-4 h-4" />,
      isActive: isAlignActive("right"),
      onClick: () => toggleAlign("right"),
    },
    {
      key: "align-justify",
      label: "Canh đều",
      icon: <AlignJustify className="w-4 h-4" />,
      isActive: isAlignActive("justify"),
      onClick: () => toggleAlign("justify"),
    },
  ];

  const renderButtons = (buttons: ToolbarButton[]) =>
    buttons.map((btn) => (
      <button
        key={btn.key}
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          btn.onClick();
        }}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            btn.onClick();
          }
        }}
        className={toolbarButtonClasses(btn.isActive)}
        aria-label={btn.label}
        title={btn.label}
      >
        {btn.icon}
        <span className={labelClass}>{btn.label}</span>
      </button>
    ));

  const ToolbarGroup = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hidden md:inline whitespace-nowrap">
        {title}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );

  if (simple) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-200 rounded-xl bg-white px-4 py-3 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all text-sm leading-relaxed resize-vertical"
        style={{ minHeight: `${minHeight}px` }}
        rows={6}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-stretch max-h-[120px] overflow-y-visible overflow-x-auto pb-1">
        <ToolbarGroup title="Định dạng">
          {renderButtons(inlineButtons)}
          {/* Conditionally render underline if available */}
          {editor.extensionManager.extensions.some((e: any) => e?.name === 'underline') && (
            <button
              key="underline"
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline?.().run?.(); }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  // @ts-ignore - toggleUnderline exists when underline extension is present
                  editor.chain().focus().toggleUnderline().run();
                }
              }}
              className={toolbarButtonClasses(editor.isActive("underline"))}
              aria-label="Gạch dưới"
              title="Gạch dưới"
            >
              <UnderlineIcon className="w-4 h-4" />
              <span className={labelClass}>Gạch dưới</span>
            </button>
          )}
        </ToolbarGroup>
        <ToolbarGroup title="Danh sách">{renderButtons(listButtons)}</ToolbarGroup>
        <ToolbarGroup title="Căn lề">{renderButtons(alignButtons)}</ToolbarGroup>
      </div>

      <div className="relative w-full border border-neutral-200 rounded-xl bg-white px-4 py-3 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        {editor.isEmpty && (
          <span className="absolute top-3 left-4 text-neutral-400 text-sm pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} className="rich-text-editor-content" />
      </div>
    </div>
  );
}

