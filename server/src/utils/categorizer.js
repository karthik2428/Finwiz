// src/utils/categorizer.js
import stringSimilarity from "string-similarity";

/**
 * Improved auto-categorizer
 * - Adds strong rules for income vs expense
 * - Keeps similarity-based fallback
 * - Prevents invalid category assignments
 */

const CATEGORY_KEYWORDS = {
  Groceries: [
    "grocery",
    "supermarket",
    "walmart",
    "grocery store",
    "big basket",
    "dmart",
    "almagro"
  ],
  Dining: [
    "restaurant",
    "cafe",
    "starbucks",
    "dominos",
    "pizza",
    "zomato",
    "swiggy",
    "mcdonald"
  ],
  Transport: [
    "uber",
    "ola",
    "taxi",
    "metro",
    "bus",
    "fuel",
    "petrol",
    "diesel",
    "parking"
  ],
  Bills: [
    "electricity",
    "water bill",
    "gas bill",
    "utility",
    "internet",
    "broadband",
    "phone bill"
  ],
  Subscription: [
    "netflix",
    "spotify",
    "hulu",
    "prime",
    "amazon prime",
    "membership",
    "subscription"
  ],
  Shopping: [
    "flipkart",
    "amazon",
    "mall",
    "shopping",
    "clothes",
    "zara",
    "h&m",
    "ajio"
  ],
  Healthcare: [
    "hospital",
    "clinic",
    "pharmacy",
    "doctor",
    "medicines",
    "apollo"
  ],
  Salary: ["salary", "payroll", "ctc", "salary credit", "employer"],
  Investment: [
    "mutual fund",
    "sip",
    "brokerage",
    "investment",
    "mf",
    "interest",
    "dividend"
  ],
  Entertainment: [
    "movie",
    "concert",
    "theatre",
    "show",
    "event",
    "cinema"
  ],
  Education: [
    "college",
    "school",
    "tuition",
    "course",
    "udemy",
    "coursera"
  ],
  Rent: ["rent", "landlord", "apartment rent", "house rent"],
  Freelance: [
    "freelance",
    "client",
    "project",
    "gig",
    "payment received"
  ],
  Income: ["income", "credit", "received"]
};

/**
 * Flatten corpus
 */
const categoryCorpus = Object.entries(CATEGORY_KEYWORDS).map(
  ([cat, keys]) => ({
    category: cat,
    text: keys.join(" ")
  })
);

/**
 * Main categorizer
 */
export function categorizeTransaction({
  merchant = "",
  note = "",
  kind = ""
}) {
  const source = `${merchant} ${note}`.toLowerCase().trim();

  if (!source) {
    return { category: "Uncategorized", confidence: 0 };
  }

  /**
   * ===============================
   * 🔥 STEP 1: STRONG RULES (OVERRIDE)
   * ===============================
   */

  // ✅ INCOME RULES (CRITICAL FIX)
  if (kind === "income") {
    if (/salary|payroll|employer/i.test(source)) {
      return { category: "Salary", confidence: 1 };
    }

    if (/freelance|client|project|gig|payment received/i.test(source)) {
      return { category: "Freelance", confidence: 1 };
    }

    if (/interest|dividend|investment/i.test(source)) {
      return { category: "Investment", confidence: 1 };
    }

    // fallback income bucket
    return { category: "Income", confidence: 0.9 };
  }

  /**
   * ===============================
   * 🔥 STEP 2: SIMILARITY MATCH (EXPENSES)
   * ===============================
   */

  let best = { category: "Uncategorized", score: 0 };

  for (const c of categoryCorpus) {
    const score = stringSimilarity.compareTwoStrings(source, c.text);

    if (score > best.score) {
      best = { category: c.category, score };
    }
  }

  /**
   * ===============================
   * 🔥 STEP 3: THRESHOLD CHECK
   * ===============================
   */

  const threshold = 0.12;

  if (best.score < threshold) {
    return { category: "Uncategorized", confidence: best.score };
  }

  /**
   * ===============================
   * 🔥 STEP 4: SAFETY GUARDS
   * ===============================
   */

  // 🚫 Prevent invalid mappings
  if (
    kind === "expense" &&
    ["Salary", "Income", "Freelance"].includes(best.category)
  ) {
    return { category: "Uncategorized", confidence: best.score };
  }

  if (
    kind === "income" &&
    ["Entertainment", "Dining", "Groceries", "Bills"].includes(best.category)
  ) {
    return { category: "Income", confidence: best.score };
  }

  return { category: best.category, confidence: best.score };
}
