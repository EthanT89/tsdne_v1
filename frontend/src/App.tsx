"use client";

import { useState } from "react";
import Title from "./components/Title";
import OutputBox from "./components/OutputBox";
import UserInput from "./components/UserInput";
import Footer from "./components/Footer";

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
  const streamSpeed = 20; //  Adjustable streaming speed

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    const newMessage = { role: "player", text: input };
    setMessages((prev) => [...prev, newMessage]); // Show user input immediately
    setInput(""); // Clear input immediately

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!response.body) {
        throw new Error("No response body received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { role: "ai", text: "" };
      setMessages((prev) => [...prev, aiMessage]); // Placeholder for AI response

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
    /**
     * Occupies the full screen, hides any overflow so no browser scrollbars appear.
     * We use flex-col so elements stack vertically:
     *  - Title (header)
     *  - Main content (output + input) that flex-grows
     *  - Footer (at bottom, clipped if too tall)
     */
    <div className="h-screen w-full overflow-hidden flex flex-col bg-gradient-to-b from-gray-900 to-black text-white font-annie">
      {/* Title at the top */}
      <header className="p-3 text-center">
        <Title />
      </header>

      {/**
       * Main content area expands to fill the space between title & footer.
       * 'flex-grow overflow-hidden' ensures it grows as large as possible,
       * but is clipped if there's not enough room for the footer.
       */}
      <main className="flex-grow overflow-hidden flex flex-col items-center px-4">
        {/**
         * A container for the OutputBox & UserInput.
         * 'flex flex-col h-full' ensures it fills the vertical space,
         * so OutputBox can grow & scroll inside it.
         */}
        <div className="w-full sm:w-4/5 md:w-3/4 max-w-2xl flex flex-col h-full">
          {/**
           * Make the OutputBox scrollable if there's more content than fits in the available space.
           * 'flex-grow overflow-auto' means it expands to fill leftover space and scrolls if needed.
           */}
          <div className="flex-grow overflow-auto">
            <OutputBox story={messages} error={error} />
          </div>

          {/* Input pinned below OutputBox, always visible unless clipped by screen */}
          <UserInput
            input={input}
            setInput={setInput}
            onSubmit={sendMessage}
            isLoading={loading}
          />
        </div>
      </main>

      {/* Footer below the main content in normal flow */}
      <Footer />
    </div>
  );
}
