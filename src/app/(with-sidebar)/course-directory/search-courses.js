'use server'

import { getServerClient } from "@/lib/supabaseServer";

export default async function searchCourses(query) {
  const supabase = await getServerClient();

  query = query.trim().toUpperCase().replace(/\s+/g, ' ');
  const [subjectCode = "", catalogNumber = ""] = query.split(' ', 2);
  if (subjectCode == "" && catalogNumber == "") {
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select(`
      subject_code,
      catalog_number,
      brother_classes (
        term_code,
        status,
        members (
          name
        )
      )
    `)
    .ilike('subject_code', `${subjectCode}%`)
    .ilike('catalog_number', `${catalogNumber}%`);

  if (error) {
    console.error("Supabase query error:", error.message);
    return [];
  }

  return data.map(({ subject_code, catalog_number, brother_classes }) => ({
    subject_code,
    catalog_number,
    students: brother_classes.map(({ status, term_code, members }) => ({
      status,
      term_code,
      name: members.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  }))
  .sort((a, b) => {
    if (a.subject_code !== b.subject_code) {
      return a.subject_code.localeCompare(b.subject_code);
    }
    return a.catalog_number.localeCompare(b.catalog_number);
  })
}