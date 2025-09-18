import { getBrowserClient } from "@/lib/supbaseClient";

export default async function handleMajorMinorSearch(input) {
  input = input.trim();
  if (!input) {
    return [];
  }
  
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('majors_minors')
    .select('program_name')
    .ilike('program_name', `%${input}%`)
    .limit(50);

  if (error) {
    console.error("Failed to fetch majors list:", error.message);
    return [];
  }

  return data.map(m => m.program_name);
}
