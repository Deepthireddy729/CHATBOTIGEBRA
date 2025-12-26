"use client";

import { useState, useEffect } from "react";

export function StreamingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsComplete(true);
      return;
    }
    
    setIsComplete(false);
    let i = 0;
    setDisplayedText(""); // Reset for new text

    const intervalId = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
        setIsComplete(true);
      }
    }, 15);

    return () => clearInterval(intervalId);
  }, [text]);

  return (
    <p className="whitespace-pre-wrap">
      {displayedText}
      {!isComplete && <span className="animate-pulse">▍</span>}
    </p>
  );
}
