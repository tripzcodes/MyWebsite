import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [fadeIn, setFadeIn] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(true);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(() => localStorage.getItem("lastSong") || "");
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem("volume")) || 0.2);
  const [songImage, setSongImage] = useState("/images/default-cover.jpg");
  const [repeat, setRepeat] = useState(false);
  const [songHistory, setSongHistory] = useState([]);
  const [isMarquee, setIsMarquee] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);

  const audioRef = useRef(null);
  const titleRef = useRef(null);
  const containerRef = useRef(null);

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
    if (!audioRef.current || autoplayAttempted) return;

    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);

    const playAudio = async () => {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Autoplay blocked by browser. Requires user interaction.");
        setIsPlaying(false);
      }
      setAutoplayAttempted(true);
    };

    playAudio();
  }, [currentSong, volume]);

  /** 🔄 Play Next & Previous Songs **/
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

  /** ⏸ Handle Play/Pause **/
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => console.warn("Playback error"));
    }

    setIsPlaying(!isPlaying);
  };

  /** 🔁 Handle Song End (Repeat) **/
  const handleSongEnd = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0; 
      audioRef.current.play();
    } else {
      playNext();
    }
  };

  /** 🔥 Fetch Embedded Song Image **/
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

  /** 🎶 Enable Marquee If Song Title is Clipped **/
  const checkMarquee = () => {
    if (titleRef.current && containerRef.current) {
      setIsMarquee(titleRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  };

  useEffect(() => {
    checkMarquee();
    window.addEventListener("resize", checkMarquee);
    return () => window.removeEventListener("resize", checkMarquee);
  }, [currentSong]);

  /** 🎵 Filter Song Title **/
  const getFilteredSongTitle = () => {
    return currentSong
      .replace("/songs/", "")
      .replace(".mp3", "")
      .replace(/\[SPOTDOWNLOADER\.COM\]/g, "")
      .trim();
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

      {/* 🎶 MUSIC PLAYER */}
      <div className="music-player">
        <img src={songImage} alt="Song Cover" className="album-cover" />
        <div className="music-info" ref={containerRef}>
          <div className="marquee-wrapper">
            {isMarquee ? (
              <div className="marquee">
                <span ref={titleRef}>{getFilteredSongTitle()}</span>
              </div>
            ) : (
              <span ref={titleRef} className="no-marquee">
                {getFilteredSongTitle()}
              </span>
            )}
          </div>
        </div>
        <div className="controls">
          <button onClick={playPrevious}>⏮</button>
          <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext}>⏭</button>
          <button
            className={`repeat-btn ${repeat ? "repeat-active" : ""}`} 
            onClick={() => setRepeat(!repeat)}
            >
            Repeat
          </button>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider" />
      </div>

      <audio ref={audioRef} src={currentSong} onEnded={handleSongEnd} autoPlay />
    </div>
  );
}

export default App;
