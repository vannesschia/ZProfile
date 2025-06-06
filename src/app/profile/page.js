import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // const supabase = await getServerClient();
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();

  // if (!session) {
  //   redirect("/");
  // }

  // const email = session.user.email;
  // const { data: member, error } = await supabase
  //   .from("members")
  //   .select("*")
  //   .eq("email_address", email)
  //   .single();

  // if (error && error.code !== "PGRST116") {
  //   return (
  //     <main style={{ padding: "2rem" }}>
  //       <h1>Error loading profile</h1>
  //       <p>{error.message}</p>
  //     </main>
  //   );
  // }

  // const isEditMode = Boolean(member);
  return (
    <main style={{ padding: "2rem" }}>
      {/* <h1>{isEditMode ? "Edit Your Profile" : "Complete Your Profile"}</h1> */}
      {/* <ProfileForm
        isEditMode={isEditMode}
        initialData={member || null}
        userEmail={email}
      /> */}
      <p>profile page</p>
    </main>
  );
}
