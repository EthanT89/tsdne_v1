interface UserInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
}

const UserInput = ({ input, setInput, onSubmit }: UserInputProps) => {
  return (
    <div className="justify-center items-center w-3/4 mt-4 flex">
      <input
        className="w-full p-3 bg-gray-700 text-white font-annie rounded-lg placeholder-gray-400 border border-white focus:outline-none focus:ring focus:ring-blue-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="What's next..."
      />
      <button
        className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        onClick={onSubmit}
      >
        Go
      </button>
    </div>
  );
};

export default UserInput;
