import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import About from "./About/About.js";
import BackgroundRenderer from "./BackgroundRenderer.js";
import Projects from "./projects/Projects.js";

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
    document.body.style.background = "transparent"; // ✅ Keeps WebGL visible

    if (location.state?.skipIntro || sessionStorage.getItem("skipIntro") === "true") {
      setShowButtons(true);
      return;
    }

    sessionStorage.setItem("skipIntro", "true"); // ✅ Save state across pages

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

  // ✅ Update Background Color When Changing Pages
  useEffect(() => {
    document.body.style.backgroundColor = location.pathname === "/about" ? "#0d0d0d" : "#000";
  }, [location.pathname]);

  const API_BASE_URL = "https://websitebackend-production-ddda.up.railway.app";

  // ✅ Fetch Song List Once
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
      audioRef.current
        .play()
        .then(() => {
          console.log("✅ Autoplay started successfully");
          setIsPlaying(true); // ✅ Update UI only if it actually plays
        })
        .catch(err => {
          console.warn("❌ Autoplay blocked by browser:", err);
          setIsPlaying(false); // ✅ Show Play button if autoplay is blocked
        });
    }
  }, [currentSong]);

  

  // ✅ Sync Volume with Local Storage & Audio Element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    localStorage.setItem("volume", volume);
  }, [volume]);

  // ✅ Fetch Album Art for Current Song
  const fetchAlbumArt = async () => {
    if (!currentSong) return;
  
    const fileName = currentSong.split("/").pop();
    console.log(`🎵 Fetching album art for: ${fileName}`);
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/song-image?file=${encodeURIComponent(fileName)}`);
      console.log(`📡 Request sent: ${API_BASE_URL}/api/song-image?file=${encodeURIComponent(fileName)}`);
  
      if (!response.ok) throw new Error("❌ No image found");
  
      const blob = await response.blob();
      console.log(`✅ Image received! Size: ${blob.size} bytes`);
  
      const imageUrl = URL.createObjectURL(blob);
      console.log(`🔗 Generated Image URL: ${imageUrl}`);
  
      setSongImage(imageUrl);
  
      // ⏩ Test if the image is loading
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => console.log("✅ Image loaded successfully");
      img.onerror = () => console.error("❌ Error loading image");
    } catch (error) {
      console.error("❌ Error fetching album art:", error);
      setSongImage("/images/default-cover.jpg");
    }
  };

  useEffect(() => {
    console.log("🔄 Song changed, attempting to fetch album art...");
    fetchAlbumArt();
  }, [currentSong]); // ✅ Runs every time `currentSong` updates
  

  // ✅ Real-time Progress Bar Update
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
        .then(() => setIsPlaying(true)) // ✅ Only update if play is successful
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

  // ✅ Improved Song Title Formatting
  const getFilteredSongTitle = () => {
    if (!currentSong) return "";
    
    // ✅ Extract only the filename
    const songFilename = currentSong.split("/").pop();
  
    // ✅ Clean up the name (remove S3 URL and unnecessary text)
    return songFilename
      .replace(/\[SPOTDOWNLOADER\.COM\]/g, "") // Remove tag
      .replace(".mp3", "") // Remove file extension
      .replace(/_/g, " ") // Replace underscores with spaces (if any)
      .trim(); // Remove any leading/trailing spaces
  };

  return (
    <>
      {/* 🔥 Add Background WebGL Renderer */}
      <BackgroundRenderer />
      {/* 🔥 Persistent Music Player */}
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

      {/* 🔥 Page Routing */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} /> {/* ✅ Added Projects Route */}
      </Routes>
    </>
  );
}

export default App;
