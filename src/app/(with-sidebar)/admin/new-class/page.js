import NewClassForm from "./new-class-form";
import { getServerClient } from "@/lib/supabaseServer";
import { getActiveRushees } from "./_lib/queries";
import { getNextClass } from "@/lib/greek-classes";

export default async function NewClassPage({searchParams,}) {
  const supabase = await getServerClient()
  const shouldPrefill = searchParams.prefill === "true";
  const { next } = await getNextClass(supabase);
  let prefillData = null
  if (shouldPrefill){
    prefillData = await getActiveRushees(supabase)
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">
        New Class
      </h2>
      {shouldPrefill && (
        <p className="text-muted-foreground">
          This will save the rush directory to the archive as the {next ?? "next"} class,
          add the active rushees below as {next ?? "new"} pledges, and then clear the rush directory.
        </p>
      )}
      <NewClassForm prefill={prefillData} />
    </div>
  );
}
