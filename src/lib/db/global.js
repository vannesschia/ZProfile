import { getServerClient } from "@/lib/supabaseServer";

export async function getCommitteeAndRushEvents(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      events (
        id,
        name,
        event_type,
        committee,
        event_date
      )
    `)
    .eq('uniqname', uniqname);
  if (error) throw error;
  const events = data.map(({ events }) => ({
    ...events,
    committee: events.event_type === 'rush_event'
      ? 'rush_event'
      : events.committee
  }));
  console.log(events)
  return events;
}

export async function getAttendanceRequirements(uniqname) {
  const supabase = await getServerClient();

  const { data: member, error: mErr } = await supabase
    .from('members')
    .select('role, total_committee_points')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (mErr) throw mErr;

  const col =
    member.role === 'pledge'  ? 'pledge_committee_pts_req'  :
    member.role === 'brother' ? 'brother_committee_pts_req' :
                                'senior_committee_pts_req';

  const { data: req, error: rErr } = await supabase
    .from('requirements')
    .select(col)
    .eq('id', true)
    .maybeSingle();
  if (rErr) throw rErr;

  return req[col] + member.total_committee_points;
}

export async function getCoffeeChatRequirements(uniqname) {
  const supabase = await getServerClient();

  const { data: member, error: mErr } = await supabase
    .from('pledge_info')
    .select('total_coffee_chats')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (mErr) throw mErr;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US');
  console.log(formattedDate);

  const { data: req, error: rErr } = await supabase
    .from('requirements')
    .select('pledge_committee_pts_req, ')
    .eq('id', true)
    .maybeSingle();
  if (rErr) throw rErr;

  return req[col] + member.total_committee_points;
}

export function tallyCategories(events) {
  return events.reduce((acc, e) => {
    const key = e.event_type === 'rush_event'
      ? 'rush_event'
      : e.committee;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function getBreakPoints() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      events (
        id,
        name,
        event_type,
        committee,
        event_date
      )
    `)
    .eq('uniqname', uniqname);
  if (error) throw error;
}

export async function getChapterAttendance(uniqname) {
  const supabase = await getServerClient();
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

export async function getAbsenceCounts(uniqname) {
  const supabase = await getServerClient();

  // Excused count
  const { count: excusedCount, error: eErr } = await supabase
    .from('event_absences')
    .select('*', { head: true, count: 'exact' })
    .eq('uniqname', uniqname)
    .eq('absence_type', 'excused');
  if (eErr) throw eErr;

  // Unexcused count
  const { count: unexcusedCount, error: uErr } = await supabase
    .from('event_absences')
    .select('*', { head: true, count: 'exact' })
    .eq('uniqname', uniqname)
    .eq('absence_type', 'unexcused');
  if (uErr) throw uErr;

  return {
    excused: excusedCount || 0,
    unexcused: unexcusedCount || 0,
  };
}

export async function getRushEvents(uniqname) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from('event_attendance')
    .select(`
      events!inner (
        id,
        name,
        event_type,
        committee,
        event_date
      )
    `)
    .eq('uniqname', uniqname)
    .eq('events.event_type', 'rush_event');

  if (error) throw error;

  return data.map(({ events }) => events);
}
