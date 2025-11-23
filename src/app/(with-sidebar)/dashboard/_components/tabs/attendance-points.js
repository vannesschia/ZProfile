import { ProgressTab } from "../../../../components/progress-block";
import { getAttendanceRequirements, getAttendancePointCount } from "../../_lib/queries";
import { formatMonthDayNumeric, daysUntilOrSince } from "@/lib/utils";
import { Laugh, Frown } from "lucide-react";
import { getServerClient } from "@/lib/supabaseServer";

export default async function AttendancePoints({ uniqname }) {
  const supabase = await getServerClient();
  const events = await getAttendancePointCount(uniqname, supabase);
  const attendanceRequirements = await getAttendanceRequirements(uniqname, supabase);
  const daysLeftOrLate = daysUntilOrSince(attendanceRequirements.dueBy);

  return (
    <ProgressTab title={"Attendance"} className={`md:max-w-[25rem] ${daysLeftOrLate.status === "past" && events < attendanceRequirements.pointsReq ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700" : null}`}>
      <div className="flex flex-row gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Attendance Points</p>
          <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-row items-end">
              {daysLeftOrLate.status === "past" && events < attendanceRequirements.pointsReq ? <Frown className="w-8 h-8 mr-2"/> : <Laugh className="w-8 h-8 mr-2"/>}
              <p className="font-medium text-3xl">{ events }</p>
              <p className="font-medium text-base text-muted-foreground">/{ attendanceRequirements.pointsReq }</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Due by</p>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-3xl">{ formatMonthDayNumeric(attendanceRequirements.dueBy) }</p>
            { daysLeftOrLate.status === "upcoming" ? 
              <p className="text-xs leading-tight text-muted-foreground">{daysLeftOrLate.daysLeft} days left.</p>
              : <p className="text-xs leading-tight text-muted-foreground">{daysLeftOrLate.daysLate} days late!</p>
            }
          </div>
        </div>
      </div>
    </ProgressTab>
  )
}