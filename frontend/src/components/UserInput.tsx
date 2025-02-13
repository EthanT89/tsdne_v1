interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const UserInput = ({ input, setInput, onSubmit, isLoading }: UserInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      onSubmit();
      setInput("");
    }
  };

  return (
    <div className="flex items-center justify-center w-full py-2">
      <input
        className="
          w-full
          p-2
          bg-gray-800
          text-white
          opacity-80
          font-annie
          rounded-lg
          placeholder-gray-400
          border
          border-gray-600
          focus:outline-none
          focus:ring
          focus:ring-blue-500
          disabled:opacity-50
        "
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="What's next..."
        disabled={isLoading}
      />
      <button
        className={`
          ml-2
          p-2
          px-3
          bg-gray-600
          text-white
          rounded-lg
          hover:bg-gray-500
          transition
          flex
          items-center
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => {
          if (!isLoading) {
            onSubmit();
            setInput("");
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Go"}
      </button>
    </div>
  );
};

export default UserInput;
