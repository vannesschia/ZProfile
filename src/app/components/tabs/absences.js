import { ProgressTab } from "../progress-block";
import { getAbsenceCounts } from "@/lib/db/global";
import { ArrowUp } from "lucide-react";

export default async function Absences({ uniqname, role }) {
  const absences = await getAbsenceCounts(uniqname);
  
  return (
    <ProgressTab title={"Absences"} className="md:max-w-[20rem]">
      <div className="flex flex-row gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Unexcused</p>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-3xl">{absences.unexcused}</p>
            {absences.unexcused > 0 ?
              <div className="flex flex-row items-center gap-0.5">
                <ArrowUp className="size-3 text-red-700"/>
                {
                  role.role == "pledge" ? 
                  <p className="text-xs leading-tight text-muted-foreground">{3*absences.unexcused} coffee chats</p>
                  : <p className="text-xs leading-tight text-muted-foreground">{3*absences.unexcused} committee points</p>
                }
              </div> 
              : null
            }
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Excused</p>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-3xl">{absences.excused}</p>
            {absences.excused > 1 ?
              <div className="flex flex-row items-center gap-0.5">
                <ArrowUp className="size-3 text-red-700"/>
                {
                  role.role == "pledge" ? 
                  <p className="text-xs leading-tight text-muted-foreground">{3*absences.excused} coffee chats</p>
                  : <p className="text-xs leading-tight text-muted-foreground">{3*absences.excused} committee points</p>
                }
              </div> 
              : null
            }
          </div>
        </div>
      </div>
    </ProgressTab>
  )
}