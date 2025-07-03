'use server'

import { getServerClient } from "@/lib/supabaseServer";

export default async function searchCourses(query) {
  const supabase = await getServerClient();

  query = query.trim().toUpperCase().replace(/\s+/g, ' ');
  const [subjectCode = "", catalogNumber = ""] = query.trim().split(' ', 2);
  if (subjectCode == "" || catalogNumber == "") {
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select(`
      brother_classes (
        term_code,
        status,
        members (
          name
        )
      )
    `)
    .eq('subject_code', subjectCode)
    .eq('catalog_number', catalogNumber);

  if (error) {
    console.error("Supabase query error:", error.message);
    return [];
  }

  return data.flatMap(item => item.brother_classes).map(i => {
    const { members, ...rest } = i;
    return {
      ...rest,
      name: members.name
    }
  });
}