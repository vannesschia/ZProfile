/**
 * Helpers for rush directory access: current semester bounds and attendance check.
 * Used by middleware, layout (sidebar), and rush-directory page.
 */

/**
 * Get current semester start and end dates.
 * Uses requirements.semester_last_day when available; otherwise infers from current date.
 * @param {object} supabase - Supabase client
 * @returns {{ start: string, end: string }} - ISO date strings (YYYY-MM-DD)
 */
export async function getCurrentSemesterBounds(supabase) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  const { data: req } = await supabase
    .from("requirements")
    .select("semester_last_day")
    .limit(1)
    .maybeSingle();

  let endDate;
  let startDate;
  if (req?.semester_last_day) {
    endDate = req.semester_last_day;
    const end = new Date(endDate);
    const endMonth = end.getMonth() + 1;
    const endYear = end.getFullYear();
    // Fall semester: Aug–Dec (month 8–12). Winter/Spring: Jan–May (1–5).
    if (endMonth >= 8 && endMonth <= 12) {
      startDate = `${endYear}-08-01`;
    } else {
      startDate = `${endYear}-01-01`;
    }
  } else {
    if (month >= 8) {
      startDate = `${year}-08-01`;
      endDate = `${year}-12-31`;
    } else if (month <= 5) {
      startDate = `${year}-01-01`;
      endDate = `${year}-05-31`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-05-31`;
    }
  }
  return { start: startDate, end: endDate };
}

/**
 * Check if the user has attended at least one rush event in the current semester.
 * @param {object} supabase - Supabase client
 * @param {string} uniqname - User's uniqname
 * @returns {Promise<boolean>}
 */
export async function hasAttendedRushEventThisSemester(supabase, uniqname) {
  const { start, end } = await getCurrentSemesterBounds(supabase);
  const { data, error } = await supabase
    .from("event_attendance")
    .select(`
      events!inner (
        event_type,
        event_date
      )
    `)
    .eq("uniqname", uniqname)
    .eq("events.event_type", "rush_event");

  if (error || !data) return false;
  const inRange = data.some(
    (row) => row.events?.event_date >= start && row.events?.event_date <= end
  );
  return inRange;
}

/**
 * Determine if the user is allowed to access the rush directory and if the sidebar link should show.
 * - Pledges: never allowed, never show.
 * - Admins: always allowed, always show.
 * - Others: allowed and show only if they attended at least one rush event this semester.
 * @param {object} supabase - Supabase client
 * @param {string} uniqname - User's uniqname
 * @returns {Promise<{ allowed: boolean, showInSidebar: boolean, isAdmin: boolean }>}
 */
export async function getRushDirectoryAccess(supabase, uniqname) {
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("admin, role")
    .eq("uniqname", uniqname)
    .maybeSingle();

  if (memberError || !member) {
    return { allowed: false, showInSidebar: false, isAdmin: false };
  }

  const isAdmin = member.admin === true;
  const isPledge = member.role === "pledge";

  if (isPledge) {
    return { allowed: false, showInSidebar: false, isAdmin: false };
  }
  if (isAdmin) {
    return { allowed: true, showInSidebar: true, isAdmin: true };
  }

  const attended = await hasAttendedRushEventThisSemester(supabase, uniqname);
  return {
    allowed: attended,
    showInSidebar: attended,
    isAdmin: false,
  };
}
