import React from "react";

interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean; // New: Track if loading
}

const UserInput = ({ input, setInput, onSubmit, isLoading }: UserInputProps) => {
  // Handle key press event
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault(); // Prevent accidental new lines
      onSubmit(); // Submit the message
      setInput(""); // Immediately clear input
    }
  };

  return (
    <div className="flex items-center justify-center w-3/4 mt-4">
      <input
        className="w-full p-3 bg-gray-800 text-white opacity-80 font-annie rounded-lg placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500 disabled:opacity-50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress} // Listen for Enter key
        placeholder="What's next..."
        disabled={isLoading} // Disable input while loading
      />
      <button
        className={`ml-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition flex items-center ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => {
          if (!isLoading) {
            onSubmit(); // Submit message
            setInput(""); // Immediately clear input
          }
        }}
        disabled={isLoading} // Disable button while loading
      >
        {isLoading ? "Loading..." : "Go"} {/* Change text while loading */}
      </button>
    </div>
  );
};
export default UserInput;
