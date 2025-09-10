import { getServerClient } from "@/lib/supabaseServer";
import CourseSearch from "@/app/(with-sidebar)/course-directory/course-search";

export const dynamic = "force-dynamic";

export default async function CourseDirectoryPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uniqname = user.email.split("@")[0];

  return (
    <div className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Course Directory</h2>
      <h1 className="text-muted-foreground">Search for courses brothers are taking</h1>
      <CourseSearch/>
    </div>
  );
}
