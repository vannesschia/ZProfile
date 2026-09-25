"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { ensureClassExists, getNextClass, setCurrentClass } from "@/lib/greek-classes";

export async function addNewClass(values) {
  const supabase = await getServerClient();

  const { next, error: nextError } = await getNextClass(supabase);
  if (nextError) {
    console.error("Failed to determine next class.", nextError);
    return nextError.message;
  }

  const classError = await ensureClassExists(supabase, next);
  if (classError) return classError.message;

  const { error: insertError } =
    await supabase
      .from("members")
      .insert(
        values.map(member => ({
          uniqname: member.uniqname,
          name: member.name,
          email_address: `${member.uniqname}@umich.edu`,
          current_class_number: next,
          role: "pledge",
          active: true,
          admin: false
        }))
      );

  if (insertError) return insertError.message;

  const updateError = await setCurrentClass(supabase, next);
  if (updateError) {
    console.error("Failed to update class letter.");
    return updateError.message;
  }
}
