import BugReportForm from "@/app/components/bug-report/bug-report-form";
import { getServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser()
  const uniqname = user.email.split("@")[0];

  const { data, error } = await supabase
    .from('members')
    .select('name')
    .eq('uniqname', uniqname)
    .single()

  if (error) {
    console.error(error.message);
    return;
  }

  return (
    <div className="flex flex-col m-4 gap-4">
      <span className="text-2xl font-bold tracking-tight leading-tight">Report Bugs</span>
      <BugReportForm name={data.name}/>
    </div>
  )
}