// src/services/mfService.js
import axios from "axios";

const MFAPI_BASE = "https://api.mfapi.in/mf";

/**
 * Fetch full MF list (contains name + schemeCode)
 */
export async function fetchFundList() {
  const res = await axios.get(MFAPI_BASE);
  return res.data; // array of { schemeCode, schemeName }
}

/**
 * Fetch NAV history of a fund using schemeCode
 */
export async function fetchFundHistory(schemeCode) {
  const res = await axios.get(`${MFAPI_BASE}/${schemeCode}`);
  return res.data; // includes: data: [ { date, nav }, ... ]
}
