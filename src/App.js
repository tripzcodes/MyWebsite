import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import About from "./About/About.js";
import BackgroundRenderer from "./BackgroundRenderer.js";
import Projects from "./projects/Projects.js";
import Discussions from "./discussions/Discussions.js";

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

  const audioRef = useRef(null);

  useEffect(() => {
    document.body.style.backgroundColor = location.pathname === "/about" ? "#0d0d0d" : "#000";
  }, [location.pathname]);

  const API_BASE_URL = "https://websitebackend-production-d425.up.railway.app";

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/songs`);
        const data = await response.json();
    
        const filteredSongs = data.filter(song => song.toLowerCase().endsWith(".mp3"));
        setSongs(filteredSongs);
  
        if (!currentSong && filteredSongs.length > 0) {
          const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
          setCurrentSong(randomSong);
          localStorage.setItem("lastSong", randomSong);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };
  
    fetchSongs();
  }, []);


  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentSong]);

  
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);
  }, [volume]);

  const fetchAlbumArt = async () => {
    if (!currentSong) return;
  
    const fileName = currentSong.split("/").pop();
    console.log(`🎵 Fetching album art for: ${fileName}`);
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/song-image?file=${encodeURIComponent(fileName)}`);
      console.log(`📡 Request sent: ${API_BASE_URL}/api/song-image?file=${encodeURIComponent(fileName)}`);
    
      const blob = await response.blob();
  
      const imageUrl = URL.createObjectURL(blob);
      console.log(`🔗 Generated Image URL: ${imageUrl}`);
  
      setSongImage(imageUrl);
  
      const img = new Image();
      img.src = imageUrl;
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
        .catch(() => console.warn("❌ Playback error"));
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

  return (
    <>
      <BackgroundRenderer />
      <div className="music-player">
        <img src={songImage} alt="Song Cover" className="album-cover" />

        <div className="progress-bar-container">
          <progress className="progress-bar" value={currentTime} max={duration} />
        </div>

        <div className="music-info">
          <span>{getFilteredSongTitle()}</span>
        </div>

        <div className="controls">
          <button onClick={playPrevious}>⏮</button>
          <button onClick={togglePlay}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={playNext}>⏭</button>
          <button className={`repeat-btn ${repeat ? "repeat-active" : "repeat-inactive"}`} onClick={() => setRepeat(!repeat)}>
            Repeat
          </button>
        </div>

        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="volume-slider" />
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
