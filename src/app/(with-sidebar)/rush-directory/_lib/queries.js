"use server";

import { getServerClient } from "@/lib/supabaseServer";

export async function getRusheeComments(isAdmin) {
  const supabase = await getServerClient();

  if (isAdmin) {
    const { data: comments, error } = await supabase
      .from("rushee_comments_private")
      .select("id, rushee_id, author_name, body, created_at, deleted_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return comments;
  } else {
    const { data: comments, error } = await supabase
      .from("rushee_comments_public")
      .select("id, rushee_id, body, created_at, anon_handle")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return comments;
  }
}

export async function getRusheeNotes() {
  const supabase = await getServerClient();

  const { data: notes, error } = await supabase
    .from("rushee_notes")
    .select("rushee_id, body")

  if (error) throw error;

  return notes;
}