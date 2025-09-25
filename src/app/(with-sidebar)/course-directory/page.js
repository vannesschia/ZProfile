import CourseSearch from "@/app/(with-sidebar)/course-directory/course-search";

export const dynamic = "force-dynamic";

export default async function CourseDirectoryPage() {
  return (
    <div className="m-4 flex flex-col gap-2">
      <h2 className="text-2xl font-bold tracking-tight leading-tight">Course Directory</h2>
      <h1 className="text-muted-foreground">Search for courses brothers are taking</h1>
      <CourseSearch/>
    </div>
  );
}
