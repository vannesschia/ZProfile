"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { getMembers, getPledges } from "./queries";
import { revalidatePath } from "next/cache";

/**
 * Syncs rushees from event_attendance for rush events.
 * Ensures rushees exist for all brothers who attended rush events.
 */
async function syncRusheesFromEventAttendance(supabase, eventId) {
  // Get all unique uniqnames from event_attendance for this rush event
  const { data: attendance, error: attendanceError } = await supabase
    .from('event_attendance')
    .select('uniqname')
    .eq('event_id', eventId);

  if (attendanceError || !attendance) {
    console.error("Error fetching attendance for rushee sync:", attendanceError);
    return;
  }

  const uniqueUniqnames = [...new Set(attendance.map(a => a.uniqname))];

  if (uniqueUniqnames.length === 0) {
    return;
  }

  // Get member info for these uniqnames
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('uniqname, name, email_address')
    .in('uniqname', uniqueUniqnames);

  if (membersError || !members) {
    console.error("Error fetching members for rushee sync:", membersError);
    return;
  }

  // Get existing rushees
  const { data: existingRushees, error: existingError } = await supabase
    .from('rushees')
    .select('uniqname')
    .in('uniqname', uniqueUniqnames);

  if (existingError) {
    console.error("Error fetching existing rushees:", existingError);
    return;
  }

  const existingUniqnames = new Set(existingRushees?.map(r => r.uniqname) || []);

  // Create rushees for members who don't have one yet
  const rusheesToCreate = members
    .filter(m => !existingUniqnames.has(m.uniqname))
    .map(member => ({
      uniqname: member.uniqname,
      name: member.name,
      email_address: member.email_address || `${member.uniqname}@umich.edu`,
      cut_status: 'active',
      likelihood: null,
      like_count: 0,
      dislike_count: 0,
      star_count: 0,
      major: [],
      minor: [],
      grade: null,
      graduation_year: null,
      profile_picture_url: null,
    }));

  if (rusheesToCreate.length > 0) {
    const { error: insertError } = await supabase
      .from('rushees')
      .insert(rusheesToCreate);

    if (insertError) {
      console.error("Error creating rushees:", insertError);
    }
  }
}

export async function submitEventEdit({ event_type, values, id }) {
  const { name, event_date, committee, attendance, unexcused_absences, excused_absences } = values;

  const supabase = await getServerClient();

  const payload = Object.fromEntries(
    Object.entries({ name, event_date, event_type, committee })
      .filter(value => value !== null)
  );

  const { error: eventUpdateError } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)

  if (eventUpdateError) {
    throw new Error(`Failed to update payload for event with ID ${id}: ${eventUpdateError.message}`);
  }

  const { error: eventAttendanceDeleteError } = await supabase
    .from('event_attendance')
    .delete()
    .eq('event_id', id)

  if (eventAttendanceDeleteError) {
    throw new Error(`Failed to delete attendance for event with ID ${id}: ${eventAttendanceDeleteError.message}`);
  }

  if (attendance) {
    const { error: eventAttendanceInsertError } = await supabase
      .from('event_attendance')
      .insert(attendance.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

    if (eventAttendanceInsertError) {
      throw new Error(`Failed to insert attendance for event with ID ${id}: ${eventAttendanceInsertError.message}`);
    }

    // Sync rushees from event attendance for rush events
    if (event_type === "rush_event") {
      await syncRusheesFromEventAttendance(supabase, id);
    }
  }

  if (excused_absences) {
    const { error: eventExcusedAbsencesInsertError } = await supabase
      .from('event_attendance')
      .insert(excused_absences.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "excused" })))

    if (eventExcusedAbsencesInsertError) {
      throw new Error(`Failed to insert attendance for event with ID ${id}: ${eventExcusedAbsencesInsertError.message}`);
    }

    if (event_type === "chapter") {
      const members = await getMembers();

      const present = members.filter(mem => !excused_absences.includes(mem.uniqname) && !unexcused_absences.includes(mem.uniqname)).map(mem => mem.uniqname);

      const { error: eventPresentInsertError } = await supabase
        .from('event_attendance')
        .insert(present.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

      if (eventPresentInsertError) {
        throw new Error(`Failed to insert attendance for event with ID ${id}: ${eventPresentInsertError.message}`);
      }
    } else if (event_type === "pledge_event") {
      const pledges = await getPledges();

      const present = pledges.filter(pledge => !excused_absences.includes(pledge.uniqname) && !unexcused_absences.includes(pledge.uniqname)).map(pledge => pledge.uniqname);

      const { error: eventPresentInsertError } = await supabase
        .from('event_attendance')
        .insert(present.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

      if (eventPresentInsertError) {
        throw new Error(`Failed to insert attendance for event with ID ${id}: ${eventPresentInsertError.message}`);
      }
    }
  }

  // Revalidate rush directory when rush events are updated
  if (event_type === "rush_event") {
    // Final sync to ensure all attendance records are processed
    await syncRusheesFromEventAttendance(supabase, id);
    revalidatePath("/rush-directory");
  }
}

export async function submitEventCreate({ event_type, values }) {
  const { name, event_date, committee, attendance, unexcused_absences, excused_absences } = values;

  const supabase = await getServerClient();

  const id = crypto.randomUUID();

  const payload = Object.fromEntries(
    Object.entries({ id, name, event_date, event_type, committee, })
      .filter(value => value !== null)
  );

  const { error: eventsError } = await supabase
    .from('events')
    .insert(payload)

  if (eventsError) {
    throw new Error(`Failed to insert payload: ${eventsError.message}`);
  }

  if (attendance) {
    const { error: eventAttendanceInsertError } = await supabase
      .from('event_attendance')
      .insert(attendance.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

    if (eventAttendanceInsertError) {
      throw new Error(`Failed to insert attendance: ${eventAttendanceInsertError.message}`);
    }

    // Sync rushees from event attendance for rush events
    if (event_type === "rush_event") {
      await syncRusheesFromEventAttendance(supabase, id);
    }
  }

  if (excused_absences) {
    const { error: eventExcusedAbsencesInsertError } = await supabase
      .from('event_attendance')
      .insert(excused_absences.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "excused" })))

    if (eventExcusedAbsencesInsertError) {
      throw new Error(`Failed to insert attendance: ${eventExcusedAbsencesInsertError.message}`);
    }

    if (event_type === "chapter") {
      const members = await getMembers();

      const present = members.filter(mem => !excused_absences.includes(mem.uniqname) && !unexcused_absences.includes(mem.uniqname)).map(mem => mem.uniqname);

      const { error: eventPresentInsertError } = await supabase
        .from('event_attendance')
        .insert(present.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

      if (eventPresentInsertError) {
        throw new Error(`Failed to insert attendance: ${eventPresentInsertError.message}`);
      }
    } else if (event_type === "pledge_event") {
      const pledges = await getPledges();

      const present = pledges.filter(pledge => !excused_absences.includes(pledge.uniqname) && !unexcused_absences.includes(pledge.uniqname)).map(pledge => pledge.uniqname);

      const { error: eventPresentInsertError } = await supabase
        .from('event_attendance')
        .insert(present.map(mem => ({ event_id: id, uniqname: mem, attendance_status: "present" })))

      if (eventPresentInsertError) {
        throw new Error(`Failed to insert attendance: ${eventPresentInsertError.message}`);
      }
    }
  }

  // Revalidate rush directory when rush events are created
  if (event_type === "rush_event") {
    // Final sync to ensure all attendance records are processed
    await syncRusheesFromEventAttendance(supabase, id);
    revalidatePath("/rush-directory");
  }
}

export async function deleteEvent(id) {
  const supabase = await getServerClient();

  // Fetch event type before deleting to revalidate rush directory if needed
  const { data: event } = await supabase
    .from('events')
    .select('event_type')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete event with ID ${id}: ${error.message}`);
  }

  // Revalidate rush directory when rush events are deleted
  if (event?.event_type === "rush_event") {
    revalidatePath("/rush-directory");
  }
}
