import { TrashIcon } from "@heroicons/react/24/solid";

interface ConversationItemProps {
  id: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  theme: "dark" | "light";
}

export default function ConversationItem({
  createdAt,
  updatedAt,
  messageCount,
  onClick,
  onDelete,
  theme,
}: ConversationItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins === 0 ? "just now" : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const bgClass = theme === "dark"
    ? "bg-gray-800 hover:bg-gray-700"
    : "bg-white hover:bg-gray-50";

  const textClass = theme === "dark"
    ? "text-gray-300"
    : "text-gray-600";

  const borderClass = theme === "dark"
    ? "border-gray-700"
    : "border-gray-200";

  return (
    <div
      className={`${bgClass} ${borderClass} border rounded-lg p-4 cursor-pointer transition-all mb-3 relative group`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Story from {formatDate(createdAt)}
        </h3>
        <button
          onClick={onDelete}
          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
            theme === "dark"
              ? "hover:bg-red-900 text-red-400"
              : "hover:bg-red-100 text-red-600"
          }`}
          title="Delete conversation"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
      <div className={`text-sm ${textClass}`}>
        {messageCount} message{messageCount !== 1 ? "s" : ""} · Last updated {formatDate(updatedAt)}
      </div>
    </div>
  );
}
