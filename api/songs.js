import AWS from "aws-sdk";
import mm from "music-metadata";

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// This function is triggered when /api/songs is requested
export default async function handler(req, res) {
  try {
    const s3 = new AWS.S3();
    const data = await s3.listObjectsV2({
      Bucket: process.env.S3_BUCKET,
      Prefix: process.env.SONGS_FOLDER,
    }).promise();

    const songUrls = data.Contents
      .map(file => `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`)
      .filter(url => url.endsWith(".mp3"));

    res.status(200).json(songUrls);
  } catch (error) {
    console.error("❌ Error fetching songs:", error);
    res.status(500).json({ error: "Failed to retrieve songs" });
  }
}
