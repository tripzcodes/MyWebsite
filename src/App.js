import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import About from "./About/About.js";

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
    document.body.style.backgroundColor = "#000"; // Ensure correct background color for home

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

function App() {
  const location = useLocation();
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(localStorage.getItem("lastSong") || "");
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(parseFloat(localStorage.getItem("volume")) || 0.2);
  const [repeat, setRepeat] = useState(false);
  const [songHistory, setSongHistory] = useState([]);
  const [songImage, setSongImage] = useState("/images/default-cover.jpg");

  const audioRef = useRef(null);

  // ✅ Update Background Color When Changing Pages
  useEffect(() => {
    document.body.style.backgroundColor = location.pathname === "/about" ? "#0d0d0d" : "#000";
  }, [location.pathname]);

  // ✅ Fetch Song List (Prevents Unnecessary Calls)
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/songs");
        const data = await response.json();
  
        const mp3Files = data.slice(0, 50).map(file => `/songs/${file}`);
        setSongs(mp3Files);
  
        if (!currentSong && mp3Files.length > 0) {
          const randomSong = mp3Files[Math.floor(Math.random() * mp3Files.length)];
          setCurrentSong(randomSong);
          localStorage.setItem("lastSong", randomSong);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };
  
    fetchSongs();
  }, [setSongs]); // ✅ Now setSongs is properly used

  // ✅ Sync Volume with Local Storage & Audio Element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);
  }, [volume]);

  // ✅ Fetch Album Art for Current Song (Fixed Warning)
  useEffect(() => {
    if (!currentSong) return;

    const fetchAlbumArt = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/song-image?file=${encodeURIComponent(currentSong.replace("/songs/", ""))}`);
        if (!response.ok) throw new Error("No image found");

        const blob = await response.blob();
        setSongImage(URL.createObjectURL(blob));
      } catch (error) {
        setSongImage("/images/default-cover.jpg");
      }
    };

    fetchAlbumArt();
  }, [currentSong]); // ✅ `currentSong` is now correctly included in dependencies

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
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  };

  // ✅ Improved Song Title Formatting
  const getFilteredSongTitle = () =>
    currentSong.replace("/songs/", "").replace(".mp3", "").replace(/\[SPOTDOWNLOADER\.COM\]/g, "").trim();

  return (
    <>
      {/* 🔥 Persistent Music Player */}
      <div className="music-player">
        <img src={songImage} alt="Song Cover" className="album-cover" />

        <div className="progress-bar-container">
          <progress className="progress-bar" value={audioRef.current?.currentTime || 0} max={audioRef.current?.duration || 1} />
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
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
      </div>

      <audio ref={audioRef} src={currentSong} onEnded={handleSongEnd} autoPlay />

      {/* 🔥 Page Routing */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
