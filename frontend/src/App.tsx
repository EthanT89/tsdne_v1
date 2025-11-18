"use client";

import { useState } from "react";
import Title from "./components/Title";
import OutputBox from "./components/OutputBox";
import UserInput from "./components/UserInput";
import Footer from "./components/Footer";
import SettingsPanel from "./components/SettingsPanel";
import ConversationSidebar from "./components/ConversationSidebar";
import { CogIcon, BookOpenIcon, PlusIcon } from "@heroicons/react/24/solid";


interface Settings {
  fontSize: number;
  animationSpeed: number;
  theme: "dark" | "light";
}

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "Dev",
      text: `Welcome to This Story Does Not Exist, where every choice you make writes a story only you can tell. You are both the reader and the written.

Hi, I’m Ethan Thornberg! I built this because I believe storytelling should be as limitless as your imagination. This project is my way of combining AI and creativity to build something truly unique. Check out the links below to see what else I’m working on—I’d love to connect!

To begin, describe your world. It could be a bustling city, a quiet forest, or something entirely new. Wherever you take it, the adventure is yours to create.

What’s next?`,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamSpeed = 20; // Adjustable streaming speed

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    fontSize: 16,
    animationSpeed: 500,
    theme: "dark",
  });
  const [showSettings, setShowSettings] = useState(false);

  // Conversation management state
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const themeClasses =
    settings.theme === "dark"
      ? "bg-gradient-to-b from-gray-900 to-gray-950 text-white"
      : "bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900";

  const loadConversation = async (id: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/conversations/${id}`);

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await response.json();

      // Transform backend format to frontend format
      const loadedMessages = data.messages.map((m: any) => ({
        role: m.role,
        text: m.text,
      }));

      setMessages(loadedMessages);
      setConversationId(id);
      setShowSidebar(false);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
    }
  };

  const deleteConversation = (id: number) => {
    // If we're currently viewing this conversation, start a new story
    if (conversationId === id) {
      startNewStory();
    }
  };

  const startNewStory = () => {
    setMessages([
      {
        role: "Dev",
        text: `Welcome to This Story Does Not Exist, where every choice you make writes a story only you can tell. You are both the reader and the written.

Hi, I'm Ethan Thornberg! I built this because I believe storytelling should be as limitless as your imagination. This project is my way of combining AI and creativity to build something truly unique. Check out the links below to see what else I'm working on—I'd love to connect!

To begin, describe your world. It could be a bustling city, a quiet forest, or something entirely new. Wherever you take it, the adventure is yours to create.

What's next?`,
      },
    ]);
    setConversationId(null);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const newMessage = { role: "player", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          conversation_id: conversationId
        }),
      });
      if (!response.body) throw new Error("No response body received.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const aiMessage = { role: "ai", text: "" };
      setMessages((prev) => [...prev, aiMessage]);
      let fullText = "";
      let isComplete = false;
      let newConversationId = conversationId;

      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes("<END>")) {
          // Extract conversation ID from response
          const convIdMatch = chunk.match(/<CONV_ID>(\d+)/);
          if (convIdMatch) {
            newConversationId = parseInt(convIdMatch[1]);
          }
          fullText = chunk.replace("<END>", "").replace(/<CONV_ID>\d+/, "").replace(/ <BREAK> /g, "\n\n");
          isComplete = true;
        } else {
          fullText += chunk;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...aiMessage, text: fullText };
          return updated;
        });
        await new Promise((resolve) => setTimeout(resolve, streamSpeed));
      }

      // Update conversation ID if this was a new conversation
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("The AI is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`h-screen w-full overflow-hidden flex flex-col ${themeClasses} font-annie`}
      style={{ fontSize: settings.fontSize + "px" }}
    >
      <header className="p-3 text-center flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(true)}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === "light"
                ? "hover:bg-gray-200 text-black"
                : "hover:bg-gray-800 text-white"
            }`}
            title="My Stories"
          >
            <BookOpenIcon className="h-8 w-8" />
          </button>
          <button
            onClick={startNewStory}
            className={`p-2 rounded-lg transition-colors ${
              settings.theme === "light"
                ? "hover:bg-gray-200 text-black"
                : "hover:bg-gray-800 text-white"
            }`}
            title="New Story"
          >
            <PlusIcon className="h-8 w-8" />
          </button>
        </div>

        <Title theme={settings.theme} />

        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === "light"
              ? "hover:bg-gray-200 text-black"
              : "hover:bg-gray-800 text-white"
          }`}
          title="Settings"
        >
          <CogIcon className="h-8 w-8" />
        </button>
      </header>

      <main className="flex-grow overflow-hidden flex flex-col items-center px-4">
        <div className="w-full sm:w-4/5 md:w-3/4 max-w-2xl flex flex-col h-full">
          <div className="flex-grow overflow-auto">
            <OutputBox
              story={messages}
              error={error}
              animationSpeed={settings.animationSpeed}
              theme={settings.theme}
            />
          </div>
          <UserInput
            input={input}
            setInput={setInput}
            onSubmit={sendMessage}
            isLoading={loading}
            theme={settings.theme}
          />
        </div>
      </main>

      <Footer theme={settings.theme} />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSettings={(newSettings) => setSettings(newSettings)}
          closePanel={() => setShowSettings(false)}
        />
      )}

      <ConversationSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        theme={settings.theme}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
