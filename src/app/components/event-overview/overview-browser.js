"use client"
import { useEffect, useState } from "react"
import { getChapterAttendance, getOtherEvents, getCommitteeEvents } from "@/lib/db/events/queries"
import { Skeleton } from "@/components/ui/skeleton"
import OverviewView from "./overview-view"
import { getBrowserClient } from "@/lib/supbaseClient"

export default function OverviewBrowser({ uniqname, role = "brother" }) {
  const [committeeAndRush, setCommitteeAndRush] = useState(null)
  const [chapterAttendance, setChapterAttendance] = useState(null)
  const [otherEvents, setOtherEvents] = useState(null)
  const [error, setError] = useState(null)

  const supabase = getBrowserClient();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const rows1 = await getCommitteeEvents(uniqname, supabase)
        const rows2 = await getChapterAttendance(uniqname, supabase)
        const rows3 = await getOtherEvents(uniqname, supabase)
        if (!ignore) setCommitteeAndRush(rows1)
        if (!ignore) setChapterAttendance(rows2)
        if (!ignore) setOtherEvents(rows3)
      } catch (e) {
        if (!ignore) setError(e.message)
      }
    })()
    return () => { ignore = true }
  }, [uniqname])

  if (error) return <div className="text-red-600">Failed: {error}</div>
  if (!committeeAndRush || !chapterAttendance) return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
  return <OverviewView className="w-6xl" role={role} events={committeeAndRush} chapter={chapterAttendance} otherEvents={otherEvents}/>
}
