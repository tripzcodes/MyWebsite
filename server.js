require("dotenv").config();  // ✅ 1) Load .env at the top
const express = require("express");
const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
const PORT = 3001;

// ✅ 2) Debug log your env variables
console.log("S3_BUCKET:", process.env.S3_BUCKET);
console.log("SONGS_FOLDER:", process.env.SONGS_FOLDER);

// ✅ 3) If S3_BUCKET is missing, throw an error to help debug
if (!process.env.S3_BUCKET) {
  console.error("❌ S3_BUCKET not defined in .env!");
  process.exit(1);
}

// ✅ 4) Allow React frontend to access backend
app.use(cors({ origin: "http://localhost:3000" }));

// ✅ 5) Load AWS credentials from .env
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// ✅ 6) API to fetch all songs dynamically
app.get("/api/songs", async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Prefix: process.env.SONGS_FOLDER,
    };

    const data = await s3.listObjectsV2(params).promise();

    // Build array of full S3 URLs that end with .mp3
    const songUrls = data.Contents.map(file =>
      `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`
    ).filter(url => url.endsWith(".mp3"));

    res.json(songUrls);
  } catch (error) {
    console.error("❌ Error fetching songs:", error);
    res.status(500).json({ error: "Failed to retrieve songs" });
  }
});

// ✅ 7) API to fetch the song's cover image from S3
app.get("/api/song-image", async (req, res) => {
  try {
    if (!req.query.file) {
      return res.status(400).json({ error: "Missing file parameter" });
    }

    const fileName = req.query.file;
    // Add the "songs/" prefix if your S3 objects live there
    const fullKey = `${process.env.SONGS_FOLDER}${fileName}`;

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: fullKey,
    };

    // Download the file from S3
    const s3Object = await s3.getObject(params).promise();

    // Parse the embedded metadata
    const metadata = await mm.parseBuffer(s3Object.Body);

    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      res.setHeader("Content-Type", picture.format);
      return res.send(Buffer.from(picture.data));
    } else {
      return res.status(404).json({ error: "No embedded cover found" });
    }
  } catch (error) {
    console.error("❌ Error fetching song image:", error);
    res.status(500).json({ error: "Error fetching song image" });
  }
});

// ✅ 8) Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
