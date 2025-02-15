import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [fadeIn, setFadeIn] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(true); // Start faded out

  const dialogueLines = ["hello", "welcome to my world"];

  useEffect(() => {
    // Step 1: Fade in background first
    setTimeout(() => {
      setFadeIn(true);
    }, 100);

    // Step 2: Wait until background has fully faded in, then start text
    setTimeout(() => {
      setShowDialogue(true);

      // Step 3: First line should fade in now
      setTimeout(() => {
        setIsFadingOut(false); // Fade-in the first "hello,"

        // Step 4: Start the fade-out sequence for first line
        setTimeout(() => {
          setIsFadingOut(true); // Fade-out "hello,"

          setTimeout(() => {
            setDialogueIndex(1); // Switch to "welcome to my world."
            setIsFadingOut(false); // Fade-in the next line

            // Step 5: Start looping after first transition
            handleDialogueSequence();
          }, 1000); // Time for fade-out before switching
        }, 2000); // First "hello," stays for the correct time
      }, 500); // First "hello," fades in after 0.5s
    }, 1700); // Background fade-in delay

  }, []);

  const handleDialogueSequence = () => {
    let currentIndex = 1;

    const interval = setInterval(() => {
      setIsFadingOut(true); // Start fade-out

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % dialogueLines.length;
        setDialogueIndex(currentIndex);
        setIsFadingOut(false); // Start fade-in for the next line
      }, 1000); // Time to complete fade-out

    }, 4000); // Total duration per line (fade-in, stay, fade-out)

    return () => clearInterval(interval);
  };

  return (
    <div className={`app-container ${fadeIn ? "fade-in" : ""}`}>
      {showDialogue && (
        <div className="dialogue-box">
          <p className={`dialogue-text ${isFadingOut ? "fade-out" : "fade-in-text"}`}>
            {dialogueLines[dialogueIndex]}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
