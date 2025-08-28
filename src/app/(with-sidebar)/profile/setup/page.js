import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { MyForm } from "@/app/components/profileForm";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { termCodeToWords } from "../../course-directory/term-functions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const email = session.user.email;

  const { data: member, memberError } = await supabase
    .from("members")
    .select("*")
    .eq("email_address", email)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Error loading profile</h1>
        <p>{memberError.message}</p>
      </main>
    );
  }

  const uniqname = email.split("@")[0];

  const { data: courses, coursesError } = await supabase
    .from("brother_classes")
    .select("class_name, term_code")
    .eq("uniqname", uniqname)

  if (coursesError) {
    console.error(coursesError);
  }

  const initialCourses = (courses) => {
    let result = [];
    courses.forEach((element) => {
      const term = termCodeToWords(element.term_code);
      const exists = result.find((x) => x.term === term);
      const clas = element.class_name.replace(/(\D+)(\d+)/, "$1 $2");
      if (exists) {
        exists.classes.push(clas);
      } else {
        result.push({ term, classes: [clas] });
      }
    });
    return result;
  };

  const initialData = {
    ...member,
    courses: courses ? initialCourses(courses) : []
  };

  return (
    <main style={{ padding: "2rem" }}>
      <main className="min-h-screen">
        <h1 className="mb-6 text-2xl font-bold">Profile Setup</h1>
        <Card className="max-w-8xl">
          {initialData ? <MyForm initialData={initialData || null} userEmail={email} /> : <p>Loading</p>}
        </Card>
      </main>
    </main>
  );
}
