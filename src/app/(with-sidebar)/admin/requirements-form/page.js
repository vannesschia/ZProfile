import { getServerClient } from "@/lib/supabaseServer";
import { RequirementsForm } from "./form";

export default async function RequirementsFormPage() {
  const supabase = await getServerClient();

  const { data: initialData, error } = await supabase
    .from('requirements')
    .select('*')
    .single()

  return (
      <div className="m-4 flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight leading-tight">Edit Requirements</h2>
        <RequirementsForm initialData={initialData}/>
      </div>
    )
}