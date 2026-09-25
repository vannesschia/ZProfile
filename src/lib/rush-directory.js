// Deletes every rushee and their reactions, stars, comments, and notes.
// Returns an error if anything fails or rows are left behind (a delete blocked
// by row-level security removes nothing but does not report an error).
export async function clearRushDirectory(supabase) {
  const { data: rushees, error: fetchError } = await supabase
    .from("rushees")
    .select("id");
  if (fetchError) return fetchError;

  const rusheeIds = rushees.map((r) => r.id);
  if (rusheeIds.length === 0) return null;

  for (const table of ["rushee_reactions", "rushee_stars", "rushee_comments", "rushee_notes"]) {
    const { error } = await supabase.from(table).delete().in("rushee_id", rusheeIds);
    if (error) return error;
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("rushees")
    .delete()
    .in("id", rusheeIds)
    .select("id");
  if (deleteError) return deleteError;

  if (deleted.length !== rusheeIds.length) {
    return new Error(`Only deleted ${deleted.length} of ${rusheeIds.length} rushees.`);
  }
  return null;
}
