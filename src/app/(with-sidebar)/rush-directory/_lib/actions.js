"use server";

import { getServerClient } from "@/lib/supabaseServer";

export default async function SendRusheeComment(commentData) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("rushee_comments")
    .insert({ ...commentData });

  if (error) throw error;
}