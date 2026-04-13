import { ProgressTab } from "../../progress-block";
import { ArrowUp } from "lucide-react";

export default function AbsencesContent({ absences, memberRole, multipler=3 }) {
  return (
    <ProgressTab title={"Absences"} className="md:max-w-[20rem]">
      <div className="flex flex-row gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Unexcused</p>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-3xl">{absences.unexcused}</p>
            {absences.unexcused > 0 ? (
              <div className="flex flex-row items-center gap-0.5">
                <ArrowUp className="size-3 text-red-700" />
                <p className="text-xs leading-tight text-muted-foreground">
                  {multipler * absences.unexcused} points
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-tight leading-tight">Excused</p>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-3xl">{absences.excused}</p>
            {absences.excused > 1 ? (
              <div className="flex flex-row items-center gap-0.5">
                <ArrowUp className="size-3 text-red-700" />
                <p className="text-xs leading-tight text-muted-foreground">
                  {multipler * absences.excusedToConsider} points
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ProgressTab>
  );
}
