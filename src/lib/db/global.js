import { getServerClient } from "@/lib/supabaseServer";
import { getBrowserClient } from "@/lib/supbaseClient";
import { formatMonthDayNumeric } from "../utils";

export async function getAttendancePointCount(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_attendance_points_count', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getCommitteePointCount(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_committee_points_count', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}


export async function getCommitteeEvents(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_committee_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getCommitteeEventsBrowser(uniqname) {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc('get_committee_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

/**
 * Fetches all committee and rush events attended by a user, excluding pledge events and study tables.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of event objects.
 */
// export async function getCommitteeAndRushEvents(uniqname) {
//   const supabase = await getServerClient();
//   const { data, error } = await supabase
//   .from('event_attendance')
//   .select(`
//     events (
//       id,
//       name,
//       event_type,
//       committee,
//       event_date
//     )
//   `)
//   .eq('uniqname', uniqname);
//   if (error) throw error;
//   const events = data
//     .map(({ events }) => ({
//       ...events,
//       committee: events.event_type === 'rush_event'
//         ? 'rush_event'
//         : events.committee
//     }))
//     .filter(e =>
//       e.event_type !== 'pledge_event' && e.event_type !== 'study_table'
//     );
//   return events;
// }

// export async function getCommitteeAndRushEventsBrowser(uniqname) {
//   const supabase = getBrowserClient();
//   const { data, error } = await supabase
//   .from('event_attendance')
//   .select(`
//     events (
//       id,
//       name,
//       event_type,
//       committee,
//       event_date
//     )
//   `)
//   .eq('uniqname', uniqname);
//   if (error) throw error;
//   const events = data
//     .map(({ events }) => ({
//       ...events,
//       committee: events.event_type === 'rush_event'
//         ? 'rush_event'
//         : events.committee
//     }))
//     .filter(e =>
//       e.event_type !== 'pledge_event' && e.event_type !== 'study_table'
//     );
//   return events;
// }

export async function getOtherEvents(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_other_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getOtherEventsBrowser(uniqname) {
  const supabase = await getBrowserClient();
  const { data, error } = await supabase.rpc('get_other_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

export async function getAllCommitteesAttendance() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('committee_events_with_attendance')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data;
}

export async function getAllChapterAttendance() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('chapter_events')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data
}

export async function getAllPledgeEventsAttendance() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('pledge_events')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data
}

export async function getAllRushEventsAttendance() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('rush_events')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data
}

export async function getAllStudyTablesAttendance() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('study_tables')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data
}

/**
 * Calculates the total attendance requirements for a user, including extra committee points.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<number>} - Total required committee points.
 */
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
    .select(`
      brother_committee_pts_req,
      semester_last_day,
      brother_multiplier
    `)
    .eq('id', true)
    .maybeSingle();
  if (rErr) throw rErr;

  const absences = await getAbsenceCounts(uniqname);

  return {
    pointsReq: req.brother_committee_pts_req + Math.max(absences.excused-1, 0) * req.brother_multiplier + absences.unexcused * req.brother_multiplier,
    dueBy: req.semester_last_day
  }
}

export async function getMilestones() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
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
  if (error) throw error;
  console.log(data);

  return data;
}

export async function getInvCommitteeEventCount() {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_indv_committee_event_count');
  if (error) {
    console.error(error);
    return null;
  }
  console.log(data);
  return data;
}

export async function getPledgeAdminView() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('pledge_admin_view')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data;
}

export async function getBrotherAdminView() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('brother_admin_view')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
  return data;
}

export async function getBrotherRequirement() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('requirements')
    .select(`
      semester_last_day,
      brother_committee_pts_req
      `);
  if (error) console.error(error);
  else console.log(data);
  return data;
}

export async function getPledgeProgressCounts(uniqname) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('get_pledge_progress_counts', {p_uniqname: uniqname});
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

/**
 * Retrieves pledge progress milestones and calculates days left for each, including extra coffee chats.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Object>} - Milestone progress details.
 */
export async function getPledgeProgress(uniqname) {
  const supabase = await getServerClient();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US');

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
}

/**
 * Fetches all coffee chats for a pledge, including brother names.
 * @param {string} uniqname - The pledge's uniqname.
 * @returns {Promise<Array>} - Array of coffee chat records.
 */
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
  return cc
}

export async function getCoffeeChatsBrowser(uniqname) {
  const supabase = await getBrowserClient();
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

/**
 * Returns the count of coffee chats for a pledge.
 * @param {string} uniqname - The pledge's uniqname.
 * @returns {Promise<number>} - Number of coffee chats.
 */
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

/**
 * Retrieves all pledge events and marks attendance/absence for a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of pledge event objects with attendance info.
 */
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

export async function getPledgeEventsBrowser(uniqname) {
  const supabase = await getBrowserClient();
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

/**
 * Fetches all study table events attended by a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of study table event objects.
 */
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

export async function getStudyTablesBrowser(uniqname) {
  const supabase = await getBrowserClient();
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

/**
 * Retrieves all chapter events and marks attendance/absence for a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of chapter event objects with attendance info.
 */
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

export async function getChapterAttendanceBrowser(uniqname) {
  const supabase = await getBrowserClient();
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

/**
 * Returns the count of excused and unexcused absences for a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Object>} - Object with excused and unexcused absence counts.
 */
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

/**
 * Fetches all rush events attended by a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of rush event objects.
 */
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