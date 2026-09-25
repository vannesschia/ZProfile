"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabaseServer";
import { ensureClassExists, getNextClass, setCurrentClass } from "@/lib/greek-classes";
import { archiveRushClass } from "@/lib/rush-archive";

// Archives the rush directory under the next class letter, promotes active
// rushees to pledges in that class, then advances the current class.
export async function importRushClass() {
  const supabase = await getServerClient();

  const { next, error: nextError } = await getNextClass(supabase);
  if (nextError) {
    console.error("Failed to determine next class.", nextError);
    return nextError.message;
  }

  const classError = await ensureClassExists(supabase, next);
  if (classError) {
    console.error("Failed to add class to class_order.", classError);
    return classError.message;
  }

  // Archive before promoting so the snapshot reflects the rush as it ended.
  const { error: archiveError } = await archiveRushClass(supabase, next);
  if (archiveError) {
    console.error("Failed to archive rush class.", archiveError);
    return archiveError.message;
  }

  const { error } = await supabase.rpc("promote_rushees_to_pledges", { next_class: next });
  if (error) return error.message;

  const updateError = await setCurrentClass(supabase, next);
  if (updateError) return updateError.message;

  revalidatePath("/rush-directory");
  revalidatePath("/archive");
}
