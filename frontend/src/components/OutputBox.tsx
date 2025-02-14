import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

interface OutputBoxProps {
  story: { role: string; text: string }[];
  error?: string | null;
  animationSpeed?: number;
  finalRender?: boolean; // New
  onFinalRenderComplete?: () => void; // New
}

const OutputBox = ({
  story,
  error,
  animationSpeed,
  finalRender,
  onFinalRenderComplete,
}: OutputBoxProps) => {
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
    const target = container.scrollHeight - container.clientHeight;
    const distance = target - start;
    const duration = Math.min(2000, Math.abs(distance) * 0.5);
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

  // Attach the scroll listener
  useEffect(() => {
    const outputBox = outputRef.current;
    if (!outputBox) return;
    outputBox.addEventListener("scroll", handleScroll);
    return () => outputBox.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll effect on new text: aligns the top of the new text with the container
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

  // NEW: final alignment if finalRender is true
  useEffect(() => {
    if (finalRender && outputRef.current && lastMessageRef.current) {
      const container = outputRef.current;
      const offset = lastMessageRef.current.offsetTop;

      // If the container is still below the last message's offset, scroll again
      if (container.scrollTop < offset) {
        container.scrollTo({
          top: offset,
          behavior: "smooth",
        });
      }

      // Signal we're done with final alignment
      onFinalRenderComplete?.();
    }
  }, [finalRender, onFinalRenderComplete]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={outputRef}
        style={{ fontSize: "inherit" }}
        className="
          bg-gray-800
          p-4
          sm:p-6
          rounded-lg
          shadow
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
            className={entry.role === "player" ? "text-blue-400" : "text-white opacity-90"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: animationSpeed ? animationSpeed / 1000 : 0.5,
              ease: "easeOut",
            }}
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
