import axios from "axios";

// Let's test a list of well-known public reels from public accounts
const candidates = [
  "DU1E_VVDIYm",
  "C74WJg4S8hB",
  "C8H9l0_Sp7A",
  "C-3U_r_L8m5",
  "C_Jg-k_p4X2",
  "C_J0VvKpH7N",
  "C49G6v_y1mK",
  "C2W_5pLy8Nx",
  "C6p9y1rT8N2",
  "DEK1n8qS9W1",
  "DF3m_1rOP2Q",
  "DF7s_3tL1N0",
  "DU2X0r8D4Ym",
  "DU0A_1bC2De",
  "DU1A_1aB2Cc",
  "DU3B_2cD3Ef"
];

// Let's also check direct HTML page parsing with crawler UA
async function checkDirect(sc: string) {
  try {
    const embedRes = await axios.get(`https://www.instagram.com/reel/${sc}/embed/captioned/`, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 facebookexternalhit/1.1" 
      },
      timeout: 8000
    });
    if (embedRes.data.includes(".mp4")) {
      console.log(`FOUND IN EMBED: ${sc}`);
      return true;
    }
    const pageRes = await axios.get(`https://www.instagram.com/reel/${sc}/`, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1",
        "Accept": "text/html"
      },
      timeout: 8000
    });
    if (pageRes.data.includes("og:video") || pageRes.data.includes(".mp4")) {
      console.log(`FOUND IN PAGE: ${sc}`);
      return true;
    }
  } catch (e: any) {
    // console.log(`${sc}: ${e.message}`);
  }
  return false;
}

async function run() {
  for (const sc of candidates) {
    await checkDirect(sc);
  }
}
run();
