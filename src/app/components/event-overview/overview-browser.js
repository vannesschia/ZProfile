"use client"
import { useEffect, useState } from "react"
import { getCommitteeAndRushEventsBrowser, getChapterAttendanceBrowser } from "@/lib/db/global"
import { Skeleton } from "@/components/ui/skeleton"
import OverviewView from "./overview-view"

export default function OverviewBrowser({ uniqname, role = "brother" }) {
  const [committeeAndRush, setCommitteeAndRush] = useState(null)
  const [chapterAttendance, setChapterAttendance] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const rows1 = await getCommitteeAndRushEventsBrowser(uniqname)
        const rows2 = await getChapterAttendanceBrowser(uniqname)
        if (!ignore) setCommitteeAndRush(rows1)
        if (!ignore) setChapterAttendance(rows2)
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
  return <OverviewView className="w-6xl" role={role} events={committeeAndRush} chapter={chapterAttendance} />
}
