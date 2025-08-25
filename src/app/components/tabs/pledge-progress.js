import { Laugh, Coffee, Badge, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommitteeAndRushEvents, getPledgeProgress, getCoffeeChatsCount, getPledgeProgressCounts, getCommitteePointCount } from "@/lib/db/global";
import MilestoneTabs from "./milestone-tabs";

export default async function PledgeProgress({ uniqname }) {
    const numCommitteePoints = await getCommitteePointCount(uniqname);
    const pledgeProgressCounts = await getPledgeProgressCounts(uniqname);
    const numCoffeeChats = await getCoffeeChatsCount(uniqname);

  return (
    <>
      <MilestoneTabs pledgeProgress={pledgeProgressCounts} numCoffeeChats={numCoffeeChats} numCommitteePoints={numCommitteePoints}/>
    </>
  )
}