import { parseInstagramUrl } from "../services/instagram/urlParser.js";
import { validateVideoUrl } from "../services/instagram/validators.js";

console.log("=== Running Instagram URL & Validation Test Suite ===");

const testUrls = [
  {
    input: "https://www.instagram.com/reel/DU1E_VVDIYm/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    expectedValid: true,
    expectedShortcode: "DU1E_VVDIYm",
    expectedNormalized: "https://www.instagram.com/reel/DU1E_VVDIYm/"
  },
  {
    input: "https://instagram.com/reel/DU1E_VVDIYm/",
    expectedValid: true,
    expectedShortcode: "DU1E_VVDIYm",
    expectedNormalized: "https://www.instagram.com/reel/DU1E_VVDIYm/"
  },
  {
    input: "https://www.instagram.com/p/DU1E_VVDIYm/",
    expectedValid: true,
    expectedShortcode: "DU1E_VVDIYm",
    expectedNormalized: "https://www.instagram.com/p/DU1E_VVDIYm/"
  },
  {
    input: "https://m.instagram.com/reel/DU1E_VVDIYm",
    expectedValid: true,
    expectedShortcode: "DU1E_VVDIYm",
    expectedNormalized: "https://www.instagram.com/reel/DU1E_VVDIYm/"
  },
  {
    input: "https://instagr.am/reel/DU1E_VVDIYm/",
    expectedValid: true,
    expectedShortcode: "DU1E_VVDIYm",
    expectedNormalized: "https://www.instagram.com/reel/DU1E_VVDIYm/"
  },
  {
    input: "https://www.w3schools.com/html/mov_bbb.mp4",
    expectedValid: false
  },
  {
    input: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    expectedValid: false
  },
  {
    input: "https://www.instagram.com/",
    expectedValid: false
  }
];

let allPassed = true;

for (const test of testUrls) {
  const parsed = parseInstagramUrl(test.input);
  const isValidMatch = parsed.valid === test.expectedValid;
  const isShortcodeMatch = !test.expectedShortcode || parsed.shortcode === test.expectedShortcode;
  const isNormalizedMatch = !test.expectedNormalized || parsed.normalizedUrl === test.expectedNormalized;

  if (isValidMatch && isShortcodeMatch && isNormalizedMatch) {
    console.log(`[PASS] ${test.input.slice(0, 60)} -> valid=${parsed.valid}`);
  } else {
    console.error(`[FAIL] ${test.input}`);
    console.error(`  Expected: valid=${test.expectedValid}, shortcode=${test.expectedShortcode}`);
    console.error(`  Got: valid=${parsed.valid}, shortcode=${parsed.shortcode}`);
    allPassed = false;
  }
}

console.log("\n=== Testing Prohibited Media Domain Rejections ===");
const videoTests = [
  { url: "https://www.w3schools.com/html/mov_bbb.mp4", expectedValid: false },
  { url: "https://picsum.photos/seed/reel/400/600", expectedValid: false },
  { url: "http://127.0.0.1/video.mp4", expectedValid: false },
  { url: "http://localhost:3000/internal", expectedValid: false },
  { url: "https://scontent-iad3-1.cdninstagram.com/o1/v/t16/f1/m84/video.mp4", expectedValid: true },
  { url: "https://video.fbcdn.net/v/t15/reel.mp4", expectedValid: true }
];

for (const test of videoTests) {
  const result = validateVideoUrl(test.url);
  if (result.valid === test.expectedValid) {
    console.log(`[PASS] ${test.url.slice(0, 60)} -> valid=${result.valid}`);
  } else {
    console.error(`[FAIL] ${test.url} -> expected=${test.expectedValid}, got=${result.valid}`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("\n❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("\n✅ All unit verification tests passed successfully!");
}
