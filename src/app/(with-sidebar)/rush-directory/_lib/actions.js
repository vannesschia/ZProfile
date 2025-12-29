"use server";

import { getServerClient } from "@/lib/supabaseServer";

export async function sendRusheeComment(commentData) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_comments")
    .insert({ ...commentData });

  if (error) throw error;
}

export async function updateRusheeNotes(rushee_id, body) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_notes")
    .update({ rushee_id, body })
    .eq("rushee_id", rushee_id);

  if (error) throw error;
}