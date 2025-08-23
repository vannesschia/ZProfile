'use server'

import { getServerClient } from "@/lib/supabaseServer";

export default async function searchCourses(query) {
  const supabase = await getServerClient();

  query = query.trim().toUpperCase().replace(/\s+/g, "");

  const { data, error } = await supabase
    .from('classes')
    .select(`
      class_name,
      brother_classes!inner (
        term_code,
        members!inner (
          name,
          role
        )
      )
    `)
    .ilike('class_name', `${query}%`)
    .filter('brother_classes.members.role', 'neq', 'alumni')

  if (error) {
    console.error("Supabase query error:", error.message);
    return [];
  }

  return data.map(({ class_name, brother_classes }) => {
    const students = brother_classes.map(({ status, term_code, members }) => ({
      status,
      term_code,
      name: members.name
    }))
    .sort((a, b) => {
      if (a.term_code !== b.term_code) {
        return a.term_code - b.term_code;
      }
      return a.name.localeCompare(b.name);
    })
    if (students.length === 0) return null;
    return {
      class_name,
      students
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.class_name.localeCompare(b.class_name));
}