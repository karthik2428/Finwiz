import axios from "axios";

const MFAPI_BASE = "https://api.mfapi.in/mf";

/**
 * Fetch all mutual funds
 */
export async function fetchFundList() {
  const res = await axios.get(MFAPI_BASE);
  return res.data;
}

/**
 * Fetch NAV history for a specific scheme
 */
export async function fetchFundHistory(schemeCode) {
  const res = await axios.get(`${MFAPI_BASE}/${schemeCode}`);
  return res.data;
}