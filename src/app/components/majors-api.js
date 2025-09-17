export default async function handleMajorMinorSearch(input) {
  input = input.trim().toLowerCase();
  if (!input) {
    return [];
  }
  
  const result = await fetch(`/api/fetch-majors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!result.ok) {
    console.error("Failed to fetch majors list");
    return [];
  }

  const majors = await result.json();
  return majors.filter(major => major.toLowerCase().includes(input));
}
