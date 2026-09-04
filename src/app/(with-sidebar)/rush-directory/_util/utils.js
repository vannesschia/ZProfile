import { ADJECTIVES, ANIMALS } from "./constants";

/**
 * Converts HTML (with entities like &nbsp;, tags like <p>) to readable plain text.
 */
export function htmlToReadableText(html) {
  if (html == null || typeof html !== "string") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.documentElement.textContent || "";
  return text
    .replace(/\u00A0/g, " ") // unescape &nbsp; (already decoded by parser, but ensure space)
    .replace(/\s+/g, " ")
    .trim();
}

export function getAnonymousName(anon_handle) {
  let hash = 0;
  for (let i = 0; i < anon_handle.length; i++) {
    hash = anon_handle.charCodeAt(i) + ((hash << 5) - hash);
  }

  const adjIndex = Math.abs(hash) % ADJECTIVES.length;
  const animalIndex = Math.abs(hash * 31) % ANIMALS.length;

  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`;
}

/* ------------------------------------------------------------------ *
 * Rushee headshot → person fuzzy matching
 *
 * Headshots often arrive named after the person rather than their
 * uniqname. Google Forms file uploads, for example, are named
 * "<original filename> - <Respondent Name>.<ext>" (e.g.
 * "IMG_1959 - Michael Vu.jpeg"). These helpers pull the person's name
 * out of a filename and score it against the roster so images can be
 * auto-matched to rushees, with a human confirming low-confidence ones.
 * ------------------------------------------------------------------ */

// Common non-name tokens that show up in camera/export filenames.
const JUNK_NAME_TOKENS = new Set([
  "headshot", "photo", "photos", "pic", "picture", "pics", "img", "image",
  "dsc", "dscf", "copy", "final", "edited", "edit", "portrait", "profile",
  "cropped", "crop", "white", "bg", "background", "id", "screenshot",
  "untitled", "new", "photoroom",
]);

function stripPathAndExt(filename) {
  const name = String(filename || "").trim();
  const lastSlash = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  const justName = lastSlash >= 0 ? name.slice(lastSlash + 1) : name;
  const lastDot = justName.lastIndexOf(".");
  return lastDot > 0 ? justName.slice(0, lastDot) : justName;
}

/**
 * Extract a person's name from a headshot filename.
 * Uses the "<original> - <Name>" convention (person name is the segment
 * after the LAST " - "); falls back to the whole basename otherwise.
 * Also flips "Last, First" -> "First Last".
 */
export function extractNameFromFilename(filename) {
  let base = stripPathAndExt(filename).trim();
  // Split on space-hyphen-space so hyphens inside UUIDs/names aren't touched.
  const parts = base.split(/\s+-\s+/);
  let candidate = (parts.length > 1 ? parts[parts.length - 1] : base).trim();
  if (candidate.includes(",")) {
    const [last, first] = candidate.split(",").map((s) => s.trim());
    if (first) candidate = `${first} ${last}`;
  }
  return candidate;
}

// Lowercase, de-accent, and split into alpha tokens (dropping numbers and,
// optionally, common camera/export junk words).
export function nameTokens(str, { dropJunk = false } = {}) {
  const s = String(str || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return [];
  return s
    .split(" ")
    .filter(Boolean)
    .filter((t) => !/^\d+$/.test(t))
    .filter((t) => !(dropJunk && JUNK_NAME_TOKENS.has(t)));
}

function bigramCounts(s) {
  const m = new Map();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
}

// Sørensen–Dice coefficient over character bigrams, in [0,1].
function diceCoefficient(a, b) {
  if (a === b) return a.length ? 1 : 0;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigramCounts(a);
  const B = bigramCounts(b);
  let overlap = 0;
  for (const [g, c] of A) {
    if (B.has(g)) overlap += Math.min(c, B.get(g));
  }
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

/**
 * Order-independent name similarity in [0,1]. Sorts tokens (so word order
 * doesn't matter), scores bigram similarity for typo tolerance, and takes
 * the max with a token-containment score (handles missing middle names or
 * first-name-only files).
 */
export function scoreNameMatch(nameA, nameB) {
  const a = nameTokens(nameA, { dropJunk: true }).sort();
  const b = nameTokens(nameB, { dropJunk: true }).sort();
  if (!a.length || !b.length) return 0;
  const dice = diceCoefficient(a.join(" "), b.join(" "));
  const setB = new Set(b);
  const contained = a.filter((t) => setB.has(t)).length;
  const containment = contained / Math.max(a.length, b.length);
  return Math.max(dice, containment);
}

/**
 * Match one headshot filename against a list of targets ({ uniqname, name }).
 * Returns { method, uniqname, score, confidence, candidates }.
 *  - method:     "exact" (filename == uniqname) | "fuzzy" | "none"
 *  - confidence: "high" (auto-accept) | "medium" (needs confirm) | "none"
 * A match is only "high" when it clears the threshold AND beats the
 * runner-up by a margin, so ambiguous names are never auto-assigned.
 */
export function matchImageToTargets(filename, targets, opts = {}) {
  const {
    highThreshold = 0.82,
    margin = 0.08,
    mediumThreshold = 0.5,
    maxCandidates = 5,
  } = opts;

  if (!Array.isArray(targets) || targets.length === 0) {
    return { method: "none", uniqname: null, score: 0, confidence: "none", candidates: [] };
  }

  // 1) Exact uniqname match (backwards compatible with uniqname-named files).
  const rawBase = stripPathAndExt(filename).trim().toLowerCase();
  const exact = targets.find((t) => String(t.uniqname).toLowerCase() === rawBase);
  if (exact) {
    return {
      method: "exact",
      uniqname: exact.uniqname,
      score: 1,
      confidence: "high",
      candidates: [{ uniqname: exact.uniqname, name: exact.name, score: 1 }],
    };
  }

  // 2) Fuzzy match on the extracted person name.
  const extracted = extractNameFromFilename(filename);
  const scored = targets
    .map((t) => ({ uniqname: t.uniqname, name: t.name || "", score: scoreNameMatch(extracted, t.name) }))
    .sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, maxCandidates);
  const best = scored[0];
  const second = scored[1];

  if (!best || best.score < mediumThreshold) {
    return { method: "none", uniqname: null, score: best?.score || 0, confidence: "none", candidates };
  }

  const clearWinner =
    best.score >= highThreshold && (!second || best.score - second.score >= margin);

  return {
    method: "fuzzy",
    uniqname: best.uniqname,
    score: best.score,
    confidence: clearWinner ? "high" : "medium",
    candidates,
  };
}