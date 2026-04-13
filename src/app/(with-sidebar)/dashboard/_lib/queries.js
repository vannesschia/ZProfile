// ****************************************************************************
// Absence Tab (Brother + Pledge)
// ****************************************************************************

/**
 * Raw excused attendance rows for the term include one "free" chapter (and for
 * pledges, one pledge_event). Subtract at most one matching row from the count each.
 *
 * @param {Array<{ events?: { event_type?: string } }> | null | undefined} rows
 * @param {string} role - `"pledge"` or brother-like (`"brother"`, etc.)
 * @returns {number}
 */
export function adjustedExcusedAbsenceCount(rows, role) {
  const list = rows ?? [];
  const n = list.length;
  if (n === 0) return 0;

  const hasChapter = list.some((r) => r.events?.event_type === "chapter");
  const hasPledgeEvent = list.some((r) => r.events?.event_type === "pledge_event");

  let discount = 0;
  if (role === "pledge") {
    if (hasChapter) discount += 1;
    if (hasPledgeEvent) discount += 1;
  } else {
    if (hasChapter) discount += 1;
  }

  return Math.max(0, n - discount);
}

/**
 * Returns the count of excused and unexcused absences for a user.
 * @param {string} uniqname - The user's uniqname.
 * @returns {Promise<Object>} - Object with excused and unexcused absence counts.
 */
export async function getAbsenceCounts(uniqname, supabase, role = "brother") {
  const { data: termCode, error: tErr } = await supabase
    .from("terms")
    .select("term_code")
    .eq("is_current", true)
    .single();
  if (tErr) throw tErr;

  const { data: excusedMetadata, error: emErr } = await supabase
    .from("event_attendance")
    .select(
      `
      *,
      events!inner(name, event_type, term_code)
    `
    )
    .eq("uniqname", uniqname)
    .eq("attendance_status", "excused")
    .eq("events.term_code", termCode.term_code);
  if (emErr) throw emErr;

  const excusedToConsider = adjustedExcusedAbsenceCount(excusedMetadata, role);

  let eventToCheck = ['chapter']
  if (role === "pledge") {
    eventToCheck.push('pledge_event')
  }

  const { data: attendanceRows, error: attendanceErr } = await supabase
  .from('event_attendance')
  .select('event_id')
  .eq('uniqname', uniqname);

  if (attendanceErr) throw attendanceErr;

  const attendedEventIds = attendanceRows.map(row => row.event_id);

  let query = supabase
    .from('events')
    .select('*')
    .in('event_type', eventToCheck);

  if (attendedEventIds.length > 0) {
    query = query.not('id', 'in', `(${attendedEventIds.join(',')})`);
  }

  const { data: missingAttendanceEvents, error: eventsErr } = await query;

  if (eventsErr) throw eventsErr;

  return {
    excused: excusedMetadata.length ?? 0,
    excusedToConsider,
    unexcused: missingAttendanceEvents?.length ?? 0,
  };
}

export async function getMemberCoffeeChatOffset(uniqname, supabase) {
  const { data, error } = await supabase
    .from("members")
    .select("coffee_chat_offset")
    .eq("uniqname", uniqname)
    .maybeSingle();
  if (error) throw error;
  return data?.coffee_chat_offset ?? 0;
}

const EXTRA_POINTS_MULTIPLIER = 3;

/**
 * Coffee chat offset (admin adjustment) plus excused absences that count toward
 * obligation, expressed as a single points total (same multiplier as the absences tab).
 */
export function totalExtraPointsFromParts(coffeeChatOffset, excusedToConsider, unexcusedToConsider, multiplier = EXTRA_POINTS_MULTIPLIER) {
  const offset = coffeeChatOffset ?? 0;
  const excused = excusedToConsider ?? 0;
  const unexcused = unexcusedToConsider ?? 0;
  return Math.max(0, (multiplier * (unexcused + excused)) + offset);
}

/** Same milestone row as `MilestoneTabs` for CC / CP baselines. */
function getActiveMilestoneIndex(pledgeProgress, numCoffeeChats, numCommitteePoints, coffeeChatOffset) {
  if (!pledgeProgress || typeof pledgeProgress !== "object") return 0;
  const keys = Object.keys(pledgeProgress);
  for (let i = 0; i < keys.length; i++) {
    const currMilestone = pledgeProgress[keys[i]];
    const totalCCRequired = currMilestone.cc + (coffeeChatOffset ?? 0);
    if (
      currMilestone.daysLeft < 0 &&
      (numCoffeeChats < totalCCRequired || numCommitteePoints < currMilestone.cp)
    ) {
      return i;
    }
    if (currMilestone.daysLeft >= 0) {
      return i;
    }
  }
  return 0;
}

export function getMilestoneBaseCcForExtra(
  pledgeProgress,
  numCoffeeChats,
  numCommitteePoints,
  coffeeChatOffset
) {
  if (!pledgeProgress || typeof pledgeProgress !== "object") return 0;
  const keys = Object.keys(pledgeProgress);
  if (keys.length === 0) return 0;
  const idx = getActiveMilestoneIndex(pledgeProgress, numCoffeeChats, numCommitteePoints, coffeeChatOffset);
  return pledgeProgress[keys[idx]]?.cc ?? 0;
}

export function getMilestoneBaseCpForExtra(
  pledgeProgress,
  numCoffeeChats,
  numCommitteePoints,
  coffeeChatOffset
) {
  if (!pledgeProgress || typeof pledgeProgress !== "object") return 0;
  const keys = Object.keys(pledgeProgress);
  if (keys.length === 0) return 0;
  const idx = getActiveMilestoneIndex(pledgeProgress, numCoffeeChats, numCommitteePoints, coffeeChatOffset);
  return pledgeProgress[keys[idx]]?.cp ?? 0;
}

/**
 * How much of the "extra" obligation is satisfied:
 * - `coffeeChatOffset` (raw units, same as in `totalExtraPointsFromParts`) is covered only by
 *   excess coffee chats (chats above active milestone base `cc`).
 * - The absence bucket `multiplier * (unexcused + excusedToConsider)` is covered only by
 *   remaining excess coffee chats plus excess committee points (above active milestone `cp`).
 */
export function computeCompletedExtraPoints({
  coffeeChatOffset,
  excusedToConsider,
  unexcused,
  multiplier = EXTRA_POINTS_MULTIPLIER,
  numCoffeeChats,
  numCommitteePoints,
  milestoneBaseCc,
  milestoneBaseCp,
}) {
  const offset = Number(coffeeChatOffset) || 0;
  const absenceDebt = (Number(unexcused) || 0) + (Number(excusedToConsider) || 0);
  const cc = Number(numCoffeeChats) || 0;
  const cp = Number(numCommitteePoints) || 0;
  const baseCc = Number(milestoneBaseCc) || 0;
  const baseCp = Number(milestoneBaseCp) || 0;

  const excessCoffeeChats = Math.max(0, cc - baseCc);
  const excessCommitteePoints = Math.max(0, cp - baseCp);

  const fulfilledCoffeeChatOffset = Math.min(offset, excessCoffeeChats);
  const remainingExcessCoffeeChats = excessCoffeeChats - fulfilledCoffeeChatOffset;
  const poolForAbsenceDebt = remainingExcessCoffeeChats + excessCommitteePoints;
  const fulfilledExtraPointsFromAbsences = Math.min(absenceDebt * multiplier, poolForAbsenceDebt);
  // const fulfilledExtraPointsFromAbsences = multiplier * fulfilledAbsenceUnits;

  const totalExtraFulfilled = fulfilledCoffeeChatOffset + fulfilledExtraPointsFromAbsences;

  return {
    totalExtraFulfilled,
    fulfilledCoffeeChatOffset,
    fulfilledExtraPointsFromAbsences,
    excessCoffeeChats,
    excessCommitteePoints,
    remainingExcessCoffeeChats,
    poolForAbsenceDebt,
  };
}

/**
 * @returns {Promise<{ coffeeChatOffset: number, excusedToConsider: number, totalExtraPoints: number, multiplier: number }>}
 */
export async function getExtraTabData(uniqname, supabase, role = "brother") {
  const [{ excusedToConsider, unexcused }, coffeeChatOffset] = await Promise.all([
    getAbsenceCounts(uniqname, supabase, role),
    getMemberCoffeeChatOffset(uniqname, supabase),
  ]);

  const totalExtraPoints = totalExtraPointsFromParts(
    coffeeChatOffset,
    excusedToConsider,
    unexcused,
    EXTRA_POINTS_MULTIPLIER
  );

  return {
    coffeeChatOffset,
    excusedToConsider,
    unexcused,
    totalExtraPoints,
    multiplier: EXTRA_POINTS_MULTIPLIER,
  };
}

/**
 * Total extra obligation fulfilled (aligned with `totalExtraPointsFromParts` + allocation rules).
 */
export async function getCompletedExtra(uniqname, supabase, role = "brother") {
  const [absence, coffeeChatOffset, numCoffeeChats, numCommitteePoints, pledgeProgress] =
    await Promise.all([
      getAbsenceCounts(uniqname, supabase, role),
      getMemberCoffeeChatOffset(uniqname, supabase),
      getCoffeeChatsCount(uniqname, supabase),
      getCommitteePointCount(uniqname, supabase),
      role === "pledge" ? getPledgeProgressCounts(uniqname, supabase) : Promise.resolve(null),
    ]);

  const { excusedToConsider, unexcused } = absence;

  const milestoneBaseCc = getMilestoneBaseCcForExtra(
    pledgeProgress,
    numCoffeeChats,
    numCommitteePoints,
    coffeeChatOffset
  );
  const milestoneBaseCp = getMilestoneBaseCpForExtra(
    pledgeProgress,
    numCoffeeChats,
    numCommitteePoints,
    coffeeChatOffset
  );

  return computeCompletedExtraPoints({
    coffeeChatOffset,
    excusedToConsider,
    unexcused,
    multiplier: EXTRA_POINTS_MULTIPLIER,
    numCoffeeChats,
    numCommitteePoints,
    milestoneBaseCc,
    milestoneBaseCp,
  });
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