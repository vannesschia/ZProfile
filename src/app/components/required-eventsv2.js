import { ChevronsUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatMonthDay } from "@/lib/utils"
import { ProgressBlock } from "./progress-block"
import { getServerClient } from "@/lib/supabaseServer"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

async function getChapterAttendance(uniqname) {
  const supabase = await getServerClient();
  const { data: chapterEvents, error: eventsError } = await supabase
    .from('events')
    .select('id, name, event_date')
    .eq('event_type', 'chapter')
    .order('event_date', { ascending: true })

  if (eventsError) throw eventsError

  const { data: absences, error: absError } = await supabase
    .from('event_absences')
    .select('event_id')
    .eq('uniqname', uniqname)

  if (absError) throw absError

  const absentSet = new Set(absences.map(a => a.event_id))

  return chapterEvents.map(evt => ({
    ...evt,
    is_absent: absentSet.has(evt.id),
  }))
}

async function getRushEvents(uniqname) {
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

async function getAbsenceCounts(uniqname) {
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
    excused:   excusedCount   || 0,
    unexcused: unexcusedCount || 0,
  };
}

export async function RequiredEvents({ uniqname }) {
  const chapters = await getChapterAttendance(uniqname);
  const rushEvents = await getRushEvents(uniqname);
  const absences = await getAbsenceCounts(uniqname);
  console.log(chapters)
  console.log(rushEvents)
  console.log(absences)

  return(
    <>
      <ProgressBlock title={"Required Events"}>
        <div className="flex flex-row gap-1 mb-8">
          <div className="w-full bg-background border-2 border-secondary p-4 rounded-md grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <p className="text-base font-semibold">Total Unexcused Absences</p>
              <div className="flex flex-row gap-3 items-center">
                <p className="font-semibold text-3xl">{absences.unexcused}</p>
                {absences.unexcused ? 
                  <div className="flex flex-row items-center gap-0.5">
                    <ChevronsUp size={16} strokeWidth={2.5} color="red"/>
                    <p className="text-red-600 text-sm">{3*absences.unexcused} AP</p>
                  </div>
                  : null
                }
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-base font-semibold">Total Excused Absences</p>
              <div className="flex flex-row gap-3 items-center">
                <p className="font-semibold text-3xl">{absences.excused}</p>
                {absences.excused ? 
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex flex-row items-center gap-0.5">
                        <ChevronsUp size={16} strokeWidth={2.5} color="red"/>
                        <p className="text-red-600 text-sm">{3*absences.excused} AP</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{3*absences.excused} additional attendance points</p>
                    </TooltipContent>
                  </Tooltip>
                  : null
                }
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-row justify-between items-end gap-4">
            <p className="text-sm">Rush Event</p>
            {rushEvents.is_absent ? <Badge className="bg-green-600">Completed</Badge> : <Badge variant="destructive">Incomplete</Badge>}
          </div>
          <Separator className="my-2"/>
          {chapters.map((chapter) => {
            return (
              <div key={chapter.id} className="flex flex-row justify-between items-end gap-4">
                <p className="text-sm">{chapter.name}</p>
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-xs">{formatMonthDay(chapter.event_date)}</p>
                  {chapter.is_absent ? <Badge className="bg-green-600">Present</Badge> : <Badge variant="destructive">Absent</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      </ProgressBlock>
    </>
  )
}