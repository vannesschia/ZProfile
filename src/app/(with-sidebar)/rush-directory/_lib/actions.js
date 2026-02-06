"use server";

import { getServerClient } from "@/lib/supabaseServer";

export async function sendRusheeComment(commentData) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_comments")
    .insert({
      rushee_id: commentData.rushee_id,
      author_uniqname: commentData.author_uniqname,
      body: commentData.body,
      is_anonymous: commentData.is_anonymous ?? false,
    });

  if (error) throw error;
}

export async function deleteRusheeComment(id) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function updateRusheeNotes(rushee_id, body) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_notes")
    .upsert({ rushee_id, body }, { onConflict: "rushee_id" })

  if (error) throw error;
}

export async function updateRusheeLikelihood(id, likelihood) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushees")
    .update({ likelihood: likelihood })
    .eq("id", id);

  if (error) throw error;
}
