import AWS from "aws-sdk";
import mm from "music-metadata";

export default async function handler(req, res) {
  if (!req.query.file) {
    return res.status(400).json({ error: "Missing file parameter" });
  }

  try {
    const s3 = new AWS.S3();
    const fullKey = `${process.env.SONGS_FOLDER}${req.query.file}`;
    const s3Object = await s3.getObject({
      Bucket: process.env.S3_BUCKET,
      Key: fullKey
    }).promise();

    const metadata = await mm.parseBuffer(s3Object.Body);
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      res.setHeader("Content-Type", pic.format);
      return res.send(Buffer.from(pic.data));
    } else {
      return res.status(404).json({ error: "No embedded cover found" });
    }
  } catch (error) {
    console.error("❌ Error fetching song image:", error);
    res.status(500).json({ error: "Error fetching song image " });
  }
}