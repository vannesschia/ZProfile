import { ProgressTab } from "../progress-block";
import { getRushEvents } from "@/lib/db/global";
import { UserCheck } from "lucide-react";

export default async function RushEvent({ uniqname }) {
  const rush_event = await getRushEvents(uniqname)

  return (
    <ProgressTab title={"Rush Event"} className="md:max-w-[17rem]">
      <div className="flex flex-col gap-4">
        <p className="text-sm tracking-tight leading-tight">Attendance</p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-end">
            <UserCheck className="w-8 h-8 mr-2"/>
            <p className="font-medium text-3xl">{ rush_event.length }</p>
            <p className="font-medium text-base text-muted-foreground">/1</p>
          </div>
          <p className="text-xs leading-tight text-muted-foreground">Refer to Brother Requirements</p>
        </div>
      </div>
    </ProgressTab>
  )
}