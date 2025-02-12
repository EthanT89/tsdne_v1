"use client";

import { useState } from "react";
import Title from "./components/Title";
import OutputBox from "./components/OutputBox";
import UserInput from "./components/UserInput";
import Footer from "./components/Footer";
import "./index.css"; 


export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "Dev",
      text: "Welcome to This Story Does Not Exist, where every choice you make writes a story only you can tell. You are both the reader and the written.\n\nHi, I’m Ethan Thornberg! I built this because I believe storytelling should be as limitless as your imagination. This project is my way of combining AI and creativity to build something truly unique. Check out the links below to see what else I’m working on—I’d love to connect!\n\nTo begin, describe your world. It could be a bustling city, a quiet forest, or something entirely new. Wherever you take it, the adventure is yours to create.\n\nWhat’s next?",
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

      let fullText = ""; // Store final formatted response
      let isComplete = false;

      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Check if we received the final formatted message
        if (chunk.includes("<END>")) {
          fullText = chunk.replace("<END>", "").replace(/ <BREAK> /g, "\n\n");
          isComplete = true;
        } else {
          fullText += chunk;
        }

        // Update UI dynamically
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...aiMessage, text: fullText };
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, streamSpeed)); // Simulate typing effect
      }

    } catch (err) {
      console.error("API Error:", err);
      setError("The AI is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gradient-to-b from-gray-900 to-black text-white font-annie">
      <Title />
      <div className="flex flex-col items-center space-y-4 mt-[-70px] flex-grow justify-center">
        <OutputBox story={messages} error={error} />
        <UserInput input={input} setInput={setInput} onSubmit={sendMessage} isLoading={loading} />
      </div>
      <Footer />
    </div>
  );
}
