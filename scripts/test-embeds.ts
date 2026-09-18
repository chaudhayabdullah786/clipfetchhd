import axios from "axios";

// Let's test a list of well-known public shortcodes from major creators/viral reels
const list = [
  "DU1E_VVDIYm", // already confirmed working!
  "C7xZ7N_v2_p",
  "C8_WqMvS_P2",
  "C-1Y3g0o-M5",
  "C80eS_bI1N3",
  "C-rM4d5y2rS",
  "C-mQ_Y1v4N_",
  "C5rT9_qP1L2",
  "C-aBcDeF123",
  "C_123456789",
  "DB1A2B3C4D5",
  "DC1A2B3C4D5",
  "DD1A2B3C4D5",
  "DE1A2B3C4D5"
];

async function testAll() {
  for (const sc of list) {
    try {
      const res = await axios.get(`https://www.instagram.com/reel/${sc}/embed/captioned/`, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: 7000,
        validateStatus: () => true
      });
      const html = typeof res.data === "string" ? res.data : "";
      const hasVideo = html.includes(".mp4") || html.includes("video_url");
      console.log(`[${res.status}] ${sc} -> video: ${hasVideo}, len: ${html.length}`);
    } catch (e: any) {
      console.log(`[ERR] ${sc} -> ${e.message}`);
    }
  }
}

testAll();
