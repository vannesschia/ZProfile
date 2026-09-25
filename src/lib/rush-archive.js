const ARCHIVE_KEY = "classes";

function htmlToText(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Snapshots the current rush directory (rushees, comments, notes) into the
// archive under `className`, in the same shape as the "Export data" button.
// Returns { key } on success (key is null if there were no rushees), or { error }.
export async function archiveRushClass(supabase, className) {
  const { data: rushees, error: rusheesError } = await supabase
    .from("rushees")
    .select("*");
  if (rusheesError) return { error: rusheesError };
  if (!rushees?.length) return { key: null };

  const [commentsResult, notesResult, archiveResult] = await Promise.all([
    supabase
      .from("rushee_comments_private")
      .select("id, rushee_id, author_uniqname, author_name, body, created_at, deleted_at")
      .order("created_at", { ascending: false }),
    supabase.from("rushee_notes").select("rushee_id, body"),
    supabase.from("archive_store").select("value").eq("key", ARCHIVE_KEY).maybeSingle(),
  ]);
  const error = commentsResult.error || notesResult.error || archiveResult.error;
  if (error) return { error };

  const snapshot = rushees.map((rushee) => ({
    ...rushee,
    comments: commentsResult.data
      .filter((c) => c.rushee_id === rushee.id && !c.deleted_at)
      .map(({ id, author_uniqname, author_name, body, created_at }) => ({
        id,
        author_uniqname,
        author_name,
        body: htmlToText(body),
        created_at,
      })),
    note: notesResult.data.find((n) => n.rushee_id === rushee.id)?.body ?? "",
  }));

  const classes = archiveResult.data?.value && typeof archiveResult.data.value === "object"
    ? archiveResult.data.value
    : {};

  // Never overwrite an existing archived class.
  let key = className;
  for (let n = 2; key in classes; ++n) key = `${className} (${n})`;

  const { error: saveError } = await supabase
    .from("archive_store")
    .upsert({ key: ARCHIVE_KEY, value: { ...classes, [key]: snapshot } }, { onConflict: "key" });
  if (saveError) return { error: saveError };

  return { key };
}
