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
  
  const uniqname = email.split("@")[0];

  const { data: member, memberError } = await supabase
    .from('members')
    .select(`
      *,
      brother_classes (
        class_name, term_code
      )
    `)
    .eq('uniqname', uniqname)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Error loading profile</h1>
        <p>{memberError.message}</p>
      </main>
    );
  }

  const initialCourses = (courses) => {
    let result = [];
    courses = courses.sort((a, b) => a.term_code - b.term_code);
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
    return result.map(({ term, classes }) => ({
      term,
      classes: classes.sort((a, b) => a.localeCompare(b))
    }));
  };

  const initialData = {
    ...member,
    brother_classes: initialCourses(member.brother_classes)
  };

  return (
    <main className="min-h-screen p-0 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Profile Setup</h1>
      <Card className="max-w-8xl">
        {initialData ? <MyForm initialData={initialData || null} userEmail={email} /> : <p>Loading</p>}
      </Card>
    </main>
  );
}
