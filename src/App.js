import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [fadeIn, setFadeIn] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(true);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(() => localStorage.getItem("lastSong") || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem("volume")) || 0.2);
  const [songImage, setSongImage] = useState(null);
  const audioRef = useRef(null);

  const dialogueLines = ["hello", "welcome to my world"];

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
    setTimeout(() => {
      setShowDialogue(true);
      setTimeout(() => {
        setIsFadingOut(false);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setDialogueIndex(1);
            setIsFadingOut(false);
            handleDialogueSequence();
          }, 1000);
        }, 2000);
      }, 500);
    }, 1700);
  }, []);

  const handleDialogueSequence = () => {
    let currentIndex = 1;
    const interval = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % dialogueLines.length;
        setDialogueIndex(currentIndex);
        setIsFadingOut(false);
      }, 1000);
    }, 4000);
    return () => clearInterval(interval);
  };

  /** 📂 Fetch Songs from Backend **/
  useEffect(() => {
    fetch("http://localhost:3001/api/songs")
      .then(response => response.json())
      .then(data => {
        const mp3Files = data.map(file => `/songs/${file}`);
        setSongs(mp3Files);

        if (!currentSong && mp3Files.length > 0) {
          const randomSong = mp3Files[Math.floor(Math.random() * mp3Files.length)];
          setCurrentSong(randomSong);
          localStorage.setItem("lastSong", randomSong);
        }
      })
      .catch(err => console.error("Error fetching songs:", err));
  }, []);

  /** 🎵 Handle Playback **/
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem("volume", volume);
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (songs.length > 0) {
      const nextSong = songs[Math.floor(Math.random() * songs.length)];
      setCurrentSong(nextSong);
      localStorage.setItem("lastSong", nextSong);
      setIsPlaying(true); // Auto-play next song
    }
  };

  /** 🔥 Fetch Embedded Song Image **/
  useEffect(() => {
    if (!currentSong) return;

    fetch(`http://localhost:3001/api/song-image?file=${encodeURIComponent(currentSong)}`)
      .then(response => response.json())
      .then(data => {
        if (data.image) {
          setSongImage(`data:image/jpeg;base64,${data.image}`);
        } else {
          setSongImage("/images/default-cover.jpg"); // Fallback image
        }
      })
      .catch(err => console.error("Error fetching song image:", err));
  }, [currentSong]);

  return (
    <div className={`app-container ${fadeIn ? "fade-in" : ""}`}>
      {showDialogue && (
        <div className="dialogue-box">
          <p className={`dialogue-text ${isFadingOut ? "fade-out" : "fade-in-text"}`}>
            {dialogueLines[dialogueIndex]}
          </p>
        </div>
      )}

      {/* 🎶 MUSIC PLAYER */}
      <div className="music-player">
        <img src={songImage} alt="Song Cover" className="album-cover" />
        <div className="music-info">
          <p className="song-title">{currentSong.replace("/songs/", "").replace(".mp3", "")}</p>
        </div>
        <div className="controls">
          <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext}>⏭</button>
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

      <audio ref={audioRef} src={currentSong} onEnded={playNext} autoPlay />
    </div>
  );
}

export default App;
