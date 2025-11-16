import { useState, useEffect } from "react";
import ConversationItem from "./ConversationItem";

interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ConversationListProps {
  onLoadConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  theme: "dark" | "light";
  refreshTrigger?: number;
}

export default function ConversationList({
  onLoadConversation,
  onDeleteConversation,
  theme,
  refreshTrigger = 0,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/conversations`);

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    if (!confirm("Delete this story? This cannot be undone.")) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/conversations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== id));
      onDeleteConversation(id);
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert("Failed to delete conversation");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          Loading conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className={`text-6xl mb-4 ${theme === "dark" ? "opacity-50" : "opacity-30"}`}>
          📖
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          No Stories Yet
        </h3>
        <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          Start a new story to begin your adventure!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        Your Stories
      </h2>
      <div>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            id={conversation.id}
            createdAt={conversation.created_at}
            updatedAt={conversation.updated_at}
            messageCount={conversation.message_count}
            onClick={() => onLoadConversation(conversation.id)}
            onDelete={(e) => handleDelete(e, conversation.id)}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
