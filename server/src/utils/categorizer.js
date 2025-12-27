// src/utils/categorizer.js
import stringSimilarity from "string-similarity";

/**
 * Simple keyword-based auto-categorizer.
 * - Has a curated map of category => keywords.
 * - For a merchant/name + note, compute best matching category.
 * - Returns category string and confidence (0-1).
 *
 * This is intentionally simple and editable — extend keywords as needed.
 */

const CATEGORY_KEYWORDS = {
  "Groceries": ["grocery","supermarket","walmart","grocery store","big basket","dmart","almagro"],
  "Dining": ["restaurant","cafe","starbucks","dominos","pizza","zomato","swiggy","mcdonald"],
  "Transport": ["uber","ola","taxi","metro","bus","fuel","petrol","diesel","parking"],
  "Bills": ["electricity","water bill","gas bill","utility","internet","broadband","phone bill"],
  "Subscription": ["netflix","spotify","hulu","prime","amazon prime","membership","subscription","spotify"],
  "Shopping": ["flipkart","amazon","mall","shopping","clothes","zara","h&m","ajio"],
  "Healthcare": ["hospital","clinic","pharmacy","doctor","medicines","apollo","clinic"],
  "Salary": ["salary","payroll","ctc","salary credit","employer"],
  "Investment": ["mutual fund","sip","brokerage","investment","mf"],
  "Entertainment": ["movie","concert","theatre","show","event"],
  "Education": ["college","school","tuition","course","udemy","coursera","education"],
  "Rent": ["rent","landlord","apartment rent","house rent"]
};

/**
 * Flatten each category to a long string for similarity checks
 */
const categoryCorpus = Object.entries(CATEGORY_KEYWORDS).map(([cat, keys]) => ({
  category: cat,
  text: keys.join(" ")
}));

/**
 * Attempts to categorize a transaction using merchant + note.
 * Returns: { category, confidence } where confidence 0..1.
 */
export function categorizeTransaction({ merchant = "", note = "" }) {
  const source = `${merchant} ${note}`.toLowerCase().trim();
  if (!source) return { category: "Uncategorized", confidence: 0 };

  // Compare source against category corpora using string-similarity
  let best = { category: "Uncategorized", score: 0 };
  for (const c of categoryCorpus) {
    const score = stringSimilarity.compareTwoStrings(source, c.text);
    if (score > best.score) {
      best = { category: c.category, score };
    }
  }

  // If best score is low, still return Uncategorized
  const threshold = 0.12; // small but avoids random matches; adjust over time
  if (best.score < threshold) return { category: "Uncategorized", confidence: best.score };
  return { category: best.category, confidence: best.score };
}
