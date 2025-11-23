import { Laugh, Coffee, Badge, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommitteePointCount, getPledgeProgressCounts, getCoffeeChatsCount } from "../../_lib/queries";
import MilestoneTabs from "./milestone-tabs";
import { getServerClient } from "@/lib/supabaseServer";

export default async function PledgeProgress({ uniqname }) {
  const supabase = await getServerClient();
  const numCommitteePoints = await getCommitteePointCount(uniqname, supabase);
  const pledgeProgressCounts = await getPledgeProgressCounts(uniqname, supabase);
  const numCoffeeChats = await getCoffeeChatsCount(uniqname, supabase);

  return (
    <>
      <MilestoneTabs pledgeProgress={pledgeProgressCounts} numCoffeeChats={numCoffeeChats} numCommitteePoints={numCommitteePoints}/>
    </>
  )
}