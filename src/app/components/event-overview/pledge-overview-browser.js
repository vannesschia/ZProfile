"use client"
import { useEffect, useState } from "react"
import { getCoffeeChatsBrowser, getPledgeEventsBrowser, getStudyTablesBrowser } from "@/lib/db/client"
import PledgeOverviewView from "./pledge-overview-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function PledgeOverviewBrowser({ uniqname }) {
  const [coffeeChats, setCoffeeChats] = useState(null)
  const [pledgeEvents, getPledgeEvents] = useState(null)
  const [studyTables, getStudyTables] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const rows1 = await getCoffeeChatsBrowser(uniqname)
        const rows2 = await getPledgeEventsBrowser(uniqname)
        const rows3 = await getStudyTablesBrowser(uniqname)
        if (!ignore) setCoffeeChats(rows1)
        if (!ignore) getPledgeEvents(rows2)
        if (!ignore) getStudyTables(rows3)
      } catch (e) {
        if (!ignore) setError(e.message)
      }
    })()
    return () => { ignore = true }
  }, [uniqname])

  if (error) return <div className="text-red-600">Failed: {error}</div>
  if (!coffeeChats || !pledgeEvents || !studyTables) return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
  return <PledgeOverviewView coffeeChats={coffeeChats} pledgeEvents={pledgeEvents} studyTable={studyTables} />
}
