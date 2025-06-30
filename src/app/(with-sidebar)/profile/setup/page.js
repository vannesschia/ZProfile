import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
// import ProfileForm from "./ProfileForm";
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
  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("email_address", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Error loading profile</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <main className="min-h-screen">

        <h1 className="mb-6 text-2xl font-bold">Profile Setup</h1>

        <Card className="max-w-8xl">
          <MyForm initialData={member || null} userEmail={email} />
        </Card>
      </main>
    </main>
  );
}
