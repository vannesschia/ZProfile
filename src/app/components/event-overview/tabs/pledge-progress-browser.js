"use client"

import { useEffect, useState } from "react";
import { getCommitteePointCount, getPledgeProgressCounts, getCoffeeChatsCount } from "../../../(with-sidebar)/dashboard/_lib/queries";
import MilestoneTabs from "./milestone-tabs";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function PledgeProgressBrowser({ uniqname }) {
  const [numCommitteePoints, setNumCommitteePoints] = useState(null)
  const [pledgeProgressCounts, setPledgeProgressCounts] = useState(null)
  const [numCoffeeChats, setNumCoffeeChats] = useState(null)
  const [coffeeChatOffset, setCoffeeChatOffset] = useState(null)
  const [error, setError] = useState(null)

  const supabase = getBrowserClient()

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const var1 = await getCommitteePointCount(uniqname, supabase);
        const var2 = await getPledgeProgressCounts(uniqname, supabase);
        const var3 = await getCoffeeChatsCount(uniqname, supabase);
        // Fetch coffee_chat_offset from members table
        const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('coffee_chat_offset')
        .eq('uniqname', uniqname)
        .single();
        const var4 = memberData?.coffee_chat_offset ?? 0;

        if (!ignore) setNumCommitteePoints(var1)
        if (!ignore) setPledgeProgressCounts(var2)
        if (!ignore) setNumCoffeeChats(var3)
        if (!ignore) setCoffeeChatOffset(var4)
      } catch (e) {
        if (!ignore) setError(e.message)
      }
    })()
    return () => { ignore = true }
  }, [uniqname])

  if (error) return <div className="text-red-600">Failed: {error}</div>
  const stillLoading =
    numCommitteePoints === null ||
    pledgeProgressCounts === null ||
    numCoffeeChats === null ||
    coffeeChatOffset === null

  if (stillLoading) return (
    <div className="w-full min-w-fit md:max-w-[20rem] flex-shrink-0 rounded-lg border-2 border-secondary overflow-hidden">
      <Skeleton className="h-[52px] w-full rounded-none" />
      <div className="p-6 flex flex-col gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )

  return (
    <>
      <MilestoneTabs 
        pledgeProgress={pledgeProgressCounts} 
        numCoffeeChats={numCoffeeChats} 
        numCommitteePoints={numCommitteePoints}
        coffeeChatOffset={coffeeChatOffset}
      />
    </>
  )
}