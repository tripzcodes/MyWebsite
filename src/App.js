import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import About from "./About/About.js";

// Home Page (MainPage)
function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fadeIn, setFadeIn] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  const dialogueLines = ["hello", "welcome to my world"];

  useEffect(() => {
    if (location.state?.skipIntro) {
      setShowButtons(true);
      return;
    }

    setFadeIn(true);
    let timeouts = [];

    const sequence = [
      () => setShowDialogue(true),
      () => setIsFadingOut(false),
      () => setIsFadingOut(true),
      () => setDialogueIndex(1),
      () => setIsFadingOut(false),
      () => setIsFadingOut(true),
      () => {
        setShowDialogue(false);
        setShowButtons(true);
      },
    ];

    sequence.forEach((fn, i) => {
      timeouts.push(setTimeout(fn, i * 2000));
    });

    return () => timeouts.forEach(clearTimeout);
  }, [location.state]);

  return (
    <div className={`app-container ${fadeIn ? "fade-in" : ""}`}>
      {showDialogue && (
        <div className="dialogue-box">
          <p className={`dialogue-text ${isFadingOut ? "fade-out" : "fade-in-text"}`}>
            {dialogueLines[dialogueIndex]}
          </p>
        </div>
      )}

      {showButtons && (
        <div className="home-container">
          <div className="button-container">
            <button onClick={() => navigate("/projects")}>Projects</button>
            <button onClick={() => navigate("/discussions")}>Discussions</button>
            <button onClick={() => navigate("/about", { state: { skipIntro: true } })}>About Me</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(localStorage.getItem("lastSong") || "");
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem("volume")) || 0.2);
  const [repeat, setRepeat] = useState(false);
  const [songHistory, setSongHistory] = useState([]);
  const [songImage, setSongImage] = useState("/images/default-cover.jpg");

  const audioRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/songs")
      .then(response => response.json())
      .then(data => {
        const mp3Files = data.slice(0, 50).map(file => `/songs/${file}`);
        setSongs(mp3Files);
        if (!currentSong && mp3Files.length > 0) {
          const randomSong = mp3Files[Math.floor(Math.random() * mp3Files.length)];
          setCurrentSong(randomSong);
          localStorage.setItem("lastSong", randomSong);
        }
      })
      .catch(err => console.error("Error fetching songs:", err));
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);
  }, [volume]);

  // ✅ Fetch Embedded Song Image (FIXED)
  useEffect(() => {
    if (!currentSong) return;

    fetch(`http://localhost:3001/api/song-image?file=${encodeURIComponent(currentSong.replace("/songs/", ""))}`)
      .then(response => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("No image found");
        }
      })
      .then(blob => {
        setSongImage(URL.createObjectURL(blob));
      })
      .catch(() => {
        setSongImage("/images/default-cover.jpg");
      });
  }, [currentSong]);

  const playNext = () => {
    if (songs.length > 0) {
      setSongHistory(prev => [...prev, currentSong]);
      const nextSong = songs[Math.floor(Math.random() * songs.length)];
      setCurrentSong(nextSong);
      localStorage.setItem("lastSong", nextSong);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (songHistory.length > 0) {
      const lastSong = songHistory.pop();
      setSongHistory([...songHistory]);
      setCurrentSong(lastSong);
      localStorage.setItem("lastSong", lastSong);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(() => console.warn("Playback error"));
    setIsPlaying(!isPlaying);
  };

  const handleSongEnd = () => {
    if (repeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  };

  // ✅ Improved Song Title Formatting
  const getFilteredSongTitle = () => {
    return currentSong
      .replace("/songs/", "")
      .replace(".mp3", "")
      .replace(/\[SPOTDOWNLOADER\.COM\]/g, "")
      .trim();
  };

  return (
    <>
      {/* Music Player (Persistent) */}
      <div className="music-player">
        <img src={songImage} 
             alt="Song Cover" 
             className="album-cover" 
        />

        <div className="progress-bar-container">
          <progress className="progress-bar" value={audioRef.current?.currentTime || 0} 
                    max={audioRef.current?.duration || 1} />
        </div>

        <div className="music-info">
          <span>{getFilteredSongTitle()}</span>
        </div>

        <div className="controls">
          <button onClick={playPrevious}>⏮</button>
          <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext}>⏭</button>
          <button 
            className={`repeat-btn ${repeat ? "repeat-active" : "repeat-inactive"}`} 
            onClick={() => setRepeat(prev => !prev)}
          >
            Repeat
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
      </div>

      <audio ref={audioRef} src={currentSong} onEnded={handleSongEnd} autoPlay />

      {/* Page Routing */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
