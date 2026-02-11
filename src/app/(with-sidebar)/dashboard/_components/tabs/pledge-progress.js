import { Laugh, Coffee, Badge, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommitteePointCount, getPledgeProgressCounts, getCoffeeChatsCount, getPledgeCoffeeChatOffset, getAbsenceCounts } from "../../_lib/queries";
import MilestoneTabs from "./milestone-tabs";
import { getServerClient } from "@/lib/supabaseServer";

export default async function PledgeProgress({ uniqname }) {
  const supabase = await getServerClient();
  const [numCommitteePoints, pledgeProgressCounts, numCoffeeChats, ccOffset, absences] = await Promise.all([
    getCommitteePointCount(uniqname, supabase),
    getPledgeProgressCounts(uniqname, supabase),
    getCoffeeChatsCount(uniqname, supabase),
    getPledgeCoffeeChatOffset(uniqname, supabase),
    getAbsenceCounts(uniqname, supabase, { eventType: 'pledge_event' }),
  ]);

  return (
    <>
      <MilestoneTabs
        pledgeProgress={pledgeProgressCounts}
        numCoffeeChats={numCoffeeChats}
        numCommitteePoints={numCommitteePoints}
        ccOffset={ccOffset}
        unexcusedAbsences={absences?.unexcused ?? 0}
      />
    </>
  )
}