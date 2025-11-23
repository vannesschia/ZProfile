// ****************************************************************************
// Tables (User Dashboard)
// ****************************************************************************

/**
 * Fetches all committee events attended by for the user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<table>} - Event information (id, name, event_type, committee, event_date).
 */
export async function getCommitteeEvents(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_committee_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}

/**
 * Fetches all coffee chats for a pledge, including brother names.
 * @param {string} uniqname - The pledge's uniqname.
 * @returns {Promise<Array>} - Array of coffee chat records.
 */
export async function getCoffeeChats(uniqname, supabase) {
  const { data: cc, error: cErr } = await supabase
    .from('coffee_chats')
    .select(`
      *,
      brother_name:brother (
        name
      )
    `)
    .eq('pledge', uniqname)
    .order('chat_date', { ascending: false });
  if (cErr) throw cErr;
  return cc
}

/**
 * Fetches all "other" events (pledge_event, study_table, rush_event) attended by for the user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<table>} - Event information (id, name, event_type, event_date).
 */
export async function getOtherEvents(uniqname, supabase) {
  const { data, error } = await supabase.rpc('get_other_events', {p_uniqname: uniqname})
  if (error) throw error;
  return data;
}


/**
 * Retrieves all pledge events and marks attendance/absence for a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of pledge event objects with attendance info.
 */
export async function getPledgeEvents(uniqname, supabase) {
  const { data, error } = await supabase
    .rpc('get_mandatory_attendance', { z_uniqname: uniqname, z_event_type: 'pledge_event' });
  if (error) throw error;

  // console.log('Pledge Events:', data);
  return data;
}

/**
 * Fetches all study table events attended by a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Array>} - Array of study table event objects.
 */
export async function getStudyTables(uniqname, supabase) {
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
export async function getChapterAttendance(uniqname, supabase) {
  const { data: chapterEvents, error: chapterError } = await supabase
    .rpc('get_mandatory_attendance', { z_uniqname: uniqname, z_event_type: 'chapter' });
  if (chapterError) throw chapterError;

  return chapterEvents;
}