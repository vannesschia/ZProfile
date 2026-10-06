export function matchesMemberName(member, query) {
  const needle = String(query || "").toLowerCase();
  if (!needle) return true;
  return String(member?.name || "").toLowerCase().includes(needle);
}
