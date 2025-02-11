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
      role: "ai",
      text: "Welcome to This Story Does Not Exist. Every story has an author. This one doesn’t—yet.\n\nDescribe your world, and let the adventure begin.",
    },
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = { role: "player", text: input };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Title />
      <div className="flex flex-col items-center space-y-4 flex-grow justify-center">
        <OutputBox story={messages} />
        <UserInput input={input} setInput={setInput} onSubmit={sendMessage} />
      </div>
      <Footer />
    </div>
  );
}
