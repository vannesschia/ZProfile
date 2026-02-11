// ****************************************************************************
// Absence Tab (Brother + Pledge)
// ****************************************************************************

/**
 * Returns the count of excused and unexcused absences for a user.
 * @param {string} uniqname - The user's uniqname.
 * @param {object} supabase - Supabase client.
 * @param {object} options - { eventType: 'pledge_event' } to only count pledge-event absences.
 * @returns {Promise<Object>} - Object with excused and unexcused absence counts.
 */
export async function getAbsenceCounts(uniqname, supabase, options = {}) {
  const { eventType } = options;

  const { data: rows, error } = await supabase
    .from('event_absences')
    .select('absence_type, events!inner(event_type)')
    .eq('uniqname', uniqname);

  if (error) throw error;

  let filtered = rows || [];
  if (eventType) {
    filtered = filtered.filter((r) => r.events?.event_type === eventType);
  }

  const excusedCount = filtered.filter((r) => r.absence_type === 'excused').length;
  const unexcusedCount = filtered.filter((r) => r.absence_type === 'unexcused').length;

  return {
    excused: excusedCount,
    unexcused: unexcusedCount,
  };
}

// ****************************************************************************
// Attendance Tab (Brother)
// ****************************************************************************

/**
 * Fetches total attendance point for user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<number>} - Total attendance points.
 */
export async function getAttendancePointCount(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_attendance_points_count', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

/**
 * Calculates attendance requirements for a user (brother or senior specifically).
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<json>} - JSON message in form of {"dueBy": date,"pointsReq": count}.
 */
export async function getAttendanceRequirements(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_attendance_requirements', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

// ****************************************************************************
// Pledge Progress / Miletone Tab (Pledge)
// ****************************************************************************

/**
 * Fetches total committee point for user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<number>} - Total committee points.
 */
export async function getCommitteePointCount(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_committee_points_count', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

/**
 * Fetch requirement counts for pledges per milestone.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<json>} - Json object with counts for requirements met per milestone.
 * Example:
 * {"firstMilestone": {"title":"Milestone #1", "cc":7, "cp":2, "dueDate":"10/10", "daysLeft":-40},
    "secondMilestone": {"title":"Milestone #2", "cc":14, "cp":4, "dueDate":"10/31", "daysLeft":-19},
    "thirdMilestone": {"title":"Milestone #3", "cc":20, "cp":6, "dueDate":"12/5", "daysLeft":16}}
 */
export async function getPledgeProgressCounts(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_pledge_progress_counts', {p_uniqname: uniqname});
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

/**
 * Returns the count of coffee chats for a pledge.
 * @param {string} uniqname - The pledge's uniqname.
 * @returns {Promise<number>} - Number of coffee chats.
 */
export async function getCoffeeChatsCount(uniqname, supabase) {
  const {data, error} = await supabase.rpc('get_approved_coffee_chat_count', {uniqname: uniqname});
  if (error) throw error;
  return data;
}

/**
 * Returns the pledge's coffee chat requirement offset (admin-set adjustment for all milestones).
 * @param {string} uniqname - The pledge's uniqname.
 * @param {object} supabase - Supabase client.
 * @returns {Promise<number>} - Offset (0 if no row).
 */
export async function getPledgeCoffeeChatOffset(uniqname, supabase) {
  const { data, error } = await supabase
    .from('pledge_coffee_chat_requirement')
    .select('required_offset')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (error) return 0;
  return Number(data?.required_offset ?? 0);
}

// ****************************************************************************
// Rush Event Tab (Brother)
// ****************************************************************************

/**
 * Fetches all rush events attended by a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of rush event objects.
 */
export async function getRushEvents(uniqname, supabase) {
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