import NewClassForm from "./new-class-form";
import { getServerClient } from "@/lib/supabaseServer";
import { getActiveRushees } from "./_lib/queries";

export default async function NewClassPage({searchParams,}) {
  const supabase = await getServerClient()
  const shouldPrefill = searchParams.prefill === "true";
  console.log(shouldPrefill)
  let prefillData = []
  if (shouldPrefill){
    prefillData = await getActiveRushees(supabase)
    console.log(prefillData)
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">
        New Class
      </h2>
      <NewClassForm prefill={prefillData} />
    </div>
  );
}
