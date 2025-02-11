interface OutputBoxProps {
  story: { role: string; text: string }[];
}

const OutputBox = ({ story }: OutputBoxProps) => {
  return (
    <div className="w-3/4 bg-gray-800 p-6 rounded-lg shadow max-h-[50vh] overflow-y-auto text-white opacity-80 text-center font-annie">
      {story.map((entry, index) => (
        <div
          key={index}
          className={
            entry.role === "player" ? "text-blue-400" : "text-white opacity-90"
          }
        >
          <strong>{entry.role === "player" ? "You: " : ""}</strong>
          {entry.text
            .split(/\n\s*\n/) // Splits by double newlines for paragraphs
            .map((paragraph, i) => (
              <p key={i} className="mb-3">
                {paragraph}
              </p>
            ))}
        </div>
      ))}
    </div>
  );
};

export default OutputBox;
