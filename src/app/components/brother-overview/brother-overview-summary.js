import { getServerClient } from "@/lib/supabaseServer";

export default async function BrotherOverviewSummary({ data }) {
  const supabase = await getServerClient();
  const { data: requirements, error } = await supabase
    .from('requirements')
    .select('brother_committee_pts_req, semester_last_day')
    .single()
  
  if (error) {
    console.error(error.message);
    return;
  }

  console.log(data)
  
  const numCompleted = () => {
    
  }

  return (
    <div className="flex flex-row gap-8 w-fit">
      <div className="flex flex-col">
        <span className="font-bold">{requirements.brother_committee_pts_req}</span>
        <span className="text-sm font-light text-muted-foreground">Committee Points</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">{requirements.semester_last_day}</span>
        <span className="text-sm font-light text-muted-foreground">Due by</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">{numCompleted()}</span>
        <span className="text-sm font-light text-muted-foreground">Completed</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold">1</span>
        <span className="text-sm font-light text-muted-foreground">On track</span>
      </div>
    </div>
  )
}