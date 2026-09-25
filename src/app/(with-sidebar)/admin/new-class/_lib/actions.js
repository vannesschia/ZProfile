"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabaseServer";
import { ensureClassExists, getNextClass, setCurrentClass } from "@/lib/greek-classes";
import { archiveRushClass } from "@/lib/rush-archive";
import { clearRushDirectory } from "@/lib/rush-directory";

// Archives the rush directory under the next class letter, promotes active
// rushees to pledges in that class, advances the current class, then clears
// the rush directory. Each step only runs if the previous one succeeded, so
// the directory is never cleared without an archived copy.
export async function importRushClass() {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("uniqname", user?.email?.split("@")[0])
    .single();
  if (member?.admin !== true) return "Only admins can import a new class.";

  const { next, current, error: nextError } = await getNextClass(supabase);
  if (nextError) {
    console.error("Failed to determine next class.", nextError);
    return nextError.message;
  }

  const classError = await ensureClassExists(supabase, next, current);
  if (classError) {
    console.error("Failed to add class to class_order.", classError);
    return classError.message;
  }

  const { error: archiveError } = await archiveRushClass(supabase, next);
  if (archiveError) {
    console.error("Failed to archive rush class.", archiveError);
    return archiveError.message;
  }

  const { error } = await supabase.rpc("promote_rushees_to_pledges", { next_class: next });
  if (error) return error.message;

  const updateError = await setCurrentClass(supabase, next);
  if (updateError) return updateError.message;

  revalidatePath("/archive");
  revalidatePath("/rush-directory");

  const clearError = await clearRushDirectory(supabase);
  if (clearError) {
    console.error("Failed to clear rush directory.", clearError);
    return `The ${next} class was imported and archived, but the rush directory could not be cleared (${clearError.message}). Use "Delete rushees" to clear it.`;
  }
}
