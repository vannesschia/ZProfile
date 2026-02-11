import { ProgressTab } from "../../../../components/progress-block";
import { getAbsenceCounts } from "../../_lib/queries";
import { ArrowUp } from "lucide-react";
import { getServerClient } from "@/lib/supabaseServer";

export default async function Absences({ uniqname, role }) {
  const supabase = await getServerClient();
  const eventType = role?.role === 'pledge' ? 'pledge_event' : null;
  const absences = await getAbsenceCounts(uniqname, supabase, eventType ? { eventType } : {});
  
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