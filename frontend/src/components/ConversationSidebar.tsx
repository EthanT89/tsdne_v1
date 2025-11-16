import { XMarkIcon } from "@heroicons/react/24/solid";
import ConversationList from "./ConversationList";

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  theme: "dark" | "light";
  refreshTrigger?: number;
}

export default function ConversationSidebar({
  isOpen,
  onClose,
  onLoadConversation,
  onDeleteConversation,
  theme,
  refreshTrigger = 0,
}: ConversationSidebarProps) {
  const bgClass = theme === "dark" ? "bg-gray-900" : "bg-slate-50";
  const overlayBg = theme === "dark" ? "bg-black" : "bg-gray-900";

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 ${overlayBg} bg-opacity-50 z-40 transition-opacity`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 ${bgClass} shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            My Stories
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "hover:bg-gray-800 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)]">
          <ConversationList
            onLoadConversation={(id) => {
              onLoadConversation(id);
              onClose();
            }}
            onDeleteConversation={onDeleteConversation}
            theme={theme}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </>
  );
}
