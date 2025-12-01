"use server";

import { getServerClient } from "@/lib/supabaseServer";

export async function getEventData(id) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      name,
      event_type,
      committee,
      event_date,
      event_attendance (
        uniqname,
        attendance_status
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to get initial data: ${error}`);
  }

  return data;
}
