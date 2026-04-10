export function classifyFund(name) {
  const n = name.toLowerCase();

  if (n.includes("liquid")) return "liquid";
  if (n.includes("ultra short")) return "ultra_short";
  if (n.includes("short term")) return "short_term";
  if (n.includes("corporate")) return "corporate_bond";

  if (n.includes("index") || n.includes("nifty") || n.includes("sensex"))
    return "index";

  if (n.includes("bluechip")) return "bluechip";

  if (n.includes("large") && n.includes("mid")) return "mid_cap";
  if (n.includes("large")) return "large_cap";

  if (n.includes("flexi")) return "flexi_cap";
  if (n.includes("multi")) return "multi_cap";

  if (n.includes("mid")) return "mid_cap";
  if (n.includes("small")) return "small_cap";

  if (n.includes("balanced") || n.includes("hybrid")) return "hybrid";

  return "other";
}