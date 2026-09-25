export async function getActiveRushees(supabase) {
  const { data, error } = await supabase
    .from("rushees")
    .select('*')
    .eq("cut_status", "active");
  if (error) console.error(error);
  return data;
}
