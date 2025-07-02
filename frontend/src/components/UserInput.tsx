interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  theme?: "dark" | "light";
}

const UserInput = ({ input, setInput, onSubmit, isLoading, theme = "dark" }: UserInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      onSubmit();
      setInput("");
    }
  };

  const isDark = theme === "dark";
  const inputClasses = isDark
    ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
    : "bg-white text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500";
  
  const buttonClasses = isDark
    ? "bg-gray-600 hover:bg-gray-500 text-white"
    : "bg-gray-200 hover:bg-gray-300 text-gray-700";

  return (
    <div className="flex items-center justify-center w-full py-2 gap-2">
      <input
        className={`
          flex-1
          p-3
          font-annie
          rounded-lg
          border
          transition-colors
          duration-200
          focus:outline-none
          focus:ring-2
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${inputClasses}
        `}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="What's next..."
        disabled={isLoading}
      />
      <button
        className={`
          px-4
          py-3
          rounded-lg
          font-medium
          transition-colors
          duration-200
          flex
          items-center
          justify-center
          min-w-[64px]
          ${buttonClasses}
          ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
        `}
        onClick={() => {
          if (!isLoading) {
            onSubmit();
            setInput("");
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? "..." : "Go"}
      </button>
    </div>
  );
};

export default UserInput;
