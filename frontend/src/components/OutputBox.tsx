import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

interface OutputBoxProps {
  story: { role: string; text: string }[];
  error?: string | null;
}

const OutputBox = ({ story, error }: OutputBoxProps) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    if (outputRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (!outputRef.current) return;
    const container = outputRef.current;
    const start = container.scrollTop;
    // Set the target to the bottom-most scroll position
    const target = container.scrollHeight - container.clientHeight;
    const distance = target - start;
    const duration = Math.min(2000, Math.abs(distance) * 2); // scale duration based on distance, cap at 2000ms
    let startTime: number | null = null;
  
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + distance * easeOutCubic(progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setShowScrollButton(false);
      }
    };
  
    requestAnimationFrame(animate);
  };
  

  // Attach scroll listener
  useEffect(() => {
    const outputBox = outputRef.current;
    if (!outputBox) return;
    outputBox.addEventListener("scroll", handleScroll);
    return () => outputBox.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll effect: whenever story updates, scroll so that the new text's start aligns with the top
  useEffect(() => {
    if (outputRef.current && lastMessageRef.current) {
      const container = outputRef.current;
      const targetScroll = lastMessageRef.current.offsetTop;
      if (container.scrollTop < targetScroll) {
        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [story]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={outputRef}
        className="
          bg-gray-800
          p-4
          sm:p-6
          rounded-lg
          shadow
          text-lg
          text-white
          opacity-80
          text-center
          font-annie
          custom-scrollbar
          break-words
          whitespace-pre-wrap
          w-full
          h-full
          overflow-y-auto
        "
      >
        {error && <p className="text-red-400 font-bold">{error}</p>}

        {story.map((entry, index) => (
          <motion.div
            key={index}
            ref={index === story.length - 1 ? lastMessageRef : null}
            className={
              entry.role === "player"
                ? "text-blue-400"
                : "text-white opacity-90"
            }
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <strong>{entry.role === "player" ? "You: " : ""}</strong>
            {entry.text.split(/\n\s*\n/).map((paragraph, i) => (
              <p key={i} className="mb-3">
                {paragraph}
              </p>
            ))}
          </motion.div>
        ))}
      </div>

      {showScrollButton && (
        <motion.button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-gray-700 text-white p-2 rounded-full shadow-lg transition-opacity hover:bg-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ChevronDownIcon className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  );
};

export default OutputBox;
