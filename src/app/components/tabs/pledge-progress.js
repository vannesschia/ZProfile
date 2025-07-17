import { Laugh, Coffee, Badge, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommitteeAndRushEvents, getAttendanceRequirements, getPledgeProgress, getCoffeeChats, getCoffeeChatsCount } from "@/lib/db/global";
import MilestoneTabs from "./milestone-tabs";

export default async function PledgeProgress({ uniqname }) {
    const events = await getCommitteeAndRushEvents(uniqname);
    // const attendanceRequirements = await getAttendanceRequirements(uniqname);
    const pledgeProgress = await getPledgeProgress(uniqname);
    const numCoffeeChats = await getCoffeeChatsCount(uniqname);

  return (
    <>
      <MilestoneTabs events={events} pledgeProgress={pledgeProgress} numCoffeeChats={numCoffeeChats}/>
    </>
  )
}