import { getServerClient } from "@/lib/supabaseServer";
import { Overview, PledgeOverview } from "@/app/components/overview";
import { ProgressTab } from "@/app/components/progress-block";
import AttendancePoints from "@/app/components/tabs/attendance-points.js";
import Absences from "@/app/components/tabs/absences";
import RushEvent from "@/app/components/tabs/rush-event";
import PledgeProgress from "@/app/components/tabs/pledge-progress";
import OverviewServer from "@/app/components/event-overview/overview-server";
import PledgeOverviewServer from "@/app/components/event-overview/pledge-overview-server";
import { nullable } from "zod";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getServerClient();

  // get members's uniqname
  const { data: { user } } = await supabase.auth.getUser()
  const uniqname = user.email.split("@")[0];

  // get member's role
  const { data: role, error: rErr } = await supabase
    .from('members')
    .select('role')
    .eq('uniqname', uniqname)
    .maybeSingle();
  if (rErr) throw rErr;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto">
        {role.role == "pledge" ? <PledgeProgress uniqname={ uniqname } /> : null}
        {role.role != "pledge" ? <AttendancePoints uniqname={ uniqname }/> : null}
        {role.role != "pledge" ? <RushEvent uniqname={ uniqname }/> : null }
        <Absences uniqname={ uniqname }/>
      </div>
      {role.role == "pledge" ? <PledgeOverviewServer uniqname={ uniqname } /> : null}
      <OverviewServer uniqname={ uniqname } role={ role.role } />
      <iframe src="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FDetroit" className="w-full h-[600px]"></iframe>
    </div>
  );
}
