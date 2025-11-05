import { getBrowserClient } from "@/lib/supbaseClient";

export async function getCommitteeEventsBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('get_committee_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getCoffeeChatsBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data: cc, error: cErr } = await supabase
    .from('coffee_chats')
    .select(`
      *,
      brother_name:brother (
        name
      )
    `)
    .eq('pledge', uniqname);
  if (cErr) throw cErr;
  return cc
}

export async function getStudyTablesBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      events (
        id,
        name,
        event_type,
        event_date
      )
    `)
    .eq('uniqname', uniqname);
  if (error) throw error;

  const events = data
  .map(({ events }) => events)
  .filter(
    e => e.event_type === 'study_table'
  );
  return events;
}

export async function getOtherEventsBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('get_other_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getPledgeEventsBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .rpc('get_mandatory_attendance', { z_uniqname: uniqname, z_event_type: 'pledge_event' });
  if (error) throw error;

  console.log('Pledge Events:', data);
  return data;
}

export async function getChapterAttendanceBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .rpc('get_mandatory_attendance', { z_uniqname: uniqname, z_event_type: 'chapter' });
  if (error) throw error;

  console.log('Pledge Events:', data);
  return data;
}