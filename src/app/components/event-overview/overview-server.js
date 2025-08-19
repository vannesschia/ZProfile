import { getCommitteeAndRushEvents, getChapterAttendance } from "@/lib/db/global"
import OverviewView from "./overview-view"

export default async function OverviewServer({ uniqname, role = "brother" }) {
  const [events, chapter] = await Promise.all([
    getCommitteeAndRushEvents(uniqname),
    getChapterAttendance(uniqname),
  ])
  return <OverviewView role={role} events={events} chapter={chapter} />
}
