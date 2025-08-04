import BrotherOverviewSummary from "@/app/components/brother-overview/brother-overview-summary";
import { BrotherOverviewTable } from "@/app/components/brother-overview/table/data-table";
import { Separator } from "@/components/ui/separator";
import { getServerClient } from "@/lib/supabaseServer";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrothersOverviewPage() {
  const supabase = await getServerClient();
  const { data: brotherInfo, error } = await supabase
    .from('members')
    .select(`name, committee_points, extra_committee_points, active,
      event_attendance (
        event_id
      ),
      event_absences (
        event_id,
        absence_type
      )
    `)
    .eq('role', 'brother')
  
  if (error) {
    console.error(error.message);
    return;
  }

  console.log(brotherInfo)

  return (
    <div className="flex flex-col gap-4 m-4">
      <div className="flex flex-row gap-1">
        Progress for <span className="flex flex-row font-bold gap-1">Brothers</span><ChevronDown />
      </div>
      <BrotherOverviewSummary />
      <Separator />
      <BrotherOverviewTable data={brotherInfo}/>
    </div>
  )
}