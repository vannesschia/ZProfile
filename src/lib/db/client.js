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
  const { data: chapterEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('event_type', 'pledge_event')
    .order('event_date', { ascending: true })

  if (eventsError) throw eventsError

  const { data: absences, error: absError } = await supabase
    .from('event_absences')
    .select('event_id, absence_type')
    .eq('uniqname', uniqname)

  if (absError) throw absError

  const absenceMap = new Map(
    absences.map(a => [a.event_id, a.absence_type])
  );

  return chapterEvents.map(evt => {
    const absenceType = absenceMap.get(evt.id) ?? null;
    return {
      ...evt,
      attendance: {
        is_absent:    absenceType !== null,
        absence_type: absenceType
      }
    };
  });
}

export async function getChapterAttendanceBrowser(uniqname) {
  const supabase = getBrowserClient();
  const { data: chapterEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('event_type', 'chapter')
    .order('event_date', { ascending: true })

  if (eventsError) throw eventsError

  const { data: absences, error: absError } = await supabase
    .from('event_absences')
    .select('event_id, absence_type')
    .eq('uniqname', uniqname)

  if (absError) throw absError

  const absenceMap = new Map(
    absences.map(a => [a.event_id, a.absence_type])
  );

  return chapterEvents.map(evt => {
    const absenceType = absenceMap.get(evt.id) ?? null;
    return {
      ...evt,
      attendance: {
        is_absent:    absenceType !== null,
        absence_type: absenceType
      }
    };
  });
}