import { Laugh, Coffee } from "lucide-react";
import { ProgressTab } from "../progress-block";
import { getCommitteeAndRushEvents, getAttendanceRequirements } from "@/lib/db/global";

export default async function PledgeProgress({ uniqname }) {
    const events = await getCommitteeAndRushEvents(uniqname);
    const attendanceRequirements = await getAttendanceRequirements(uniqname);

  return (
    <ProgressTab title={"Pledge Progress"}>
      <div className="flex flex-row gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Coffee Chats</p>
          <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-row items-end">
              <Coffee className="w-8 h-8 mr-2"/>
              <p className="font-medium text-3xl">{ events.length }</p>
              <p className="font-medium text-base text-muted-foreground">/{ attendanceRequirements }</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Committee Points</p>
          <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-row items-end">
              <Laugh className="w-8 h-8 mr-2"/>
              <p className="font-medium text-3xl">{ events.length }</p>
              <p className="font-medium text-base text-muted-foreground">/{ attendanceRequirements }</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Due by</p>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-3xl">6/13</p>
            <p className="text-xs leading-tight text-muted-foreground">2 days left.</p>
          </div>
        </div>
      </div>
    </ProgressTab>
  )
}