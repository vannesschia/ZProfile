import { getServerClient } from "@/lib/supabaseServer";
import { ProgressBlock } from "./progress-block";
import { DataTable } from "./committee-events/data-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarClock } from "lucide-react";
import { capitalizeFirstLetter } from "@/lib/utils";

async function getCommitteeAndRushEvents(uniqname) {
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
  const events = data.map(({ events }) => ({
    ...events,
    committee: events.event_type === 'rush_event'
      ? 'rush_event'
      : events.committee
  }));
  console.log(events)
  return events;
}

async function getAttendanceRequirements(uniqname) {
  const supabase = await getServerClient();

  const { data: member, error: mErr } = await supabase
    .from('members')
    .select('role, total_committee_points')
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

  return req[col] + member.total_committee_points;
}

function tallyCategories(events) {
  return events.reduce((acc, e) => {
    const key = e.event_type === 'rush_event'
      ? 'rush_event'
      : e.committee;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function getBreakPoints() {
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

export async function AttendancePoints({ uniqname }) {
  const events = await getCommitteeAndRushEvents(uniqname);
  const tallyEvents = Object.entries(tallyCategories(events));
  const attendanceRequirements = await getAttendanceRequirements(uniqname);
  const totalPoints = Math.max(attendanceRequirements, tallyEvents.length)
  // const colors = {
  //   "technology":"bg-teal-400",
  //   "prof_dev":"bg-orange-400",
  //   "ram":"bg-yellow-400",
  //   "social":"bg-green-400",
  //   "marketing":"bg-blue-400",
  //   "fundraising":"bg-violet-400",
  //   "rush_event":"bg-slate-400"
  // }
  const colors = ["bg-[#004b23]", "bg-[#006400]", "bg-[#007200]", "bg-[#008000]", "bg-[#38b000]", "bg-[#70e000]", "bg-[#9ef01a]"]
  const breakpoints = [
  {
    title: "Milestone #1",
    committeePoints: 2,
    dueDate: "6/1",
    coffeeChats: 0,
  },
  {
    title: "Milestone #2",
    committeePoints: 4,
    dueDate: "6/15",
    coffeeChats: 0,
  },
  {
    title: "Final Milestone",
    committeePoints: 6,
    dueDate: "7/5",
    coffeeChats: 0,
  },
  {
    title: "Extra Points",
    committeePoints: 8,
    dueDate: "7/23",
    coffeeChats: 0,
  }
]
  // const breakpoints = [0, 2, 4, 6, 8]
  const fillPct = (events.length / totalPoints) * 100;

  return(
    <ProgressBlock title={"Committee Points"}>
      {/* <div className="mb-2">
        <div className="relative w-[calc(100%-1.25rem)] h-2 bg-gray-200 rounded-l">
          <div
            className="h-full bg-black rounded-l"
            style={{ width: `${fillPct}%` }}
          />
          {breakpoints.map((bp, idx) => {
            const leftPct = (bp.committeePoints / totalPoints) * 100;
            const reached = events.length >= bp.committeePoints;
            const isLast = idx === breakpoints.length - 1;
            const leftStyle = isLast
              ? `calc(${leftPct}%)`
              : `calc(${leftPct}%)`;

            return (
              <div
                key={bp.committeePoints}
                className={`
                  absolute top-1/2 transform -translate-y-1/2
                  w-5 h-5 z-10 rounded-sm
                  flex items-center justify-center
                  ${reached 
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-400 text-gray-700'}
                `}
                style={{ left: leftStyle }}
              >
                <span className="text-xs font-medium">
                  {bp.committeePoints}
                </span>
              </div>
            );
          })}
        </div>
      </div> */}

      {/* Label row */}
    {/* <div className="flex justify-between text-sm px-1 mb-4">
      {breakpoints.map(bp => (
        <div
          key={bp.committeePoints}
          className="flex-1 flex flex-col items-end leading-tight pl-4"
        >
          <span className="whitespace-normal break-words text-right font-semibold">
            {bp.title}
          </span>
          <span className="text-xs flex flex-row items-center gap-1">
            <CalendarClock className="w-[0.75rem] h-[0.75rem]"/> {bp.dueDate}
          </span>
        </div>
      ))}
    </div> */}

      <div className="flex flex-row gap-4 items-center mb-4">
        <div className="w-full h-3 bg-gray-200 rounded overflow-hidden flex flex-row">
          {tallyEvents.sort(([, a], [, b]) => b - a).map(([category, total], idx) => {
            const pct = (total / totalPoints) * 100;
            return (
              <Tooltip key={category}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-full ${colors[idx]}`}
                    style={{
                      width: `${pct}%`,
                      boxShadow: idx < tallyEvents.length-1 ? 'inset -2px 0 0 #E4E7EB' : undefined
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {capitalizeFirstLetter(category)}: {total}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <p className="text-base font-semibold">{events.length}/{totalPoints}</p>
      </div>
      <DataTable data={events} />
    </ProgressBlock>

  )
}