"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { getMembers, getPledges } from "./queries";

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
}

export async function deleteEvent(id) {
  const supabase = await getServerClient();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete event with ID ${id}: ${error.message}`);
  }
}
