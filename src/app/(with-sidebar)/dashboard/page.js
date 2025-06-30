import { getServerClient } from "@/lib/supabaseServer";
import { Overview } from "@/app/components/overview";
import { ProgressTab } from "@/app/components/progress-block";
import AttendancePoints from "@/app/components/tabs/attendance-points.js";
import Absences from "@/app/components/tabs/absences";
import RushEvent from "@/app/components/tabs/rush-event";
import PledgeProgress from "@/app/components/tabs/pledge-progress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser()
  const uniqname = user.email.split("@")[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row gap-4 overflow-x-auto">
        <PledgeProgress uniqname={ uniqname } />
        <AttendancePoints uniqname={ uniqname }/>
        <RushEvent uniqname={ uniqname }/>
        <Absences uniqname={ uniqname }/>
      </div>
      <Overview uniqname={ uniqname }/>
    </div>
  );
}
