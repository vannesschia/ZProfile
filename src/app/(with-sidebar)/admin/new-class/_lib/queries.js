import { getNextClass, setCurrentClass } from "@/lib/greek-classes";

export async function getActiveRushees(supabase) {
  const { data, error } = await supabase
    .from("rushees")
    .select('*')
    .eq("cut_status", "active");
  if (error) console.error(error);
  return data;
}

export async function setRusheeToPledges(supabase) {
  const { next, error: nextError } = await getNextClass(supabase);
  if (nextError) {
    console.error("Failed to determine next class.", nextError);
    return nextError;
  }

  const { error } = await supabase.rpc('promote_rushees_to_pledges', { next_class: next });
  if (error) return error;

  return setCurrentClass(supabase, next);
}
