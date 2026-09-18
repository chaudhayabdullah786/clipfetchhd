import axios from "axios";

const candidates = [
  "DU1E_VVDIYm",
  "C-w-mRks6Yk",
  "DFh46w5yG4W",
  "C3z5g2uN6O_",
  "DDs6P-0uQ1v",
  "C8_WqMvS_P2",
  "C86G5z5y2N0",
  "C9K1n4sI1K9",
  "C7x5j9vQ1B3",
  "C6p9y1rT8N2",
  "C4v8w2qZ7M1",
  "DCL2j7xOD02"
];

async function check(sc: string) {
  try {
    const res = await axios.get(`https://www.instagram.com/reel/${sc}/embed/captioned/`, {
      headers: { "User-Agent": "facebookexternalhit/1.1" },
      timeout: 8000
    });
    const match = res.data.match(/video_url\\*":\s*\\*"([^"]+?\.mp4[^"\\]*)/);
    if (match) {
      console.log(`FOUND PUBLIC REEL: ${sc}`);
      return true;
    } else {
      console.log(`No video in embed for ${sc}`);
    }
  } catch (e: any) {
    console.log(`Error on ${sc}: ${e.message}`);
  }
  return false;
}

async function run() {
  for (const sc of candidates) {
    await check(sc);
  }
}
run();
