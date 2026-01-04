import { ADJECTIVES, ANIMALS } from "./constants";

export function getAnonymousName(anon_handle) {
  let hash = 0;
  for (let i = 0; i < anon_handle.length; i++) {
    hash = anon_handle.charCodeAt(i) + ((hash << 5) - hash);
  }

  const adjIndex = Math.abs(hash) % ADJECTIVES.length;
  const animalIndex = Math.abs(hash * 31) % ANIMALS.length;

  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`;
}