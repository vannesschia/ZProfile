import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { canAccessArchive } from "./_lib/allowlist";
import ArchiveClientView from "./ArchiveClientView";

export default async function ArchivePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/");

  const uniqname = session.user.email?.split("@")[0];
  if (!canAccessArchive(uniqname)) {
    redirect("/dashboard");
  }

  return (
    <main className="m-4 flex flex-col gap-2">
      <span className="text-2xl font-bold tracking-tight leading-tight">
        Rush Archive
      </span>
      <p className="text-muted-foreground">
        Historical rush directory data (read-only). Import a JSON file to view.
      </p>

      <ArchiveClientView uniqname={uniqname} />
    </main>
  );
}
