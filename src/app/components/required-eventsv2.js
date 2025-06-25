import { ChevronsUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { capitalizeFirstLetter } from "@/lib/utils"
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
    .select('event_id, absence_type')
    .eq('uniqname', uniqname)

  if (absError) throw absError

  const absenceMap = new Map(
    absences.map(a => [a.event_id, a.absence_type])
  );

  return chapterEvents.map(evt => {
    const absenceType = absenceMap.get(evt.id) ?? null;
    return {
      ...evt,
      is_absent:    absenceType !== null,
      absence_type: absenceType
    };
  });
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
  console.log(data.map(({ events }) => events))
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
    excused: excusedCount || 0,
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
          <div className="w-full bg-background border-2 border-secondary p-4 rounded-md grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <p className="font-bold text-3xl">{absences.unexcused}</p>
                <p className="font-semibold tracking-tight leading-tight">Unexcused Absences</p>
                {absences.excused > 0 ? 
                  <p className="text-sm leading-tight text-muted-foreground mt-2">This contributes to <span className="text-red-700">{3*absences.excused}+</span> additional committee points.</p>
                  : null
                }
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <p className="font-semibold text-3xl">{absences.excused}</p>
                <p className="font-semibold tracking-tight leading-tight">Excused Absences</p>
                {absences.excused > 1 ? 
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex flex-row items-center gap-0.5">
                        <ChevronsUp size={16} strokeWidth={2.5} className="bg-red-800"/>
                        <p className="text-red-800 text-sm">{3*absences.excused} AP</p>
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
            {rushEvents.length > 0 ? <Badge className="border-green-700 bg-green-700/30 text-green-700 px-1 py-0.5">Completed</Badge> : <Badge className="border-red-700 bg-red-700/30 text-red-700 px-1 py-0.5">Incomplete</Badge>}
          </div>
          <Separator className="my-2"/>
          {chapters.map((chapter) => {
            return (
              <div key={chapter.id} className="flex flex-row justify-between items-end gap-4">
                <p className="text-sm">{chapter.name}</p>
                <div className="flex flex-row gap-1">
                  {chapter.absence_type ? <Badge className="border-primary bg-primary/20 text-primary px-1 py-0.5">{capitalizeFirstLetter(chapter.absence_type)}</Badge> : null}
                  {!chapter.is_absent ? <Badge className="border-green-700 bg-green-700/30 text-green-700 px-1 py-0.5">Present</Badge> : <Badge className="border-red-700 bg-red-700/30 text-red-700 px-1 py-0.5">Absent</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      </ProgressBlock>
    </>
  )
}