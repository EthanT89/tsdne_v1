interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
}

const UserInput = ({ input, setInput, onSubmit }: UserInputProps) => {
  return (
    <div className="flex items-center justify-center w-3/4 mt-4">
      <input
        className="w-full p-3 bg-gray-800 text-white opacity-80 font-annie rounded-lg placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="What's next..."
      />
      <button
        className="ml-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition flex items-center"
        onClick={onSubmit}
      >
        Go
      </button>
    </div>
  );
};
export default UserInput;
