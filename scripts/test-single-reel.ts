import axios from "axios";
import { DirectInstagramProvider } from "../services/instagram/providers/directProvider.js";

async function test() {
  const provider = new DirectInstagramProvider();
  const res = await provider.extract("https://www.instagram.com/reel/DU1E_VVDIYm/", "DU1E_VVDIYm");
  console.log("Extraction Result:", JSON.stringify(res, null, 2));
}

test();
