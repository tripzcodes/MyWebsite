import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, SkipForward, SkipBack, Repeat, Music } from "lucide-react";
import "./App.css";
import About from "./About/About.js";
import BackgroundRenderer from "./BackgroundRenderer.js";
import Projects from "./projects/Projects.js";
import Discussions from "./discussions/Discussions.js";
import { Analytics } from "@vercel/analytics/react"


function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // const [skipIntro, setSkipIntro] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(true);
  const [showDialogue, setShowDialogue] = useState(false);

  const dialogueLines = ["Hello.", "Welcome to my world."];

  useEffect(() => {
    document.body.style.background = "transparent"; 

    if (location.state?.skipIntro || sessionStorage.getItem("skipIntro") === "true") {
      setShowButtons(true);
      return;
    }

    sessionStorage.setItem("skipIntro", "true"); 

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

    sequence.forEach((fn, i) => timeouts.push(setTimeout(fn, i * 1000)));

    return () => timeouts.forEach(clearTimeout);
  }, [location.state]);

  return (
    <div className="app-container">
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
            <button onClick={() => navigate("/projects", { state: { skipIntro: true } })}>Projects</button>
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const timeoutRef = useRef(null);

  const audioRef = useRef(null);

  useEffect(() => {
    document.body.style.backgroundColor = location.pathname === "/about" ? "#0d0d0d" : "#000";
  }, [location.pathname]);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_API?.replace(/\/$/, "");

  useEffect(() => {
    const fetchSongs = async () => {
      if (!API_BASE_URL) {
        return;
      }
  
      try {
        const url = `${API_BASE_URL}/api/songs`;
  
        const response = await fetch(url);
        
        if (!response.ok) {
          return;
        }
  
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text();
          return;
        }
  
        const data = await response.json();
        const filteredSongs = data.filter(song => song.toLowerCase().endsWith(".mp3"));
  
        setSongs(filteredSongs);
  
        if (!currentSong && filteredSongs.length > 0) {
          const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
          setCurrentSong(randomSong);
          localStorage.setItem("lastSong", randomSong);
        }
      } catch (error) {
      }
    };
  
    fetchSongs();
  }, []);


  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
  
    audioRef.current.src = currentSong;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(error => {
        setIsPlaying(false);
      });
  }, [currentSong]);

  
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);
  }, [volume]);

  const fetchAlbumArt = async () => {
    if (!currentSong || !API_BASE_URL) return;
  
    const fileName = encodeURIComponent(currentSong.split("/").pop().trim());
    const cleanAPIUrl = `${API_BASE_URL}/api/song-image`;
  
    try {
  
      const response = await fetch(`${cleanAPIUrl}?file=${fileName}`);
      
      if (!response.ok) {
        setSongImage("/images/default-cover.jpg");
        return;
      }
  
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setSongImage(imageUrl);
  
    } catch (error) {
      setSongImage("/images/default-cover.jpg");
    }
  };
  

  useEffect(() => {
    fetchAlbumArt();
  }, [currentSong]);
  

  useEffect(() => {
    if (!audioRef.current) return;

    const updateProgress = () => {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 1);
    };

    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  

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
  
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => console.warn("Playback error"));
    }
  };

  const handleSongEnd = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  };

  const getFilteredSongTitle = () => {
    if (!currentSong) return "";
    
    const songFilename = currentSong.split("/").pop();
  
    return songFilename
      .replace(/\[SPOTDOWNLOADER\.COM\]/g, "")
      .replace(".mp3", "")
      .replace(/_/g, " ") 
      .trim();
  };

  const resetTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMinimized(true);
    }, 5000); 
  };
  
  useEffect(() => {
    const handleInteraction = (event) => {
      if (event.target.closest(".music-player")) {
        setIsMinimized(false);
        resetTimer();
      }
    };
  
    document.addEventListener("click", handleInteraction);
    resetTimer();
  
    return () => {
      document.removeEventListener("click", handleInteraction);
      clearTimeout(timeoutRef.current);
    };
  }, [isMinimized]);

  // useEffect(() => {
  //   const preventOutOfBoundsScroll = () => {
  //     const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  //     if (window.scrollY < 0) {
  //       window.scrollTo({ top: 0, behavior: "smooth" });
  //     } else if (window.scrollY > maxScroll) {
  //       window.scrollTo({ top: maxScroll, behavior: "smooth" });
  //     }
  //   };
  
  //   window.addEventListener("scroll", preventOutOfBoundsScroll);
  
  //   return () => {
  //     window.removeEventListener("scroll", preventOutOfBoundsScroll);
  //   };
  // }, []);
  

  return (
    <>
      <BackgroundRenderer />
      <Analytics />
  
      <div
      
        className={`music-player ${isMinimized ? "minimized" : ""}`}
        onClick={() => setIsMinimized(false)}
      >
        {!isMinimized ? (
          <>
            <img src={songImage} alt="Song Cover" className="album-cover" />
  
            <div className="progress-bar-container">
              <progress className="progress-bar" value={currentTime} max={duration} />
            </div>
  
            <div className="music-info">
              <span>{getFilteredSongTitle()}</span>
            </div>
  
            <div className="controls">
              <button onClick={playPrevious}>
                <SkipBack size={20} />
              </button>
              <button onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={playNext}>
                <SkipForward size={20} />
              </button>
              <button
                className={`repeat-btn ${repeat ? "repeat-active" : ""}`}
                onClick={() => setRepeat(!repeat)}
              >
                <Repeat size={20} />
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
          </>
        ) : (
          <div className="mini-player">
            <Music size={24} />
          </div>
        )}
      </div>
  
      <audio ref={audioRef} src={currentSong} onEnded={handleSongEnd} autoPlay />
  
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/discussions" element={<Discussions />} />
      </Routes>
    </>
  );
}

export default App;
