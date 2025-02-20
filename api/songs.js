const AWS = require("aws-sdk");

const S3_BUCKET = "tripz-songs";  // ✅ Change this to your actual bucket name
const REGION = "us-east-2";       // ✅ Change this to your AWS region
const SONGS_FOLDER = "songs/";    // ✅ Change if your songs are inside another folder

// Configure AWS SDK
AWS.config.update({ region: REGION });
const s3 = new AWS.S3();

// ✅ Vercel Serverless Function to Fetch Songs
module.exports = async (req, res) => {
    try {
        const params = {
            Bucket: S3_BUCKET,
            Prefix: SONGS_FOLDER, // Lists only files inside the "songs" folder
        };

        const data = await s3.listObjectsV2(params).promise();
        const songUrls = data.Contents.map(file => 
            `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${file.Key}`
        ).filter(url => url.endsWith(".mp3")); // Only return .mp3 files

        res.json(songUrls);
    } catch (error) {
        console.error("Error fetching songs:", error);
        res.status(500).json({ error: "Failed to retrieve songs" });
    }
};
