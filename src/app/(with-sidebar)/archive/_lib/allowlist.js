/**
 * Hardcoded allowlist for Archive access.
 * Only these uniqnames can see the Archive link and access /archive.
 * Admins and dev team do NOT get access unless listed here.
 */
export const ARCHIVE_ALLOWED_UNIQNAMES = [
  "nairanan",
  "zgammo",
  "amoomaw",
  "georgu"
  // Add more uniqnames as needed
];

export function canAccessArchive(uniqname) {
  if (!uniqname || typeof uniqname !== "string") return false;
  return ARCHIVE_ALLOWED_UNIQNAMES.includes(uniqname.trim().toLowerCase());
}
