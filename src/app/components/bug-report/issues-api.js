export default async function handleIssuePost(title, description) {
  const result = await fetch("/api/post-issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description })
  });

  if (!result.ok) {
    console.error("Failed to post");
    return false;
  } else {
    console.log("Successfully posted issue")
    return true;
  }
}