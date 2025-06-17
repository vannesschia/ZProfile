import { getServerClient } from "@/lib/supabaseServer";
import { CommitteeEvents } from "./committee-events";
import { RequiredEvents } from "./required-events";
import { ProgressBlock } from "./progress-block";
import { DataTable } from "./committee-events/data-table";

async function getCommitteeAndRushEvents(uniqname) {
  const supabase = await getServerClient();
  console.log(uniqname)
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
  
  const events = data.map(({ events }) => events);

  return events;
}

async function getAttendanceRequirements(uniqname) {
  const supabase = await getServerClient();
  const { data: member, error: mErr } = await supabase
  .from('members')
  .select('role')
  .eq('uniqname', uniqname)
  .single();
  if (mErr) throw mErr;

  const col =
    member.role === 'pledge'  ? 'pledge_committee_pts_req'  :
    member.role === 'brother' ? 'brother_committee_pts_req' :
                                'senior_committee_pts_req';

  const { data: req, error: rErr } = await supabase
    .from('requirements')
    .select(col)
    .eq('id', true)
    .single();
  if (rErr) throw rErr;
  console.log(req)
  console.log(`Required points: ${req[col]}`);

  return req[col];
}

export async function AttendancePoints({ uniqname }) {
  const events = await getCommitteeAndRushEvents(uniqname);
  const totalPoints = await getAttendanceRequirements(uniqname);
  console.log(events);
  return(
    <ProgressBlock title={"Committee Points"}>
      <div className="flex flex-row gap-4 items-center mb-4">
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden flex flex-row">
          <div
            className="h-full bg-black"
            style={{ width: `${events.length/totalPoints * 100}%` }}
          />
        </div>
        <p className="text-base font-semibold">{events.length}/{totalPoints}</p>
      </div>
      <DataTable data={events} />
    </ProgressBlock>

  )
}