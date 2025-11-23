import { getChapterAttendance, getOtherEvents, getCommitteeEvents } from "@/lib/db/events/queries"
import OverviewView from "./overview-view"
import { getServerClient } from "@/lib/supabaseServer";

export default async function OverviewServer({ uniqname, role = "brother" }) {
  const supabase = await getServerClient();

  const [events, chapter, otherEvents] = await Promise.all([
    getCommitteeEvents(uniqname, supabase),
    getChapterAttendance(uniqname, supabase),
    getOtherEvents(uniqname, supabase)
  ])
  return <OverviewView role={role} events={events} chapter={chapter} otherEvents={otherEvents}/>
}
