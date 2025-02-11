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
      role: "Player",
      text: "Welcome to This Story Does Not Exist, where every choice you make writes a story only you can tell. You are both the reader and the written. \n \n Hi, I’m Ethan Thornberg! I built this because I believe storytelling should be as limitless as your imagination. This project is my way of combining AI and creativity to build something truly unique. Check out the links below to see what else I’m working on—I’d love to connect! \n \n To begin, describe your world. It could be a bustling city, a quiet forest, or something entirely new. Wherever you take it, the adventure is yours to create. \n \n What’s next?",
    },
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const newMessage = { role: "player", text: input };
  
    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
  
      const data = await res.json();
      const aiResponse = { role: "ai", text: data.response };
  
      setMessages([...messages, newMessage, aiResponse]);
      setInput("");
  
    } catch (error) {
      console.error("Error:", error);
    }
  };
  

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gradient-to-b from-gray-900 to-black text-white font-annie">
      <Title />
      <div className="flex flex-col items-center space-y-4 mt-[-70px] flex-grow justify-center">
        <OutputBox story={messages} />
        <UserInput input={input} setInput={setInput} onSubmit={sendMessage} />
      </div>
      <Footer />
    </div>
  );
}
