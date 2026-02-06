"use server";

const { createHash } = await import('node:crypto');
import { getServerClient } from "@/lib/supabaseServer";

export async function getRusheeComments(rushees, uniqname, isAdmin) {
  const supabase = await getServerClient();

  if (isAdmin) {
    let { data: comments, error } = await supabase
      .from("rushee_comments_private")
      .select("id, rushee_id, author_uniqname, author_name, body, created_at, deleted_at, is_anonymous")
      .order("created_at", { ascending: false });

    // Fallback if is_anonymous not yet in view (run migration to add it)
    if (error && (error.message?.includes("is_anonymous") || error.code === "42703")) {
      const fallback = await supabase
        .from("rushee_comments_private")
        .select("id, rushee_id, author_uniqname, author_name, body, created_at, deleted_at")
        .order("created_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      comments = fallback.data;
    } else if (error) {
      throw error;
    }

    return (comments ?? []).map(c => ({
      ...c,
      isMine: c.author_uniqname === uniqname,
      is_anonymous: c.is_anonymous ?? false,
    }));
  } else {
    const hashes = rushees.map(rushee => {
      return "brother-" + createHash('sha256')
        .update(`${rushee.id}|${uniqname}`)
        .digest('hex')
        .substring(0, 6);
    });

    const { data: comments, error } = await supabase
      .from("rushee_comments_public")
      .select("id, rushee_id, body, created_at, anon_handle")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return comments.map(c => ({
      ...c,
      isMine: hashes.includes(c.anon_handle),
    }));
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