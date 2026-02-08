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