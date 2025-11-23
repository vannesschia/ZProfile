"use client"
import { useEffect, useState } from "react"
import { getPledgeEvents, getCoffeeChats, getStudyTables } from "@/lib/db/events/queries"
import PledgeOverviewView from "./pledge-overview-view"
import { Skeleton } from "@/components/ui/skeleton"
import { getBrowserClient } from "@/lib/supbaseClient"

export default function PledgeOverviewBrowser({ uniqname }) {
  const [coffeeChats, setCoffeeChats] = useState(null)
  const [pledgeEvents, setPledgeEvents] = useState(null)
  const [studyTables, setStudyTables] = useState(null)
  const [error, setError] = useState(null)

  const supabase = getBrowserClient();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const rows1 = await getCoffeeChats(uniqname, supabase)
        const rows2 = await getPledgeEvents(uniqname, supabase)
        const rows3 = await getStudyTables(uniqname, supabase)
        if (!ignore) setCoffeeChats(rows1)
        if (!ignore) setPledgeEvents(rows2)
        if (!ignore) setStudyTables(rows3)
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
  return <PledgeOverviewView coffeeChats={coffeeChats} pledgeEvents={pledgeEvents} studyTable={studyTables} adminView={true}/>
}
