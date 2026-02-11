// ****************************************************************************
// Views
// ****************************************************************************

/**
 * Fetch view for pledge information/records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Pledge table information.
 */
export async function getPledgeAdminView(supabase) {
  const { data, error } = await supabase
    .from('pledge_admin_view')
    .select('*');
  if (error) console.error(error);
  return data;
}

/**
 * Fetch view for committee event attendance records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Committee event information.
 */
export async function getAllCommitteesAttendance(supabase) {
  const { data, error } = await supabase
    .from('committee_events_with_attendance')
    .select('*');
  if (error) console.error(error);
  return data;
}

/**
 * Fetch view for chapter attendance records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Chapter event information.
 */
export async function getAllChapterAttendance(supabase) {
  const { data, error } = await supabase
    .from('chapter_events')
    .select('*');
  if (error) console.error(error);
  return data
}

/**
 * Fetch view for pledge event attendance records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Pledge event information.
 */
export async function getAllPledgeEventsAttendance(supabase) {
  const { data, error } = await supabase
    .from('pledge_events')
    .select('*');
  if (error) console.error(error);
  return data
}

/**
 * Fetch view for rush event attendance records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Rush event information.
 */
export async function getAllRushEventsAttendance(supabase) {
  const { data, error } = await supabase
    .from('rush_events')
    .select('*');
  if (error) console.error(error);
  return data
}

/**
 * Fetch view for study tables attendance records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Study table event information.
 */
export async function getAllStudyTablesAttendance(supabase) {
  const { data, error } = await supabase
    .from('study_tables')
    .select('*');
  if (error) console.error(error);
  return data
}

/**
 * Fetch view for brother information/records.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Brother table information.
 */
export async function getBrotherAdminView(supabase) {
  const { data, error } = await supabase
    .from('brother_admin_view')
    .select('*');
  if (error) console.error(error);
  return data;
}

/**
 * Fetch rush event attendance count per brother (uniqname).
 * Used for sorting brothers by rush attendance points.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<Record<string, number>>} - Object mapping uniqname to count of rush events attended.
 */
export async function getBrotherRushAttendanceCounts(supabase) {
  const { data, error } = await supabase
    .from('event_attendance')
    .select('uniqname, events!inner(event_type)')
    .eq('events.event_type', 'rush_event');
  if (error) {
    console.error(error);
    return {};
  }
  const counts = (data || []).reduce((acc, row) => {
    const u = row.uniqname;
    if (u) acc[u] = (acc[u] || 0) + 1;
    return acc;
  }, {});
  return counts;
}

// ****************************************************************************
// Helper Functions
// ****************************************************************************

/**
 * Fetch milestone requirements for pledges.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<table>} - Milestone requirements information.
 */
export async function getMilestones(supabase) {
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
  return data;
}

/**
 * Fetch event count for each committee.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<json>} - Json object with committee names as keys and event counts.
 * Example: {"technology":5,"social":4,"prof_dev":3,"marketing":3,"fundraising":1}
 */
export async function getInvCommitteeEventCount(supabase) {
  const { data, error } = await supabase.rpc('get_indv_committee_event_count');
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

/**
 * Fetch requirements for brothers.
 * @param {object} supabase - The Supabase client.
 * @returns {Promise<json>} - Values for last day of semester and point requirement count.
 */
export async function getBrotherRequirement(supabase) {
  const { data, error } = await supabase
    .from('requirements')
    .select(`
      semester_last_day,
      brother_committee_pts_req
      `);
  if (error) console.error(error);
  return data;
}