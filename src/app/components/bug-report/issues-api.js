export default async function handleIssuePost(title, description, name) {
  const result = await fetch("/api/post-issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, name })
  });

  if (!result.ok) {
    console.error("Failed to post");
    return false;
  } else {
    return true;
  }
}