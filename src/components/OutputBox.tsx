interface OutputBoxProps {
  story: { role: string; text: string }[];
}

const OutputBox = ({ story }: OutputBoxProps) => {
  return (
    <div className="w-3/4 bg-gray-800 p-4 rounded-lg shadow max-h-[50vh] overflow-y-auto text-white text-center">
      {story.map((entry, index) => (
        <p
          key={index}
          className={
            entry.role === "player" ? "text-blue-400" : "text-green-400"
          }
        >
          <strong>{entry.role === "player" ? "You" : "AI"}:</strong>{" "}
          {entry.text}
        </p>
      ))}
    </div>
  );
};

export default OutputBox;
