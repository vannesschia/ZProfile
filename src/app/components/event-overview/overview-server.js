import { getChapterAttendance, getOtherEvents, getCommitteeEvents } from "@/lib/db/global"
import OverviewView from "./overview-view"

export default async function OverviewServer({ uniqname, role = "brother" }) {
  const [events, chapter, otherEvents] = await Promise.all([
    getCommitteeEvents(uniqname),
    getChapterAttendance(uniqname),
    getOtherEvents(uniqname)
  ])
  return <OverviewView role={role} events={events} chapter={chapter} otherEvents={otherEvents}/>
}
