import { getServerClient } from "@/lib/supabaseServer";
import { formatMonthDayNumeric } from "../utils";

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
  const events = data
    .map(({ events }) => ({
      ...events,
      committee: events.event_type === 'rush_event'
        ? 'rush_event'
        : events.committee
    }))
    .filter(e =>
      e.event_type !== 'pledge_event' && e.event_type !== 'study_table'
    );
  // console.log(events)
  return events;
}

export async function getAttendanceRequirements(uniqname) {
  const supabase = await getServerClient();

  const { data: member, error: mErr } = await supabase
    .from('members')
    .select('extra_committee_points')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (mErr) throw mErr;

  const { data: req, error: rErr } = await supabase
    .from('requirements')
    .select('brother_committee_pts_req')
    .eq('id', true)
    .maybeSingle();
  if (rErr) throw rErr;

  return req.brother_committee_pts_req + member.extra_committee_points;
}

export async function getPledgeProgress(uniqname) {
  const supabase = await getServerClient();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US');
  // console.log(formattedDate);

  const { data: req, error: rErr } = await supabase
    .from('requirements')
    .select(`
      first_milestone_cc,
      first_milestone_cp,
      second_milestone_cc,
      second_milestone_cp,
      final_milestone_cc,
      final_milestone_cp,
      first_milestone_due_date,
      second_milestone_due_date,
      final_milestone_due_date
    `)
    .eq('id', true)
    .maybeSingle();
  if (rErr) throw rErr;
  console.log(req)

  const { data: extra, error: eErr } = await supabase
    .from('pledge_info')
    .select('extra_coffee_chats')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (eErr) throw eErr;
  
  function getDaysLeft(date) {
    const dueDate = new Date(date);
    return Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
  }

  return {
    firstMilestone: {
      title: "Milestone #1",
      cc: req.first_milestone_cc + extra.extra_coffee_chats,
      cp: req.first_milestone_cp,
      dueDate: formatMonthDayNumeric(req.first_milestone_due_date),
      daysLeft: getDaysLeft(req.first_milestone_due_date)
    },
    secondMilestone: {
      title: "Milestone #2",
      cc: req.second_milestone_cc + extra.extra_coffee_chats,
      cp: req.second_milestone_cp,
      dueDate: formatMonthDayNumeric(req.second_milestone_due_date),
      daysLeft: getDaysLeft(req.second_milestone_due_date)
    },
    finalMilestone: {
      title: "Final Milestone",
      cc: req.final_milestone_cc + extra.extra_coffee_chats,
      cp: req.final_milestone_cp,
      dueDate: formatMonthDayNumeric(req.final_milestone_due_date),
      daysLeft: getDaysLeft(req.final_milestone_due_date)
    }
  }
  const dueDate = new Date(req.final_milestone_due_date);
  const daysLeft = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (today < new Date(req.first_milestone_due_date)) {
    return {
      cc: req.first_milestone_cc + extra.extra_coffee_chats,
      cp: req.first_milestone_cp,
      dueDate: formatMonthDayNumeric(req.first_milestone_due_date),
      daysLeft: daysLeft
    }
  } else if (today < new Date(req.second_milestone_due_date)) {
    return {
      cc: req.second_milestone_cc + extra.extra_coffee_chats,
      cp: req.second_milestone_cp,
      dueDate: formatMonthDayNumeric(req.second_milestone_due_date),
      days_left: daysLeft
    }
  } else {
    return {
      cc: req.final_milestone_cc + extra.extra_coffee_chats,
      cp: req.final_milestone_cp,
      dueDate: formatMonthDayNumeric(req.final_milestone_due_date),
      daysLeft: daysLeft
    }
  }
}

export async function getCoffeeChats(uniqname) {
  const supabase = await getServerClient();

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
  // console.log(cc)

  return cc
}

export async function getCoffeeChatsCount(uniqname) {
  const supabase = await getServerClient();

  const { count, error } = await supabase
    .from('coffee_chats')
    .select(`
      *,
      brother_name:brother (
        name
      )
    `, { count: 'exact', head: true })
    .eq('pledge', uniqname);
  if (error) throw error;
  console.log(count)
  return count
}

export async function getPledgeEvents(uniqname) {
  const supabase = await getServerClient();
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

export async function getStudyTables(uniqname) {
  const supabase = await getServerClient();
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