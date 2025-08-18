import { getServerClient } from "@/lib/supabaseServer";
import { Overview, PledgeOverview } from "@/app/components/overview";
import { ProgressTab } from "@/app/components/progress-block";
import AttendancePoints from "@/app/components/tabs/attendance-points.js";
import Absences from "@/app/components/tabs/absences";
import RushEvent from "@/app/components/tabs/rush-event";
import PledgeProgress from "@/app/components/tabs/pledge-progress";
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
      {role.role == "pledge" ? <PledgeOverview uniqname={ uniqname } /> : null}
      <Overview uniqname={ uniqname } role={ role.role } />
      <iframe
        src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FNew_York&showPrint=0&showCalendars=0&src=Y19jODEzNzU2Yjc5MWZmNDk1YmM5NGRjNzA0MWQ3ZTAyYTEwMTM2YmU1NTczMGJkNjY5Mjg4ZWU4NzE3YTFiZmQ0QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&color=%234285f4"
        className="w-full h-[600px]"
      />
    </div>
  );
}
