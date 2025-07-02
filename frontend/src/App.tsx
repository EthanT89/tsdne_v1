"use client";

import { useState } from "react";
import Title from "./components/Title";
import OutputBox from "./components/OutputBox";
import UserInput from "./components/UserInput";
import Footer from "./components/Footer";
import SettingsPanel from "./components/SettingsPanel";
import { CogIcon } from "@heroicons/react/24/solid";


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

  const themeClasses =
    settings.theme === "dark"
      ? "bg-gradient-to-b from-gray-900 to-gray-950 text-white"
      : "bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900";

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const newMessage = { role: "player", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.body) throw new Error("No response body received.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const aiMessage = { role: "ai", text: "" };
      setMessages((prev) => [...prev, aiMessage]);
      let fullText = "";
      let isComplete = false;
      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes("<END>")) {
          fullText = chunk.replace("<END>", "").replace(/ <BREAK> /g, "\n\n");
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
        <Title theme={settings.theme} />
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-lg transition-colors ${
            settings.theme === "light" 
              ? "hover:bg-gray-200 text-black" 
              : "hover:bg-gray-800 text-white"
          }`}
        >
          <CogIcon
            className="h-8 w-8"
          />
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
    </div>
  );
}
