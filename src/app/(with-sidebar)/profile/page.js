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
import Link from "next/link";

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
      
        <Card className="max-w-8xl">
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{member?.name || "Full Name"}</CardTitle>
              <CardDescription>{member?.grade || "Grade"}</CardDescription>
            </div>

            <Link href="/profile/setup">
              <CardAction variant="default" className="bg-black text-white rounded-md px-4 py-2 transition duration-200 ease-in-out hover:bg-gray-700">
                Edit Profile
              </CardAction>
            </Link>
          </CardHeader>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6"> {/* left column */}
              <CardContent>
                <strong>Major</strong>
                <p>{member?.major || "Major"}</p>
              </CardContent>
              <CardContent>
                <strong>Expected Graduation Date</strong>
                <p>{member?.graduation_year || "Graduation Year"}</p>
              </CardContent>
              <CardContent>
                <strong>Email</strong>
                <p>{member?.email_address || "Email"}</p>
              </CardContent>
            </div>
              <div className="space-y-6"> {/* right column */}
              <CardContent>
                <strong>Minor</strong>
                <p>{member?.minor || "Minor"}</p>
              </CardContent>
              <CardContent>
                <strong>Class</strong>
                <p>{member?.current_class_number || "Class"}</p>
              </CardContent>
              <CardContent>
                <strong>Phone Number</strong>
                <p>{member?.phone_number || "Phone Number"}</p>
              </CardContent>
            </div>
          </div>
        </Card>

      </main>
    </main>
  );
}
