const express = require("express");
const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors()); // Allow React frontend to access backend
app.use(express.static("public"));

// ✅ API to fetch all song files
app.get("/api/songs", (req, res) => {
  const songsDir = path.join(__dirname, "public/songs");

  fs.readdir(songsDir, (err, files) => {
    if (err) {
      console.error("Error reading songs directory:", err);
      return res.status(500).json({ error: "Failed to read directory" });
    }

    const mp3Files = files.filter(file => file.endsWith(".mp3"));
    res.json(mp3Files);
  });
});

// ✅ API to fetch metadata (title, album, cover image)
app.get("/api/metadata", async (req, res) => {
  try {
    if (!req.query.file) {
      return res.status(400).json({ error: "Missing file parameter" });
    }

    const filePath = path.join(__dirname, "public/songs", req.query.file);

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const metadata = await mm.parseFile(filePath);
    let coverBase64 = null;

    if (metadata.common.picture && metadata.common.picture.length > 0) {
      coverBase64 = metadata.common.picture[0].data.toString("base64");
    }

    res.json({
      title: metadata.common.title || req.query.file.replace(".mp3", ""),
      album: metadata.common.album || "Unknown Album",
      cover: coverBase64,
    });
  } catch (error) {
    console.error("Error reading metadata:", error);
    res.status(500).json({ error: "Error reading metadata" });
  }
});

// ✅ API to fetch embedded image separately
app.get("/api/song-image", async (req, res) => {
  try {
    if (!req.query.file) {
      return res.status(400).json({ error: "Missing file parameter" });
    }

    const filePath = path.join(__dirname, "public/songs", req.query.file);

    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const metadata = await mm.parseFile(filePath);
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(metadata.common.picture[0].data);
    } else {
      return res.status(404).json({ error: "No embedded cover found" });
    }
  } catch (error) {
    console.error("Error fetching song image:", error);
    res.status(500).json({ error: "Error fetching song image" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
