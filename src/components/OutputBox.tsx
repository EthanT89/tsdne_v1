import { useEffect, useRef } from "react";

interface OutputBoxProps {
  story: { role: string; text: string }[];
  error?: string | null;
}

const OutputBox = ({ story, error }: OutputBoxProps) => {
  const outputRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  useEffect(() => {
    if (outputRef.current) {
      
      outputRef.current.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: "smooth", // Enables smooth scrolling instead of instant jumps
      });
    }

    
  }, [story]); // Run effect every time `story` updates

  return (
    <div
      ref={outputRef} // Attach ref to div
      className="w-3/4 bg-gray-800 p-6 rounded-lg shadow max-h-[50vh] overflow-y-auto text-white opacity-80 text-center font-annie custom-scrollbar"
    >
      {error && <p className="text-red-400 font-bold">{error}</p>}

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
              <p key={i} className="mb-3">{paragraph}</p>
            ))}
        </div>
      ))}
    </div>
  );
};

export default OutputBox;
